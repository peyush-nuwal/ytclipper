package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"
)

type EmailService struct{}

func NewEmailService() *EmailService {
	return &EmailService{}
}

// GenerateToken generates a random token for email verification/password reset
func (e *EmailService) GenerateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// GetTokenExpiry returns the expiry time for tokens (24 hours from now)
func (e *EmailService) GetTokenExpiry() time.Time {
	return time.Now().Add(24 * time.Hour)
}

// SendVerificationEmail sends an email verification email
func (e *EmailService) SendVerificationEmail(email, token string) error {
	// TODO: Implement actual email sending logic
	// For now, just log the verification link
	fmt.Printf("Verification email sent to %s with token: %s\n", email, token)
	return nil
}

// SendPasswordResetEmail sends a password reset email
func (e *EmailService) SendPasswordResetEmail(email, token string) error {
	// TODO: Implement actual email sending logic
	// For now, just log the reset link
	fmt.Printf("Password reset email sent to %s with token: %s\n", email, token)
	return nil
}
