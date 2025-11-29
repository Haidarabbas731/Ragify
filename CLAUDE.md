# CLAUDE.md

AI Knowledge Base Chat System - RAG app with FastAPI + React.

**PRD:** `docs/PRD.md` | **Tasks:** `tasks/*.md`

---

## 🚨 MANDATORY WORKFLOW

**⚠️ CRITICAL TASK FILE UPDATE RULE:**

- ✅ **ALWAYS** update the relevant task file (`tasks/*.md`) when making ANY code changes
- ✅ **ALWAYS** document new features, improvements, or security updates in the task file
- ✅ **ALWAYS** add notes about implementation details that differ from original plan
- ✅ **ALWAYS** mark updates with `**UPDATE:**` or `**IMPROVEMENT:**` or `**SECURITY UPDATE:**` prefixes
- ❌ **NEVER** make code changes without documenting them in the task file
- ✅ If you add something new that's not mentioned in tasks, ADD IT to the task file immediately
- ✅ This ensures future AI sessions and developers know about all changes made

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
3. **For Frontend:** Verify with Chrome DevTools MCP (console, network, performance)
4. Test endpoints/components manually
5. Commit code changes
6. **STOP - Wait for user approval before next phase**
7. Update TodoWrite tool

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
- **Dark/Light Mode:** ALL UI must support BOTH dark and light modes with proper contrast
  - Use Tailwind's `dark:` prefix for theme-specific colors
  - Test readability in both modes before committing
  - Follow the same CSS pattern as landing page components

### CRITICAL: Use Frontend Skill
**⚠️ MANDATORY:** When implementing ANY frontend code (components, pages, UI, styling):
- ✅ **ALWAYS** use the `frontend-design` skill
- ✅ Run `/skill frontend-design` BEFORE writing frontend code
- ✅ This ensures production-grade, polished UI with proper design patterns
- ❌ DO NOT write raw frontend code without using the skill
- ❌ DO NOT skip this step even for small components

**Examples:**
- Creating login page → Use skill
- Adding button component → Use skill
- Styling chat interface → Use skill
- Building forms → Use skill

### CRITICAL: Frontend Verification with Chrome DevTools MCP
**⚠️ MANDATORY:** After implementing ANY frontend feature or page:
- ✅ **ALWAYS** verify implementation using Chrome DevTools MCP
- ✅ Check for console errors, warnings, and network issues
- ✅ Verify page performance and load times
- ✅ Test responsive design and accessibility
- ✅ Ensure proper rendering in both dark and light modes
- ✅ Validate form functionality and error states
- ❌ DO NOT consider a feature "complete" without DevTools verification

**MCP Tools to Use:**
- `mcp__chrome-devtools__navigate_page` - Load the page
- `mcp__chrome-devtools__take_screenshot` - Visual verification
- `mcp__chrome-devtools__take_snapshot` - DOM structure check
- `mcp__chrome-devtools__list_console_messages` - Error detection
- `mcp__chrome-devtools__list_network_requests` - API call verification
- `mcp__chrome-devtools__performance_start_trace` - Performance analysis

**What to Check:**
- No console errors or warnings
- All API requests succeed (200/201 status)
- Images and assets load correctly
- Animations and transitions work smoothly
- Forms validate and submit properly
- Dark/light mode switching works
- Responsive layout on different screen sizes
- Accessibility tree is properly structured

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

### Implementation Guide
**⚠️ IMPORTANT:** For detailed frontend implementation plan:
- **22-day plan:** `docs/FRONTEND_IMPLEMENTATION_PLAN.md`
- **Task checklist:** `tasks/12-FRONTEND.md`
- Follow the plan day-by-day for structured development
- Plan includes: MVP (Days 1-9) → UX (Days 10-15) → Polish (Days 16-22)

---

## Pre-Commit Hook

`.git/hooks/pre-commit` auto-runs `ruff` + `pytest` for backend.

Bypass: `git commit --no-verify` (NOT recommended)

---

## Reference

- **PRD:** `docs/PRD.md`
- **Tasks:** `tasks/*.md`
- **Env:** `backend/.env.example`, `frontend/.env.example`
