package timestamps

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
	"github.com/shubhamku044/ytclipper/internal/models"
)

type AIService struct {
	openaiAPIKey   *config.OpenAIConfig
	embeddingModel string
	db             *database.Database
}

func NewAIService(openaiAPIKey *config.OpenAIConfig, db *database.Database) *AIService {
	return &AIService{
		openaiAPIKey:   openaiAPIKey,
		embeddingModel: openaiAPIKey.EmbeddingModel,
		db:             db,
	}
}

func (ai *AIService) GenerateEmbedding(text string) ([]float32, error) {
	if text == "" {
		return nil, fmt.Errorf("text cannot be empty")
	}

	reqBody := EmbeddingRequest{
		Input:          []string{text},
		Model:          ai.embeddingModel,
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
	req.Header.Set("Authorization", "Bearer "+ai.openaiAPIKey.APIKey)

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

func (ai *AIService) GenerateTextCompletion(prompt string) (string, error) {
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
	req.Header.Set("Authorization", "Bearer "+ai.openaiAPIKey.APIKey)

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

func (ai *AIService) CreateEmbeddingText(title, note string, tags []string) string {
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

func (ai *AIService) ProcessEmbeddingForTimestamp(timestampID string) error {
	ctx := context.Background()

	var timestamp models.Timestamp
	err := ai.db.DB.NewSelect().
		Model(&timestamp).
		Where("id = ?", timestampID).
		Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch timestamp: %w", err)
	}

	var tagNames []string
	for _, tag := range timestamp.Tags {
		tagNames = append(tagNames, tag.Name)
	}

	embeddingText := ai.CreateEmbeddingText(timestamp.Title, timestamp.Note, tagNames)
	if embeddingText == "" {
		return fmt.Errorf("no content to embed for timestamp %s", timestampID)
	}

	embedding, err := ai.GenerateEmbedding(embeddingText)
	if err != nil {
		return fmt.Errorf("failed to generate embedding: %w", err)
	}

	_, err = ai.db.DB.NewUpdate().
		Model((*models.Timestamp)(nil)).
		Set("embedding = ?", embedding).
		Set("updated_at = ?", time.Now().UTC()).
		Where("id = ?", timestampID).
		Exec(ctx)

	return err
}

func (ai *AIService) ProcessMissingEmbeddingsForUser(userID string, batchSize int) error {
	ctx := context.Background()

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	var timestamps []models.Timestamp
	err = ai.db.DB.NewSelect().
		Model(&timestamps).
		Where("user_id = ? AND deleted_at IS NULL AND embedding IS NULL", userUUID).
		Limit(batchSize).
		Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch timestamps: %w", err)
	}

	processed := 0
	for _, ts := range timestamps {
		if err := ai.ProcessEmbeddingForTimestamp(ts.ID.String()); err != nil {
			continue
		}
		processed++
		time.Sleep(1 * time.Second) // Rate limiting
	}

	return nil
}

func (ai *AIService) ProcessAllMissingEmbeddings(batchSize int) error {
	ctx := context.Background()

	var timestamps []models.Timestamp
	err := ai.db.DB.NewSelect().
		Model(&timestamps).
		Where("deleted_at IS NULL AND embedding IS NULL").
		Limit(batchSize).
		Scan(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch timestamps: %w", err)
	}

	processed := 0
	for _, ts := range timestamps {
		if err := ai.ProcessEmbeddingForTimestamp(ts.ID.String()); err != nil {
			continue
		}
		processed++
		time.Sleep(1 * time.Second) // Rate limiting
	}

	return nil
}
