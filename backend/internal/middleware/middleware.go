package middleware

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			log.Error().Str("error", err).Msg("Panic recovered")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "INTERNAL_ERROR",
					"message": "Internal server error",
				},
				"timestamp": time.Now().UTC(),
			})
		}
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}

func ResponseFormatter() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
	}
}

func RequestLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		log.Info().
			Str("method", param.Method).
			Str("path", param.Path).
			Int("status", param.StatusCode).
			Dur("latency", param.Latency).
			Str("client_ip", param.ClientIP).
			Msg("HTTP Request")
		return ""
	})
}

type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

func RespondWithOK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, APIResponse{
		Success:   true,
		Data:      data,
		Timestamp: time.Now().UTC(),
	})
}

func RespondWithError(c *gin.Context, statusCode int, code, message string, details interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
		Timestamp: time.Now().UTC(),
	})
}
