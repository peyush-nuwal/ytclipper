package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type AuthMiddleware struct {
	jwtService *JWTService
	authConfig *config.AuthConfig
	db         *database.Database
}

func NewAuthMiddleware(jwtService *JWTService, authConfig *config.AuthConfig, db *database.Database) *AuthMiddleware {
	return &AuthMiddleware{
		jwtService: jwtService,
		authConfig: authConfig,
		db:         db,
	}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := m.extractToken(c)
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "NO_TOKEN", "No authentication token provided", nil)
			c.Abort()
			return
		}

		claims, err := m.jwtService.ValidateToken(token)
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid or expired token", nil)
			c.Abort()
			return
		}

		// Get user from database
		var user models.User
		err = m.db.DB.NewSelect().
			Model(&user).
			Where("id = ?", claims.UserID).
			Scan(c.Request.Context())
		if err != nil {
			middleware.RespondWithError(c, http.StatusUnauthorized, "USER_NOT_FOUND", "User not found", nil)
			c.Abort()
			return
		}

		// Set user in Gin's context
		c.Set("user", user)
		c.Set("claims", claims)

		c.Next()
	}
}

func (m *AuthMiddleware) extractToken(c *gin.Context) (string, error) {
	// Try to get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1], nil
		}
	}

	// Try to get token from cookie
	token, err := c.Cookie("access_token")
	if err != nil {
		return "", err
	}

	return token, nil
}

// GetUser retrieves the user from the context
func GetUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	if userObj, ok := user.(models.User); ok {
		return &userObj, true
	}

	return nil, false
}

// GetUserID retrieves the user ID from the context
func GetUserID(c *gin.Context) (string, bool) {
	user, exists := GetUser(c)
	if !exists {
		return "", false
	}
	return user.ID.String(), true
}

// GetClaims retrieves the JWT claims from the context
func GetClaims(c *gin.Context) (*Claims, bool) {
	claims, exists := c.Get("claims")
	if !exists {
		return nil, false
	}

	if claimsObj, ok := claims.(*Claims); ok {
		return claimsObj, true
	}

	return nil, false
}
