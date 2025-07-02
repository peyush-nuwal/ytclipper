# Clipture Docker Setup Guide

This guide explains how to set up and run Clipture using Docker, following industry best practices inspired by projects like [Monkeytype](https://github.com/monkeytypegame/monkeytype).

## 📁 Docker Organization

Following Monkeytype's approach, all Docker configurations are centralized in the `docker/` directory:

```
docker/
├── compose.yml           # Production environment
├── compose.dev.yml       # Development environment  
├── compose.db-only.yml   # Database services only
├── compose.test.yml      # Testing environment
├── env.example           # Environment variables template
└── README.md            # Docker-specific documentation
```

This organization provides:

## 🚀 Quick Start

This project is now fully containerized with production-ready backend, frontend apps, PostgreSQL 14, and Redis.

### Architecture

- **Backend API**: Production-ready Go service with Gin framework, structured logging, database integration, graceful shutdown
- **Frontend App**: React + Vite with optimized nginx serving
- **Landing Page**: Next.js with SSR capabilities
- **PostgreSQL 14**: Production database with health checks
- **Redis**: Caching and session management

### Prerequisites

- Docker and Docker Compose V2
- Make (optional, for convenience commands)

## 🛠️ Development Setup

### Option 1: Using Make (Recommended)

```bash
# Start development environment
make dev

# Start in background
make dev-detached

# View logs
make dev-logs

# Stop services
make dev-down
```

### Option 2: Using Docker Compose directly

```bash
# Start development environment
docker compose -f docker/compose.dev.yml up --build

# Start in background
docker compose -f docker/compose.dev.yml up --build -d

# Stop services
docker compose -f docker/compose.dev.yml down
```

### Database Only Mode (Monkeytype-inspired)

Perfect for local development when you want to run services separately:

```bash
# Start only database services (PostgreSQL + Redis)
make db-only

# Or manually
docker compose -f docker/compose.db-only.yml up -d

# Stop database services
make db-only-down
```

### Testing Environment

Isolated testing environment with dedicated test databases:

```bash
# Run all tests in containers
make test-env

# Build and run tests
make test-env-build

# Or manually
docker compose -f docker/compose.test.yml up --abort-on-container-exit
```

### Development Services

- **Backend API**: http://localhost:8080
- **PostgreSQL**: localhost:5433 (dev port to avoid conflicts)
- **Redis**: localhost:6379

### Key Endpoints

- `GET http://localhost:8080/health` - Backend health check
- `GET http://localhost:8080/db-health` - Database connectivity check
- `GET http://localhost:8080/api/v1` - API v1 information
- `GET http://localhost:8080/` - API welcome page

## 🚀 Production Deployment

```bash
# Setup environment files first
make setup

# Edit your configuration
nano docker/.env
nano backend/.env

# Build and start all services
make up

# Or using docker compose directly
docker compose -f docker/compose.yml up --build -d
```

### Production Services

- **Backend API**: http://localhost:8080
- **Frontend App**: http://localhost:3000
- **Landing Page**: http://localhost:3001
- **PostgreSQL**: Internal network only
- **Redis**: Internal network only

## 🏗️ Backend Architecture

The backend follows Go best practices with:

```
backend/
├── cmd/main.go              # Application entrypoint with graceful shutdown
├── internal/
│   ├── config/             # Environment-based configuration
│   ├── logger/             # Structured logging with zerolog
│   ├── database/           # PostgreSQL + GORM with connection pooling
│   ├── server/             # HTTP server setup
│   ├── router/             # Route definitions and middleware
│   ├── handlers/           # HTTP request handlers
│   └── middleware/         # Custom middleware (CORS, error handling, etc.)
├── Dockerfile              # Production container
├── Dockerfile.dev          # Development container with hot reload
└── .air.toml              # Hot reload configuration
```

### Key Features

- **Graceful Shutdown**: Proper signal handling and cleanup
- **Health Checks**: Built-in health endpoints for monitoring
- **Structured Logging**: JSON logs in production, pretty logs in development
- **Database Integration**: PostgreSQL with connection pooling and retry logic
- **Security**: CORS, security headers, non-root containers
- **Production Ready**: Environment-based configuration, monitoring hooks

## 🗄️ Database

- **PostgreSQL 14**: Latest stable version
- **Connection Pooling**: Optimized for production workloads
- **Health Monitoring**: Automatic connectivity checks
- **Persistent Storage**: Docker volumes for data persistence

### Database Commands

```bash
# Connect to database shell
make db-shell

# View database logs
make db-logs

# Backup database
make db-backup
```

## 🐳 Container Features

### Security

- Non-root users in all containers
- Security headers and CORS protection
- Environment-based secrets management
- Network isolation between services

### Performance

- Multi-stage Docker builds for minimal image sizes
- Nginx serving optimized static assets
- Connection pooling and health checks
- Gzip compression and caching headers

### Monitoring

- Health checks for all services
- Structured logging and request tracing
- Automatic service recovery
- Performance metrics collection ready

## 🔧 Useful Commands

```bash
# View all available commands
make help

# Setup development environment with all config files
make setup

# Check service health
make health

# Database-only operations (Monkeytype pattern)
make db-only          # Start only databases
make db-only-down     # Stop database services

# Testing environment
make test-env         # Run tests in isolated containers
make test-env-build   # Build and run tests

# View logs for specific service
docker compose -f docker/compose.yml logs -f backend
docker compose -f docker/compose.yml logs -f postgres

# Execute commands in containers
docker compose -f docker/compose.yml exec backend sh
docker compose -f docker/compose.yml exec postgres psql -U postgres -d clipture

# Clean up everything (cleans all compose files)
make clean-all
```

## 🌟 What's Next

The foundation is ready for building your screen capture and annotation service:

1. **Add Authentication**: JWT middleware is configured, just add auth handlers
2. **Add Models**: Database setup is ready for your GORM models
3. **Add Business Logic**: Structured service layer for your core features
4. **Add File Upload**: Ready for handling image uploads and processing
5. **Add WebSocket**: Real-time collaboration features
6. **Add Tests**: Test structure is in place

## 🔍 Troubleshooting

### Port Conflicts

If you get port binding errors:

- PostgreSQL dev uses port 5432 to avoid conflicts
- Change ports in docker-compose files if needed

### Database Connection Issues

```bash
# Check database health
docker compose exec postgres pg_isready -U postgres

# View database logs
docker compose logs postgres
```

### Container Issues

```bash
# Rebuild containers
docker compose build --no-cache

# Clean everything and restart
make clean-all && make dev
```

Your containerized, production-ready application is now ready to go! 🎉
