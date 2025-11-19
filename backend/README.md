# AI Knowledge Base - Backend

FastAPI-based RAG (Retrieval-Augmented Generation) system for chatting with your documents using Google Gemini and Milvus vector database.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+**
- **Docker & Docker Compose** (for PostgreSQL & Redis)
- **UV Package Manager**: `pip install uv`

### 1. Clone & Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (see Configuration section)
```

### 2. Start Services
```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Install dependencies
uv sync
```

### 3. Run Development Server
```bash
# Terminal 1: API Server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Background Worker (for document processing)
uv run arq app.tasks.worker.WorkerSettings
```

### 4. Access API
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Config, security, logging
│   ├── db/              # Database setup (database.py)
│   ├── models/          # SQLModel database models
│   ├── schemas/         # Pydantic request/response schemas
│   ├── services/        # Business logic
│   ├── tasks/           # ARQ background tasks
│   └── utils/           # Helper functions
├── scripts/             # Utility scripts
│   ├── bootstrap_admin.py  # Generate first invite code
│   ├── seed_data.py        # Seed dev test data
│   ├── run_worker.sh       # Start ARQ worker
│   └── db_reset.sh         # Reset database (dev only)
├── tests/               # Pytest tests
├── alembic/             # Database migrations (optional)
├── .env.example         # Environment template
└── pyproject.toml       # UV dependencies
```

---

## ⚙️ Configuration

### Required Environment Variables

Edit `.env` file:

```bash
# Database (Docker)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/knowledge_base

# Redis (Docker)
REDIS_URL=redis://localhost:6379/0

# Google Gemini (Get from https://aistudio.google.com)
GOOGLE_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
EMBEDDING_MODEL=models/text-embedding-004

# Milvus Vector DB (Zilliz Cloud - Free Tier)
MILVUS_HOST=your-cluster.cloud.zilliz.com
MILVUS_PORT=19530
MILVUS_TOKEN=your-zilliz-token

# Backblaze B2 Storage (Free 10GB)
B2_APPLICATION_KEY_ID=your-key-id
B2_APPLICATION_KEY=your-key
B2_BUCKET_NAME=your-bucket-name

# Email (Resend - Free 100/day)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com

# JWT Security (generate with: openssl rand -hex 32)
JWT_SECRET_KEY=your-secret-key-here
```

---

## 🛠️ Development Workflow

### Run Linting
```bash
uv run ruff check .           # Check only
uv run ruff check --fix .     # Auto-fix issues
uv run ruff format .          # Format code
```

### Run Tests
```bash
uv run pytest                 # All tests
uv run pytest -v              # Verbose
uv run pytest --cov=app       # With coverage
```

### Database Management

**Auto-create tables (on API startup):**
```bash
# Tables are created automatically when you run:
uv run uvicorn app.main:app --reload
```

**Manual migrations (optional - Alembic):**
```bash
# Generate migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback
uv run alembic downgrade -1
```

**Reset database (dev only):**
```bash
bash scripts/db_reset.sh  # Drops all tables and recreates
```

---

## 🔐 Initial Setup Scripts

### Generate First Admin Invite Code
```bash
uv run python scripts/bootstrap_admin.py
```
**Output:**
```
==================================================
Admin Invite Code Generated Successfully!
==================================================

Invite Code: KB-XXXX-XXXX-XXXX
Invite ID: uuid-here
Max Uses: 1

Use this code to create the first admin account.
==================================================
```

### Seed Development Data (Optional)
```bash
uv run python scripts/seed_data.py
```
**Creates:**
- Test user: `test@example.com` / `testpassword123`
- Test collection
- Test invite code: `KB-TEST-1234-ABCD`

---

## 🔄 Background Worker (ARQ)

### What is the Worker?
The ARQ worker processes **heavy background jobs** that are too slow for HTTP requests:
- Document text extraction
- Text chunking (1000 chars, 200 overlap)
- Embedding generation (768-dim vectors)
- Milvus vector storage
- Email sending

### Why Separate Process?
```
User uploads 50MB PDF
    ↓
API saves to B2 → returns "202 Accepted" (< 1 sec)
    ↓
Job added to Redis queue
    
[Background Worker Process]
    ↓
Processes document (30-60 seconds)
    ↓
Updates database when complete
```

If processing happened in the API, the HTTP request would timeout!

### Development
```bash
# Terminal 1: API
uv run uvicorn app.main:app --reload

# Terminal 2: Worker
uv run arq app.tasks.worker.WorkerSettings
```

### Production (Render/Railway)
Worker runs automatically as a separate service (see Deployment section).

---

## 🚢 Deployment (Render.com)

### Recommended Cloud Services

**For best performance and avoiding vendor lock-in:**

| Service | Provider | Free Tier |
|---------|----------|-----------|
| PostgreSQL | **Neon** or **Aiven** | 3GB storage (Neon) / 1GB (Aiven) |
| Redis | **Upstash** or **Render** | 10k commands/day (Upstash) / 25MB (Render) |
| Milvus | **Zilliz Cloud** | Already configured ✅ |
| Storage | **Backblaze B2** | 10GB free ✅ |
| Email | **Resend** | 100 emails/day ✅ |

### Deployment Steps

**1. Setup External Services:**

```bash
# Create accounts and get credentials:
# - Neon/Aiven: Get DATABASE_URL
# - Upstash: Get REDIS_URL  
# - Already have: Milvus, B2, Resend
```

**2. Deploy to Render:**

```bash
# Push code to GitHub
git push origin dev

# On Render.com:
# 1. New → Blueprint
# 2. Connect your GitHub repo
# 3. Render reads render.yaml (in project root)
# 4. Add secret environment variables in dashboard:
#    - DATABASE_URL (from Neon/Aiven)
#    - REDIS_URL (from Upstash)
#    - GOOGLE_API_KEY
#    - MILVUS_HOST, MILVUS_TOKEN
#    - B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY
#    - RESEND_API_KEY
#    - JWT_SECRET_KEY (generate with: openssl rand -hex 32)
```

**3. Render Auto-Deploys:**
- ✅ FastAPI Web Service (kb-api)
- ✅ ARQ Background Worker (kb-worker)
- ✅ Auto-restarts on crashes
- ✅ Auto-deploys on git push

**4. Access Your API:**
```
https://kb-api.onrender.com/docs
https://kb-api.onrender.com/api/v1/health
```

### render.yaml Configuration

The project includes `render.yaml` in the root directory. Key features:

```yaml
services:
  # API Service
  - type: web
    name: kb-api
    buildCommand: "cd backend && pip install uv && uv sync"
    startCommand: "cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        sync: false  # Add in dashboard
      - key: REDIS_URL
        sync: false  # Add in dashboard
      # ... (all other environment variables)

  # Worker Service  
  - type: worker
    name: kb-worker
    startCommand: "cd backend && uv run arq app.tasks.worker.WorkerSettings"
    # Same envVars as web service
```

**Using Render's Managed Services (Alternative):**

If you prefer Render's built-in PostgreSQL and Redis, uncomment this in `render.yaml`:

```yaml
databases:
  - name: kb-postgres
    plan: free

  - name: kb-redis
    plan: free
```

And change envVars to:
```yaml
- key: DATABASE_URL
  fromDatabase:
    name: kb-postgres
    property: connectionString
```

### Environment Variables Setup

**Never commit secrets!** Add these in **Render Dashboard → Environment**:

```bash
# Required Secrets
DATABASE_URL=postgresql+asyncpg://user:pass@host.aivencloud.com:12345/knowledge_base
REDIS_URL=redis://default:password@abc-123.upstash.io:6379
GOOGLE_API_KEY=your-google-api-key
MILVUS_HOST=your-cluster.cloud.zilliz.com
MILVUS_TOKEN=your-milvus-token
B2_APPLICATION_KEY_ID=your-b2-key-id
B2_APPLICATION_KEY=your-b2-application-key
B2_BUCKET_NAME=your-bucket-name
RESEND_API_KEY=your-resend-key
JWT_SECRET_KEY=your-generated-secret-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
FRONTEND_URL=https://yourfrontend.vercel.app
ADMIN_EMAIL=admin@example.com
```

**All other variables** are already configured in `render.yaml` with default values.

---

## 📊 Database Models

### Core Models (Completed ✅)
- **User**: Authentication, storage quotas, user status
- **Document**: File metadata, processing status, B2 storage keys
- **Collection**: Organize documents into groups
- **Conversation**: Chat history with JSONB messages
- **InviteCode**: Invite-only registration system (KB-XXXX-XXXX-XXXX)
- **AdminAuditLog**: Track admin actions

### Key Features
- **Timezone-aware datetimes**: All timestamps use `TIMESTAMP WITH TIME ZONE`
- **Soft deletes**: Documents marked as deleted, not removed
- **Status tracking**: Document processing states (PROCESSING → ACTIVE → DELETED → ERROR)
- **JSONB fields**: Flexible metadata and message storage

---

## 🧪 Testing

### Run All Tests
```bash
uv run pytest
```

### Test Coverage
```bash
uv run pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

### Test Specific Module
```bash
uv run pytest tests/test_auth.py -v
```

---

## 📝 API Documentation

### Interactive Docs
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Health Check
```bash
curl http://localhost:8000/api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "app_name": "AI Knowledge Base",
  "environment": "development",
  "services": {
    "api": "up",
    "database": "up",
    "redis": "up"
  }
}
```

---

## 🔧 Troubleshooting

### Docker containers not running
```bash
docker-compose ps
docker-compose logs postgres
docker-compose logs redis
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker exec kb_postgres psql -U postgres -c "\l"

# Check tables
docker exec kb_postgres psql -U postgres -d knowledge_base -c "\dt"
```

### Worker not processing jobs
```bash
# Check Redis connection
docker exec kb_redis redis-cli ping
# Should return: PONG

# Check worker logs
uv run arq app.tasks.worker.WorkerSettings
```

### Import errors
```bash
# Reinstall dependencies
uv sync --reinstall
```

---

## 📚 Tech Stack

- **Framework**: FastAPI 0.104+
- **ORM**: SQLModel (NOT SQLAlchemy ORM)
- **Database**: PostgreSQL 16 (asyncpg driver)
- **Cache/Queue**: Redis 7
- **Vector DB**: Milvus (Zilliz Cloud)
- **Storage**: Backblaze B2
- **LLM**: Google Gemini 2.0 Flash
- **Embeddings**: text-embedding-004 (768-dim)
- **Background Jobs**: ARQ
- **Auth**: JWT + Argon2
- **Email**: Resend API
- **Package Manager**: UV
- **Linting**: Ruff
- **Testing**: Pytest + pytest-asyncio

---

## 📖 Key Values (from PRD)

| Setting | Value |
|---------|-------|
| Max file size | 50MB |
| Chunk size | 1000 characters |
| Chunk overlap | 200 characters |
| Embedding dimension | 768 |
| Storage quota (default) | 1GB per user |
| JWT access token | 1 hour |
| JWT refresh token | 7 days |
| Rate limit | 100 requests/hour |

---

## 🔐 Security

- **Password hashing**: Argon2
- **JWT blocklist**: Redis-based
- **User isolation**: All queries filtered by `user_id`
- **Invite-only registration**: KB-XXXX-XXXX-XXXX codes
- **No credentials in code**: All secrets in `.env`

---

## 🎯 Development Status

### ✅ Completed (Phase 0)
- [x] Project structure setup
- [x] Database models (User, Document, Collection, Conversation, InviteCode, AdminAuditLog)
- [x] Database session management (`database.py` with `init_db()`)
- [x] Auto-create tables on startup
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Configuration management
- [x] Security utilities (JWT, Argon2)
- [x] Logging setup
- [x] Health check endpoint
- [x] Bootstrap scripts

### 🚧 In Progress
- [ ] Pydantic schemas (request/response models)
- [ ] CRUD services
- [ ] Authentication endpoints
- [ ] Document upload/management
- [ ] RAG chat endpoints
- [ ] Unit tests

---

## 📄 License

This project is for educational purposes.

---

## 🤝 Contributing

This is a learning project. Contributions welcome!

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Documentation**: See `docs/PRD.md` for full specifications
- **Tasks**: See `tasks/*.md` for implementation tracking

---

**Last Updated**: Phase 0 Completed - November 2025
