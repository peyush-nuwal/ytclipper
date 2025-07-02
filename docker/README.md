# Clipture Docker Configuration

This directory contains all Docker-related configurations for the Clipture application, organized following industry best practices inspired by projects like Monkeytype.

## 📁 Structure

```
docker/
├── compose.yml           # Production environment
├── compose.dev.yml       # Development environment  
├── compose.db-only.yml   # Database services only
├── compose.test.yml      # Testing environment
├── .env.example          # Environment variables template
└── README.md            # This file
```

## 🚀 Quick Start

### Production Environment
```bash
# Copy and configure environment variables
cp docker/env.example docker/.env
# Edit docker/.env with your production values

# Start all services
docker compose -f docker/compose.yml up -d

# Check service health
docker compose -f docker/compose.yml ps
```

### Development Environment
```bash
# Start development environment
docker compose -f docker/compose.dev.yml up -d

# View logs
docker compose -f docker/compose.dev.yml logs -f backend
```

### Database Only
```bash
# Start only database services (useful for local development)
docker compose -f docker/compose.db-only.yml up -d
```

### Testing Environment
```bash
# Run all tests in isolated containers
docker compose -f docker/compose.test.yml up --abort-on-container-exit
```

## 🔧 Available Services

| Service | Production Port | Development Port | Description |
|---------|----------------|------------------|-------------|
| **Backend API** | 8080 | 8080 | Go backend with hot reload in dev |
| **Frontend App** | 3000 | - | React application |
| **Landing Page** | 3001 | - | Next.js landing page |
| **PostgreSQL** | 5432 | 5432 | Database server |
| **Redis** | 6379 | 6379 | Cache and session store |

## 🐛 Testing

The testing environment provides isolated containers for:
- Unit tests for backend (Go)
- Component tests for frontend (React)
- Integration tests for landing page (Next.js)
- Isolated test database (port 5434)

## 📊 Health Checks

All services include comprehensive health checks:
- **Database**: Connection and query tests
- **Backend**: HTTP endpoint health checks
- **Frontend**: Static file serving tests
- **Redis**: Connection and basic operations

## 🔒 Security Notes

- Default passwords are for development only
- Update all secrets in production `.env` file
- Use strong, unique passwords for each service
- Consider using Docker secrets for production deployments

## 🛠 Development Tips

1. **Hot Reload**: Backend uses Air for automatic reloading
2. **Logs**: Use `docker compose logs -f <service>` to follow logs
3. **Database Access**: Connect directly via `localhost:5432` in development
4. **Clean Restart**: `docker compose down -v` removes volumes

## 📚 Related Documentation

- [Main Setup Guide](../DOCKER_SETUP.md)
- [Development Guide](../DEVELOPMENT.md)
- [Backend Documentation](../backend/README.md) 