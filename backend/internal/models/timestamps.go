package models

import (
	"context"
	"encoding/json"
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

func (t *Tag) BeforeInsert(ctx context.Context) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.CreatedAt.IsZero() {
		t.CreatedAt = time.Now().UTC()
	}
	if t.UpdatedAt.IsZero() {
		t.UpdatedAt = time.Now().UTC()
	}
	return nil
}

func (t *Tag) BeforeUpdate(ctx context.Context) error {
	t.UpdatedAt = time.Now().UTC()
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

func (t *Timestamp) BeforeInsert(ctx context.Context) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.CreatedAt.IsZero() {
		t.CreatedAt = time.Now().UTC()
	}
	if t.UpdatedAt.IsZero() {
		t.UpdatedAt = time.Now().UTC()
	}
	return nil
}

func (t *Timestamp) BeforeUpdate(ctx context.Context) error {
	t.UpdatedAt = time.Now().UTC()
	return nil
}

type TimestampTag struct {
	ID          uuid.UUID `json:"id" bun:"id,pk,type:uuid,default:uuid_generate_v4()"`
	TimestampID uuid.UUID `json:"timestamp_id" bun:"timestamp_id,type:uuid,notnull"`
	TagID       uuid.UUID `json:"tag_id" bun:"tag_id,type:uuid,notnull"`
	CreatedAt   time.Time `json:"created_at" bun:"created_at,notnull"`

	Timestamp *Timestamp `json:"-" bun:"rel:belongs-to,timestamp"`
	Tag       *Tag       `json:"-" bun:"rel:belongs-to,tag"`
}

func (TimestampTag) TableName() string {
	return "timestamp_tags"
}

func (tt *TimestampTag) BeforeInsert(ctx context.Context) error {
	if tt.ID == uuid.Nil {
		tt.ID = uuid.New()
	}
	if tt.CreatedAt.IsZero() {
		tt.CreatedAt = time.Now().UTC()
	}
	return nil
}

func (t *Tag) MarshalJSON() ([]byte, error) {
	type Alias Tag
	if t.Timestamps == nil {
		t.Timestamps = []Timestamp{}
	}
	return json.Marshal(&struct{ *Alias }{Alias: (*Alias)(t)})
}

func (t *Tag) AfterScan(ctx context.Context) error {
	if t.Timestamps == nil {
		t.Timestamps = []Timestamp{}
	}
	return nil
}

func (t *Timestamp) MarshalJSON() ([]byte, error) {
	type Alias Timestamp
	if t.Tags == nil {
		t.Tags = []Tag{}
	}
	return json.Marshal(&struct{ *Alias }{Alias: (*Alias)(t)})
}

func (t *Timestamp) AfterScan(ctx context.Context) error {
	if t.Tags == nil {
		t.Tags = []Tag{}
	}
	return nil
}
