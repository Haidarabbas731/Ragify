# Ragify - Backend

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
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Background Worker (for document processing)
uv run arq app.tasks.worker.WorkerSettings
```

### Alternative: All-in-Docker with Milvus Lite
Avoids the ~3GB standalone Milvus image. Postgres and Redis run as containers; the Milvus Lite server, ARQ worker and API all run inside the single `api` container (Lite allows one process per DB file).
```bash
docker compose -f docker-compose.yml -f docker-compose.lite.yml up --build
```
Requires Docker Compose v2.24+. Data persists on the `document_storage` volume; `down -v` wipes it.

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
│   ├── start-api.sh        # Container entrypoint: migrate + seed admin + uvicorn
│   ├── start-worker.sh     # Container entrypoint: arq worker
│   └── db_reset.sh         # Reset database (dev only)
├── tests/               # Pytest tests
├── alembic/             # Database migrations (optional)
├── .env.example         # Environment template
└── pyproject.toml       # UV dependencies
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill it in. The essentials:

```bash
# Database and Redis (Docker)
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/knowledge_base
REDIS_URL=redis://localhost:6379/0

# Chat model: the default for everyone who has not saved their own key
LLM_PROVIDER=gemini                  # gemini | openrouter
GOOGLE_API_KEY=your-google-api-key   # https://aistudio.google.com/apikey
GEMINI_MODEL=gemini-2.5-flash
OPENROUTER_API_KEY=                  # https://openrouter.ai/keys
OPENROUTER_MODEL=openai/gpt-4o-mini

# Embeddings (Cohere). Changing the model or dimension needs a re-index (see below)
COHERE_API_KEY=your-cohere-api-key
EMBEDDING_MODEL=embed-v4.0
EMBEDDING_DIMENSION=1024             # embed-v4.0 supports 256, 512, 1024, 1536

# Vector DB: a local Milvus Lite file for dev, or a Milvus/Zilliz URL
VECTOR_DB_URI=./milvus_ragify.db
VECTOR_DB_TOKEN=

# File storage: local for dev, b2 for production
STORAGE_BACKEND=local

# Email (Resend) and security
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
JWT_SECRET_KEY=your-secret-key-here  # generate with: openssl rand -hex 32
```

### Which API key does chat use?

1. **The user's own key**, if they saved one in Profile > Preferences (provider, model and key are theirs).
2. Otherwise **the server key from `.env`** for `LLM_PROVIDER`.
3. If neither exists, chat asks the user to add a key.

Saved keys are stored encrypted. The encryption key is derived from `JWT_SECRET_KEY`
(or set `APP_ENCRYPTION_KEY` to use a dedicated one), so changing either makes saved keys
unreadable and users must enter them again.

### Re-indexing after changing the embedding model

Vectors from different embedding models are not comparable, so the Milvus collection records
the model and dimension that built it, and the app refuses to open it with a different setup:

```
Collection 'knowledge_base' was built with embeddings '...' but the app is configured for '...'
```

To switch: stop the worker, delete the collection (or the Milvus Lite data), clear the
`documents` rows and stored files, then restart and re-upload your documents.

---

## 🛠️ Development Workflow

### Git Pre-Commit Hook (Auto-installed)

A pre-commit hook runs automatically before every commit:
- ✅ Runs `ruff check --fix .` to lint code
- ✅ Runs `pytest` to ensure tests pass
- ❌ Blocks commit if either check fails

**To bypass (not recommended):**
```bash
git commit --no-verify -m "message"
```

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

**Migrations (Alembic) create and change the tables.** The API does not create tables at
startup, so apply migrations before the first run and after pulling new code (the Docker
start script does this for you):
```bash
# Apply migrations
uv run alembic upgrade head

# Generate a migration after changing a model
uv run alembic revision --autogenerate -m "description"

# Rollback
uv run alembic downgrade -1
```

**Reset database (dev only):**
```bash
bash scripts/db_reset.sh  # Drops all tables and recreates
```

---

## 🔐 Initial Setup Scripts

### Admin account (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)

The API creates this admin at startup and keeps its password in sync with `ADMIN_PASSWORD`
(changing the variable and restarting is enough; a password changed in the app for this
account is reverted the same way). Avoid `#`, `$`, quotes, backslashes and spaces in the
value: env-file parsers cut or rewrite them. To also restore a demoted or suspended admin run
`python scripts/seed_admin.py --restore-access`.

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
- Document text extraction (PDF, DOCX, TXT, MD)
- Text chunking (1000 chars, 200 overlap)
- Embedding generation (1024-dim vectors with gemini-embedding-001)
- Milvus vector storage with user isolation
- Email sending
- Document cleanup tasks

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
uv run uvicorn main:app --reload

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
#    - GOOGLE_API_KEY (or OPENROUTER_API_KEY) for the default chat model
#    - COHERE_API_KEY (embeddings)
#    - VECTOR_DB_URI, VECTOR_DB_TOKEN (Milvus/Zilliz)
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

### Dokploy: standalone Milvus or Milvus Lite

Two compose files deploy the same app with the same environment variables
(`.env.dokploy.example`). Pick one in Dokploy's compose path; switch any time.

| | `docker-compose.dokploy.yml` | `docker-compose.dokploy-lite.yml` |
| --- | --- | --- |
| Vector store | Standalone Milvus service (~3-4 GB image) | Milvus Lite inside the `api` container |
| Services | postgres, redis, milvus, api, worker | postgres, redis, api (worker and Lite run inside it) |
| Best for | Real production, more data | Demos and small deployments |
| Index storage | `milvus_data` volume | `milvus_lite_data` volume (back it up by copying the volume) |

Switching between them changes where vectors live, so re-upload documents afterwards.
After moving to Lite, delete the old `milvus_data` volume on the server to reclaim the space.

### Environment Variables Setup

**Never commit secrets!** Add these in **Render Dashboard → Environment**:

```bash
# Required Secrets
DATABASE_URL=postgresql+asyncpg://user:pass@host.aivencloud.com:12345/knowledge_base
REDIS_URL=redis://default:password@abc-123.upstash.io:6379
GOOGLE_API_KEY=your-google-api-key
COHERE_API_KEY=your-cohere-api-key
VECTOR_DB_URI=https://your-cluster.cloud.zilliz.com
VECTOR_DB_TOKEN=your-milvus-token
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
- **Document**: File metadata, processing status, B2 storage keys, chunk counts
- **Collection**: Organize documents into groups
- **Conversation**: Chat history with JSONB messages
- **InviteCode**: Invite-only registration system (KB-XXXX-XXXX-XXXX)
- **AdminAuditLog**: Track admin actions

### Key Features
- **Timezone-aware datetimes**: All timestamps use `TIMESTAMP WITH TIME ZONE`
- **Soft deletes**: Documents marked as deleted, not removed immediately
- **Status tracking**: Document processing states (PROCESSING → ACTIVE → ERROR → DELETED)
- **JSONB fields**: Flexible metadata and message storage
- **User isolation**: All vector data filtered by user_id in Milvus

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
  "app_name": "Ragify",
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
- **Embeddings**: gemini-embedding-001 (1024-dim)
- **Background Jobs**: ARQ (async task queue)
- **Auth**: JWT + Argon2
- **Email**: Resend API
- **Text Extraction**: PyPDF, python-docx
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
| Embedding dimension | 1024 (upgraded from 768) |
| Embedding model | gemini-embedding-001 |
| Storage quota (default) | 1GB per user |
| JWT access token | 1 hour |
| JWT refresh token | 7 days |
| Rate limit (chat) | 100 requests/hour |
| Rate limit (upload) | 10 documents/hour |
| Concurrent uploads | 10 per user |
| ARQ worker jobs | 10 concurrent |
| ARQ job timeout | 1 hour |

---

## 🔐 Security

- **Password hashing**: Argon2
- **JWT blocklist**: Redis-based
- **User isolation**: All queries filtered by `user_id`
- **Invite-only registration**: KB-XXXX-XXXX-XXXX codes
- **No credentials in code**: All secrets in `.env`

---

## 🎯 Development Status

### ✅ Phase 0: Setup & Foundation (Completed)
- [x] Project structure setup
- [x] Database models (User, Document, Collection, Conversation, InviteCode, AdminAuditLog)
- [x] Database session management (`database.py`); tables are managed by Alembic migrations
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Configuration management
- [x] Security utilities (JWT, Argon2)
- [x] Logging setup
- [x] Health check endpoint
- [x] Bootstrap scripts

### ✅ Phase 1: Core Models (Completed)
- [x] SQLModel database models with relationships
- [x] Pydantic schemas (request/response models)
- [x] Timezone-aware datetime handling
- [x] JSONB metadata fields
- [x] Status enums and validation

### ✅ Phase 2: Authentication (Completed)
- [x] User registration with invite codes
- [x] Login with JWT tokens (access + refresh)
- [x] Password reset flow with email
- [x] Token refresh endpoint
- [x] Logout with token blocklist
- [x] Email templates (modern design)
- [x] Middleware (rate limiting, security headers, size limits)

### ✅ Phase 3: Storage Services (Completed)
- [x] Backblaze B2 service (upload, download, delete)
- [x] Milvus vector database service (insert, search, delete with user isolation)
- [x] Google Gemini embedding service (gemini-embedding-001, 1024-dim)
- [x] Redis service (caching, rate limiting, JWT blocklist)
- [x] Storage quota management
- [x] Singleton patterns for service reuse

### ✅ Phase 4: Document Processing Pipeline (Completed)
- [x] Text extraction utilities (PDF, DOCX, TXT, MD)
- [x] Text chunking with metadata (1000 chars, 200 overlap)
- [x] Document upload API endpoint
- [x] ARQ background worker setup
- [x] Document processing task (extract → chunk → embed → store)
- [x] Document management endpoints (list, get, delete, retry, update)
- [x] Soft delete with cleanup jobs
- [x] Error handling with retry logic
- [x] BytesIO support (in-memory processing)

### 🚧 Phase 5: RAG Chat System (Next)
- [ ] Chat endpoint with streaming responses
- [ ] Vector similarity search
- [ ] Context retrieval from Milvus
- [ ] Conversation history management
- [ ] Chat rate limiting

### 📋 Deferred Tasks (from Phase 3 & 4)
- [ ] Unit tests for storage services
- [ ] Integration tests for document processing
- [ ] Health check integration (B2, Milvus)
- [ ] Rate limiting implementation
- [ ] Orphaned job recovery
- [ ] Scheduled cleanup jobs

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

---

## 🎉 Recent Updates

### Phase 4 Completion (November 2025)
- ✅ Full document processing pipeline implemented
- ✅ ARQ background worker for async processing
- ✅ Text extraction from PDF, DOCX, TXT, MD files
- ✅ BytesIO-based in-memory file handling
- ✅ Embedding model upgraded to gemini-embedding-001 (1024-dim)
- ✅ 6 document management API endpoints
- ✅ Soft delete pattern with cleanup jobs
- ✅ Error recovery with retry functionality

### Test Configuration Fixed
- ✅ Windows asyncio event loop issues resolved
- ✅ pytest-asyncio configuration updated
- ✅ NullPool added to prevent connection pool conflicts

---

**Last Updated**: Phase 4 Completed - November 2025
