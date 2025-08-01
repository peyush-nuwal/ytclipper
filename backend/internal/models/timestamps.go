package models

import "time"

type Tag struct {
	ID        string    `json:"id" bun:"id,pk"`
	Name      string    `json:"name" bun:"name,notnull,unique"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,notnull"`
}

func (Tag) TableName() string {
	return "tags"
}

type Timestamp struct {
	ID        string    `json:"id" bun:"id,pk"`
	VideoID   string    `json:"video_id" bun:"video_id,notnull"`
	UserID    string    `json:"user_id" bun:"user_id,notnull"`
	Timestamp float64   `json:"timestamp" bun:"timestamp,notnull"`
	Title     string    `json:"title"`
	Note      string    `json:"note"`
	Tags      []Tag     `json:"tags" bun:"m2m:timestamp_tags,join:Timestamp=Tag"`
	Embedding []float32 `json:"-" bun:"embedding,notnull"`
	CreatedAt time.Time `json:"created_at" bun:"created_at,notnull"`
	UpdatedAt time.Time `json:"updated_at" bun:"updated_at,notnull"`
	DeletedAt time.Time `json:"-" bun:"deleted_at,soft_delete,nullzero"`
}

func (Timestamp) TableName() string {
	return "timestamps"
}

type TimestampTag struct {
	ID          string    `json:"id" bun:"id,pk"`
	TimestampID string    `json:"timestamp_id" bun:"timestamp_id,notnull"`
	TagID       string    `json:"tag_id" bun:"tag_id,notnull"`
	CreatedAt   time.Time `json:"created_at" bun:"created_at,notnull"`
}

func (TimestampTag) TableName() string {
	return "timestamp_tags"
}
