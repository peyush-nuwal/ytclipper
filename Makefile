.PHONY: help dev build up down logs clean test

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
dev: ## Start development environment
	docker compose -f docker/compose.dev.yml up --build

dev-detached: ## Start development environment in detached mode
	docker compose -f docker/compose.dev.yml up --build -d

dev-down: ## Stop development environment
	docker compose -f docker/compose.dev.yml down

dev-logs: ## Show development logs
	docker compose -f docker/compose.dev.yml logs -f

# Production
build: ## Build all services
	docker compose -f docker/compose.yml build

up: ## Start production environment
	docker compose -f docker/compose.yml up --build

up-detached: ## Start production environment in detached mode
	docker compose -f docker/compose.yml up --build -d

down: ## Stop production environment
	docker compose -f docker/compose.yml down

restart: ## Restart all services
	docker compose -f docker/compose.yml restart

logs: ## Show production logs
	docker compose -f docker/compose.yml logs -f

# Staging
staging-build: ## Build staging services
	docker compose -f docker/compose.staging.yml build

staging-up: ## Start staging environment
	docker compose -f docker/compose.staging.yml up --build

staging-up-detached: ## Start staging environment in detached mode
	docker compose -f docker/compose.staging.yml up --build -d

staging-down: ## Stop staging environment
	docker compose -f docker/compose.staging.yml down

staging-restart: ## Restart staging services
	docker compose -f docker/compose.staging.yml restart

staging-logs: ## Show staging logs
	docker compose -f docker/compose.staging.yml logs -f

# Database Only (following Monkeytype pattern)
db-only: ## Start only database services
	docker compose -f docker/compose.db-only.yml up -d

db-only-down: ## Stop database-only services
	docker compose -f docker/compose.db-only.yml down

# Testing (new Monkeytype-inspired feature)
test-env: ## Start testing environment
	docker compose -f docker/compose.test.yml up --abort-on-container-exit

test-env-build: ## Build and start testing environment
	docker compose -f docker/compose.test.yml up --build --abort-on-container-exit

# Database (MongoDB Atlas)
db-shell: ## Connect to database shell (requires mongosh installed locally and MONGO_URI env var)
	@if [ -z "$$MONGO_URI" ]; then echo "Error: MONGO_URI environment variable not set"; exit 1; fi
	mongosh "$$MONGO_URI"

db-backup: ## Backup database (requires mongodump installed locally and MONGO_URI env var)
	@if [ -z "$$MONGO_URI" ]; then echo "Error: MONGO_URI environment variable not set"; exit 1; fi
	mongodump --uri="$$MONGO_URI" --out=./backup_$$(date +%Y%m%d_%H%M%S)

# Backend
backend-shell: ## Connect to backend container shell
	docker compose -f docker/compose.yml exec backend sh

backend-logs: ## Show backend logs
	docker compose -f docker/compose.yml logs -f backend

backend-test: ## Run backend tests
	cd backend && go test ./...

# Backend Development (standalone)
backend-dev: ## Start only backend service for development
	docker compose -f docker/compose.dev.yml up --build backend

backend-staging: ## Start only backend service for staging
	docker compose -f docker/compose.staging.yml up --build backend

backend-production: ## Start only backend service for production
	docker compose -f docker/compose.yml up --build backend

# Frontend
frontend-shell: ## Connect to frontend container shell
	docker compose -f docker/compose.yml exec app sh

frontend-logs: ## Show frontend logs
	docker compose -f docker/compose.yml logs -f app

# Cleanup
clean: ## Clean up containers, networks, and volumes
	docker compose -f docker/compose.yml down -v --remove-orphans
	docker compose -f docker/compose.dev.yml down -v --remove-orphans
	docker compose -f docker/compose.db-only.yml down -v --remove-orphans
	docker compose -f docker/compose.test.yml down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean up everything including images
	docker compose -f docker/compose.yml down -v --remove-orphans --rmi all
	docker compose -f docker/compose.dev.yml down -v --remove-orphans --rmi all
	docker compose -f docker/compose.db-only.yml down -v --remove-orphans --rmi all
	docker compose -f docker/compose.test.yml down -v --remove-orphans --rmi all
	docker system prune -af

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:8080/health || echo "Backend: UNHEALTHY"
	@curl -f http://localhost:3000/health || echo "Frontend: UNHEALTHY"
	@curl -f http://localhost:3001/health || echo "Landing: UNHEALTHY"
	@echo "Note: MongoDB Atlas health is checked via backend /db-health endpoint"

# Setup
setup: ## Setup development environment
	@echo "Setting up development environment..."
	@echo "🔒 SECURITY WARNING: You need to create .env files with your actual MongoDB Atlas credentials"
	@echo "📖 Please read docker/ENVIRONMENT_SETUP.md for detailed setup instructions"
	@echo "📖 Please read backend/ENVIRONMENT_SETUP.md for backend-specific setup"
	@echo ""
	@echo "Required steps:"
	@echo "1. Create docker/.env with your MongoDB Atlas URI"
	@echo "2. Create backend/.env with your credentials (for local development)"
	@echo "3. Never commit these .env files to version control"
	@echo ""
	@echo "After setting up .env files, run 'make dev' to start development environment"

# Install dependencies
install: ## Install dependencies for all apps
	cd backend && go mod tidy && go mod download
	cd apps/app && npm install
	cd apps/landing && npm install 