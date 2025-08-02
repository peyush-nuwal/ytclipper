-- +goose Up
-- +goose StatementBegin
ALTER TABLE videos RENAME COLUMN youtube_id TO youtube_url;

ALTER TABLE videos
ADD COLUMN video_id VARCHAR(255) UNIQUE NOT NULL,
ADD COLUMN ai_summary TEXT,
ADD COLUMN ai_summary_generated_at TIMESTAMP,
ADD COLUMN watched_duration INTEGER DEFAULT 0;


CREATE INDEX IF NOT EXISTS idx_timestamps_video_id ON timestamps(video_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE videos
DROP COLUMN IF EXISTS ai_summary,
DROP COLUMN IF EXISTS ai_summary_generated_at,
DROP COLUMN IF EXISTS watched_duration;

ALTER TABLE videos RENAME COLUMN youtube_url TO youtube_id;

DROP INDEX IF EXISTS idx_timestamps_video_id;

-- +goose StatementEnd
