# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**AI Knowledge Base Chat System** - RAG application with FastAPI backend, SQLModel ORM, Milvus vector DB, Google Gemini LLM.

**PRD:** `docs/PRD.md` - Complete specifications  
**Tasks:** `tasks/` - Implementation tracking with checkboxes

---

## 🚨 MANDATORY WORKFLOW

### 1. Git Rules

- ✅ **ALWAYS** work on `dev` branch
- ✅ **ALWAYS** run `ruff check --fix .` before commit
- ✅ **ALWAYS** run `pytest` before commit
- ❌ **NEVER** push to remote unless explicitly requested
- ❌ **NEVER** commit to `main` branch

### 2. Before Every Commit:

**Note:** A pre-commit hook is installed that automatically runs these checks!

```bash
cd backend
uv run ruff check --fix .
uv run pytest
git add .
git commit -m "feat(scope): description"
# Pre-commit hook will automatically run ruff and pytest
```

### 3. Task Completion Workflow

**CRITICAL:** After completing ANY task from `tasks/*.md`:

1. ✅ Update checkboxes in the task file (mark completed tasks)
2. ✅ **IMPORTANT:** Only check tasks that are ACTUALLY completed, not all tasks
3. ✅ Run linting: `uv run ruff check --fix .`
4. ✅ Run tests: `uv run pytest`
5. ✅ **Test API endpoints** if you created/modified any endpoints (manually verify they work)
6. ✅ Commit with descriptive message (code changes ONLY, NOT task files)
7. ⏸️ **STOP and wait for user approval before moving to next phase**
8. ✅ Update TodoWrite tool with current progress

**⚠️ CRITICAL TASK FILE UPDATE RULE:**

- ✅ **ALWAYS** update the relevant task file (`tasks/*.md`) when making ANY code changes
- ✅ **ALWAYS** document new features, improvements, or security updates in the task file
- ✅ **ALWAYS** add notes about implementation details that differ from original plan
- ✅ **ALWAYS** mark updates with `**UPDATE:**` or `**IMPROVEMENT:**` or `**SECURITY UPDATE:**` prefixes
- ❌ **NEVER** make code changes without documenting them in the task file
- ✅ If you add something new that's not mentioned in tasks, ADD IT to the task file immediately
- ✅ This ensures future AI sessions and developers know about all changes made

**⚠️ CRITICAL GIT RULE:**

- ❌ **NEVER** commit `tasks/*.md` files to git
- ❌ **NEVER** run `git add tasks/`
- ✅ Task files are tracked locally only (in .gitignore)
- ✅ Only commit actual code, tests, and configuration files

**⚠️ ENDPOINT TESTING RULE:**

- ✅ **ALWAYS** test API endpoints after creation/modification
- ✅ Check server starts without errors: `uv run uvicorn app.main:app --reload`
- ✅ Verify endpoint appears in `/docs` (Swagger UI)
- ✅ Test at least one successful request manually
- ✅ Inform user if any issues found during testing

**Example:**

```markdown
- [x] Create User model
- [x] Create Document model
- [ ] Create Pydantic schemas ← Stop here, ask for approval
```

**⚠️ IMPORTANT CHECKBOX RULE:**

- Always check the tickbox `[x]` ONLY for tasks that are completed
- Do NOT check all tasks at once
- Verify each task is actually done before marking it complete

### 4. Phase Completion

When a phase file (e.g., `tasks/01-CORE-MODELS.md`) is complete:

- ✅ Mark all checkboxes in completion checklist
- ✅ Verify against PRD sections listed
- ⏸️ **STOP - Wait for user review and approval**
- ❌ **DO NOT** proceed to next phase without approval

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

## Code Rules

### 1. Use SQLModel (NOT SQLAlchemy ORM)

```python
from sqlmodel import SQLModel, Field, select
from sqlmodel.ext.asyncio.session import AsyncSession

class User(SQLModel, table=True):
    __tablename__ = "users"
    user_id: str = Field(primary_key=True)
```

### 2. Documentation

- ✅ All functions have docstrings (Args, Returns, Raises)
- ✅ All functions have type hints
- ❌ NO PRD references in code comments
- ✅ Self-documenting names

### 3. Key Values (from PRD)

- File: 50MB max, chunk: 1000 chars, overlap: 200
- Embedding: 768 dim (text-embedding-004)
- Storage: 1GB per user
- JWT: Access 1hr, Refresh 7 days
- Rate limit: 100 chat/hour

### 4. Security

- Argon2 passwords, JWT blocklist (Redis)
- User isolation: filter by `user_id`
- Invite codes: `KB-XXXX-XXXX-XXXX`

---

## Git Pre-Commit Hook

A pre-commit hook is installed at `.git/hooks/pre-commit` that automatically:

1. Runs `ruff check --fix .` in backend/
2. Runs `pytest` in backend/
3. Blocks commit if either fails

**To bypass (NOT recommended):**

```bash
git commit --no-verify -m "message"
```

---

## Reference

- **PRD:** `docs/PRD.md` - Verify all implementations
- **Tasks:** `tasks/*.md` - Track progress with checkboxes
- **Env:** `backend/.env.example` - All required variables
- **Pre-commit Hook:** `.git/hooks/pre-commit` - Auto-runs tests and linting
