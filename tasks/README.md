# Backend Development Task Tracker

**Project:** AI Knowledge Base Chat System  
**PRD Document:** `docs/PRD.md`  
**Repository:** Chat With Knowledge Base

---

## 🚨 CRITICAL GIT RULES (READ FIRST!)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Workflow:
1. ✅ **ALWAYS** work on `dev` branch (checkout with `git checkout dev`)
2. ✅ **ALWAYS** run `pytest` before committing
3. ✅ **ALWAYS** run `ruff check .` before committing
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Examples:
  - feat(auth): add JWT authentication
  - fix(upload): handle concurrent file uploads
  - test(api): add integration tests for chat
```

---

## 📋 Development Phases Overview

| Phase | Name | Status | Est. Time | Priority | Dependencies |
|-------|------|--------|-----------|----------|--------------|
| 0 | [Setup & Infrastructure](00-SETUP.md) | ⬜ Not Started | 1-2 days | Critical | None |
| 1 | [Core Models & Database](01-CORE-MODELS.md) | ⬜ Not Started | 2-3 days | Critical | Phase 0 |
| 2 | [Authentication System](02-AUTHENTICATION.md) | ⬜ Not Started | 3-4 days | Critical | Phase 1 |
| 3 | [Storage Services](03-STORAGE-SERVICES.md) | ⬜ Not Started | 2-3 days | Critical | Phase 1-2 |
| 4 | [Document Processing](04-DOCUMENT-PROCESSING.md) | ⬜ Not Started | 3-4 days | Critical | Phase 3 |
| 5 | [RAG Chat System](05-RAG-CHAT.md) | ⬜ Not Started | 3-4 days | Critical | Phase 4 |
| 6 | [Email Service](06-EMAIL-SERVICE.md) | ⬜ Not Started | 1 day | High | Phase 2 |
| 7 | [Admin Features](07-ADMIN-FEATURES.md) | ⬜ Not Started | 2-3 days | High | Phase 2 |
| 8 | [Testing & QA](08-TESTING.md) | ⬜ Not Started | 2-3 days | High | Phase 1-7 |
| 9 | [Deployment & Docker](09-DEPLOYMENT.md) | ⬜ Not Started | 2 days | Medium | Phase 8 |
| 10 | [Documentation](10-DOCUMENTATION.md) | ⬜ Not Started | 1-2 days | Medium | All |

**Total Estimated Time:** 22-31 days (4-6 weeks)

---

## 🎯 Current Phase

**Phase:** 0 - Setup & Infrastructure  
**File:** [tasks/00-SETUP.md](00-SETUP.md)  
**PRD Reference:** Section 5, 11.1, 11.2

### Quick Start:
```bash
# 1. Checkout dev branch
git checkout dev

# 2. Navigate to backend directory
cd backend

# 3. Follow tasks in 00-SETUP.md
```

---

## 📖 How to Use These Task Files

### 1. **Read the Phase File**
Each phase has a dedicated markdown file with:
- PRD section references
- Detailed implementation tasks with checkboxes
- Testing requirements
- Completion checklist with PRD verification

### 2. **Work Through Tasks Sequentially**
- Check off tasks as you complete them (`- [x]`)
- Run tests after each major feature
- Verify against PRD before moving to next section

### 3. **PRD Verification (CRITICAL)**
After implementing each section, cross-check with PRD:
```markdown
## ✅ Phase X Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] Cross-check implementation with PRD Section X.Y
- [ ] Verify all fields/endpoints match PRD exactly
- [ ] Confirm behavior matches PRD specifications
```

### 4. **Before Committing**
```bash
# Run tests
pytest backend/tests/

# Run linter
ruff check backend/

# If all pass, commit (local only)
git add .
git commit -m "feat(scope): description"

# DO NOT PUSH unless explicitly requested
```

---

## 📚 PRD Reference Quick Links

### Core Sections:
- **Section 5:** Technical Architecture & Tech Stack
- **Section 7:** Data Flow Diagrams
- **Section 9:** API Specifications (All Endpoints)
- **Section 10:** Data Models (User, Document, Collection, etc.)
- **Section 11:** Technical Implementation Details
- **Section 13:** Security Requirements

### Implementation Guides:
- **Section 11.1:** Project Structure
- **Section 11.2:** Database Setup with Alembic
- **Section 11.3:** Background Worker (arq)
- **Section 11.4:** Milvus & Rate Limiting
- **Section 11.8:** Git Workflow Strategy
- **Section 13.1:** Authentication (JWT)
- **Section 13.7:** Invite-Only Registration

---

## 🔍 Task File Structure

Each phase file follows this structure:

```markdown
# Phase X: Name

**Priority:** Critical/High/Medium
**Estimated Time:** X days
**Dependencies:** Previous phases
**PRD Reference:** Section numbers

---

## ⚠️ GIT REMINDER
[Git rules reminder]

---

## X.1 Section Name
**PRD Reference:** Section Y.Z

### Subsection
- [ ] Task 1
- [ ] Task 2
  - Implementation details
  - PRD reference
  - Testing requirements

---

## ✅ Phase X Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] Cross-check with PRD Section...

Before moving to Phase X+1, verify:
- [ ] Functional requirements
- [ ] Tests passing
- [ ] PRD alignment verified
```

---

## 🧪 Testing Strategy

**PRD Reference:** Section 11.7 (Testing Strategy)

### Test Types:
1. **Unit Tests:** Test individual functions/methods
2. **Integration Tests:** Test API endpoints end-to-end
3. **Security Tests:** Test authentication, authorization, data isolation

### Running Tests:
```bash
# All tests
pytest

# Specific module
pytest backend/tests/test_auth.py

# With coverage
pytest --cov=backend/app

# Verbose
pytest -v
```

---

## 📊 Progress Tracking

Update this section as you complete phases:

- [ ] Phase 0: Setup & Infrastructure
- [ ] Phase 1: Core Models & Database
- [ ] Phase 2: Authentication System
- [ ] Phase 3: Storage Services
- [ ] Phase 4: Document Processing
- [ ] Phase 5: RAG Chat System
- [ ] Phase 6: Email Service
- [ ] Phase 7: Admin Features
- [ ] Phase 8: Testing & QA
- [ ] Phase 9: Deployment & Docker
- [ ] Phase 10: Documentation

**Progress:** 0/10 phases completed (0%)

---

## 🆘 Troubleshooting

### Common Issues:

**1. Database Migration Fails**
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Check Alembic env.py configuration
- See PRD Section 11.2.4

**2. Tests Failing**
- Ensure test database is set up
- Check conftest.py fixtures
- Verify test dependencies installed

**3. Worker Not Processing**
- Check Redis connection
- Verify arq worker is running
- See PRD Section 11.3

**4. Import Errors**
- Verify all `__init__.py` files exist
- Check virtual environment activated
- Run `uv sync` to reinstall dependencies

---

## 📝 Notes for AI Agent

When implementing features:
1. **Always reference PRD** for exact specifications (use it to verify, NOT to add as code comments)
2. **Use SQLModel (NOT SQLAlchemy ORM)** - PRD Section 10
3. **Use AsyncSession from sqlmodel.ext.asyncio.session**
4. **DO NOT add PRD references or section numbers in code comments** - keep code clean
5. **Follow existing patterns** in codebase
6. **Write tests** for all new features
7. **Update task checkboxes** as you complete them
8. **Verify against PRD** before marking phase complete
9. **Never push to remote** unless explicitly requested

### Code Style & Documentation Rules:
- ❌ **NO** PRD section references in code comments
- ❌ **NO** unnecessary comments (unless complex logic requires explanation)
- ✅ **Well-documented code** with consistent patterns across all files
- ✅ **Type hints** for all function signatures
- ✅ **Docstrings** for all public functions/classes (brief, clear purpose)
- ✅ **Consistent naming conventions** (snake_case for functions, PascalCase for classes)
- ✅ **Follow existing patterns** when adding new files
- ✅ **Self-documenting code** with descriptive variable/function names

### Documentation Standards:
```python
# ✅ GOOD - Clear docstring, type hints, self-documenting
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
    # Implementation...

# ❌ BAD - No docstring, unclear names, missing types
def cu(s, e, p, i):
    # PRD Section 10.1 - Create user (DON'T DO THIS!)
    return User(...)
```

### Critical Technical Specifications (Cross-check before implementing):
- **ORM:** SQLModel (NOT SQLAlchemy) - Section 10
- **Embedding Model:** text-embedding-004 (768 dimensions) - Section 5
- **LLM Model:** gemini-2.0-flash-exp - Section 11.2.2
- **Chunk Size:** 1000 characters - Section 5
- **Chunk Overlap:** 200 characters - Section 5
- **Max File Size:** 50MB - Section 3.293
- **Storage Quota:** 1GB default per user - Section 10.1
- **Token Expiry:** Access 1hr, Refresh 7 days - Section 13.1
- **Rate Limit (Chat):** 100 queries/hour - Section 11.4

---

## 🎓 Learning Resources

- FastAPI Docs: https://fastapi.tiangolo.com/
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Milvus Docs: https://milvus.io/docs
- Alembic Docs: https://alembic.sqlalchemy.org/
- Argon2 Docs: https://argon2-cffi.readthedocs.io/
- arq Docs: https://arq-docs.helpmanual.io/

---

**Last Updated:** 2025-01-19  
**Document Version:** 1.0  
**PRD Version:** Referenced from `docs/PRD.md`
