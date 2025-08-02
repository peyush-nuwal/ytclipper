package dashboard

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/database"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type DashboardHandlers struct {
	db *database.Database
}

func NewDashboardHandlers(db *database.Database) *DashboardHandlers {
	return &DashboardHandlers{
		db: db,
	}
}

func (d *DashboardHandlers) GetMostUsedTags(c *gin.Context) {
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
	tags, err := d.getMostUsedTags(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "TAGS_ERROR", "Failed to get most used tags", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"tags": tags})
}

func (d *DashboardHandlers) GetRecentVideos(c *gin.Context) {
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
	videos, err := d.getRecentVideos(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "VIDEOS_ERROR", "Failed to get recent videos", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"videos": videos})
}

func (d *DashboardHandlers) GetRecentActivity(c *gin.Context) {
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
	activities, err := d.getRecentActivity(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "ACTIVITY_ERROR", "Failed to get recent activity", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"activities": activities})
}

func (d *DashboardHandlers) GetRecentNotes(c *gin.Context) {
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
	notes, err := d.getRecentNotes(ctx, userID)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "NOTES_ERROR", "Failed to get recent notes", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"notes": notes})
}

func (d *DashboardHandlers) getMostUsedTags(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type TagCount struct {
		Name  string `bun:"name"`
		Count int64  `bun:"count"`
	}

	var tagCounts []TagCount
	err := d.db.DB.NewSelect().
		Model((*models.Tag)(nil)).
		Column("tags.name", "COUNT(tt.timestamp_id) as count").
		Join("JOIN timestamp_tags tt ON tags.id = tt.tag_id").
		Join("JOIN timestamps ts ON tt.timestamp_id = ts.id").
		Where("ts.user_id = ? AND ts.deleted_at IS NULL", userID).
		Group("tags.id, tags.name").
		Order("count DESC").
		Limit(10).
		Scan(ctx, &tagCounts)
	if err != nil {
		return []gin.H{}, nil
	}

	tags := make([]gin.H, len(tagCounts))
	for i, tc := range tagCounts {
		tags[i] = gin.H{
			"name":  tc.Name,
			"count": tc.Count,
		}
	}

	return tags, nil
}

func (d *DashboardHandlers) getRecentVideos(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type VideoData struct {
		VideoID         string `bun:"video_id"`
		Title           string `bun:"title"`
		ThumbnailURL    string `bun:"thumbnail_url"`
		Duration        int    `bun:"duration"`
		WatchedDuration int    `bun:"watched_duration"`
		NoteCount       int64  `bun:"note_count"`
		LatestTimestamp string `bun:"latest_timestamp"`
	}

	var videoData []VideoData
	err := d.db.DB.NewSelect().
		Model((*models.Video)(nil)).
		Column("videos.video_id", "videos.title", "videos.thumbnail_url", "videos.duration", "videos.watched_duration").
		Column("COALESCE(COUNT(ts.id), 0) as note_count").
		Column("MAX(ts.created_at) as latest_timestamp").
		Join("LEFT JOIN timestamps ts ON videos.video_id = ts.video_id AND ts.user_id = videos.user_id AND ts.deleted_at IS NULL").
		Where("videos.user_id = ? AND videos.deleted_at IS NULL", userID).
		Group("videos.id, videos.video_id, videos.title, videos.thumbnail_url, videos.duration, videos.watched_duration").
		Order("latest_timestamp DESC NULLS LAST, videos.created_at DESC").
		Limit(5).
		Scan(ctx, &videoData)
	if err != nil {
		return []gin.H{}, nil
	}

	videos := make([]gin.H, len(videoData))
	for i, vd := range videoData {
		var progress int
		if vd.Duration > 0 {
			progress = int((float64(vd.WatchedDuration) / float64(vd.Duration)) * 100)
		}

		videos[i] = gin.H{
			"video_id":         vd.VideoID,
			"title":            vd.Title,
			"thumbnail_url":    vd.ThumbnailURL,
			"duration":         vd.Duration,
			"note_count":       vd.NoteCount,
			"latest_timestamp": vd.LatestTimestamp,
			"watch_progress":   progress,
		}
	}

	return videos, nil
}

func (d *DashboardHandlers) getRecentActivity(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type ActivityData struct {
		Title     string `bun:"title"`
		CreatedAt string `bun:"created_at"`
	}

	var activityData []ActivityData
	err := d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Column("title", "created_at").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(5).
		Scan(ctx, &activityData)
	if err != nil {
		return []gin.H{}, nil
	}

	activities := make([]gin.H, len(activityData))
	for i, ad := range activityData {
		activities[i] = gin.H{
			"title":     ad.Title,
			"timestamp": ad.CreatedAt,
			"duration":  300,
		}
	}

	return activities, nil
}

func (d *DashboardHandlers) getRecentNotes(ctx context.Context, userID uuid.UUID) ([]gin.H, error) {
	type NoteData struct {
		ID         string `bun:"id"`
		Title      string `bun:"title"`
		CreatedAt  string `bun:"created_at"`
		VideoTitle string `bun:"video_title"`
	}

	var noteData []NoteData
	err := d.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Column("timestamps.id", "timestamps.title", "timestamps.created_at").
		Column("COALESCE(videos.title, 'Unknown Video') as video_title").
		Join("LEFT JOIN videos ON timestamps.video_id = videos.video_id AND videos.user_id = timestamps.user_id").
		Where("timestamps.user_id = ? AND timestamps.deleted_at IS NULL", userID).
		Order("timestamps.created_at DESC").
		Limit(10).
		Scan(ctx, &noteData)
	if err != nil {
		return []gin.H{}, nil
	}

	notes := make([]gin.H, len(noteData))
	for i, nd := range noteData {
		var tags []string
		err := d.db.DB.NewSelect().
			Model((*models.Tag)(nil)).
			Column("tags.name").
			Join("JOIN timestamp_tags tt ON tags.id = tt.tag_id").
			Where("tt.timestamp_id = ?", nd.ID).
			Scan(ctx, &tags)
		if err != nil {
			tags = []string{}
		}

		notes[i] = gin.H{
			"id":          nd.ID,
			"title":       nd.Title,
			"video_title": nd.VideoTitle,
			"created_at":  nd.CreatedAt,
			"tags":        tags,
		}
	}

	return notes, nil
}
