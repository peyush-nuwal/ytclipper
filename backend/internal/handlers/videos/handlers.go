package videos

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type VideoHandlers struct {
	db *database.Database
}

func NewVideoHandlers(db *database.Database) *VideoHandlers {
	return &VideoHandlers{
		db: db,
	}
}

func (v *VideoHandlers) GetAllVideos(c *gin.Context) {
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

	var videos []models.Video
	err = v.db.DB.NewSelect().
		Model(&videos).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	videoMap := make(map[string]gin.H)
	for _, video := range videos {
		count, err := v.db.DB.NewSelect().
			Model((*models.Timestamp)(nil)).
			Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, video.VideoID).
			Count(ctx)

		if err != nil {
			count = 0
		}

		videoMap[video.VideoID] = gin.H{
			"video_id":         video.VideoID,
			"youtube_url":      video.YouTubeURL,
			"title":            video.Title,
			"thumbnail_url":    video.ThumbnailURL,
			"channel_id":       video.ChannelID,
			"channel_title":    video.ChannelTitle,
			"duration":         video.Duration,
			"published_at":     video.PublishedAt,
			"view_count":       video.ViewCount,
			"like_count":       video.LikeCount,
			"comment_count":    video.CommentCount,
			"ai_summary":       video.AISummary,
			"watched_duration": video.WatchedDuration,
			"count":            count,
			"created_at":       video.CreatedAt,
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

func (v *VideoHandlers) GetVideoByID(c *gin.Context) {
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

	videoID := c.Param("id")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	ctx := context.Background()

	var video models.Video
	err = v.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusNotFound, "VIDEO_NOT_FOUND", "Video not found", gin.H{
			"error": err.Error(),
		})
		return
	}

	var timestamps []models.Timestamp
	err = v.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(ctx)

	if err != nil {
		timestamps = []models.Timestamp{}
	}

	middleware.RespondWithOK(c, gin.H{
		"video":           video,
		"timestamps":      timestamps,
		"timestamp_count": len(timestamps),
	})
}

func (v *VideoHandlers) DeleteVideo(c *gin.Context) {
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

	videoID := c.Param("id")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	ctx := context.Background()

	_, err = v.db.DB.NewUpdate().
		Model((*models.Video)(nil)).
		Set("deleted_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete video", gin.H{
			"error": err.Error(),
		})
		return
	}

	_, err = v.db.DB.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("deleted_at = NOW()").
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Exec(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_ERROR", "Failed to delete video timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Video and all associated timestamps deleted successfully",
	})
}

func (v *VideoHandlers) GetRecentVideos(c *gin.Context) {
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

	limit := 10
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 50 {
			limit = parsed
		}
	}

	ctx := context.Background()

	var videos []models.Video
	err = v.db.DB.NewSelect().
		Model(&videos).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(limit).
		Scan(ctx)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch recent videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"videos": videos,
		"count":  len(videos),
	})
}

func (v *VideoHandlers) CreateOrUpdateVideo(ctx context.Context, userID uuid.UUID, videoID string, title string) error {
	var existingVideo models.Video
	err := v.db.DB.NewSelect().
		Model(&existingVideo).
		Where("user_id = ? AND video_id = ?", userID, videoID).
		Scan(ctx)

	if err != nil {
		video := &models.Video{
			UserID:  userID,
			VideoID: videoID,
			Title:   title,
		}

		_, err = v.db.DB.NewInsert().
			Model(video).
			Exec(ctx)

		return err
	}

	// Video exists for this user, don't update the title
	// The video title should be the YouTube video title, not the timestamp title
	return nil
}

// VideoExists checks if a video exists for a user
func (v *VideoHandlers) VideoExists(ctx context.Context, userID uuid.UUID, videoID string) (bool, error) {
	count, err := v.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Count(ctx)

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (v *VideoHandlers) CreateVideoIfNotExists(ctx context.Context, userID uuid.UUID, videoID string, youtubeURL string, title string) error {
	exists, err := v.VideoExists(ctx, userID, videoID)
	if err != nil {
		return err
	}

	if !exists {
		video := &models.Video{
			UserID:     userID,
			VideoID:    videoID,
			YouTubeURL: youtubeURL,
			Title:      title,
		}

		_, err = v.db.DB.NewInsert().
			Model(video).
			Exec(ctx)

		return err
	}

	return nil
}

func (v *VideoHandlers) GetVideoByYouTubeURL(ctx context.Context, userID uuid.UUID, youtubeURL string) (*models.Video, error) {
	var video models.Video
	err := v.db.DB.NewSelect().
		Model(&video).
		Where("user_id = ? AND youtube_url = ? AND deleted_at IS NULL", userID, youtubeURL).
		Scan(ctx)

	if err != nil {
		return nil, err
	}

	return &video, nil
}

func (v *VideoHandlers) GetOrCreateVideoByYouTubeURL(ctx context.Context, userID uuid.UUID, youtubeURL string, videoID string, title string) (*models.Video, error) {
	video, err := v.GetVideoByYouTubeURL(ctx, userID, youtubeURL)
	if err == nil {
		if video.Title != title {
			_, err = v.db.DB.NewUpdate().
				Model(video).
				Set("title = ?", title).
				Set("updated_at = NOW()").
				Where("id = ?", video.ID).
				Exec(ctx)
			if err != nil {
				return nil, err
			}
			video.Title = title
		}
		return video, nil
	}

	newVideo := &models.Video{
		UserID:     userID,
		VideoID:    videoID,
		YouTubeURL: youtubeURL,
		Title:      title,
	}

	_, err = v.db.DB.NewInsert().
		Model(newVideo).
		Exec(ctx)

	if err != nil {
		return nil, err
	}

	return newVideo, nil
}
