package models

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Video represents a YouTube video that has been clipped
type Video struct {
	bun.BaseModel `bun:"table:videos,alias:v"`

	ID     uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`

	// YouTube video information
	YouTubeID   string `bun:"youtube_id,notnull" json:"youtube_id"`
	Title       string `bun:"title,notnull" json:"title"`
	Description string `bun:"description" json:"description"`

	// Video metadata
	Duration     int64      `bun:"duration" json:"duration"` // Duration in seconds
	ThumbnailURL string     `bun:"thumbnail_url" json:"thumbnail_url"`
	ChannelID    string     `bun:"channel_id" json:"channel_id"`
	ChannelName  string     `bun:"channel_name" json:"channel_name"`
	PublishedAt  *time.Time `bun:"published_at" json:"published_at"`

	// Video categorization
	Category string `bun:"category" json:"category"`
	Language string `bun:"language" json:"language"`

	// Status and visibility
	Status      VideoStatus     `bun:"status,default:'active'" json:"status"`
	Visibility  VideoVisibility `bun:"visibility,default:'private'" json:"visibility"`
	IsProcessed bool            `bun:"is_processed,default:false" json:"is_processed"`

	// Statistics
	ViewCount    int64 `bun:"view_count,default:0" json:"view_count"`
	LikeCount    int64 `bun:"like_count,default:0" json:"like_count"`
	CommentCount int64 `bun:"comment_count,default:0" json:"comment_count"`
	ClipCount    int   `bun:"clip_count,default:0" json:"clip_count"`

	// User interactions
	IsFavorite    bool       `bun:"is_favorite,default:false" json:"is_favorite"`
	LastWatchedAt *time.Time `bun:"last_watched_at" json:"last_watched_at"`
	WatchProgress float64    `bun:"watch_progress,default:0" json:"watch_progress"` // Percentage (0-100)

	// Metadata
	Notes       string `bun:"notes" json:"notes"`
	CustomTitle string `bun:"custom_title" json:"custom_title"` // User's custom title
	Rating      int    `bun:"rating,default:0" json:"rating"`   // 1-5 stars

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	User  *User  `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
	Clips []Clip `bun:"rel:has-many,join:id=video_id" json:"clips,omitempty"`
}

// VideoStatus represents the status of a video
type VideoStatus string

const (
	VideoStatusActive   VideoStatus = "active"
	VideoStatusArchived VideoStatus = "archived"
	VideoStatusDeleted  VideoStatus = "deleted"
	VideoStatusPending  VideoStatus = "pending"
)

// VideoVisibility represents who can access the video
type VideoVisibility string

const (
	VideoVisibilityPrivate VideoVisibility = "private"
	VideoVisibilityPublic  VideoVisibility = "public"
	VideoVisibilityShared  VideoVisibility = "shared"
)

// VideoTranscript represents a video transcript
type VideoTranscript struct {
	bun.BaseModel `bun:"table:video_transcripts,alias:vt"`

	ID       uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	VideoID  uuid.UUID `bun:"video_id,type:uuid,notnull" json:"video_id"`
	Language string    `bun:"language,notnull" json:"language"`
	Content  string    `bun:"content,type:text" json:"content"`
	IsAuto   bool      `bun:"is_auto,default:false" json:"is_auto"` // Auto-generated vs manual

	// Timestamps
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	Video *Video `bun:"rel:belongs-to,join:video_id=id" json:"video,omitempty"`
}

// VideoAnalytics represents video analytics data
type VideoAnalytics struct {
	bun.BaseModel `bun:"table:video_analytics,alias:va"`

	ID      uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	VideoID uuid.UUID `bun:"video_id,type:uuid,notnull" json:"video_id"`

	// Engagement metrics
	TotalViews       int64   `bun:"total_views,default:0" json:"total_views"`
	UniqueViews      int64   `bun:"unique_views,default:0" json:"unique_views"`
	TotalWatchTime   int64   `bun:"total_watch_time,default:0" json:"total_watch_time"`     // In seconds
	AverageWatchTime float64 `bun:"average_watch_time,default:0" json:"average_watch_time"` // In seconds
	CompletionRate   float64 `bun:"completion_rate,default:0" json:"completion_rate"`       // Percentage

	// Clip analytics
	ClipsCreated     int   `bun:"clips_created,default:0" json:"clips_created"`
	MostClippedStart int64 `bun:"most_clipped_start,default:0" json:"most_clipped_start"` // Timestamp in seconds
	MostClippedEnd   int64 `bun:"most_clipped_end,default:0" json:"most_clipped_end"`     // Timestamp in seconds

	// Sharing analytics
	ShareCount       int `bun:"share_count,default:0" json:"share_count"`
	PlaylistAddCount int `bun:"playlist_add_count,default:0" json:"playlist_add_count"`

	// Timestamps
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	Video *Video `bun:"rel:belongs-to,join:video_id=id" json:"video,omitempty"`
}

// BeforeInsert hooks for UUID generation and timestamps
func (v *Video) BeforeInsert(ctx context.Context) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	now := time.Now()
	v.CreatedAt = now
	v.UpdatedAt = now
	return nil
}

func (v *Video) BeforeUpdate(ctx context.Context) error {
	v.UpdatedAt = time.Now()
	return nil
}

func (vt *VideoTranscript) BeforeInsert(ctx context.Context) error {
	if vt.ID == uuid.Nil {
		vt.ID = uuid.New()
	}
	now := time.Now()
	vt.CreatedAt = now
	vt.UpdatedAt = now
	return nil
}

func (vt *VideoTranscript) BeforeUpdate(ctx context.Context) error {
	vt.UpdatedAt = time.Now()
	return nil
}

func (va *VideoAnalytics) BeforeInsert(ctx context.Context) error {
	if va.ID == uuid.Nil {
		va.ID = uuid.New()
	}
	now := time.Now()
	va.CreatedAt = now
	va.UpdatedAt = now
	return nil
}

func (va *VideoAnalytics) BeforeUpdate(ctx context.Context) error {
	va.UpdatedAt = time.Now()
	return nil
}

// GetDurationFormatted returns the duration in a human-readable format
func (v *Video) GetDurationFormatted() string {
	if v.Duration == 0 {
		return "Unknown"
	}
	return formatDuration(v.Duration)
}

// GetWatchTimeFormatted returns the total watch time in a human-readable format
func (v *Video) GetWatchTimeFormatted() string {
	watchTime := int64(float64(v.Duration) * (v.WatchProgress / 100))
	return formatDuration(watchTime)
}

// IsWatched returns true if the video has been watched (>90% completion)
func (v *Video) IsWatched() bool {
	return v.WatchProgress >= 90.0
}

// formatDuration formats seconds into a human-readable duration string
func formatDuration(seconds int64) string {
	if seconds < 60 {
		return fmt.Sprintf("%ds", seconds)
	} else if seconds < 3600 {
		return fmt.Sprintf("%dm %ds", seconds/60, seconds%60)
	} else {
		return fmt.Sprintf("%dh %dm", seconds/3600, (seconds%3600)/60)
	}
}
