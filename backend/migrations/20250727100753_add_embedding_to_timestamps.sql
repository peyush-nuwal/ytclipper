-- +goose Up
-- +goose StatementBegin

-- Add the embedding column to the timestamps table
ALTER TABLE timestamps
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Create an index for fast approximate nearest neighbor search
CREATE INDEX IF NOT EXISTS idx_timestamps_embedding
ON timestamps USING ivfflat (embedding vector_cosine_ops);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP INDEX IF EXISTS idx_timestamps_embedding;
ALTER TABLE timestamps DROP COLUMN IF EXISTS embedding;
-- +goose StatementEnd
