package auth

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/shubhamku044/ytclipper/internal/config"
	"github.com/shubhamku044/ytclipper/internal/database"
)

type JWTService struct {
	secret             string
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
	tokenIssuer        string
	tokenAudience      string
	cookieDomain       string
	cookieSecure       bool
	cookieHTTPOnly     bool
	db                 *database.Database
}

func NewJWTService(jwtConfig *config.JWTConfig, authConfig *config.AuthConfig, db *database.Database) *JWTService {
	return &JWTService{
		secret:             jwtConfig.Secret,
		accessTokenExpiry:  jwtConfig.AccessTokenExpiry,
		refreshTokenExpiry: jwtConfig.RefreshTokenExpiry,
		tokenIssuer:        jwtConfig.TokenIssuer,
		tokenAudience:      jwtConfig.TokenAudience,
		cookieDomain:       authConfig.CookieDomain,
		cookieSecure:       authConfig.CookieSecure,
		cookieHTTPOnly:     authConfig.CookieHTTPOnly,
		db:                 db,
	}
}

type Claims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	Picture   string `json:"picture"`
	TokenType string `json:"token_type"`
	jwt.RegisteredClaims
}

func (j *JWTService) GenerateAccessToken(userID string) (string, int64, error) {
	expiry := time.Now().Add(j.accessTokenExpiry)
	claims := &Claims{
		UserID:    userID,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    j.tokenIssuer,
			Subject:   userID,
			Audience:  []string{j.tokenAudience},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiry.Unix(), nil
}

func (j *JWTService) GenerateRefreshToken(userID string) (string, int64, error) {
	expiry := time.Now().Add(j.refreshTokenExpiry)
	claims := &Claims{
		UserID:    userID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    j.tokenIssuer,
			Subject:   userID,
			Audience:  []string{j.tokenAudience},
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secret))
	if err != nil {
		return "", 0, err
	}

	return tokenString, expiry.Unix(), nil
}

func (j *JWTService) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func (j *JWTService) RefreshAccessToken(refreshToken string) (*TokenPair, error) {
	claims, err := j.ValidateToken(refreshToken)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != "refresh" {
		return nil, fmt.Errorf("invalid token type")
	}

	accessToken, accessExpiry, err := j.GenerateAccessToken(claims.UserID)
	if err != nil {
		return nil, err
	}

	newRefreshToken, _, err := j.GenerateRefreshToken(claims.UserID)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    accessExpiry,
	}, nil
}

func (j *JWTService) SetTokenCookies(c *gin.Context, accessToken, refreshToken string) {
	c.SetCookie("access_token", accessToken, int(j.accessTokenExpiry.Seconds()), "/", j.cookieDomain, j.cookieSecure, j.cookieHTTPOnly)

	c.SetCookie("refresh_token", refreshToken, int(j.refreshTokenExpiry.Seconds()), "/", j.cookieDomain, j.cookieSecure, j.cookieHTTPOnly)
}

func (j *JWTService) ClearTokenCookies(c *gin.Context) {
	c.SetCookie("access_token", "", -1, "/", j.cookieDomain, j.cookieSecure, j.cookieHTTPOnly)
	c.SetCookie("refresh_token", "", -1, "/", j.cookieDomain, j.cookieSecure, j.cookieHTTPOnly)
}
