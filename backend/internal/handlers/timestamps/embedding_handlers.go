package timestamps

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

// BackfillEmbeddingsAsync starts background embedding generation
func (t *TimestampsHandlers) BackfillEmbeddingsAsync(c *gin.Context) {
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

	go func() {
		log.Printf("Starting async embedding backfill for user %s", userID)
		t.processEmbeddingsBackground(userID.String())
	}()

	middleware.RespondWithOK(c, gin.H{
		"message": "Embedding generation started in background",
		"user_id": userID.String(),
	})
}

// processEmbeddingsBackground processes embeddings in the background
func (t *TimestampsHandlers) processEmbeddingsBackground(userID string) {
	ctx := context.Background()
	batchSize := 5 // Smaller batches for background processing

	// Convert string user ID to UUID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		log.Printf("Error parsing user ID for background processing: %v", err)
		return
	}

	// Find timestamps without embeddings
	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userUUID).
		Where("embedding IS NULL").
		Scan(ctx)

	if err != nil {
		log.Printf("Error fetching timestamps for background processing: %v", err)
		return
	}

	log.Printf("Found %d timestamps needing embeddings for user %s", len(timestamps), userID)

	processed := 0
	for i := 0; i < len(timestamps); i += batchSize {
		end := i + batchSize
		if end > len(timestamps) {
			end = len(timestamps)
		}

		batch := timestamps[i:end]

		for _, ts := range batch {
			var tagNames []string
			for _, tag := range ts.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			embeddingText := t.aiService.CreateEmbeddingText(ts.Title, ts.Note, tagNames)
			if embeddingText == "" {
				continue
			}

			embedding, err := t.aiService.GenerateEmbedding(embeddingText)
			if err != nil {
				log.Printf("Failed to generate embedding for timestamp %s: %v", ts.ID, err)
				time.Sleep(5 * time.Second) // Wait longer on error
				continue
			}

			_, err = t.db.DB.NewUpdate().
				Model((*models.Timestamp)(nil)).
				Set("embedding = ?", embedding).
				Set("updated_at = ?", time.Now().UTC()).
				Where("id = ?", ts.ID).
				Exec(ctx)

			if err != nil {
				log.Printf("Failed to update timestamp %s: %v", ts.ID, err)
				continue
			}

			processed++
		}

		// Rate limiting between batches
		time.Sleep(2 * time.Second)
		log.Printf("Processed %d/%d timestamps for user %s", processed, len(timestamps), userID)
	}

	log.Printf("Completed embedding backfill for user %s: %d/%d processed", userID, processed, len(timestamps))
}

// GetEmbeddingStatus returns the status of embeddings for the current user
func (t *TimestampsHandlers) GetEmbeddingStatus(c *gin.Context) {
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

	// Count total timestamps
	totalCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count total timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Count timestamps with embeddings
	withEmbeddingsCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Where("embedding IS NOT NULL").
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count timestamps with embeddings", gin.H{
			"error": err.Error(),
		})
		return
	}

	withoutEmbeddingsCount := totalCount - withEmbeddingsCount

	completionPercentage := float64(0)
	if totalCount > 0 {
		completionPercentage = float64(withEmbeddingsCount) / float64(totalCount) * 100
	}

	middleware.RespondWithOK(c, gin.H{
		"total_timestamps":      totalCount,
		"with_embeddings":       withEmbeddingsCount,
		"without_embeddings":    withoutEmbeddingsCount,
		"completion_percentage": completionPercentage,
		"needs_backfill":        withoutEmbeddingsCount > 0,
		"estimated_cost_usd":    float64(withoutEmbeddingsCount) * 0.00002, // Rough estimate
	})
}
