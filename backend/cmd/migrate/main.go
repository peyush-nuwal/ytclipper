package main

import (
	"context"
	"flag"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"text/template"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
)

const migrationTemplate = `-- +migrate Up
-- {{ .Description }}

-- Add your up migration SQL here


-- +migrate Down
-- Rollback {{ .Description }}

-- Add your down migration SQL here

`

type MigrationData struct {
	Description string
}

func main() {
	// Configure logger
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	var (
		command     = flag.String("command", "", "Command to run: create, up, down, status")
		description = flag.String("desc", "", "Description for new migration")
		steps       = flag.Int("steps", 0, "Number of steps to migrate (0 = all)")
	)
	flag.Parse()

	if *command == "" {
		fmt.Println("Usage: go run cmd/migrate/main.go -command=<create|up|down|status> [options]")
		fmt.Println("Commands:")
		fmt.Println("  create -desc='description'  Create a new migration")
		fmt.Println("  up                          Run all pending migrations")
		fmt.Println("  down -steps=N               Rollback N migrations")
		fmt.Println("  status                      Show migration status")
		os.Exit(1)
	}

	// Load configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.NewDatabase(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer db.Close()

	ctx := context.Background()

	switch *command {
	case "create":
		if *description == "" {
			log.Fatal().Msg("Description is required for create command")
		}
		err = createMigration(*description)
	case "up":
		err = runMigrationsUp(ctx, db)
	case "down":
		err = runMigrationsDown(ctx, db, *steps)
	case "status":
		err = showMigrationStatus(ctx, db)
	default:
		log.Fatal().Str("command", *command).Msg("Unknown command")
	}

	if err != nil {
		log.Fatal().Err(err).Msg("Command failed")
	}
}

func createMigration(description string) error {
	// Get next migration number
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	nextNumber := getNextMigrationNumber(migrationFiles)

	// Create filename
	filename := fmt.Sprintf("%03d_%s.sql", nextNumber, strings.ReplaceAll(strings.ToLower(description), " ", "_"))
	filepath := filepath.Join("migrations", filename)

	// Create migration file from template
	tmpl, err := template.New("migration").Parse(migrationTemplate)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	file, err := os.Create(filepath)
	if err != nil {
		return fmt.Errorf("failed to create migration file: %w", err)
	}
	defer file.Close()

	data := MigrationData{
		Description: description,
	}

	err = tmpl.Execute(file, data)
	if err != nil {
		return fmt.Errorf("failed to execute template: %w", err)
	}

	log.Info().Str("file", filepath).Msg("Created migration file")
	return nil
}

func runMigrationsUp(ctx context.Context, db *database.Database) error {
	log.Info().Msg("Running migrations up...")

	// Get all migration files
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := getAppliedMigrations(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Run pending migrations
	for _, file := range migrationFiles {
		version := getVersionFromFilename(file)
		if _, applied := appliedMigrations[version]; !applied {
			log.Info().Str("migration", file).Msg("Running migration")

			err = runMigrationFile(ctx, db, file, true)
			if err != nil {
				return fmt.Errorf("failed to run migration %s: %w", file, err)
			}

			// Record migration
			err = recordMigration(ctx, db, version, getDescriptionFromFilename(file))
			if err != nil {
				return fmt.Errorf("failed to record migration %s: %w", file, err)
			}
		}
	}

	log.Info().Msg("All migrations completed")
	return nil
}

func runMigrationsDown(ctx context.Context, db *database.Database, steps int) error {
	if steps <= 0 {
		return fmt.Errorf("steps must be greater than 0")
	}

	log.Info().Int("steps", steps).Msg("Running migrations down...")

	// Get applied migrations in reverse order
	appliedMigrations, err := getAppliedMigrationsOrdered(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	// Reverse the order for rollback
	for i := len(appliedMigrations) - 1; i >= 0 && steps > 0; i-- {
		migration := appliedMigrations[i]
		filename := findMigrationFile(migration.Version)

		if filename == "" {
			log.Warn().Str("version", migration.Version).Msg("Migration file not found, skipping")
			continue
		}

		log.Info().Str("migration", filename).Msg("Rolling back migration")

		err = runMigrationFile(ctx, db, filename, false)
		if err != nil {
			return fmt.Errorf("failed to rollback migration %s: %w", filename, err)
		}

		// Remove migration record
		err = removeMigrationRecord(ctx, db, migration.Version)
		if err != nil {
			return fmt.Errorf("failed to remove migration record %s: %w", filename, err)
		}

		steps--
	}

	log.Info().Msg("Migration rollback completed")
	return nil
}

func showMigrationStatus(ctx context.Context, db *database.Database) error {
	// Get all migration files
	migrationFiles, err := getMigrationFiles()
	if err != nil {
		return fmt.Errorf("failed to get migration files: %w", err)
	}

	// Get applied migrations
	appliedMigrations, err := getAppliedMigrations(ctx, db)
	if err != nil {
		return fmt.Errorf("failed to get applied migrations: %w", err)
	}

	fmt.Println("Migration Status:")
	fmt.Println("=================")

	for _, file := range migrationFiles {
		version := getVersionFromFilename(file)
		status := "PENDING"
		appliedAt := ""

		if migration, applied := appliedMigrations[version]; applied {
			status = "APPLIED"
			appliedAt = migration.AppliedAt.Format("2006-01-02 15:04:05")
		}

		fmt.Printf("%-30s %-10s %s\n", file, status, appliedAt)
	}

	return nil
}

// Helper functions

func getMigrationFiles() ([]string, error) {
	files, err := ioutil.ReadDir("migrations")
	if err != nil {
		return nil, err
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

func getNextMigrationNumber(files []string) int {
	if len(files) == 0 {
		return 1
	}

	// Get the last file and extract number
	lastFile := files[len(files)-1]
	parts := strings.Split(lastFile, "_")
	if len(parts) == 0 {
		return 1
	}

	num, err := strconv.Atoi(parts[0])
	if err != nil {
		return 1
	}

	return num + 1
}

func getVersionFromFilename(filename string) string {
	parts := strings.Split(filename, "_")
	if len(parts) < 2 {
		return filename
	}
	return parts[0] + "_" + strings.Join(parts[1:], "_")[:len(strings.Join(parts[1:], "_"))-4] // Remove .sql
}

func getDescriptionFromFilename(filename string) string {
	parts := strings.Split(filename, "_")
	if len(parts) < 2 {
		return "Unknown"
	}
	desc := strings.Join(parts[1:], "_")
	return strings.TrimSuffix(desc, ".sql")
}

func getAppliedMigrations(ctx context.Context, db *database.Database) (map[string]database.FileMigration, error) {
	// Create migrations table if it doesn't exist
	_, err := db.DB.NewCreateTable().
		Model((*database.FileMigration)(nil)).
		IfNotExists().
		Exec(ctx)
	if err != nil {
		return nil, err
	}

	var migrations []database.FileMigration
	err = db.DB.NewSelect().
		Model(&migrations).
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	result := make(map[string]database.FileMigration)
	for _, migration := range migrations {
		result[migration.Version] = migration
	}

	return result, nil
}

func getAppliedMigrationsOrdered(ctx context.Context, db *database.Database) ([]database.FileMigration, error) {
	var migrations []database.FileMigration
	err := db.DB.NewSelect().
		Model(&migrations).
		Order("applied_at DESC").
		Scan(ctx)
	if err != nil {
		return nil, err
	}

	return migrations, nil
}

func findMigrationFile(version string) string {
	files, err := getMigrationFiles()
	if err != nil {
		return ""
	}

	for _, file := range files {
		if getVersionFromFilename(file) == version {
			return file
		}
	}

	return ""
}

func runMigrationFile(ctx context.Context, db *database.Database, filename string, up bool) error {
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

	// Execute the SQL
	_, err = db.DB.Exec(sql)
	if err != nil {
		return fmt.Errorf("failed to execute migration SQL: %w", err)
	}

	return nil
}

func recordMigration(ctx context.Context, db *database.Database, version, description string) error {
	migration := &database.FileMigration{
		Version:     version,
		Description: description,
		AppliedAt:   time.Now(),
	}

	_, err := db.DB.NewInsert().Model(migration).Exec(ctx)
	return err
}

func removeMigrationRecord(ctx context.Context, db *database.Database, version string) error {
	_, err := db.DB.NewDelete().
		Model((*database.FileMigration)(nil)).
		Where("version = ?", version).
		Exec(ctx)
	return err
}
