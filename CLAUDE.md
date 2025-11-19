# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**AI Knowledge Base Chat System** - A RAG (Retrieval Augmented Generation) application that allows users to upload documents and chat with them using natural language queries.

**Architecture:** FastAPI backend with SQLModel ORM, Milvus vector database, Google Gemini 2.0 Flash for LLM, async background processing with arq workers.

**PRD Location:** `docs/PRD.md` - Complete product requirements and technical specifications

---

## 🚨 CRITICAL GIT WORKFLOW

**ALWAYS work on `dev` branch. NEVER push to remote unless explicitly requested.**

### Before Every Commit:
```bash
cd backend
uv run ruff check --fix .   # Auto-fix linting
uv run pytest               # Run all tests
git add .
git commit -m "<type>(<scope>): <description>"
# DO NOT PUSH - keep commits local
```

### Commit Format:
- `feat(auth): add JWT authentication`
- `fix(upload): handle file size validation`
- `test(models): add User model tests`

---

## Development Commands

### Setup
```bash
cd backend
cp .env.example .env        # Edit with real credentials
uv sync                     # Install all dependencies
```

### Run Development Server
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# API docs: http://localhost:8000/docs
# Health: http://localhost:8000/api/v1/health
```

### Run Background Worker (arq)
```bash
cd backend
uv run arq app.tasks.worker.WorkerSettings
```

### Database Migrations
```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1
```

### Testing
```bash
cd backend
uv run pytest                       # All tests
uv run pytest tests/test_auth.py    # Specific file
uv run pytest -v                    # Verbose
uv run pytest --cov=app             # With coverage
```

### Linting & Formatting
```bash
cd backend
uv run ruff check .                 # Check only
uv run ruff check --fix .           # Auto-fix
uv run ruff format .                # Format code
```

---

## Code Architecture

### Tech Stack
- **ORM:** SQLModel (NOT SQLAlchemy) with AsyncSession
- **Database:** PostgreSQL with asyncpg driver
- **Vector DB:** Milvus (Zilliz Cloud) - 768-dim embeddings
- **Storage:** Backblaze B2 (S3-compatible)
- **Cache/Queue:** Redis + arq background workers
- **LLM:** Google Gemini 2.0 Flash (`gemini-2.0-flash-exp`)
- **Embeddings:** Google text-embedding-004 (768 dimensions)
- **Auth:** JWT with Argon2 password hashing

### Directory Structure
```
backend/
├── app/
│   ├── api/v1/           # API endpoints (auth, documents, chat, etc.)
│   │   └── admin/        # Admin-only endpoints
│   ├── core/             # Config, security (JWT, Argon2)
│   ├── db/               # Database session, base classes
│   ├── models/           # SQLModel database models
│   ├── schemas/          # Pydantic request/response schemas
│   ├── services/         # Business logic (auth, documents, B2, Milvus, LLM)
│   ├── tasks/            # arq background workers
│   ├── utils/            # Text extraction, chunking utilities
│   ├── middleware/       # Rate limiting, security headers
│   └── prompts/          # LLM prompt templates
├── tests/                # Pytest test suite
├── scripts/              # Utility scripts (bootstrap admin, seed data)
└── alembic/              # Database migrations
```

### Key Models (SQLModel)
All models use `SQLModel` with `table=True`:
- **User:** Authentication, storage quotas, invite tracking
- **Document:** File metadata, processing status state machine
- **Collection:** Document organization (like folders)
- **Conversation:** JSONB message history
- **InviteCode:** Invite-only registration system
- **AdminAuditLog:** Compliance tracking for admin actions

### Data Flow

**Document Upload:**
1. Upload to Backblaze B2 → get storage_key
2. Create Document record (status=PROCESSING)
3. Enqueue arq background job
4. Worker: extract text → chunk (1000 chars, 200 overlap) → generate embeddings → store in Milvus
5. Update status to ACTIVE

**Chat Query (RAG):**
1. Generate query embedding (text-embedding-004)
2. Search Milvus for similar chunks (user_id filtered, top 5)
3. Build context from retrieved chunks
4. Send to Gemini 2.0 Flash with RAG prompt
5. Return answer + source citations

### Background Workers (arq)
Workers defined in `app/tasks/worker.py`:
- `process_document` - Text extraction, chunking, embedding
- `cleanup_deleted_document` - B2 + Milvus + PostgreSQL cleanup
- `recover_orphaned_jobs` - Retry stuck processing jobs (cron: every 15min)

---

## Critical Implementation Rules

### 1. Use SQLModel (NOT SQLAlchemy ORM)
```python
# ✅ CORRECT
from sqlmodel import SQLModel, Field, select
from sqlmodel.ext.asyncio.session import AsyncSession

class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: str = Field(primary_key=True)

# Query
async def get_user(session: AsyncSession, user_id: str):
    result = await session.execute(select(User).where(User.user_id == user_id))
    return result.scalar_one_or_none()
```

### 2. Documentation Standards
- All functions MUST have docstrings (Args, Returns, Raises)
- All functions MUST have type hints
- NO PRD references in code comments
- Self-documenting variable/function names

```python
async def create_user(
    session: AsyncSession,
    email: str,
    password_hash: str,
    invite_code: str
) -> User:
    """Create a new user with the provided credentials.
    
    Args:
        session: Database session
        email: User email address
        password_hash: Argon2 hashed password
        invite_code: Valid invite code
        
    Returns:
        Created user instance
        
    Raises:
        ValueError: If email already exists or invite code invalid
    """
    # Implementation
```

### 3. Hard-Coded Values (from PRD)
- Max file size: **50MB**
- Chunk size: **1000 characters**
- Chunk overlap: **200 characters**
- Embedding dimension: **768** (text-embedding-004)
- Storage quota: **1GB** per user default
- JWT expiry: Access **1 hour**, Refresh **7 days**
- Rate limit: **100 chat queries/hour** per user

### 4. Security
- Passwords: **Argon2** only (via passlib)
- JWT tokens: Redis blocklist for revocation
- User data isolation: ALWAYS filter by `user_id` in Milvus queries
- Invite-only registration (codes: `KB-XXXX-XXXX-XXXX` format)

### 5. Soft Delete Pattern
Documents are soft-deleted immediately (status=DELETED), then cleanup runs in background:
1. Update status, release storage quota instantly
2. Enqueue cleanup job
3. Worker deletes: Milvus chunks → B2 file → PostgreSQL record

---

## Task Tracking

Implementation progress tracked in `tasks/` directory:
- Each phase has a markdown file with checkboxes
- Check PRD references for exact specifications
- Verify against PRD before marking complete

**Current Phase:** Check `tasks/README.md` for status

---

## Environment Variables

All required variables in `backend/.env.example`:
- Database: `DATABASE_URL` (PostgreSQL with asyncpg)
- Redis: `REDIS_URL`
- Milvus: `MILVUS_HOST`, `MILVUS_PORT`, `MILVUS_TOKEN`
- B2: `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`
- Google AI: `GOOGLE_API_KEY`
- Email: `RESEND_API_KEY`
- JWT: `JWT_SECRET_KEY`

---

## Testing Strategy

- **Unit tests:** Individual functions/services
- **Integration tests:** API endpoints end-to-end
- **Fixtures:** `tests/conftest.py` - test DB, sample data
- **Async tests:** Use `pytest-asyncio` with `asyncio_mode = auto`

Run tests BEFORE every commit - no exceptions.
