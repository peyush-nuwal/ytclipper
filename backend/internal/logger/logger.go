package logger

import (
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/ytclipper/internal/config"
)

func InitDefault() {
	zerolog.TimeFieldFormat = time.RFC3339
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

func Init(cfg *config.Config) {
	zerolog.TimeFieldFormat = cfg.Logger.TimeFormat

	var logLevel zerolog.Level
	switch cfg.Logger.Level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(logLevel)

	if cfg.Logger.Pretty {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	} else {
		log.Logger = zerolog.New(os.Stderr).With().Timestamp().Logger()
	}
}
