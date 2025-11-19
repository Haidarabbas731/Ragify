# Phase 0: Backend Project Setup & Infrastructure

**Priority:** Critical  
**Estimated Time:** 1-2 days  
**Dependencies:** None  
**PRD Reference:** Section 5 (Technical Architecture), Section 11.1 (Project Structure), Section 11.2 (Database Setup)

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
Example: feat(auth): add JWT authentication
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all functions** with docstrings (purpose, args, returns, raises)
- ✅ **Use type hints** for all function signatures
- ✅ **Follow consistent patterns** across all files
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in these task files are for the AI agent to verify implementation correctness, NOT to be copied into code.

---

## 0.1 Development Environment Setup

### Backend Setup
- [x] Install Python 3.11+
- [x] Install UV package manager (`pip install uv`)
- [x] Create virtual environment with UV
- [x] Install Ruff for linting/formatting
- [x] Configure VS Code/IDE with Python extensions

### Version Control
**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)
- [x] Initialize Git repository
- [x] Create `main` branch (production-ready code only)
- [x] Create and checkout to `dev` branch (active development)
- [x] Create `.gitignore` file for backend
- [x] **IMPORTANT: ALL work must be done on `dev` branch**
- [x] Create initial commit on `dev` branch
- [x] **DO NOT push to remote unless explicitly requested**

---

## 0.2 Backend Project Structure Creation
**PRD Reference:** Section 11.1 (Project Structure)

### Backend Directory Structure
- [x] Create `backend/` directory
- [x] Create `backend/app/` directory
- [x] Create `backend/app/api/v1/` directory
- [x] Create `backend/app/api/v1/admin/` directory
- [x] Create `backend/app/core/` directory
- [x] Create `backend/app/db/` directory
- [x] Create `backend/app/models/` directory
- [x] Create `backend/app/schemas/` directory
- [x] Create `backend/app/services/` directory
- [x] Create `backend/app/middleware/` directory
- [x] Create `backend/app/tasks/` directory
- [x] Create `backend/app/utils/` directory
- [x] Create `backend/tests/` directory
- [x] Create `backend/scripts/` directory
- [x] Create `backend/alembic/` directory
- [x] Create all `__init__.py` files in each package

---

## 0.3 Backend Dependencies Installation
**PRD Reference:** Section 11.2.1 (Dependencies pyproject.toml)

### Backend Dependencies (`pyproject.toml`)
- [x] Create `pyproject.toml` with project metadata
- [x] Add FastAPI dependencies (fastapi, uvicorn[standard])
- [x] Add SQLModel + asyncpg + alembic (sqlmodel>=0.0.14)
- [x] Add Pydantic + pydantic-settings (included with SQLModel)
- [x] Add authentication libraries (python-jose[cryptography], passlib[argon2])
- [x] Add Redis + arq (redis[hiredis], arq)
- [x] Add pymilvus (Milvus client)
- [x] Add b2sdk (Backblaze B2)
- [x] Add google-generativeai (Gemini API)
- [x] Add text processing libraries (pypdf, python-docx, python-magic)
- [x] Add resend (email service)
- [x] Add utility libraries (python-dotenv, httpx, python-dateutil)
- [x] Add dev dependencies (pytest, pytest-asyncio, pytest-cov, ruff, mypy)
- [x] Run `uv sync` to install all dependencies
- [x] Verify installation with `uv pip list`

---

## 0.4 Backend Configuration Files

### Backend Configuration
- [x] Create `backend/.env.example` with all required variables (see PRD Section 11.2.2)
- [x] Create `backend/.env` file (DO NOT COMMIT - add to .gitignore)
- [x] Create `backend/app/core/config.py` with Settings class
- [x] Create `backend/app/core/security.py` (JWT, password hashing)
- [x] Create `backend/app/core/logging.py` (structured logging)
- [x] Create `backend/app/api/exceptions.py` (custom exception handlers)
- [x] Create `backend/alembic.ini` for database migrations
- [x] Create `backend/ruff.toml` for code quality settings
- [x] Create `backend/pytest.ini` for test configuration
- [x] Create `backend/.gitignore` (exclude .env, __pycache__, .pytest_cache, etc.)

### Security Middleware (CRITICAL)
**PRD Reference:** Section 13.6 (Additional Security Measures)
- [x] Create `backend/app/middleware/security_headers.py` (HSTS, X-Frame-Options, CSP)
- [x] Create `backend/app/middleware/size_limit.py` (50MB request size enforcement)
- [x] Create `backend/app/middleware/rate_limit.py` (Rate limiting - see PRD Section 11.4)
- [x] Register security middleware in `main.py`

### Docker Configuration (Optional for later)
- [x] Create `backend/Dockerfile`
- [x] Create `docker-compose.yml` (PostgreSQL, Redis, Milvus)
- [x] Create `backend/.dockerignore`

---

## 0.5 External Services Setup
**PRD Reference:** Section 5 (Technical Architecture - Technology Stack)

### Database Services
- [x] Sign up for Aiven PostgreSQL (1GB free tier)
- [x] Create database instance
- [x] Note down connection string (DATABASE_URL)
- [x] Test connection with `psql` or TablePlus

### Redis Setup
- [x] Install Redis locally (or use Docker)
- [x] OR sign up for Redis Cloud (free tier)
- [x] Note down Redis URL
- [x] Test connection with `redis-cli`

### Milvus/Zilliz Cloud
- [x] Sign up for Zilliz Cloud (free tier)
- [x] Create cluster
- [x] Note down MILVUS_HOST and MILVUS_PORT
- [x] Note down API token

### Backblaze B2
- [x] Sign up for Backblaze account
- [x] Create B2 bucket (unique name)
- [x] Generate application key (with read/write access)
- [x] Note down: B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME

### Google AI Studio
- [x] Sign up for Google AI Studio
- [x] Create API key for Gemini
- [x] Note down GOOGLE_API_KEY
- [x] Test API access with a simple request

### Resend Email Service
- [x] Sign up for Resend (free tier: 100 emails/day)
- [x] Verify domain OR use onboarding domain
- [x] Generate API key
- [x] Note down RESEND_API_KEY
- [x] Set EMAIL_FROM_ADDRESS

---

## 0.6 Database Initialization
**PRD Reference:** Section 11.2.4 (Alembic Configuration)

### Alembic Setup
- [x] Run `alembic init alembic` in backend directory
- [x] Configure `alembic/env.py` with async engine (see PRD Section 11.2.4)
- [x] Import all models in `env.py`
- [x] Update `alembic.ini` with correct script location

### Initial Migration
- [x] Create all model files (User, Document, Collection, etc.)
- [x] Run `alembic revision --autogenerate -m "Initial migration"`
- [x] Review generated migration script
- [x] Run `alembic upgrade head` to apply migration
- [x] Verify tables created with `psql` or database client

---

## 0.7 Backend Hello World Testing
**PRD Reference:** Section 9.11 (Health Check API)

### Backend Hello World
- [x] Create `backend/app/main.py` with minimal FastAPI app
- [x] Add health check endpoint (`GET /api/v1/health`)
- [x] Configure CORS middleware for future frontend
- [x] Add database connection check in health endpoint
- [x] Add Redis connection check in health endpoint
- [x] Add arq queue statistics to health check (pending_tasks, failed_tasks_24h)
- [x] Run with `uvicorn app.main:app --reload`
- [x] Test at `http://localhost:8000/api/v1/health`
- [x] Test auto-generated docs at `http://localhost:8000/docs`
- [x] Verify all services return "up" status

---

## 0.8 Development Workflow Setup
**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Scripts Creation
- [x] Create `backend/scripts/bootstrap_admin.py` (generate first invite code)
- [x] Create `backend/scripts/seed_data.py` (dev data seeding)
- [x] Create `backend/scripts/run_worker.sh` (arq worker startup)
- [x] Create `backend/scripts/db_reset.sh` (drop & recreate database)

### Utility Files Setup
**PRD Reference:** Section 11.1 (Project Structure - utils/)
- [x] Create `backend/app/utils/text_extraction.py` (PDF/DOCX text extraction)
- [x] Create `backend/app/utils/chunking.py` (Text chunking utilities)
- [x] Create `backend/app/utils/sanitization.py` (Input sanitization)

### Git Hooks (Optional)
- [x] Set up pre-commit hook for Ruff
- [ ] Set up pre-commit hook for Biome
- [x] Set up pre-commit hook for tests (pytest)

### Documentation
- [x] Create `backend/README.md` with setup instructions
- [ ] Create `frontend/README.md` with setup instructions
- [ ] Create root `README.md` with project overview
- [x] Document environment variables in `.env.example`

---

## ✅ Phase 0 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [x] **Cross-check implementation with PRD Section 5, 11.1, 11.2**
- [x] **Verify all environment variables match PRD Section 11.2.2**
- [x] **Confirm directory structure matches PRD Section 11.1**

Before moving to Phase 1, verify:
- [x] All dependencies installed successfully
- [x] All external services accessible (PostgreSQL, Redis, Milvus, B2, Google AI, Resend)
- [x] Database migrations applied and tables created
- [x] Backend server starts without errors (`uvicorn app.main:app --reload`)
- [x] Health check endpoint responds with all services "up"
- [x] API docs accessible at `http://localhost:8000/docs`
- [x] Environment variables loaded properly from `.env`
- [x] Git repository initialized with initial commit
- [x] Ruff linting passes without errors
- [x] Can connect to PostgreSQL with asyncpg
- [x] Can connect to Redis
- [x] Bootstrap admin script created and tested

---

**Next Phase:** [Phase 1: Core Models & Database](01-CORE-MODELS.md)
