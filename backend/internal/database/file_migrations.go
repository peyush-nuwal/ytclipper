package database

import (
	"context"
	"fmt"
	"io/ioutil"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// FileMigration represents a file-based migration
type FileMigration struct {
	ID          int       `bun:"id,pk,autoincrement"`
	Version     string    `bun:"version,unique,notnull"`
	Description string    `bun:"description"`
	AppliedAt   time.Time `bun:"applied_at,nullzero,notnull,default:current_timestamp"`
}

// RunFileMigrations runs all pending file-based migrations
func (d *Database) RunFileMigrations(ctx context.Context) error {
	log.Info().Msg("Running file-based migrations...")

	// Create migrations table if it doesn't exist
	if err := d.createFileMigrationsTable(ctx); err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get all migration files
	migrationFiles, err := d.getMigrationFiles()
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := d.getAppliedFileMigrations(ctx)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Run pending migrations
	for _, file := range migrationFiles {
		version := d.getVersionFromFilename(file)
		if _, applied := appliedMigrations[version]; !applied {
			log.Info().Str("migration", file).Msg("Running migration")

			err = d.runMigrationFile(ctx, file, true)
			if err != nil {
				return fmt.Errorf("failed to run migration %s: %w", file, err)
			}

			// Record migration
			err = d.recordFileMigration(ctx, version, d.getDescriptionFromFilename(file))
			if err != nil {
				return fmt.Errorf("failed to record migration %s: %w", file, err)
			}
		}
	}

	log.Info().Msg("File-based migrations completed successfully")
	return nil
}

// createFileMigrationsTable creates the migrations tracking table
func (d *Database) createFileMigrationsTable(ctx context.Context) error {
	_, err := d.DB.NewCreateTable().
		Model((*FileMigration)(nil)).
		IfNotExists().
		Exec(ctx)
	return err
}

// getMigrationFiles returns all migration files in order
func (d *Database) getMigrationFiles() ([]string, error) {
	files, err := ioutil.ReadDir("migrations")
	if err != nil {
		// If migrations directory doesn't exist, return empty slice
		return []string{}, nil
	}

	var migrationFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			migrationFiles = append(migrationFiles, file.Name())
		}
	}

	sort.Strings(migrationFiles)
	return migrationFiles, nil
}

// getAppliedFileMigrations returns a map of applied migrations
func (d *Database) getAppliedFileMigrations(ctx context.Context) (map[string]FileMigration, error) {
	var migrations []FileMigration
	err := d.DB.NewSelect().
		Model(&migrations).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	result := make(map[string]FileMigration)
	for _, migration := range migrations {
		result[migration.Version] = migration
	}

	return result, nil
}

// runMigrationFile runs a single migration file
func (d *Database) runMigrationFile(ctx context.Context, filename string, up bool) error {
	filepath := filepath.Join("migrations", filename)
	content, err := ioutil.ReadFile(filepath)
	if err != nil {
		return fmt.Errorf("failed to read migration file: %w", err)
	}

	// Split file by +migrate Up and +migrate Down
	parts := strings.Split(string(content), "-- +migrate Down")
	if len(parts) != 2 {
		return fmt.Errorf("invalid migration file format")
	}

	var sql string
	if up {
		// Get up migration (remove the +migrate Up comment)
		upPart := parts[0]
		upPart = strings.Replace(upPart, "-- +migrate Up", "", 1)
		sql = strings.TrimSpace(upPart)
	} else {
		// Get down migration
		sql = strings.TrimSpace(parts[1])
	}

	// Skip empty SQL
	if sql == "" {
		return nil
	}

	// Execute the SQL
	_, err = d.DB.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	return nil
}

// recordFileMigration records a migration as applied
func (d *Database) recordFileMigration(ctx context.Context, version, description string) error {
	migration := &FileMigration{
		Version:     version,
		Description: description,
		AppliedAt:   time.Now(),
	}

	_, err := d.DB.NewInsert().Model(migration).Exec(ctx)
	return err
}

// getVersionFromFilename extracts version from filename
func (d *Database) getVersionFromFilename(filename string) string {
	parts := strings.Split(filename, "_")
	if len(parts) < 2 {
		return filename
	}
	return parts[0] + "_" + strings.Join(parts[1:], "_")[:len(strings.Join(parts[1:], "_"))-4] // Remove .sql
}

// getDescriptionFromFilename extracts description from filename
func (d *Database) getDescriptionFromFilename(filename string) string {
	parts := strings.Split(filename, "_")
	if len(parts) < 2 {
		return "Unknown"
	}
	desc := strings.Join(parts[1:], "_")
	return strings.TrimSuffix(desc, ".sql")
}
