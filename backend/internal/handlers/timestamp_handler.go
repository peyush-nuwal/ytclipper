package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/auth"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/middleware"
	"github.com/shubhamku044/ytclipper/internal/models"
	"github.com/uptrace/bun"
)

type TimestampsHandlers struct {
	db             *database.Database
	openaiAPIKey   *config.OpenAIConfig
	embeddingModel string
}

func NewTimestampHandlers(db *database.Database, openaiAPIKey *config.OpenAIConfig) *TimestampsHandlers {
	return &TimestampsHandlers{
		db:             db,
		openaiAPIKey:   openaiAPIKey,
		embeddingModel: openaiAPIKey.EmbeddingModel,
	}
}

type TagSearchRequest struct {
	Query string `json:"query" binding:"required"` // Search query for tag names
	Limit int    `json:"limit,omitempty"`          // Maximum number of results (default: 10, max: 50)
}

type CreateTimestampRequest struct {
	VideoID   string   `json:"video_id" binding:"required"`
	Timestamp float64  `json:"timestamp" binding:"required"`
	Title     string   `json:"title"`
	Note      string   `json:"note"`
	Tags      []string `json:"tags"`
}

type SummaryRequest struct {
	VideoID string `json:"video_id" binding:"required"`
	Type    string `json:"type,omitempty"`
}
type SearchRequest struct {
	Query   string `json:"query" binding:"required"`
	VideoID string `json:"video_id,omitempty"`
	Limit   int    `json:"limit,omitempty"`
}

type EmbeddingRequest struct {
	Input          []string `json:"input"`
	Model          string   `json:"model"`
	EncodingFormat string   `json:"encoding_format,omitempty"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
}

type ChatRequest struct {
	Model    string `json:"model"`
	Messages []struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	} `json:"messages"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
}

type ChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

type DeleteMultipleRequest struct {
	IDs []string `json:"ids" binding:"required"`
}

func (t *TimestampsHandlers) generateEmbedding(text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	reqBody := EmbeddingRequest{
		Input:          []string{text},
		Model:          t.embeddingModel,
		EncodingFormat: "float",
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/embeddings", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+t.openaiAPIKey.APIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("OpenAI API error: status %d", resp.StatusCode)
	}

	var embeddingResp EmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&embeddingResp); err != nil {
		return nil, err
	}

	if len(embeddingResp.Data) == 0 {
		return nil, fmt.Errorf("no embedding data received")
	}

	return embeddingResp.Data[0].Embedding, nil
}

func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float32
	for i := range a {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}

func (t *TimestampsHandlers) createEmbeddingText(title, note string, tags []string) string {
	var parts []string

	if title != "" {
		parts = append(parts, "Title: "+title)
	}
	if note != "" {
		parts = append(parts, "Note: "+note)
	}
	if len(tags) > 0 {
		parts = append(parts, "Tags: "+strings.Join(tags, ", "))
	}

	return strings.Join(parts, "\n")
}
func normalizeTagName(input string) string {
	input = strings.ToLower(input)

	input = strings.ReplaceAll(input, " ", "-")
	input = strings.ReplaceAll(input, "_", "-")

	reMultiHyphen := regexp.MustCompile(`-+`)
	input = reMultiHyphen.ReplaceAllString(input, "-")

	reClean := regexp.MustCompile(`[^a-z-]`)
	input = reClean.ReplaceAllString(input, "")

	input = strings.Trim(input, "-")

	return input
}

func (t *TimestampsHandlers) findOrCreateTag(ctx context.Context, tagName string) (*models.Tag, error) {
	if tagName == "" {
		return nil, fmt.Errorf("tag name cannot be empty")
	}
	normalizedName := normalizeTagName(tagName)

	if normalizedName == "" {
		return nil, fmt.Errorf("tag name cannot be normalized to empty string")
	}

	var existingTag models.Tag
	err := t.db.DB.NewSelect().
		Model(&existingTag).
		Where("name = ?", normalizedName).
		Scan(ctx)

	if err == nil {
		return &existingTag, nil
	}
	newTag := &models.Tag{
		ID:        uuid.NewString(),
		Name:      normalizedName,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	_, err = t.db.DB.NewInsert().
		Model(newTag).
		Exec(ctx)

	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "unique constraint") {
			err = t.db.DB.NewSelect().
				Model(&existingTag).
				Where("LOWER(name) = LOWER(?)", normalizedName).
				Scan(ctx)
			if err == nil {
				return &existingTag, nil
			}
		}
		return nil, fmt.Errorf("failed to create tag: %w", err)
	}

	return newTag, nil
}
func (t *TimestampsHandlers) processTagsForTimestamp(ctx context.Context, tagNames []string) ([]string, error) {
	if len(tagNames) == 0 {
		return nil, nil
	}

	var tagIDs []string
	for _, tagName := range tagNames {
		if tagName == "" {
			continue
		}

		tag, err := t.findOrCreateTag(ctx, tagName)
		if err != nil {
			return nil, fmt.Errorf("failed to process tag '%s': %w", tagName, err)
		}

		tagIDs = append(tagIDs, tag.ID)
	}

	return tagIDs, nil
}

func (t *TimestampsHandlers) createTimestampTagRelations(ctx context.Context, timestampID string, tagIDs []string) error {
	if len(tagIDs) == 0 {
		return nil
	}

	var relations []models.TimestampTag
	for _, tagID := range tagIDs {
		relations = append(relations, models.TimestampTag{
			ID:          uuid.New().String(),
			TimestampID: timestampID,
			TagID:       tagID,
			CreatedAt:   time.Now(),
		})
	}

	_, err := t.db.DB.NewInsert().
		Model(&relations).
		Exec(ctx)

	return err
}

func (t *TimestampsHandlers) GetAllTags(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	limit := 100 // Default limit for all tags
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 && parsed <= 500 {
			limit = parsed
		}
	}

	// First, check if user has any timestamps
	timestampCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(c.Request.Context())

	if err != nil {
		log.Printf("Error checking timestamp count: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_FETCH_TAGS", "Failed to fetch tags", nil)
		return
	}

	var tags []models.Tag

	if timestampCount == 0 {
		// User has no timestamps, return empty list
		tags = []models.Tag{}
	} else {
		// Get all tags that are used by the current user using a subquery
		query := t.db.DB.NewSelect().
			Model(&tags).
			Where("id IN (SELECT DISTINCT tag_id FROM timestamp_tags WHERE timestamp_id IN (SELECT id FROM timestamps WHERE user_id = ? AND deleted_at IS NULL))", userID).
			Order("name ASC").
			Limit(limit)

		err = query.Scan(c.Request.Context())
		if err != nil {
			log.Printf("Error fetching all tags: %v", err)
			middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_FETCH_TAGS", "Failed to fetch tags", gin.H{"error": err.Error()})
			return
		}
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"count": len(tags),
	})
}

func (t *TimestampsHandlers) SearchTags(c *gin.Context) {
	var req TagSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	if req.Limit <= 0 || req.Limit > 50 {
		req.Limit = 10
	}

	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	// First, check if user has any timestamps
	timestampCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(c.Request.Context())

	if err != nil {
		log.Printf("Error checking timestamp count: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_SEARCH_TAGS", "Failed to search tags", nil)
		return
	}

	var tags []models.Tag

	if timestampCount == 0 {
		// User has no timestamps, return empty list
		tags = []models.Tag{}
	} else {
		// Search for tags that are used by the current user using a subquery
		query := t.db.DB.NewSelect().
			Model(&tags).
			Where("id IN (SELECT DISTINCT tag_id FROM timestamp_tags WHERE timestamp_id IN (SELECT id FROM timestamps WHERE user_id = ? AND deleted_at IS NULL))", userID).
			Where("LOWER(name) ILIKE LOWER(?)", "%"+req.Query+"%").
			Order("name ASC").
			Limit(req.Limit)

		err = query.Scan(c.Request.Context())
		if err != nil {
			log.Printf("Error searching tags: %v", err)
			middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_SEARCH_TAGS", "Failed to search tags", gin.H{"error": err.Error()})
			return
		}
	}

	middleware.RespondWithOK(c, gin.H{
		"tags":  tags,
		"query": req.Query,
		"count": len(tags),
	})
}

func (t *TimestampsHandlers) CreateTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var req CreateTimestampRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body", gin.H{
			"error": err.Error(),
		})
		return
	}

	tagIDs, err := t.processTagsForTimestamp(c, req.Tags)
	if err != nil {
		log.Printf("Error processing tags: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "FAILED_TO_PROCESS_TAGS", "Failed to process tags", nil)
		return
	}

	embeddingText := t.createEmbeddingText(req.Title, req.Note, req.Tags)
	embedding, err := t.generateEmbedding(embeddingText)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "EMBEDDING_ERROR", "Failed to generate embedding", gin.H{
			"error": err.Error(),
		})
		return
	}

	timestamp := models.Timestamp{
		ID:        uuid.NewString(),
		VideoID:   req.VideoID,
		UserID:    userID,
		Timestamp: req.Timestamp,
		Embedding: embedding,
		Title:     req.Title,
		Note:      req.Note,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	}

	ctx := context.Background()

	tx, err := t.db.DB.BeginTx(ctx, nil)

	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_TRANSACTION_ERROR", "Failed to start database transaction", gin.H{
			"error": err.Error(),
		})
		return
	}
	defer tx.Rollback()

	if _, err := tx.NewInsert().Model(&timestamp).Exec(ctx); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_INSERT_ERROR", "Failed to save timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	if len(tagIDs) > 0 {
		var relations []models.TimestampTag
		for _, tagID := range tagIDs {
			relations = append(relations, models.TimestampTag{
				ID:          uuid.New().String(),
				TimestampID: timestamp.ID,
				TagID:       tagID,
				CreatedAt:   time.Now(),
			})
		}
		_, err = tx.NewInsert().Model(&relations).Exec(ctx)
		if err != nil {
			log.Printf("Error creating timestamp-tag relations: %v", err)
			middleware.RespondWithError(c, http.StatusInternalServerError, "DB_INSERT_ERROR", "Failed to create tag relations", gin.H{
				"error": err.Error(),
			})
			return
		}
	}
	if err = tx.Commit(); err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_COMMIT_ERROR", "Failed to commit transaction", gin.H{
			"error": err.Error(),
		})
		return
	}

	var createdTimestamp models.Timestamp
	err = t.db.DB.NewSelect().
		Model(&createdTimestamp).
		Relation("Tags").
		Where("timestamp.id = ?", timestamp.ID).
		Scan(ctx)

	if err != nil {
		log.Printf("Error fetching created timestamp: %v", err)
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch created timestamp", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamp": createdTimestamp,
	})
}
func (t *TimestampsHandlers) AnswerQuestion(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
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
	queryEmbedding, err := t.generateEmbedding(req.Question)
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
	type ScoredTimestamp struct {
		Timestamp models.Timestamp
		Score     float32
	}

	var scoredResults []ScoredTimestamp
	for _, ts := range timestamps {
		if len(ts.Embedding) > 0 {
			score := cosineSimilarity(queryEmbedding, ts.Embedding)
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
		ts := scored.Timestamp
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

	answer, err := t.generateTextCompletion(prompt)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "AI_ERROR", "Failed to generate answer", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Prepare relevant notes for response
	var relevantNotes []gin.H
	for _, scored := range scoredResults {
		ts := scored.Timestamp
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

func (t *TimestampsHandlers) generateTextCompletion(prompt string) (string, error) {
	reqBody := ChatRequest{
		Model: "gpt-3.5-turbo",
		Messages: []struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		}{
			{
				Role:    "user",
				Content: prompt,
			},
		},
		MaxTokens:   1000,
		Temperature: 0.7,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+t.openaiAPIKey.APIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenAI API error: status %d", resp.StatusCode)
	}

	var chatResp ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResp); err != nil {
		return "", err
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	return chatResp.Choices[0].Message.Content, nil
}

func (t *TimestampsHandlers) GenerateSummary(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
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
	err := t.db.DB.NewSelect().
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
	summary, err := t.generateTextCompletion(prompt + "\n\n" + content.String())
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

func (t *TimestampsHandlers) SearchTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
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
	queryEmbedding, err := t.generateEmbedding(req.Query)
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
	type ScoredTimestamp struct {
		Timestamp models.Timestamp `json:"timestamp"`
		Score     float32          `json:"score"`
	}

	var scoredResults []ScoredTimestamp
	for _, ts := range timestamps {
		if len(ts.Embedding) > 0 {
			score := cosineSimilarity(queryEmbedding, ts.Embedding)
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
func (t *TimestampsHandlers) BackfillEmbeddingsAsync(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	go func() {
		log.Printf("Starting async embedding backfill for user %s", userID)
		t.processEmbeddingsBackground(userID)
	}()

	middleware.RespondWithOK(c, gin.H{
		"message": "Embedding generation started in background",
		"user_id": userID,
	})
}
func (t *TimestampsHandlers) processEmbeddingsBackground(userID string) {
	ctx := context.Background()
	batchSize := 5 // Smaller batches for background processing

	// Find timestamps without embeddings
	var timestamps []models.Timestamp
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Where("embedding IS NULL").
		Scan(ctx)

	if err != nil {
		log.Printf("Error fetching timestamps for background processing: %v", err)
		return
	}

	log.Printf("Found %d timestamps needing embeddings for user %s", len(timestamps), userID)

	processed := 0
	for i := 0; i < len(timestamps); i += batchSize {
		end := i + batchSize
		if end > len(timestamps) {
			end = len(timestamps)
		}

		batch := timestamps[i:end]

		for _, ts := range batch {
			var tagNames []string
			for _, tag := range ts.Tags {
				tagNames = append(tagNames, tag.Name)
			}
			embeddingText := t.createEmbeddingText(ts.Title, ts.Note, tagNames)
			if embeddingText == "" {
				continue
			}

			embedding, err := t.generateEmbedding(embeddingText)
			if err != nil {
				log.Printf("Failed to generate embedding for timestamp %s: %v", ts.ID, err)
				time.Sleep(5 * time.Second) // Wait longer on error
				continue
			}

			_, err = t.db.DB.NewUpdate().
				Model((*models.Timestamp)(nil)).
				Set("embedding = ?", embedding).
				Set("updated_at = ?", time.Now().UTC()).
				Where("id = ?", ts.ID).
				Exec(ctx)

			if err != nil {
				log.Printf("Failed to update timestamp %s: %v", ts.ID, err)
				continue
			}

			processed++
		}

		// Rate limiting between batches
		time.Sleep(2 * time.Second)
		log.Printf("Processed %d/%d timestamps for user %s", processed, len(timestamps), userID)
	}

	log.Printf("Completed embedding backfill for user %s: %d/%d processed", userID, processed, len(timestamps))
}
func (t *TimestampsHandlers) GetEmbeddingStatus(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	ctx := context.Background()

	// Count total timestamps
	totalCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count total timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	// Count timestamps with embeddings
	withEmbeddingsCount, err := t.db.DB.NewSelect().
		Model((*models.Timestamp)(nil)).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Where("embedding IS NOT NULL").
		Count(ctx)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to count timestamps with embeddings", gin.H{
			"error": err.Error(),
		})
		return
	}

	withoutEmbeddingsCount := totalCount - withEmbeddingsCount

	completionPercentage := float64(0)
	if totalCount > 0 {
		completionPercentage = float64(withEmbeddingsCount) / float64(totalCount) * 100
	}

	middleware.RespondWithOK(c, gin.H{
		"total_timestamps":      totalCount,
		"with_embeddings":       withEmbeddingsCount,
		"without_embeddings":    withoutEmbeddingsCount,
		"completion_percentage": completionPercentage,
		"needs_backfill":        withoutEmbeddingsCount > 0,
		"estimated_cost_usd":    float64(withoutEmbeddingsCount) * 0.00002, // Rough estimate
	})
}

func (t *TimestampsHandlers) GetTimestampsByVideoID(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	videoID := c.Param("videoId")
	if videoID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_VIDEO_ID", "Video ID is required", nil)
		return
	}

	timestamps := []models.Timestamp{}
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND video_id = ? AND deleted_at IS NULL", userID, videoID).
		Order("timestamp ASC").
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"timestamps": timestamps,
		"video_id":   videoID,
	})
}

func (t *TimestampsHandlers) GetAllTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var timestamps []models.Timestamp
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Relation("Tags").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"timestamps": timestamps})
}

func (t *TimestampsHandlers) GetAllVideosWithTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	type VideoInfo struct {
		VideoID string    `json:"video_id"`
		Latest  time.Time `json:"latest_timestamp"`
		Count   int       `json:"count"`
	}

	var videos []VideoInfo
	err := t.db.DB.NewSelect().
		Table("timestamps").
		Column("video_id").
		ColumnExpr("MAX(created_at) AS latest").
		ColumnExpr("COUNT(*) AS count").
		Where("user_id = ? AND deleted_at IS NULL", userID).
		Group("video_id").
		OrderExpr("latest DESC").
		Scan(context.Background(), &videos)
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch video list", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"videos": videos})
}

func (t *TimestampsHandlers) GetRecentTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	limit := 5
	if param := c.Query("limit"); param != "" {
		if parsed, err := strconv.Atoi(param); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var timestamps []models.Timestamp
	err := t.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL", userID).
		OrderExpr("created_at DESC").
		Limit(limit).
		Scan(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_READ_ERROR", "Failed to fetch recent timestamps", gin.H{
			"error": err.Error(),
		})
		return
	}

	middleware.RespondWithOK(c, gin.H{"recent_timestamps": timestamps})
}

func (t *TimestampsHandlers) DeleteTimestamp(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	timestampID := c.Param("id")
	if timestampID == "" {
		middleware.RespondWithError(c, http.StatusBadRequest, "MISSING_TIMESTAMP_ID", "Timestamp ID is required", nil)
		return
	}

	now := time.Now().UTC()
	_, err := t.db.DB.NewUpdate().
		Table("timestamps").
		Set("deleted_at = ?", now).
		Where("id = ? AND user_id = ?", timestampID, userID).
		Exec(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_DELETE_ERROR", "Failed to delete timestamp", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{"message": "Timestamp deleted successfully"})
}

func (t *TimestampsHandlers) DeleteMultipleTimestamps(c *gin.Context) {
	userID, exists := auth.GetUserID(c)
	if !exists {
		middleware.RespondWithError(c, http.StatusUnauthorized, "NO_USER_ID", "User ID not found", nil)
		return
	}

	var req DeleteMultipleRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.IDs) == 0 {
		middleware.RespondWithError(c, http.StatusBadRequest, "INVALID_REQUEST", "At least one timestamp ID must be provided", gin.H{
			"error": err.Error(),
		})
		return
	}

	now := time.Now().UTC()
	_, err := t.db.DB.NewUpdate().
		Table("timestamps").
		Set("deleted_at = ?", now).
		Where("id IN (?) AND user_id = ?", bun.In(req.IDs), userID).
		Exec(context.Background())
	if err != nil {
		middleware.RespondWithError(c, http.StatusInternalServerError, "DB_DELETE_ERROR", "Failed to delete timestamps", gin.H{"error": err.Error()})
		return
	}

	middleware.RespondWithOK(c, gin.H{
		"message": "Timestamps deleted successfully",
		"count":   len(req.IDs),
	})
}
