// Package database for connection and migrations
package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
	"github.com/uptrace/bun/extra/bundebug"
)

type Database struct {
	DB *bun.DB
}

func NewDatabase(cfg *config.Config) (*Database, error) {
	var dsn string

	if cfg.Database.URL != "" {
		dsn = cfg.Database.URL
	} else {
		dsn = fmt.Sprintf(
			"postgres://%s:%s@%s:%s/%s?sslmode=%s",
			cfg.Database.User,
			cfg.Database.Password,
			cfg.Database.Host,
			cfg.Database.Port,
			cfg.Database.Name,
			cfg.Database.SSLMode,
		)
	}

	// Configure connection with retry logic
	var sqldb *sql.DB
	var err error
	maxRetries := 5
	retryDelay := 2 * time.Second

	for retryCount := 0; retryCount < maxRetries; retryCount++ {
		sqldb = sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(dsn)))

		// Test connection
		if err = sqldb.Ping(); err == nil {
			break
		}

		log.Warn().
			Err(err).
			Int("attempt", retryCount+1).
			Int("maxRetries", maxRetries).
			Msg("Failed to connect to database, retrying...")

		if retryCount < maxRetries-1 {
			time.Sleep(retryDelay)
			retryDelay *= 2
		}
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database after %d attempts: %w", maxRetries, err)
	}

	// Configure connection pool
	sqldb.SetMaxOpenConns(25)
	sqldb.SetMaxIdleConns(25)
	sqldb.SetConnMaxLifetime(5 * time.Minute)

	// Create Bun DB instance
	db := bun.NewDB(sqldb, pgdialect.New())

	db.RegisterModel(
		(*models.TimestampTag)(nil),
		(*models.Tag)(nil),
		(*models.Timestamp)(nil),
	)

	// Add debug logging in development
	if cfg.Server.Env == "development" {
		db.AddQueryHook(bundebug.NewQueryHook(
			bundebug.WithVerbose(true),
			bundebug.FromEnv("BUNDEBUG"),
		))
	}

	log.Info().Msg("Successfully connected to database")

	return &Database{DB: db}, nil
}

func (d *Database) Close() error {
	if d.DB != nil {
		return d.DB.Close()
	}
	return nil
}

func (d *Database) Ping(ctx context.Context) error {
	return d.DB.Ping()
}

// Transaction wrapper
func (d *Database) RunInTransaction(ctx context.Context, fn func(ctx context.Context, tx bun.Tx) error) error {
	return d.DB.RunInTx(ctx, nil, fn)
}

// Basic CRUD operations
func (d *Database) Create(ctx context.Context, model interface{}) error {
	_, err := d.DB.NewInsert().Model(model).Exec(ctx)
	return err
}

func (d *Database) Find(ctx context.Context, model interface{}, id interface{}) error {
	return d.DB.NewSelect().Model(model).Where("id = ?", id).Scan(ctx)
}

func (d *Database) Update(ctx context.Context, model interface{}) error {
	_, err := d.DB.NewUpdate().Model(model).WherePK().Exec(ctx)
	return err
}

func (d *Database) Delete(ctx context.Context, model interface{}) error {
	_, err := d.DB.NewDelete().Model(model).WherePK().Exec(ctx)
	return err
}

// Soft delete support
func (d *Database) SoftDelete(ctx context.Context, model interface{}) error {
	_, err := d.DB.NewUpdate().
		Model(model).
		Set("deleted_at = ?", time.Now()).
		WherePK().
		Exec(ctx)
	return err
}
