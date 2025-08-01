package server

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pressly/goose/v3"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/router"
)

func runGooseMigrations(ctx context.Context, db *database.Database) error {
	sqlDB := db.DB.DB

	goose.SetBaseFS(nil)

	if err := goose.Up(sqlDB, "migrations"); err != nil {
		return err
	}

	return nil
}

type Server struct {
	router *gin.Engine
	http   *http.Server
	config *config.Config
	db     *database.Database
}

func NewServer(cfg *config.Config) *Server {
	db, err := database.NewDatabase(cfg)
	if err != nil {
		log.Warn().Err(err).Msg("Failed to connect to database, continuing without database connection")
	} else {
		ctx := context.Background()
		if err := runGooseMigrations(ctx, db); err != nil {
			log.Error().Err(err).Msg("Failed to run database migrations")
		} else {
			log.Info().Msg("Database migrations completed successfully")
		}
	}

	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if cfg.Server.Env == "test" {
		gin.SetMode(gin.TestMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := router.SetupRouter(db, cfg)

	srv := &Server{
		router: r,
		config: cfg,
		db:     db,
		http: &http.Server{
			Addr:    ":" + cfg.Server.Port,
			Handler: r,
		},
	}

	return srv
}

func (s *Server) ListenAndServe() error {
	return s.http.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.db != nil {
		s.db.Close()
	}
	return s.http.Shutdown(ctx)
}
