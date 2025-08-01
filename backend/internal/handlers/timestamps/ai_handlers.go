package timestamps

import (
	"context"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	authhandlers "github.com/shubhamku044/ytclipper/internal/handlers/auth"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
)

// SearchTimestamps searches timestamps using semantic similarity
func (t *TimestampsHandlers) SearchTimestamps(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req SearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Generate embedding for search query
	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Query)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate query embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get all timestamps for the user (and optionally for specific video)
	query := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if req.VideoID != "" {
		query = query.Where("video_id = ?", req.VideoID)
	}

	var timestamps []models.Timestamp
	err = query.Scan(context.Background(), &timestamps)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Calculate similarities and rank results
	var scoredResults []ScoredTimestamp
	for _, ts := range timestamps {
		if len(ts.Embedding) > 0 {
			score := CosineSimilarity(queryEmbedding, ts.Embedding)
			scoredResults = append(scoredResults, ScoredTimestamp{
				Timestamp: ts,
				Score:     score,
			})
		}
	}

	// Sort by score (highest first)
	sort.Slice(scoredResults, func(i, j int) bool {
		return scoredResults[i].Score > scoredResults[j].Score
	})

	// Apply limit
	limit := req.Limit
	if limit == 0 || limit > 50 {
		limit = 10 // Default limit
	}
	if len(scoredResults) > limit {
		scoredResults = scoredResults[:limit]
	}

	middleware.RespondWithOK(c, gin.H{
		"results": scoredResults,
		"query":   req.Query,
		"count":   len(scoredResults),
	})
}

// GenerateSummary generates a summary of timestamps for a video
func (t *TimestampsHandlers) GenerateSummary(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	var req SummaryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get all timestamps for the video
	var timestamps []models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, req.VideoID).
		Order("timestamp ASC").
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	if len(timestamps) == 0 {
		middleware.RespondWithError(c, http.StatusNotFound, "NO_TIMESTAMPS", "No timestamps found for this video", nil)
		return
	}

	var content strings.Builder
	content.WriteString("Video Notes Summary Request\n\n")

	for _, ts := range timestamps {
		content.WriteString(fmt.Sprintf("## Timestamp: %.2f seconds\n", ts.Timestamp))
		if ts.Title != "" {
			content.WriteString(fmt.Sprintf("**Title:** %s\n\n", ts.Title))
		}
		if ts.Note != "" {
			content.WriteString(fmt.Sprintf("**Content:**\n%s\n\n", ts.Note))
		}
		if len(ts.Tags) > 0 {
			var tagNames []string
			for _, tag := range ts.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			content.WriteString(fmt.Sprintf("**Tags:** %s\n\n", strings.Join(tagNames, ", ")))
		}
		content.WriteString("---\n\n")
	}

	// Determine summary style
	summaryType := req.Type
	if summaryType == "" {
		summaryType = "brief"
	}

	var prompt string
	switch summaryType {
	case "detailed":
		prompt = "Please provide a detailed summary of these video notes, organizing them by themes and topics. Include specific timestamps where relevant."
	case "key_points":
		prompt = "Please extract the key points and main takeaways from these video notes in a bullet-point format."
	default: // brief
		prompt = "Please provide a brief, concise summary of the main themes and topics covered in these video notes."
	}

	// Generate summary using OpenAI
	summary, err := t.aiService.GenerateTextCompletion(prompt + "\n\n" + content.String())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate summary", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"summary":      summary,
		"video_id":     req.VideoID,
		"type":         summaryType,
		"note_count":   len(timestamps),
		"generated_at": time.Now().UTC(),
	})
}

// AnswerQuestion answers questions based on video notes
func (t *TimestampsHandlers) AnswerQuestion(c *gin.Context) {
	userIDStr, exists := authhandlers.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// Convert string user ID to UUID
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_USER_ID", "Invalid user ID format", gin.H{
			"error": err.Error(),
		})
		return
	}

	type QuestionRequest struct {
		Question string `json:"question" binding:"required"`
		VideoID  string `json:"video_id,omitempty"`
		Context  int    `json:"context,omitempty"` // Number of relevant notes to include
	}

	var req QuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Search for relevant notes
	searchReq := SearchRequest{
		Query:   req.Question,
		VideoID: req.VideoID,
		Limit:   req.Context,
	}
	if searchReq.Limit == 0 {
		searchReq.Limit = 5
	}

	// Generate embedding for the question
	queryEmbedding, err := t.aiService.GenerateEmbedding(req.Question)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate question embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Get relevant timestamps
	query := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID)

	if req.VideoID != "" {
		query = query.Where("video_id = ?", req.VideoID)
	}

	var timestamps []models.Timestamp
	err = query.Scan(context.Background(), &timestamps)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Find most relevant notes
	var scoredResults []ScoredTimestamp
	for _, ts := range timestamps {
		if len(ts.Embedding) > 0 {
			score := CosineSimilarity(queryEmbedding, ts.Embedding)
			scoredResults = append(scoredResults, ScoredTimestamp{
				Timestamp: ts,
				Score:     score,
			})
		}
	}

	sort.Slice(scoredResults, func(i, j int) bool {
		return scoredResults[i].Score > scoredResults[j].Score
	})

	if len(scoredResults) > searchReq.Limit {
		scoredResults = scoredResults[:searchReq.Limit]
	}

	// Build context from relevant markdown notes
	var context strings.Builder
	context.WriteString("# Relevant Video Notes\n\n")

	for i, scored := range scoredResults {
		ts := scored.Timestamp.(models.Timestamp)
		context.WriteString(fmt.Sprintf("## Note %d (Timestamp: %.2f seconds, Relevance: %.3f)\n\n", i+1, ts.Timestamp, scored.Score))
		if ts.Title != "" {
			context.WriteString(fmt.Sprintf("**Title:** %s\n\n", ts.Title))
		}
		if ts.Note != "" {
			context.WriteString(fmt.Sprintf("**Content:**\n%s\n\n", ts.Note))
		}
		if len(ts.Tags) > 0 {
			var tagNames []string
			for _, tag := range ts.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			context.WriteString(fmt.Sprintf("**Tags:** %s\n\n", strings.Join(tagNames, ", ")))
		}
		context.WriteString("---\n\n")
	}

	// Generate answer with markdown-aware prompt
	prompt := fmt.Sprintf(`Based on the following video notes (written in markdown format), please answer this question: "%s"

%s

Please provide a comprehensive answer based on the markdown content above. If the notes don't contain enough information to answer the question, please say so clearly. You can reference specific timestamps in your answer.`,
		req.Question, context.String())

	answer, err := t.aiService.GenerateTextCompletion(prompt)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate answer", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Prepare relevant notes for response
	var relevantNotes []gin.H
	for _, scored := range scoredResults {
		ts := scored.Timestamp.(models.Timestamp)
		relevantNotes = append(relevantNotes, gin.H{
			"id":        ts.ID,
			"timestamp": ts.Timestamp,
			"title":     ts.Title,
			"note":      ts.Note,
			"tags":      ts.Tags,
			"score":     scored.Score,
		})
	}

	middleware.RespondWithOK(c, gin.H{
		"answer":         answer,
		"question":       req.Question,
		"relevant_notes": relevantNotes,
		"context_count":  len(relevantNotes),
		"generated_at":   time.Now().UTC(),
	})
}
