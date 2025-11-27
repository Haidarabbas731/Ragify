# Phase 9: Deployment & Production Infrastructure

**Priority:** High
**Estimated Time:** 2 days
**Dependencies:** Phase 8 (Testing completed)
**PRD Reference:** Section 15 (Deployment Strategy)

---

## ⚠️ IMPORTANT GIT RULES (READ FIRST)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Git Workflow:
1. ✅ **ALWAYS** work on `dev` branch (not `main`)
2. ✅ **ALWAYS** run tests before committing (`pytest`)
3. ✅ **ALWAYS** run linting before committing (`ruff check .`)
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Example: chore(deploy): add production Docker configuration
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all functions** with docstrings (purpose, args, returns, raises)
- ✅ **Use type hints** for all function signatures
- ✅ **Follow consistent patterns** across all files
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in this file are for verification only, NOT for code comments.

---

## 9.1 Docker Configuration (Production)

**PRD Reference:** Section 15 (Deployment Strategy - Development Environment)

### Production Dockerfile Enhancement
**File:** `backend/Dockerfile`

**NOTE:** Basic Dockerfile already exists from Phase 0, enhance for production:

- [x] Verify base Python 3.11-slim image
- [x] Verify UV installation
- [ ] Add multi-stage build for smaller image size
- [ ] Add non-root user for security
- [ ] Add health check endpoint
- [ ] Optimize layer caching
- [ ] Add production-only optimizations

**Production Dockerfile Example:**
```dockerfile
# Stage 1: Builder
FROM python:3.11-slim AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Stage 2: Runtime
FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose Production Configuration
**File:** `backend/docker-compose.prod.yml`

**NOTE:** Basic docker-compose.yml exists from Phase 0 for local dev. Create production version:

- [ ] Create `backend/docker-compose.prod.yml`
- [ ] Add production environment variables
- [ ] Configure resource limits (CPU, memory)
- [ ] Add logging configuration
- [ ] Add restart policies
- [ ] Configure networks for service isolation
- [ ] Add health checks for all services
- [ ] Include arq worker service
- [ ] Add Redis persistence configuration

**Services to include:**
- FastAPI backend (main app)
- arq worker (background tasks)
- Redis (session store, queue, cache)

**Cloud Services (No containers needed):**
- PostgreSQL (Aiven cloud)
- Milvus (Zilliz Cloud)
- Object Storage (Backblaze B2)

### .dockerignore Optimization
**File:** `backend/.dockerignore`

- [x] Verify .dockerignore exists (created in Phase 0)
- [ ] Add production-specific exclusions
- [ ] Verify test files are excluded
- [ ] Verify .env files are excluded
- [ ] Add coverage reports exclusion
- [ ] Add __pycache__ exclusion

---

## 9.2 Environment Configuration

**PRD Reference:** Section 15 (Backend .env.example)

### Environment Variables Management
**File:** `backend/.env.example`

- [x] Verify .env.example exists (created in Phase 0)
- [ ] Document all required variables with comments
- [ ] Add production-specific variables
- [ ] Add security recommendations
- [ ] Document service URLs (Aiven, Zilliz, B2)
- [ ] Add example values for all services

**Required Environment Variables:**
```bash
# Google AI API
GOOGLE_API_KEY=your_api_key_here

# Zilliz Cloud (Milvus)
ZILLIZ_CLOUD_URI=https://your-cluster.zillizcloud.com:19530
ZILLIZ_CLOUD_TOKEN=your_token_here

# PostgreSQL (Aiven)
POSTGRES_URI=postgresql://user:pass@host:port/db?sslmode=require

# Backblaze B2
B2_APPLICATION_KEY_ID=your_key_id
B2_APPLICATION_KEY=your_key
B2_BUCKET_NAME=your_bucket
B2_ENDPOINT_URL=https://s3.us-west-002.backblazeb2.com

# Redis
REDIS_URL=redis://redis:6379/0

# Security
JWT_SECRET_KEY=your_secret_key_here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_NAME=AI Knowledge Base
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
FRONTEND_URL=https://yourdomain.com
INVITE_ONLY=true
```

### Production Secrets Management
- [ ] Document .env security best practices
- [ ] Add instructions for secret rotation
- [ ] Document environment-specific configurations
- [ ] Add staging environment configuration
- [ ] Add development environment configuration

---

## 9.3 Database Migrations in Production

**PRD Reference:** Section 11.2 (Alembic Migrations)

### Migration Workflow
- [ ] Document migration deployment process
- [ ] Create migration verification checklist
- [ ] Add rollback procedures
- [ ] Document backup requirements before migrations
- [ ] Test migrations on staging environment first

**Production Migration Steps:**
```bash
# 1. Backup database
pg_dump $POSTGRES_URI > backup_$(date +%Y%m%d).sql

# 2. Review pending migrations
uv run alembic current
uv run alembic history

# 3. Apply migrations
uv run alembic upgrade head

# 4. Verify application starts
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# 5. Rollback if needed
uv run alembic downgrade -1
```

---

## 9.4 Production Deployment Platforms

### Platform-Specific Deployment Guides

#### Option 1: DigitalOcean App Platform
- [ ] Create deployment guide for DigitalOcean
- [ ] Document app configuration (docker-compose)
- [ ] Document environment variables setup
- [ ] Document database connection (Aiven)
- [ ] Document domain configuration
- [ ] Document SSL/TLS setup (automatic with App Platform)
- [ ] Document scaling configuration

#### Option 2: AWS (EC2 + ECS)
- [ ] Create deployment guide for AWS
- [ ] Document EC2 instance setup
- [ ] Document Docker deployment on EC2
- [ ] Document ECS Fargate configuration (optional)
- [ ] Document RDS PostgreSQL configuration (alternative to Aiven)
- [ ] Document ElastiCache Redis configuration
- [ ] Document load balancer setup
- [ ] Document auto-scaling configuration

#### Option 3: Google Cloud Platform (Cloud Run)
- [ ] Create deployment guide for GCP
- [ ] Document Cloud Run deployment
- [ ] Document Cloud SQL PostgreSQL setup
- [ ] Document Memorystore Redis setup
- [ ] Document secret management (Secret Manager)
- [ ] Document Cloud Build CI/CD integration

#### Option 4: Self-Hosted VPS (DigitalOcean Droplet, Linode, etc.)
- [ ] Create deployment guide for VPS
- [ ] Document server setup (Ubuntu 22.04 LTS)
- [ ] Document Docker & Docker Compose installation
- [ ] Document Nginx reverse proxy configuration
- [ ] Document SSL/TLS with Let's Encrypt (certbot)
- [ ] Document firewall configuration (UFW)
- [ ] Document systemd service configuration
- [ ] Document automatic startup on reboot

---

## 9.5 CI/CD Pipeline (Optional)

**PRD Reference:** Section 11.7 (Testing Strategy)

### GitHub Actions Workflow
**File:** `.github/workflows/deploy.yml`

- [ ] Create GitHub Actions workflow file
- [ ] Add workflow for dev branch (auto-test)
- [ ] Add workflow for main branch (auto-deploy)
- [ ] Configure secrets in GitHub repository
- [ ] Add Docker image build step
- [ ] Add Docker image push to registry
- [ ] Add deployment step (platform-specific)
- [ ] Add rollback mechanism
- [ ] Add deployment notifications (Slack/Discord)

**Workflow Steps:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend
          pip install uv
          uv sync
          uv run pytest
          uv run ruff check .

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Platform-specific deployment commands
```

### GitLab CI/CD (Alternative)
- [ ] Create GitLab CI configuration
- [ ] Add test stage
- [ ] Add build stage
- [ ] Add deploy stage
- [ ] Configure GitLab secrets

---

## 9.6 Monitoring & Health Checks

**PRD Reference:** Section 12 (Performance Requirements), Section 21.3 (Monitoring)

### Health Check Endpoints
**File:** `backend/app/api/v1/health.py`

- [x] Verify health endpoint exists (created in Phase 0)
- [ ] Enhance with detailed service status
- [ ] Add PostgreSQL connection check
- [ ] Add Redis connection check
- [ ] Add Milvus connection check
- [ ] Add B2 connection check
- [ ] Return service versions
- [ ] Add response time metrics

**Enhanced Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:00:00Z",
  "services": {
    "postgres": {"status": "healthy", "latency_ms": 5},
    "redis": {"status": "healthy", "latency_ms": 1},
    "milvus": {"status": "healthy", "latency_ms": 15},
    "b2": {"status": "healthy", "latency_ms": 50}
  },
  "version": "1.0.0"
}
```

### Uptime Monitoring
- [ ] Document uptime monitoring setup (UptimeRobot, Pingdom, etc.)
- [ ] Configure health check polling (every 5 minutes)
- [ ] Configure alerting for downtime
- [ ] Add status page (optional)

---

## 9.7 Logging & Error Tracking

**PRD Reference:** Section 11.5 (Structured Logging), Section 21.3 (Monitoring)

### Production Logging Configuration
**File:** `backend/app/core/logging.py`

- [x] Verify logging configuration exists (created in Phase 0)
- [ ] Configure production log level (INFO)
- [ ] Add JSON-formatted logs for production
- [ ] Add request ID tracking
- [ ] Add user ID in log context
- [ ] Configure log rotation
- [ ] Add log aggregation service integration (optional)

### Error Tracking (Optional)
- [ ] Document Sentry integration
- [ ] Add Sentry SDK to dependencies
- [ ] Configure error reporting
- [ ] Add custom error tags (user_id, endpoint)
- [ ] Configure error alerts
- [ ] Add performance monitoring

**Sentry Integration Example:**
```python
# backend/app/core/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "production"),
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1
)
```

---

## 9.8 Backup & Disaster Recovery

**PRD Reference:** Section 21.4 (Backup & Disaster Recovery)

### Database Backup Strategy
- [ ] Document automated PostgreSQL backup (Aiven automatic backups)
- [ ] Document manual backup procedures
- [ ] Document backup retention policy
- [ ] Test database restore procedure
- [ ] Document backup verification process

### Object Storage Backup
- [ ] Document B2 backup configuration
- [ ] Verify B2 versioning is enabled
- [ ] Document file recovery procedures
- [ ] Test file restore procedure

### Redis Persistence
- [ ] Configure Redis AOF (Append-Only File)
- [ ] Configure Redis RDB snapshots
- [ ] Document Redis backup procedures
- [ ] Test Redis restore procedure

### Disaster Recovery Plan
- [ ] Document full system recovery steps
- [ ] Document RTO (Recovery Time Objective)
- [ ] Document RPO (Recovery Point Objective)
- [ ] Create disaster recovery runbook
- [ ] Test disaster recovery annually

---

## 9.9 Security Hardening

**PRD Reference:** Section 13 (Security & Access Control)

### HTTPS/TLS Configuration
- [ ] Document SSL/TLS certificate setup (Let's Encrypt)
- [ ] Configure automatic certificate renewal
- [ ] Enforce HTTPS redirects
- [ ] Configure HSTS headers
- [ ] Test SSL configuration (SSL Labs)

### Firewall Configuration
- [ ] Document firewall rules (ports 80, 443, 22)
- [ ] Close unnecessary ports
- [ ] Configure rate limiting at firewall level
- [ ] Document DDoS protection measures

### Security Headers
**File:** `backend/app/middleware/security_headers.py`

- [x] Verify security headers middleware exists
- [ ] Add Content-Security-Policy header
- [ ] Add X-Frame-Options header
- [ ] Add X-Content-Type-Options header
- [ ] Add Referrer-Policy header
- [ ] Test security headers (securityheaders.com)

### Secret Management
- [ ] Document environment variable security
- [ ] Use Docker secrets (if applicable)
- [ ] Rotate secrets regularly
- [ ] Document secret rotation procedures
- [ ] Use secret management service (AWS Secrets Manager, etc.)

---

## 9.10 Performance Optimization

**PRD Reference:** Section 12 (Performance Requirements)

### Application Performance
- [ ] Enable Uvicorn workers (multi-process)
- [ ] Configure worker count (2 × CPU cores)
- [ ] Add response caching (Redis)
- [ ] Optimize database queries (indexes)
- [ ] Enable gzip compression
- [ ] Configure CDN for static files (frontend)

**Uvicorn Production Command:**
```bash
uv run uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info \
  --access-log
```

### Database Performance
- [ ] Configure connection pooling
- [ ] Optimize frequently-used queries
- [ ] Add database indexes (if missing)
- [ ] Monitor slow queries
- [ ] Configure query timeout limits

### Caching Strategy
- [ ] Document Redis caching strategy
- [ ] Cache user sessions
- [ ] Cache frequently-accessed data
- [ ] Configure cache expiration policies
- [ ] Monitor cache hit rates

---

## ✅ Phase 9 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check deployment with PRD Section 15** (Docker, env vars)
- [ ] **Verify all services are containerized** (FastAPI, arq worker, Redis)
- [ ] **Confirm cloud services are documented** (Aiven, Zilliz, B2)
- [ ] **Test deployment on staging environment** (before production)
- [ ] **Verify health checks work** (all services responding)

Before deploying to production, verify:
- [ ] All environment variables configured in `.env`
- [ ] Docker images build successfully
- [ ] docker-compose.prod.yml tested
- [ ] Database migrations applied successfully
- [ ] All services start without errors
- [ ] Health check endpoint returns 200 OK
- [ ] HTTPS/SSL certificate configured
- [ ] Firewall rules configured
- [ ] Backup procedures tested
- [ ] Monitoring & alerting configured
- [ ] Error tracking configured (optional)
- [ ] CI/CD pipeline tested (optional)
- [ ] Deployment documentation complete
- [ ] Rollback procedures documented and tested
- [ ] Team trained on deployment procedures

**Deployment Readiness:** ⬜ Not Ready / ⬜ Ready for Staging / ⬜ Ready for Production

---

## 📋 Deployment Checklist (Production Day)

### Pre-Deployment
- [ ] Run all tests: `uv run pytest`
- [ ] Run linting: `uv run ruff check .`
- [ ] Backup production database
- [ ] Review pending migrations
- [ ] Update environment variables
- [ ] Build Docker images
- [ ] Test images locally

### Deployment
- [ ] Apply database migrations
- [ ] Deploy application containers
- [ ] Verify health checks pass
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Monitor performance metrics

### Post-Deployment
- [ ] Smoke test all features
- [ ] Verify integrations (B2, Milvus, email)
- [ ] Check error tracking dashboard
- [ ] Monitor uptime for 24 hours
- [ ] Update team on deployment status
- [ ] Document any issues encountered
- [ ] Create post-deployment report

---

**Next Phase:** Phase 10 - Documentation & Developer Guides
