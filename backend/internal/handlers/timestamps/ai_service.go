package timestamps

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/shubhamku044/ytclipper/internal/config"
)

type AIService struct {
	openaiAPIKey   *config.OpenAIConfig
	embeddingModel string
}

func NewAIService(openaiAPIKey *config.OpenAIConfig) *AIService {
	return &AIService{
		openaiAPIKey:   openaiAPIKey,
		embeddingModel: openaiAPIKey.EmbeddingModel,
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
