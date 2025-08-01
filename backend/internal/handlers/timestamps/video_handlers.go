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

func (t *TimestampsHandlers) GetAllVideosWithTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

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

	videoMap := make(map[string]gin.H)
	for _, ts := range timestamps {
		if _, exists := videoMap[ts.VideoID]; !exists {
			videoMap[ts.VideoID] = gin.H{
				"video_id":  ts.VideoID,
				"title":     ts.Title,
				"timestamp": ts.Timestamp,
				"note":      ts.Note,
				"count":     1,
			}
		} else {
			if count, ok := videoMap[ts.VideoID]["count"].(int); ok {
				videoMap[ts.VideoID]["count"] = count + 1
			}
		}
	}

	var result []gin.H
	for _, video := range videoMap {
		result = append(result, video)
	}

	middleware.RespondWithOK(c, gin.H{
		"videos": result,
		"count":  len(result),
	})
}

func (t *TimestampsHandlers) GetRecentTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

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
