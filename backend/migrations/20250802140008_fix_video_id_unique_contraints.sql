-- +goose Up
-- +goose StatementBegin

-- Drop the existing unique constraint on video_id
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_video_id_key;

-- Create a composite unique index for user_id + video_id instead
-- This allows multiple users to have the same video_id but prevents duplicates per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_user_video_id ON videos(user_id, video_id);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop the composite unique index
DROP INDEX IF EXISTS idx_videos_user_video_id;

-- Re-add the unique constraint on video_id (if needed for rollback)
-- Note: This will fail if there are duplicate video_ids across users
-- ALTER TABLE videos ADD CONSTRAINT videos_video_id_key UNIQUE (video_id);

-- +goose StatementEnd
