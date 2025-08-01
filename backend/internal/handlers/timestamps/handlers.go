package timestamps

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type TimestampsHandlers struct {
	db         *database.Database
	aiService  *AIService
	tagService *TagService
}

func NewTimestampsHandlers(db *database.Database, openaiAPIKey *config.OpenAIConfig) *TimestampsHandlers {
	return &TimestampsHandlers{
		db:         db,
		aiService:  NewAIService(openaiAPIKey),
		tagService: NewTagService(db),
	}
}

// GetAllTags returns all tags for the current user
func (t *TimestampsHandlers) GetAllTags(c *gin.Context) {
	userID, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	limit := 100 // Default limit for all tags
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	tags, err := t.tagService.GetAllTags(c.Request.Context(), userID, limit)
	if err != nil {
		log.Printf("Error fetching all tags: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_FETCH_TAGS", "Failed to fetch tags", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"count": len(tags),
	})
}

// SearchTags searches for tags matching a query
func (t *TimestampsHandlers) SearchTags(c *gin.Context) {
	var req TagSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.Limit <= 0 || req.Limit > 50 {
		req.Limit = 10
	}

	userID, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	tags, err := t.tagService.SearchTags(c.Request.Context(), userID, req.Query, req.Limit)
	if err != nil {
		log.Printf("Error searching tags: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_SEARCH_TAGS", "Failed to search tags", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"query": req.Query,
		"count": len(tags),
	})
}

func (t *TimestampsHandlers) CreateTimestamp(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req CreateTimestampRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	// Start database transaction
	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback() // Rollback by default, commit only on success

	// Create timestamp within transaction
	timestamp := models.Timestamp{
		UserID:    userID,
		VideoID:   req.VideoID,
		Title:     req.Title,
		Note:      req.Note,
		Timestamp: req.Timestamp,
		// Embedding will be NULL initially and populated later by AI service
	}

	if err := t.db.CreateWithTx(ctx, tx, &timestamp); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to create timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Process tags within the same transaction
	if len(req.Tags) > 0 {
		tagIDs, err := t.tagService.ProcessTagsForTimestampWithTx(ctx, tx, req.Tags)
		if err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_ERROR", "Failed to process tags", gin.H{
				"error": err.Error(),
			})
			return
		}

		if err := t.tagService.CreateTimestampTagRelationsWithTx(ctx, tx, timestamp.ID.String(), tagIDs); err != nil {
			middleware.RespondWithError(c, http.StatusInternalServerError, "TAG_RELATION_ERROR", "Failed to create tag relations", gin.H{
				"error": err.Error(),
			})
			return
		}
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Generate embedding asynchronously (outside transaction)
	if t.aiService != nil {
		go func() {
			var tagNames []string
			for _, tag := range timestamp.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			embeddingText := t.aiService.CreateEmbeddingText(timestamp.Title, timestamp.Note, tagNames)
			if embeddingText != "" {
				if embedding, err := t.aiService.GenerateEmbedding(embeddingText); err == nil {
					_, _ = t.db.DB.NewUpdate().
						Model((*models.Timestamp)(nil)).
						Set("embedding = ?", embedding).
						Set("updated_at = ?", time.Now().UTC()).
						Where("id = ?", timestamp.ID).
						Exec(context.Background())
				}
			}
		}()
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamp": timestamp,
		"message":   "Timestamp created successfully",
	})
}

// GetAllTimestamps returns all timestamps for the current user
func (t *TimestampsHandlers) GetAllTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"count":      len(timestamps),
	})
}

// GetTimestampsByVideoID returns all timestamps for a specific video
func (t *TimestampsHandlers) GetTimestampsByVideoID(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	videoID := c.Param("videoId")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	ctx := context.Background()

	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
		"count":      len(timestamps),
	})
}

// DeleteTimestamp deletes a specific timestamp
func (t *TimestampsHandlers) DeleteTimestamp(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	timestampIDStr := c.Param("id")
	if timestampIDStr == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	// Convert string timestamp ID to UUID
	timestampID, err := uuid.Parse(timestampIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TIMESTAMP_ID", "Invalid timestamp ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	ctx := context.Background()

	// Start database transaction
	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback() // Rollback by default, commit only on success

	// Soft delete the timestamp within transaction
	_, err = tx.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = ?", time.Now().UTC()).
		Where("id = ? AND user_id = ?", timestampID, userID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Clean up orphaned tag relations within the same transaction
	if err := t.tagService.CleanupOrphanedTagRelationsWithTx(ctx, tx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "CLEANUP_ERROR", "Failed to cleanup orphaned tag relations", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamp deleted successfully",
	})
}

// DeleteMultipleTimestamps deletes multiple timestamps
func (t *TimestampsHandlers) DeleteMultipleTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req struct {
		IDs []string `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert string IDs to UUIDs
	var timestampIDs []uuid.UUID
	for _, idStr := range req.IDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_TIMESTAMP_ID", "Invalid timestamp ID format", gin.H{
				"error": err.Error(),
				"id":    idStr,
			})
			return
		}
		timestampIDs = append(timestampIDs, id)
	}

	ctx := context.Background()

	// Start database transaction
	tx, err := t.db.DB.BeginTx(ctx, nil)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback() // Rollback by default, commit only on success

	// Soft delete multiple timestamps within transaction
	_, err = tx.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = ?", time.Now().UTC()).
		Where("id IN (?) AND user_id = ?", timestampIDs, userID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Clean up orphaned tag relations within the same transaction
	if err := t.tagService.CleanupOrphanedTagRelationsWithTx(ctx, tx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "CLEANUP_ERROR", "Failed to cleanup orphaned tag relations", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamps deleted successfully",
		"count":   len(timestampIDs),
	})
}
