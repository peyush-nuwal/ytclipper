package auth

import (
	"github.com/gin-gonic/gin"
)

// SetupAuthRoutes sets up all authentication routes
func SetupAuthRoutes(r *gin.Engine, authHandlers *AuthHandlers, oauthHandlers *OAuthHandlers, authMiddleware *AuthMiddleware) {
	// Auth routes
	auth := r.Group("/api/v1/auth")
	{
		// Public routes
		auth.POST("/register", authHandlers.RegisterHandler)
		auth.POST("/login", authHandlers.LoginHandler)
		auth.POST("/forgot-password", authHandlers.ForgotPasswordHandler)
		auth.POST("/reset-password", authHandlers.ResetPasswordHandler)
		auth.POST("/verify-email", authHandlers.VerifyEmailHandler)
		auth.POST("/refresh", authHandlers.RefreshTokenHandler())

		// OAuth routes
		auth.GET("/google", oauthHandlers.LoginHandler())
		auth.GET("/google/callback", oauthHandlers.CallbackHandler())
		auth.POST("/logout", oauthHandlers.LogoutHandler())

		// Protected routes
		protected := auth.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			protected.GET("/me", authHandlers.GetCurrentUserHandler())
			protected.GET("/status", authHandlers.AuthStatusHandler)
			protected.POST("/add-password", authHandlers.AddPasswordHandler)
			protected.GET("/access-token", authHandlers.GetAccessToken())
		}
	}
}
