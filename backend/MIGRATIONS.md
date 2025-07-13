# Database Migrations Guide

This guide explains how to work with database migrations in the YTClipper backend using Goose migration tool with Bun
ORM.

## Overview

Our migration system uses [Goose](https://github.com/pressly/goose) for database migrations with file-based SQL
migrations stored in the `backend/migrations/` directory. Each migration is a SQL file with both "up" and "down"
operations.

## Migration File Structure

Migration files follow Goose's timestamp naming convention:

```
20250713000001_initial_schema.sql
20250713000002_add_indexes.sql
20250713000003_add_user_preferences.sql
```

Each file contains:

```sql
-- +goose Up
-- Description of what this migration does

-- Your SQL for applying the migration
CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL
);

-- +goose Down
-- Description of how to rollback this migration

-- Your SQL for rolling back the migration
DROP TABLE IF EXISTS example;
```

## Available Commands

### Create a New Migration

```bash
make migrate-create desc="add user preferences table"
```

This creates a new migration file with a timestamp and your description.

### Run All Pending Migrations

```bash
make migrate-up
```

This applies all migrations that haven't been run yet.

### Rollback Migrations

```bash
make migrate-down steps=1
```

This rolls back the specified number of migrations (most recent first).

### Check Migration Status

```bash
make migrate-status
```

This shows which migrations have been applied and when.

### Reset Database (Development Only)

```bash
make migrate-reset
```

**⚠️ WARNING**: This will drop all data! It rolls back all migrations and then reapplies them.

## Common Migration Scenarios

### 1. Adding a New Column

Create a new migration:

```bash
make migrate-create desc="add profile_picture to users"
```

Edit the generated file:

```sql
-- +goose Up
-- Add profile_picture column to users table

ALTER TABLE users ADD COLUMN profile_picture VARCHAR(500);

-- +goose Down
-- Remove profile_picture column from users table

ALTER TABLE users DROP COLUMN profile_picture;
```

### 2. Creating a New Table

```bash
make migrate-create desc="create notifications table"
```

```sql
-- +goose Up
-- Create notifications table

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read ON notifications(read);

-- +goose Down
-- Drop notifications table

DROP TABLE IF EXISTS notifications;
```

### 3. Modifying an Existing Column

```bash
make migrate-create desc="increase video title length"
```

```sql
-- +goose Up
-- Increase video title column length

ALTER TABLE videos ALTER COLUMN title TYPE VARCHAR(1000);

-- +goose Down
-- Revert video title column length

ALTER TABLE videos ALTER COLUMN title TYPE VARCHAR(500);
```

### 4. Adding Indexes

```bash
make migrate-create desc="add performance indexes"
```

```sql
-- +goose Up
-- Add performance indexes

CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_clips_start_time ON clips(start_time);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- +goose Down
-- Remove performance indexes

DROP INDEX IF EXISTS idx_videos_channel_id;
DROP INDEX IF EXISTS idx_clips_start_time;
DROP INDEX IF EXISTS idx_users_email_verified;
```

### 5. Adding Constraints

```bash
make migrate-create desc="add unique constraint to video youtube_id"
```

```sql
-- +goose Up
-- Add unique constraint to video youtube_id

ALTER TABLE videos ADD CONSTRAINT uk_videos_youtube_id UNIQUE (youtube_id);

-- +goose Down
-- Remove unique constraint from video youtube_id

ALTER TABLE videos DROP CONSTRAINT IF EXISTS uk_videos_youtube_id;
```

## Best Practices

### 1. Always Test Migrations

Before applying migrations in production:

1. Test the migration locally
2. Test the rollback (down migration)
3. Verify data integrity after migration

### 2. Make Migrations Reversible

Always write proper down migrations. Even if you don't plan to rollback, having them helps with:

- Development workflow
- Emergency rollbacks
- Understanding what the migration does

### 3. Use Transactions Carefully

Goose automatically wraps each migration in a transaction, but be aware of:

- DDL operations that can't be rolled back
- Long-running migrations that might lock tables

### 4. Handle Data Migrations

For complex data transformations:

```sql
-- +goose Up
-- Migrate user preferences from JSON to separate table

-- Create new table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
);

-- Migrate existing data (if any)
INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT
    id,
    'theme',
    COALESCE(preferences->>'theme', 'light')
FROM users
WHERE preferences IS NOT NULL;

-- Remove old column
ALTER TABLE users DROP COLUMN IF EXISTS preferences;

-- +goose Down
-- Rollback user preferences migration

-- Add back old column
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Migrate data back (simplified)
UPDATE users SET preferences = jsonb_build_object('theme',
    COALESCE((SELECT preference_value FROM user_preferences
             WHERE user_id = users.id AND preference_key = 'theme'), 'light')
);

-- Drop new table
DROP TABLE IF EXISTS user_preferences;
```

### 5. Version Control

- Always commit migration files with your code changes
- Never modify existing migration files that have been applied
- Create new migrations to fix issues

## Troubleshooting

### Migration Failed

If a migration fails:

1. Check the error message in the logs
2. Fix the SQL in the migration file
3. Rollback if necessary: `make migrate-down steps=1`
4. Fix and reapply: `make migrate-up`

### Migration Applied but Wrong

If you need to fix an applied migration:

1. Create a new migration to fix the issue
2. Don't modify the original migration file

### Database Out of Sync

If your database schema doesn't match migrations:

1. Check migration status: `make migrate-status`
2. In development, you can reset: `make migrate-reset`
3. In production, create corrective migrations

## Production Considerations

### 1. Backup Before Migrations

Always backup your database before running migrations in production.

### 2. Downtime Planning

Some migrations may require downtime:

- Adding NOT NULL columns to large tables
- Changing column types
- Adding indexes on large tables

### 3. Monitoring

Monitor migration performance and database locks during application.

### 4. Rollback Strategy

Have a rollback plan ready:

- Test rollback migrations
- Have database backups
- Know how to quickly revert application code

## Integration with Application

Goose migrations are integrated into the application startup:

```go
// In internal/server/server.go
if err := goose.Up(database.GetDB().DB, "migrations"); err != nil {
    log.Error().Err(err).Msg("Failed to run database migrations")
    return err
}
```

This ensures migrations are applied automatically when the application starts.

## Goose CLI Commands

You can also run Goose commands directly:

```bash
# Set environment variables first
source docker/.env

# Check status
goose -dir migrations postgres "$DATABASE_URL" status

# Apply migrations
goose -dir migrations postgres "$DATABASE_URL" up

# Rollback migrations
goose -dir migrations postgres "$DATABASE_URL" down

# Create new migration
goose -dir migrations create add_user_preferences sql
```

## Migration Tracking

Goose tracks applied migrations in the `goose_db_version` table:

- `id` - Auto-incrementing primary key
- `version_id` - Migration timestamp (e.g., "20250713000001")
- `is_applied` - Boolean indicating if migration is applied
- `tstamp` - Timestamp when migration was applied

## File Structure

```
backend/
├── migrations/
│   ├── 20250713000001_initial_schema.sql
│   ├── 20250713000002_add_indexes.sql
│   └── 20250713000003_add_user_preferences.sql
├── internal/
│   ├── database/
│   │   └── database.go
│   └── server/
│       └── server.go
└── Makefile
```

## Why Goose?

We chose Goose for our migration system because:

- **Battle-tested**: Used by many production applications
- **Simple**: Easy to understand and use
- **Flexible**: Supports both SQL and Go migrations
- **Integration**: Works well with any Go database driver
- **Features**: Provides versioning, rollbacks, and status checking
- **Community**: Active community and good documentation

## Quick Reference

| Command                                  | Description                  |
| ---------------------------------------- | ---------------------------- |
| `make migrate-create desc="description"` | Create new migration         |
| `make migrate-up`                        | Apply all pending migrations |
| `make migrate-down steps=N`              | Rollback N migrations        |
| `make migrate-status`                    | Show migration status        |
| `make migrate-reset`                     | Reset database (dev only)    |

The migration system automatically runs on application startup and is ready for production use! 🚀
