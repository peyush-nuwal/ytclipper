package router

import (
	"net/http"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/handlers"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/handlers/timestamps"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

func SetupRouter(db *database.Database, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return strings.HasPrefix(origin, "chrome-extension://") ||
				strings.HasPrefix(origin, "http://localhost:5173") ||
				strings.HasPrefix(origin, "https://app.ytclipper.com") ||
				strings.HasPrefix(origin, "https://app-staging.ytclipper.com")
		},
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"https://app.ytclipper.com",
			"https://app-staging.ytclipper.com",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.ResponseFormatter())
	r.Use(middleware.RequestLogger())

	jwtService := authhandlers.NewJWTService(&cfg.JWT, &cfg.Auth, db)
	emailService := authhandlers.NewEmailService()
	authMiddleware := authhandlers.NewAuthMiddleware(jwtService, &cfg.Auth, db)
	authHandlers := authhandlers.NewAuthHandlers(authMiddleware, jwtService, emailService, db)
	oauthHandlers := authhandlers.NewOAuthHandlers(&cfg.Google, &cfg.Auth, jwtService, db, &cfg.Server)
	timestampHandlers := timestamps.NewTimestampsHandlers(db, &cfg.OpenAI)

	r.NoRoute(func(c *gin.Context) {
		middleware.RespondWithError(c, http.StatusNotFound, "NOT_FOUND", "The requested resource could not be found", gin.H{
			"documentation": "/api/docs",
		})
	})

	r.GET("/health", handlers.HealthCheck)
	r.GET("/db-health", handlers.DBHealthCheck(db))

	authhandlers.SetupAuthRoutes(r, authHandlers, oauthHandlers, authMiddleware)

	r.GET("/", func(c *gin.Context) {
		middleware.RespondWithOK(c, gin.H{
			"name":        "ytclipper API",
			"description": "A modern screen capture and annotation service",
			"version":     "1.0.0",
			"status":      "running",
			"endpoints": map[string]string{
				"health":    "/health",
				"db_health": "/db-health",
				"api_v1":    "/api/v1",
			},
			"repository": "https://github.com/shubhamku044/ytclipper",
		})
	})

	v1 := r.Group("/api/v1")
	{
		v1.GET("/", func(c *gin.Context) {
			middleware.RespondWithOK(c, gin.H{
				"name":        "ytclipper API",
				"description": "A modern screen capture and annotation service",
				"version":     "1.0.0",
				"status":      "running",
				"endpoints": map[string]string{
					"health":    "/api/v1/health",
					"db_health": "/api/v1/db-health",
				},
			})
		})

		v1.GET("/health", handlers.HealthCheck)
		v1.GET("/db-health", handlers.DBHealthCheck(db))

		protected := v1.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			timestampRoutes := protected.Group("/timestamps")
			{
				timestampRoutes.GET("/", timestampHandlers.GetAllTimestamps)
				timestampRoutes.POST("/", timestampHandlers.CreateTimestamp)
				timestampRoutes.GET("/:id", timestampHandlers.GetTimestampsByVideoID)
				timestampRoutes.DELETE("/:id", timestampHandlers.DeleteTimestamp)
				timestampRoutes.DELETE("/", timestampHandlers.DeleteMultipleTimestamps)
				timestampRoutes.GET("/tags", timestampHandlers.GetAllTags)
				timestampRoutes.POST("/tags/search", timestampHandlers.SearchTags)
				timestampRoutes.POST("/search", timestampHandlers.SearchTimestamps)
				timestampRoutes.POST("/summary", timestampHandlers.GenerateSummary)
				timestampRoutes.POST("/question", timestampHandlers.AnswerQuestion)
				timestampRoutes.POST("/embeddings/backfill", timestampHandlers.BackfillEmbeddingsAsync)
				timestampRoutes.GET("/embeddings/status", timestampHandlers.GetEmbeddingStatus)
				timestampRoutes.POST("/embeddings/process-user", timestampHandlers.ProcessMissingEmbeddingsForUser)
				timestampRoutes.POST("/embeddings/process-all", timestampHandlers.ProcessAllMissingEmbeddings)
			}

			videoRoutes := protected.Group("/videos")
			{
				videoRoutes.GET("/", timestampHandlers.GetAllVideosWithTimestamps)
				videoRoutes.GET("/recent", timestampHandlers.GetRecentTimestamps)
			}
		}
	}

	return r
}
