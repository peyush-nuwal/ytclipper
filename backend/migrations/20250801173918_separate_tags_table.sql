-- +goose Up
-- +goose StatementBegin

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on tags name for case-insensitive search
CREATE INDEX IF NOT EXISTS idx_tags_name_lower ON tags(LOWER(name));

-- Create junction table for timestamps and tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS timestamp_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp_id UUID NOT NULL REFERENCES timestamps(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timestamp_id, tag_id)
);

-- Create indexes for the junction table
CREATE INDEX IF NOT EXISTS idx_timestamp_tags_timestamp_id ON timestamp_tags(timestamp_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_tags_tag_id ON timestamp_tags(tag_id);

-- Remove the tags column from timestamps table (if it exists)
ALTER TABLE timestamps DROP COLUMN IF EXISTS tags;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Add back the tags column to timestamps table
ALTER TABLE timestamps ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Drop the junction table and tags table
DROP INDEX IF EXISTS idx_timestamp_tags_timestamp_id;
DROP INDEX IF EXISTS idx_timestamp_tags_tag_id;
DROP TABLE IF EXISTS timestamp_tags;

DROP INDEX IF EXISTS idx_tags_name_lower;
DROP TABLE IF EXISTS tags;

-- +goose StatementEnd
