package models

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Tag struct {
	ID         uuid.UUID   `json:"id" bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	Name       string      `json:"name" bun:"name,notnull,unique"`
	CreatedAt  time.Time   `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt  time.Time   `json:"updated_at" bun:"updated_at,notnull"`
	Timestamps []Timestamp `json:"-" bun:"m2m:timestamp_tags"`
}

func (Tag) TableName() string {
	return "tags"
}

// BeforeInsert hook for Tag
func (t *Tag) BeforeInsert(ctx context.Context) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	return nil
}

// BeforeUpdate hook for Tag
func (t *Tag) BeforeUpdate(ctx context.Context) error {
	t.UpdatedAt = time.Now()
	return nil
}

type Timestamp struct {
	ID        uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	VideoID   string    `json:"video_id" bun:"video_id,notnull"`
	UserID    uuid.UUID `json:"user_id" bun:"user_id,type:uuid,notnull"`
	Timestamp float64   `json:"timestamp" bun:"timestamp,notnull"`
	Title     string    `json:"title"`
	Note      string    `json:"note"`
	Tags      []Tag     `json:"tags" bun:"m2m:timestamp_tags"`
	Embedding []float32 `json:"-" bun:"embedding,nullzero"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,notnull"`
	DeletedAt time.Time `json:"-" bun:"deleted_at,soft_delete,nullzero"`
}

func (Timestamp) TableName() string {
	return "timestamps"
}

// BeforeInsert hook for Timestamp
func (t *Timestamp) BeforeInsert(ctx context.Context) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	return nil
}

// BeforeUpdate hook for Timestamp
func (t *Timestamp) BeforeUpdate(ctx context.Context) error {
	t.UpdatedAt = time.Now()
	return nil
}

type TimestampTag struct {
	ID          uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	TimestampID uuid.UUID `json:"timestamp_id" bun:"timestamp_id,type:uuid,notnull"`
	TagID       uuid.UUID `json:"tag_id" bun:"tag_id,type:uuid,notnull"`
	CreatedAt   time.Time `json:"created_at" bun:"created_at,notnull"`

	// These fields are needed for Bun ORM many-to-many relationships
	Timestamp *Timestamp `json:"-" bun:"rel:belongs-to,timestamp"`
	Tag       *Tag       `json:"-" bun:"rel:belongs-to,tag"`
}

func (TimestampTag) TableName() string {
	return "timestamp_tags"
}

// BeforeInsert hook for TimestampTag
func (tt *TimestampTag) BeforeInsert(ctx context.Context) error {
	if tt.ID == uuid.Nil {
		tt.ID = uuid.New()
	}
	now := time.Now()
	tt.CreatedAt = now
	return nil
}
