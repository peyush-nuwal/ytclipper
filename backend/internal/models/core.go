package models

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/uptrace/bun"
)

// Tag represents a tag that can be applied to videos, clips, or playlists
type Tag struct {
	bun.BaseModel `bun:"table:tags,alias:t"`

	ID     uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`
	Name   string    `bun:"name,notnull" json:"name"`
	Color  string    `bun:"color,default:'#3B82F6'" json:"color"` // Hex color code

	// Usage statistics
	UsageCount int `bun:"usage_count,default:0" json:"usage_count"`

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// Clip represents a timestamped clip/note from a video
type Clip struct {
	bun.BaseModel `bun:"table:clips,alias:c"`

	ID      uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	VideoID uuid.UUID `bun:"video_id,type:uuid,notnull" json:"video_id"`
	UserID  uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`

	// Clip timing
	StartTime float64 `bun:"start_time,notnull" json:"start_time"` // In seconds
	EndTime   float64 `bun:"end_time" json:"end_time"`             // In seconds, optional

	// Clip content
	Title       string `bun:"title,notnull" json:"title"`
	Description string `bun:"description" json:"description"`
	Content     string `bun:"content" json:"content"` // The actual transcribed content

	// Clip metadata
	Type       ClipType `bun:"type,default:'note'" json:"type"`
	Importance int      `bun:"importance,default:3" json:"importance"` // 1-5 scale
	IsPublic   bool     `bun:"is_public,default:false" json:"is_public"`

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	Video *Video `bun:"rel:belongs-to,join:video_id=id" json:"video,omitempty"`
	User  *User  `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// ClipType represents the type of clip
type ClipType string

const (
	ClipTypeNote      ClipType = "note"
	ClipTypeHighlight ClipType = "highlight"
	ClipTypeBookmark  ClipType = "bookmark"
	ClipTypeQuestion  ClipType = "question"
	ClipTypeAction    ClipType = "action"
)

// Playlist represents a collection of videos
type Playlist struct {
	bun.BaseModel `bun:"table:playlists,alias:p"`

	ID     uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`

	// Playlist info
	Name        string `bun:"name,notnull" json:"name"`
	Description string `bun:"description" json:"description"`

	// Playlist settings
	Visibility      PlaylistVisibility `bun:"visibility,default:'private'" json:"visibility"`
	IsCollaborative bool               `bun:"is_collaborative,default:false" json:"is_collaborative"`

	// Metadata
	ThumbnailURL string `bun:"thumbnail_url" json:"thumbnail_url"`
	Color        string `bun:"color,default:'#3B82F6'" json:"color"`

	// Statistics
	VideoCount int `bun:"video_count,default:0" json:"video_count"`
	ViewCount  int `bun:"view_count,default:0" json:"view_count"`

	// Timestamps
	CreatedAt time.Time  `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time  `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`
	DeletedAt *time.Time `bun:"deleted_at,soft_delete,nullzero" json:"-"`

	// Relationships
	User *User `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// PlaylistVisibility represents the visibility of a playlist
type PlaylistVisibility string

const (
	PlaylistVisibilityPrivate  PlaylistVisibility = "private"
	PlaylistVisibilityPublic   PlaylistVisibility = "public"
	PlaylistVisibilityUnlisted PlaylistVisibility = "unlisted"
)

// Favorite represents a favorited video
type Favorite struct {
	bun.BaseModel `bun:"table:favorites,alias:f"`

	ID      uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	UserID  uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"`
	VideoID uuid.UUID `bun:"video_id,type:uuid,notnull" json:"video_id"`

	// Favorite metadata
	Note string `bun:"note" json:"note"` // Optional note about why it's favorited

	// Timestamps
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	User  *User  `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
	Video *Video `bun:"rel:belongs-to,join:video_id=id" json:"video,omitempty"`
}

// SharedPlaylist represents a shared playlist
type SharedPlaylist struct {
	bun.BaseModel `bun:"table:shared_playlists,alias:sp"`

	ID         uuid.UUID `bun:"id,pk,type:uuid,default:uuid_generate_v4()" json:"id"`
	PlaylistID uuid.UUID `bun:"playlist_id,type:uuid,notnull" json:"playlist_id"`
	UserID     uuid.UUID `bun:"user_id,type:uuid,notnull" json:"user_id"` // User who shared
	SharedWith string    `bun:"shared_with,notnull" json:"shared_with"`   // Email or user ID

	// Sharing settings
	Permission SharedPermission `bun:"permission,default:'view'" json:"permission"`
	ExpiresAt  *time.Time       `bun:"expires_at" json:"expires_at"`

	// Timestamps
	CreatedAt time.Time `bun:"created_at,nullzero,notnull,default:current_timestamp" json:"created_at"`
	UpdatedAt time.Time `bun:"updated_at,nullzero,notnull,default:current_timestamp" json:"updated_at"`

	// Relationships
	Playlist *Playlist `bun:"rel:belongs-to,join:playlist_id=id" json:"playlist,omitempty"`
	User     *User     `bun:"rel:belongs-to,join:user_id=id" json:"user,omitempty"`
}

// SharedPermission represents the permission level for shared playlists
type SharedPermission string

const (
	SharedPermissionView SharedPermission = "view"
	SharedPermissionEdit SharedPermission = "edit"
)

// BeforeInsert hooks for UUID generation and timestamps
func (t *Tag) BeforeInsert(ctx context.Context) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	return nil
}

func (t *Tag) BeforeUpdate(ctx context.Context) error {
	t.UpdatedAt = time.Now()
	return nil
}

func (c *Clip) BeforeInsert(ctx context.Context) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	now := time.Now()
	c.CreatedAt = now
	c.UpdatedAt = now
	return nil
}

func (c *Clip) BeforeUpdate(ctx context.Context) error {
	c.UpdatedAt = time.Now()
	return nil
}

func (p *Playlist) BeforeInsert(ctx context.Context) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now
	return nil
}

func (p *Playlist) BeforeUpdate(ctx context.Context) error {
	p.UpdatedAt = time.Now()
	return nil
}

func (f *Favorite) BeforeInsert(ctx context.Context) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	now := time.Now()
	f.CreatedAt = now
	f.UpdatedAt = now
	return nil
}

func (f *Favorite) BeforeUpdate(ctx context.Context) error {
	f.UpdatedAt = time.Now()
	return nil
}

func (sp *SharedPlaylist) BeforeInsert(ctx context.Context) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	now := time.Now()
	sp.CreatedAt = now
	sp.UpdatedAt = now
	return nil
}

func (sp *SharedPlaylist) BeforeUpdate(ctx context.Context) error {
	sp.UpdatedAt = time.Now()
	return nil
}
