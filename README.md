# Clipture

A modern screen capture and annotation service built with Go, React, and Next.js.

## Architecture

This is a containerized monorepo application with the following services:

- **Backend API**: Production-ready Go service with Gin framework
- **Frontend App**: React application with Vite
- **Landing Page**: Next.js application
- **PostgreSQL 14**: Primary database
- **Redis**: Caching and session store

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Make (optional, for convenience commands)

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/shubhamku044/clipture.git
cd clipture
```

2. Setup development environment:

```bash
make setup
```

3. Start development environment:

```bash
make dev
```

This will start:

- Backend API at http://localhost:8080
- Frontend App at http://localhost:3000
- PostgreSQL at localhost:5432
- Redis at localhost:6379

### Production Deployment

1. Start production environment:

```bash
make up-detached
```

This will start:

- Backend API at http://localhost:8080
- Frontend App at http://localhost:3000
- Landing Page at http://localhost:3001
- PostgreSQL (internal network)
- Redis (internal network)

## Services

### Backend API (Port 8080)

Production-ready Go service featuring:

- **Gin HTTP Framework**: Fast and lightweight web framework
- **Structured Logging**: Using zerolog for structured JSON logging
- **Database Integration**: PostgreSQL with GORM ORM
- **Configuration Management**: Environment-based configuration
- **Graceful Shutdown**: Proper signal handling and cleanup
- **Health Checks**: Built-in health endpoints
- **Middleware**: Error handling, CORS, request logging
- **Production Ready**: Security headers, rate limiting, monitoring

#### Key Endpoints:

- `GET /health` - Service health check
- `GET /db-health` - Database health check
- `GET /api/v1` - API version 1 root
- `POST /api/v1/auth/register` - User registration (TBD)
- `POST /api/v1/auth/login` - User login (TBD)

### Frontend App (Port 3000)

React application with:

- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe development
- **Modern React**: Latest React features and hooks
- **Production Build**: Optimized nginx-served static files

### Landing Page (Port 3001)

Next.js application featuring:

- **Server-Side Rendering**: Optimized for SEO
- **TypeScript**: Type-safe development
- **Production Optimized**: Standalone output for containers

### Database (PostgreSQL 14)

Production-ready database setup:

- **PostgreSQL 14**: Latest stable version
- **Alpine Linux**: Lightweight container
- **Persistent Storage**: Docker volumes for data persistence
- **Health Checks**: Automatic health monitoring
- **Security**: SCRAM-SHA-256 authentication

### Redis Cache

Caching and session management:

- **Redis 7**: Latest stable version
- **Alpine Linux**: Lightweight container
- **Persistent Storage**: AOF persistence enabled
- **Password Protection**: Configured with authentication

## Development Commands

Using Make (recommended):

```bash
# Development
make dev              # Start development environment
make dev-detached     # Start development in background
make dev-down         # Stop development environment
make dev-logs         # View development logs

# Production
make build            # Build all services
make up               # Start production environment
make up-detached      # Start production in background
make down             # Stop production environment
make logs             # View production logs

# Database
make db-shell         # Connect to database
make db-backup        # Backup database
make db-logs          # View database logs

# Backend
make backend-shell    # Connect to backend container
make backend-logs     # View backend logs
make backend-test     # Run backend tests

# Cleanup
make clean            # Clean containers and volumes
make clean-all        # Clean everything including images

# Health
make health           # Check all services health
```

## Manual Docker Commands

If you prefer not to use Make:

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose up --build -d
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec postgres psql -U postgres -d clipture
```

## Environment Configuration

### Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# Server
PORT=8080
ENV=development

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=clipture
DB_USER=postgres
DB_PASSWORD=postgres

# Security
JWT_SECRET=your_secret_here
AUTH_JWT_SECRET=your_auth_secret_here

# Logging
LOG_LEVEL=debug
LOG_PRETTY=true
```

## Project Structure

```
clipture/
├── backend/                 # Go API service
│   ├── cmd/                # Application entrypoint
│   │   ├── internal/       # Private application code
│   │   │   ├── config/    # Configuration management
│   │   │   ├── database/  # Database connection and operations
│   │   │   ├── handlers/  # HTTP handlers
│   │   │   ├── logger/    # Logging configuration
│   │   │   ├── middleware/# HTTP middleware
│   │   │   ├── router/    # Route definitions
│   │   │   └── server/    # Server setup
│   │   ├── Dockerfile       # Production container
│   │   ├── Dockerfile.dev   # Development container
│   │   └── .air.toml        # Hot reload configuration
│   ├── apps/
│   │   ├── app/             # React frontend
│   │   │   ├── src/         # Source code
│   │   │   ├── Dockerfile   # Production container
│   │   │   └── nginx.conf   # Nginx configuration
│   │   └── landing/         # Next.js landing page
│   │       ├── src/         # Source code
│   │       └── Dockerfile   # Production container
│   ├── docker-compose.yml    # Production compose file
│   ├── docker-compose.dev.yml# Development compose file
│   ├── Makefile             # Development commands
│   └── README.md            # This file
```

## Health Monitoring

All services include health checks:

- **Backend**: `GET /health` and `GET /db-health`
- **Frontend**: Nginx health endpoint
- **Database**: PostgreSQL connection check
- **Redis**: Redis ping check

Health status is automatically monitored by Docker Compose.

## Security Features

- **Non-root containers**: All services run as non-root users
- **Security headers**: CORS, XSS protection, content type validation
- **Environment isolation**: Separate networks for development and production
- **Secrets management**: Environment-based configuration
- **Database security**: SCRAM-SHA-256 authentication

## Monitoring and Logging

- **Structured logging**: JSON logs in production
- **Request tracing**: Comprehensive request logging
- **Error handling**: Centralized error management
- **Performance monitoring**: Response time tracking
- **Health checks**: Automated service health monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
