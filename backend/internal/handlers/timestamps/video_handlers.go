package timestamps

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

// GetAllVideosWithTimestamps returns all videos that have timestamps for the current user
func (t *TimestampsHandlers) GetAllVideosWithTimestamps(c *gin.Context) {
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

	// Get distinct video IDs with timestamps
	var videos []struct {
		VideoID   string  `json:"video_id"`
		Title     string  `json:"title"`
		Timestamp float64 `json:"timestamp"`
		Note      string  `json:"note"`
		Count     int     `json:"count"`
	}

	err = t.db.DB.NewSelect().
		Column("video_id").
		Column("title").
		Column("timestamp").
		Column("note").
		Column("COUNT(*) as count").
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Group("video_id, title, timestamp, note").
		Order("timestamp DESC").
		Scan(ctx, &videos)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Group by video ID to get unique videos with their first timestamp info
	videoMap := make(map[string]gin.H)
	for _, v := range videos {
		if _, exists := videoMap[v.VideoID]; !exists {
			videoMap[v.VideoID] = gin.H{
				"video_id":  v.VideoID,
				"title":     v.Title,
				"timestamp": v.Timestamp,
				"note":      v.Note,
				"count":     v.Count,
			}
		}
	}

	// Convert map to slice
	var result []gin.H
	for _, video := range videoMap {
		result = append(result, video)
	}

	middleware.RespondWithOK(c, gin.H{
		"videos": result,
		"count":  len(result),
	})
}

// GetRecentTimestamps returns recent timestamps across all videos
func (t *TimestampsHandlers) GetRecentTimestamps(c *gin.Context) {
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
		Limit(20).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch recent timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"count":      len(timestamps),
	})
}
