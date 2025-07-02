package router

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/clipture/internal/database"
	"github.com/shubhamku044/clipture/internal/handlers"
	"github.com/shubhamku044/clipture/internal/middleware"
)

// SetupRouter sets up the router with all routes and middleware
func SetupRouter(db *database.Database) *gin.Engine {
	r := gin.Default()

	// Add middlewares
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.Use(middleware.ErrorHandler())
	r.Use(middleware.ResponseFormatter())
	r.Use(middleware.RequestLogger())

	// Add NoRoute handler for proper 404 responses
	r.NoRoute(func(c *gin.Context) {
		middleware.RespondWithError(c, http.StatusNotFound, "NOT_FOUND", "The requested resource could not be found", gin.H{
			"documentation": "/api/docs",
		})
	})

	// Root health check endpoints
	r.GET("/health", handlers.HealthCheck)
	r.GET("/db-health", handlers.DBHealthCheck(db))

	// Root welcome page
	r.GET("/", func(c *gin.Context) {
		middleware.RespondWithOK(c, gin.H{
			"name":        "Clipture API",
			"description": "A modern screen capture and annotation service",
			"version":     "1.0.0",
			"status":      "running",
			"endpoints": map[string]string{
				"health":    "/health",
				"db_health": "/db-health",
				"api_v1":    "/api/v1",
			},
			"repository": "https://github.com/shubhamku044/clipture",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// API v1 welcome page
		v1.GET("/", func(c *gin.Context) {
			middleware.RespondWithOK(c, gin.H{
				"name":        "Clipture API",
				"description": "A modern screen capture and annotation service",
				"version":     "1.0.0",
				"status":      "running",
				"endpoints": map[string]string{
					"health":    "/api/v1/health",
					"db_health": "/api/v1/db-health",
				},
			})
		})

		// Health check endpoints
		v1.GET("/health", handlers.HealthCheck)
		v1.GET("/db-health", handlers.DBHealthCheck(db))

		// Auth routes (to be implemented)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", func(c *gin.Context) {
				middleware.RespondWithOK(c, gin.H{"message": "Registration endpoint - to be implemented"})
			})
			auth.POST("/login", func(c *gin.Context) {
				middleware.RespondWithOK(c, gin.H{"message": "Login endpoint - to be implemented"})
			})
		}

		// Protected routes (to be implemented)
		protected := v1.Group("")
		// protected.Use(middleware.Auth()) // Add auth middleware later
		{
			// User routes
			protected.GET("/profile", func(c *gin.Context) {
				middleware.RespondWithOK(c, gin.H{"message": "Profile endpoint - to be implemented"})
			})
		}
	}

	return r
}
