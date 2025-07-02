package logger

import (
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/clipture/internal/config"
)

// InitDefault initializes the logger with default settings
func InitDefault() {
	// UNIX Time is faster and smaller than most timestamps
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Default level is info
	zerolog.SetGlobalLevel(zerolog.InfoLevel)

	// Pretty print for development
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

// Init initializes the logger with configuration
func Init(cfg *config.Config) {
	// Set log level
	level := parseLogLevel(cfg.Logger.Level)
	zerolog.SetGlobalLevel(level)

	// Configure time format
	if cfg.Logger.TimeFormat != "" {
		zerolog.TimeFieldFormat = cfg.Logger.TimeFormat
	}

	// Configure output format
	if cfg.Logger.Pretty && cfg.Server.Env != "production" {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: time.RFC3339,
		})
	} else {
		// JSON format for production
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}

	log.Info().
		Str("level", cfg.Logger.Level).
		Bool("pretty", cfg.Logger.Pretty).
		Str("format", cfg.Logger.TimeFormat).
		Msg("Logger initialized")
}

func parseLogLevel(level string) zerolog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn", "warning":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	default:
		return zerolog.InfoLevel
	}
}
