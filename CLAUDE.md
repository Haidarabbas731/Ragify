# CLAUDE.md

AI Knowledge Base Chat System - RAG app with FastAPI + React.

**PRD:** `docs/PRD.md` | **Tasks:** `tasks/*.md`

---

## 🚨 MANDATORY WORKFLOW

### Git Rules
- ✅ Work on `dev` branch only
- ✅ Run linting before commit (backend: `ruff`, frontend: `biome`)
- ✅ Run tests before commit (backend: `pytest`, frontend: `bun test`)
- ❌ NEVER push to remote unless explicitly requested
- ❌ NEVER commit to `main`

### Commit Format
```
<type>(<scope>): <description>
```
- ❌ NO Claude Code promotional messages
- ❌ NO "Generated with Claude Code" footer
- ❌ NO "Co-Authored-By: Claude"

### Task Completion Workflow
1. Update checkboxes in `tasks/*.md` (only completed tasks)
2. Run linting + tests
3. Test endpoints/components manually
4. Commit code changes
5. **STOP - Wait for user approval before next phase**
6. Update TodoWrite tool

**CRITICAL:**
- ✅ Update task files when making ANY code changes
- ✅ Mark updates with `**UPDATE:**`, `**IMPROVEMENT:**`, `**SECURITY UPDATE:**`
- ✅ Commit task files with code changes

---

## Backend Development

**Stack:** FastAPI, SQLModel, PostgreSQL, Milvus, Redis, arq, Gemini, uv

### Commands
```bash
# Setup
cd backend && cp .env.example .env && uv sync

# Dev server (localhost:8000/docs)
uv run uvicorn main:app --reload

# Worker
uv run arq app.tasks.worker.WorkerSettings

# Migrations
uv run alembic revision --autogenerate -m "msg"
uv run alembic upgrade head

# Test & Lint
uv run pytest
uv run ruff check --fix .
```

### Code Rules
- Use SQLModel (NOT SQLAlchemy ORM)
- All functions: docstrings + type hints
- NO PRD references in comments
- Security: Argon2 passwords, JWT blocklist, user isolation
- Key limits: 50MB files, 1000 chars/chunk, 1GB storage/user, 100 chat/hour

---

## Frontend Development

**Stack:** React 18, TypeScript, Vite, Bun, Tailwind, shadcn/ui, Zustand, React Query, Biome

### Commands
```bash
# Setup
cd frontend && bun install && cp .env.example .env

# Dev server (localhost:5173)
bun run dev

# Build & Test & Lint
bun run build
bun test
bun run biome check --write .
```

### Environment
```bash
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=AI Knowledge Base
```

### Code Rules
- TypeScript for all components (avoid `any`)
- JSDoc comments for components
- State: Zustand (global), React Query (server), useState (local)
- API: Axios with JWT interceptors
- Error handling: toast notifications, loading states, error boundaries
- Routes: `/login`, `/register`, `/dashboard`, `/chat`, `/profile`, `/admin`

### Project Structure
```
src/
├── components/ui/       # shadcn/ui
├── components/auth/     # Auth components
├── components/chat/     # Chat UI
├── pages/               # Route pages
├── hooks/               # Custom hooks
├── lib/                 # api.ts, auth.ts, utils.ts
├── store/               # Zustand stores
└── types/               # TS types
```

---

## Pre-Commit Hook

`.git/hooks/pre-commit` auto-runs `ruff` + `pytest` for backend.

Bypass: `git commit --no-verify` (NOT recommended)

---

## Reference

- **PRD:** `docs/PRD.md`
- **Tasks:** `tasks/*.md`
- **Env:** `backend/.env.example`, `frontend/.env.example`
