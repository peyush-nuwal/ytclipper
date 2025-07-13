package database

import (
	"context"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/uptrace/bun"
)

// Migration represents a database migration
type Migration struct {
	ID          int       `bun:"id,pk,autoincrement"`
	Version     string    `bun:"version,unique,notnull"`
	Description string    `bun:"description"`
	AppliedAt   time.Time `bun:"applied_at,nullzero,notnull,default:current_timestamp"`
}

// MigrationFunc represents a migration function
type MigrationFunc func(ctx context.Context, db *bun.DB) error

// MigrationEntry represents a migration with its up and down functions
type MigrationEntry struct {
	Version     string
	Description string
	Up          MigrationFunc
	Down        MigrationFunc
}

// RunMigrations runs all pending migrations
func (d *Database) RunMigrations(ctx context.Context) error {
	log.Info().Msg("Running database migrations...")

	// Create migrations table if it doesn't exist
	if err := d.createMigrationsTable(ctx); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migrations
	migrations := getAllMigrations()

	// Run each migration
	for _, migration := range migrations {
		if err := d.runMigration(ctx, migration); err != nil {
			return fmt.Errorf("failed to run migration %s: %w", migration.Version, err)
		}
	}

	log.Info().Msg("Database migrations completed successfully")
	return nil
}

// createMigrationsTable creates the migrations tracking table
func (d *Database) createMigrationsTable(ctx context.Context) error {
	_, err := d.DB.NewCreateTable().
		Model((*Migration)(nil)).
		IfNotExists().
		Exec(ctx)
	return err
}

// runMigration runs a single migration if it hasn't been applied yet
func (d *Database) runMigration(ctx context.Context, migration MigrationEntry) error {
	// Check if migration has already been applied
	count, err := d.DB.NewSelect().
		Model((*Migration)(nil)).
		Where("version = ?", migration.Version).
		Count(ctx)

	if err != nil {
		return fmt.Errorf("failed to check migration status: %w", err)
	}

	if count > 0 {
		log.Debug().Str("version", migration.Version).Msg("Migration already applied, skipping")
		return nil
	}

	log.Info().Str("version", migration.Version).Str("description", migration.Description).Msg("Applying migration")

	// Run the migration
	if err := migration.Up(ctx, d.DB); err != nil {
		return fmt.Errorf("failed to execute migration: %w", err)
	}

	// Record the migration
	migrationRecord := &Migration{
		Version:     migration.Version,
		Description: migration.Description,
		AppliedAt:   time.Now(),
	}

	_, err = d.DB.NewInsert().Model(migrationRecord).Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to record migration: %w", err)
	}

	log.Info().Str("version", migration.Version).Msg("Migration applied successfully")
	return nil
}

// getAllMigrations returns all available migrations in order
func getAllMigrations() []MigrationEntry {
	return []MigrationEntry{
		{
			Version:     "001_initial_schema",
			Description: "Create initial database schema",
			Up:          migration001Up,
			Down:        migration001Down,
		},
		{
			Version:     "002_add_indexes",
			Description: "Add database indexes for performance",
			Up:          migration002Up,
			Down:        migration002Down,
		},
	}
}

// migration001Up creates the initial schema
func migration001Up(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Creating initial database schema...")

	// Enable UUID extension
	_, err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")
	if err != nil {
		return fmt.Errorf("failed to create uuid extension: %w", err)
	}

	// Create users table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			email VARCHAR(255) UNIQUE NOT NULL,
			name VARCHAR(255),
			picture VARCHAR(500),
			google_id VARCHAR(255) UNIQUE,
			password VARCHAR(255),
			email_verified BOOLEAN DEFAULT FALSE,
			email_verification_token VARCHAR(255),
			email_verification_expiry TIMESTAMP,
			password_reset_token VARCHAR(255),
			password_reset_expiry TIMESTAMP,
			provider VARCHAR(50),
			provider_id VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}

	// Create refresh_tokens table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS refresh_tokens (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			token VARCHAR(255) UNIQUE NOT NULL,
			expires_at TIMESTAMP NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create refresh_tokens table: %w", err)
	}

	// Create user_sessions table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS user_sessions (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			user_agent VARCHAR(500),
			ip_address VARCHAR(45),
			expires_at TIMESTAMP NOT NULL,
			is_active BOOLEAN DEFAULT TRUE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create user_sessions table: %w", err)
	}

	// Create videos table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS videos (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			youtube_id VARCHAR(255) UNIQUE NOT NULL,
			title VARCHAR(500) NOT NULL,
			description TEXT,
			thumbnail_url VARCHAR(500),
			duration INTEGER,
			channel_name VARCHAR(255),
			channel_id VARCHAR(255),
			published_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create videos table: %w", err)
	}

	// Create clips table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS clips (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			start_time FLOAT NOT NULL,
			end_time FLOAT,
			title VARCHAR(500) NOT NULL,
			description TEXT,
			content TEXT,
			type VARCHAR(50) DEFAULT 'note',
			importance INTEGER DEFAULT 3,
			is_public BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create clips table: %w", err)
	}

	// Create tags table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS tags (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(100) NOT NULL,
			color VARCHAR(7) DEFAULT '#3B82F6',
			usage_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create tags table: %w", err)
	}

	// Create playlists table
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS playlists (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			visibility VARCHAR(20) DEFAULT 'private',
			is_collaborative BOOLEAN DEFAULT FALSE,
			thumbnail_url VARCHAR(500),
			color VARCHAR(7) DEFAULT '#3B82F6',
			video_count INTEGER DEFAULT 0,
			view_count INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			deleted_at TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create playlists table: %w", err)
	}

	log.Info().Msg("Initial schema created successfully")
	return nil
}

// migration001Down drops the initial schema
func migration001Down(ctx context.Context, db *bun.DB) error {
	tables := []string{
		"playlists", "tags", "clips", "videos",
		"user_sessions", "refresh_tokens", "users",
	}

	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s CASCADE", table))
		if err != nil {
			return fmt.Errorf("failed to drop table %s: %w", table, err)
		}
	}

	return nil
}

// migration002Up adds indexes for performance
func migration002Up(ctx context.Context, db *bun.DB) error {
	log.Info().Msg("Adding database indexes...")

	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
		"CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id)",
		"CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)",
		"CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_videos_youtube_id ON videos(youtube_id)",
		"CREATE INDEX IF NOT EXISTS idx_clips_video_id ON clips(video_id)",
		"CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)",
		"CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id)",
	}

	for _, indexSQL := range indexes {
		_, err := db.Exec(indexSQL)
		if err != nil {
			return fmt.Errorf("failed to create index: %w", err)
		}
	}

	log.Info().Msg("Database indexes created successfully")
	return nil
}

// migration002Down drops the indexes
func migration002Down(ctx context.Context, db *bun.DB) error {
	indexes := []string{
		"DROP INDEX IF EXISTS idx_users_email",
		"DROP INDEX IF EXISTS idx_users_google_id",
		"DROP INDEX IF EXISTS idx_refresh_tokens_user_id",
		"DROP INDEX IF EXISTS idx_refresh_tokens_token",
		"DROP INDEX IF EXISTS idx_user_sessions_user_id",
		"DROP INDEX IF EXISTS idx_videos_user_id",
		"DROP INDEX IF EXISTS idx_videos_youtube_id",
		"DROP INDEX IF EXISTS idx_clips_video_id",
		"DROP INDEX IF EXISTS idx_clips_user_id",
		"DROP INDEX IF EXISTS idx_tags_user_id",
		"DROP INDEX IF EXISTS idx_playlists_user_id",
	}

	for _, indexSQL := range indexes {
		_, err := db.Exec(indexSQL)
		if err != nil {
			return fmt.Errorf("failed to drop index: %w", err)
		}
	}

	return nil
}
