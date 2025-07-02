# Development Guide

This guide explains how to work with Clipture's development environment, which follows modern best practices similar to projects like [Monkeytype](https://github.com/monkeytypegame/monkeytype).

## 🛠️ Development Stack

### Core Technologies

- **TypeScript** - Type-safe development across all packages
- **React 19** - Modern frontend framework with latest features
- **Next.js 15** - Full-stack React framework for landing page
- **Go** - High-performance backend API
- **PostgreSQL 14** - Production database
- **Redis 7** - Caching and session management

### Development Tooling

- **PNPM** - Fast, disk-efficient package manager
- **Turborepo** - Efficient monorepo build orchestration
- **Vitest** - Modern testing framework
- **ESLint** - Code linting and quality checks
- **Prettier** - Code formatting automation
- **Husky** - Git hooks automation
- **Commitlint** - Conventional commit enforcement
- **Docker** - Containerized development and deployment

## 🚀 Quick Start

### Prerequisites

```bash
# Install Node.js (v18 or higher)
node --version

# Install PNPM
npm install -g pnpm

# Install Go (v1.22 or higher)
go version

# Install Docker Desktop
docker --version
```

### Setup

```bash
# Clone and setup
git clone <repository-url>
cd clipture
pnpm install

# Start development environment
make dev              # All services with Docker
# OR
pnpm dev             # Frontend only
pnpm dev:backend     # Backend only
```

## 📁 Project Structure

```
clipture/
├── apps/
│   ├── app/          # React frontend (Port 3000)
│   └── landing/      # Next.js landing page (Port 3001)
├── backend/          # Go API server (Port 8080)
├── packages/
│   └── ui/           # Shared UI components
├── docker/           # Docker configurations
└── docs/             # Documentation
```

## 🔧 Available Commands

### Global Commands (Root Level)

```bash
# Development
pnpm dev              # Start all frontend apps
pnpm dev:app          # Start React app only
pnpm dev:landing      # Start landing page only
pnpm dev:backend      # Start Go backend
pnpm dev:all          # Start all frontend apps concurrently

# Building
pnpm build            # Build all packages
turbo build           # Same as above (uses Turborepo)

# Code Quality
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm type-check       # TypeScript type checking

# Utilities
pnpm clean            # Clean build artifacts
```

### Docker Commands

```bash
# Development with hot reload
make dev              # Start development environment
make dev-down         # Stop development environment
make dev-logs         # View development logs

# Production
make build            # Build all services
make up               # Start production environment
make down             # Stop production environment

# Database
make db-shell         # Connect to PostgreSQL
make db-backup        # Backup database
make db-logs          # View database logs

# Health checks
make health           # Check all services
```

## 🎯 Development Workflow

### 1. Code Quality Automation

**Pre-commit Hooks** (runs automatically):

- **Prettier** - Formats staged files
- **ESLint** - Lints and fixes staged files
- **Type checking** - Validates TypeScript

**Commit Message Hooks**:

- **Commitlint** - Enforces conventional commits

### 2. Conventional Commits

We enforce conventional commit messages:

```bash
# ✅ Good examples
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
chore: update dependencies
test: add unit tests for user service

# ❌ Bad examples
updated stuff
fixed bug
WIP
```

**Commit Types:**

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code formatting (no logic changes)
- `refactor` - Code refactoring
- `test` - Adding or modifying tests
- `chore` - Maintenance tasks
- `ci` - CI/CD changes
- `perf` - Performance improvements
- `revert` - Reverting changes

### 3. Testing Strategy

**Unit Tests** - Individual component/function testing:

```bash
# Run tests for specific packages
pnpm --filter app test
pnpm --filter landing test
pnpm --filter ui test

# Watch mode for development
pnpm --filter app test:watch
```

**Integration Tests** - API and service integration:

```bash
# Backend tests (Go)
cd backend && go test ./...

# E2E tests (when implemented)
pnpm test:e2e
```

**Test Files Location:**

- Frontend: `src/**/*.{test,spec}.{ts,tsx}`
- Backend: `*_test.go`
- UI Package: `**/*.{test,spec}.ts`

### 4. Code Style Guidelines

**Prettier Configuration:**

- Single quotes for strings
- Semicolons required
- 2-space indentation
- 80 character line width
- Trailing commas (ES5)

**ESLint Rules:**

- TypeScript strict mode
- React hooks rules
- Import order enforcement
- Unused import removal
- Accessibility rules (jsx-a11y)

## 🏗️ Monorepo Architecture

### Package Management

We use **PNPM workspaces** for efficient dependency management:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Build Orchestration

**Turborepo** manages builds across packages:

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["^test"]
    }
  }
}
```

Benefits:

- **Parallel execution** - Multiple packages build simultaneously
- **Smart caching** - Only rebuilds changed packages
- **Dependency awareness** - Builds in correct order

## 🐛 Debugging

### Frontend Debugging

```bash
# Enable debug mode
DEBUG=* pnpm dev:app

# Browser DevTools
# React DevTools extension
# Redux DevTools (if applicable)
```

### Backend Debugging

```bash
# Go debugging with Delve
cd backend
dlv debug ./cmd

# Air hot reload with verbose logging
ENV=development LOG_LEVEL=debug pnpm dev:backend
```

### Docker Debugging

```bash
# View service logs
docker-compose logs -f [service-name]

# Execute commands in containers
docker-compose exec backend sh
docker-compose exec app sh

# Debug specific container
docker run -it clipture_backend sh
```

## 🔍 IDE Setup

### VS Code Configuration

**Recommended Extensions:**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "golang.go",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**Settings (.vscode/settings.json):**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.preferTypeOnlyAutoImports": true
}
```

## 🚨 Troubleshooting

### Common Issues

**1. Husky hooks not running:**

```bash
# Reinstall hooks
npx husky install
chmod +x .husky/pre-commit .husky/commit-msg
```

**2. PNPM workspace issues:**

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
```

**3. TypeScript errors after dependency updates:**

```bash
# Clear TypeScript cache
rm -rf packages/*/tsconfig.tsbuildinfo apps/*/tsconfig.tsbuildinfo
pnpm type-check
```

**4. Docker issues:**

```bash
# Reset Docker environment
make clean-all
docker system prune -f
make dev
```

### Performance Optimization

**Build Performance:**

```bash
# Use Turborepo for faster builds
turbo build --parallel

# Cache optimization
turbo build --cache-dir=.turbo
```

**Development Performance:**

```bash
# Hot reload optimization
pnpm dev:app           # Vite HMR
make dev               # Docker with Air hot reload
```

## 📈 Monitoring and Analytics

### Build Analytics

```bash
# Turborepo build summary
turbo build --summarize

# Bundle analysis
pnpm --filter app build:analyze
```

### Performance Monitoring

- **Backend**: Built-in health checks at `/health`
- **Frontend**: Web Vitals integration ready
- **Database**: Connection pool monitoring

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feat/amazing-feature`
5. **Open** a Pull Request

### Code Review Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (`pnpm type-check`)
- [ ] Conventional commit messages
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Performance considerations addressed

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React 19 Documentation](https://react.dev/)
- [Next.js 15 Guide](https://nextjs.org/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Turborepo Handbook](https://turbo.build/repo/docs)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Go Documentation](https://golang.org/doc/)

---

For questions or support, check our [GitHub Issues](../../issues) or contact the development team.
