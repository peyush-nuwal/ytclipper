package videos

import (
	"github.com/gin-gonic/gin"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
)

func SetupVideoRoutes(router *gin.RouterGroup, handlers *VideoHandlers, authMiddleware *authhandlers.AuthMiddleware) {
	videoRoutes := router.Group("/ytclipper/videos")
	{
		videoRoutes.Use(authMiddleware.RequireAuth())

		// Get all videos with timestamp counts
		videoRoutes.GET("", handlers.GetAllVideos)

		// Get recent videos
		videoRoutes.GET("/recent", handlers.GetRecentVideos)

		// Get specific video with timestamps
		videoRoutes.GET("/:id", handlers.GetVideoByID)

		// Delete video and all its timestamps
		videoRoutes.DELETE("/:id", handlers.DeleteVideo)
	}
}
