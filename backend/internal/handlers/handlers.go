package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
)

type UserInfo struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name,omitempty"`
	CreatedAt string `json:"created_at,omitempty"`
}

func HealthCheck(c *gin.Context) {
	middleware.RespondWithOK(c, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().UTC(),
		"service":   "ytclipper-backend",
		"version":   "1.0.0",
	})
}

func DBHealthCheck(db *database.Database) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		status := "healthy"
		var err error

		if db != nil && db.DB != nil {
			err = db.Ping(ctx)
			if err != nil {
				status = "unhealthy"
			}
		} else {
			status = "disconnected"
		}

		if err != nil {
			middleware.RespondWithError(c, http.StatusServiceUnavailable, "DB_UNHEALTHY", "Database is not healthy", gin.H{
				"error": err.Error(),
			})
			return
		}

		middleware.RespondWithOK(c, gin.H{
			"status":    status,
			"timestamp": time.Now().UTC(),
			"database":  "postgresql",
		})
	}
}

func VerifyToken(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth status endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "Token verification is handled by auth handlers",
		"endpoint": "/api/v1/auth/status",
	})
}

func GetUserProfile(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth user endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "User profile is handled by auth handlers",
		"endpoint": "/api/v1/auth/me",
	})
}

func GetSession(c *gin.Context) {
	// This function is now handled by the auth handlers
	// Redirect to the auth session endpoint
	middleware.RespondWithOK(c, gin.H{
		"message":  "Session info is handled by auth handlers",
		"endpoint": "/api/v1/auth/status",
	})
}
