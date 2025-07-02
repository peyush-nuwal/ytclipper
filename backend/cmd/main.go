package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/shubhamku044/clipture/internal/config"
	"github.com/shubhamku044/clipture/internal/logger"
	"github.com/shubhamku044/clipture/internal/server"
)

func main() {
	logger.InitDefault()

	cfg := config.Load()
	logger.Init(cfg)

	srv := server.NewServer(cfg)

	serverCtx, serverStopCtx := context.WithCancel(context.Background())

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGHUP, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	go func() {
		<-sig

		shutdownCtx, cancelShutdown := context.WithTimeout(serverCtx, 30*time.Second)
		defer cancelShutdown()

		go func() {
			<-shutdownCtx.Done()
			if shutdownCtx.Err() == context.DeadlineExceeded {
				log.Fatal().Msg("graceful shutdown timed out.. forcing exit.")
			}
		}()

		err := srv.Shutdown(shutdownCtx)
		if err != nil {
			log.Fatal().Err(err).Msg("Server shutdown failed")
		}
		serverStopCtx()
	}()

	port := cfg.Server.Port
	log.Info().Str("port", port).Msg("Starting server")

	err := srv.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatal().Err(err).Msg("Server failed to start")
	}

	<-serverCtx.Done()
}
