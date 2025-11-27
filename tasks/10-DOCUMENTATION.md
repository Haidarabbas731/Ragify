# Phase 10: Documentation & Developer Guides

**Priority:** High (before production)
**Estimated Time:** 1-2 days
**Dependencies:** Phase 9 (Deployment completed)
**PRD Reference:** Section 21.1 (Service Layer Documentation), Section 21.2 (Deployment & DevOps Guide)

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
Example: docs: add comprehensive API documentation
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

## 10.1 API Documentation

**PRD Reference:** FastAPI automatic OpenAPI documentation

### OpenAPI/Swagger Documentation
**File:** `backend/main.py`

- [x] Verify FastAPI automatic docs are enabled (default)
- [ ] Enhance API title and description
- [ ] Add version information
- [ ] Add contact information
- [ ] Add license information
- [ ] Group endpoints by tags
- [ ] Add comprehensive endpoint descriptions
- [ ] Add example request/response bodies

**Enhanced OpenAPI Metadata:**
```python
# backend/main.py
from fastapi import FastAPI

app = FastAPI(
    title="AI Knowledge Base API",
    description="""
    A Retrieval-Augmented Generation (RAG) system for intelligent document search and chat.

    ## Features
    - Document upload and processing (PDF, DOCX, TXT, MD)
    - Vector-based semantic search
    - Chat with your documents using Google Gemini
    - Collection management for organized knowledge
    - Invite-only user registration
    - Admin panel for system management

    ## Authentication
    All protected endpoints require a Bearer token in the Authorization header.
    """,
    version="1.0.0",
    contact={
        "name": "AI Knowledge Base Support",
        "email": "support@example.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    },
    docs_url="/docs",
    redoc_url="/redoc"
)
```

### Endpoint Documentation Standards
- [ ] Add detailed docstrings to all route functions
- [ ] Document all request parameters
- [ ] Document all response models
- [ ] Add example values for request/response
- [ ] Document error responses (400, 401, 403, 404, 500)
- [ ] Add security requirements per endpoint

**Example Endpoint Documentation:**
```python
@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=201,
    summary="Upload a document",
    description="""
    Upload a document for processing and indexing.

    **Supported formats:** PDF, DOCX, TXT, MD
    **Max file size:** 50MB
    **Rate limit:** 10 uploads per hour

    The document will be:
    1. Uploaded to Backblaze B2
    2. Queued for background processing
    3. Text extracted and chunked
    4. Embedded using Google text-embedding-004
    5. Indexed in Milvus vector database
    """,
    responses={
        201: {"description": "Document uploaded successfully"},
        400: {"description": "Invalid file format or file too large"},
        401: {"description": "Not authenticated"},
        413: {"description": "File too large"},
        429: {"description": "Rate limit exceeded"}
    }
)
async def upload_document(...):
    ...
```

---

## 10.2 Developer Onboarding Guide

**File:** `docs/DEVELOPER_GUIDE.md`

### Create Developer Documentation
- [ ] Create `docs/DEVELOPER_GUIDE.md`
- [ ] Document system architecture
- [ ] Document project structure
- [ ] Document technology stack
- [ ] Document setup instructions
- [ ] Document development workflow
- [ ] Document coding standards
- [ ] Document common tasks

**Guide Sections:**
```markdown
# Developer Guide

## Table of Contents
1. System Architecture
2. Technology Stack
3. Getting Started
4. Project Structure
5. Development Workflow
6. Coding Standards
7. Testing Guide
8. Common Tasks
9. Troubleshooting

## System Architecture
[Architecture diagram and description]

## Technology Stack
- **Backend:** FastAPI, SQLModel, PostgreSQL
- **Vector DB:** Milvus (Zilliz Cloud)
- **Storage:** Backblaze B2
- **LLM:** Google Gemini Pro
- **Embeddings:** Google text-embedding-004
- **Queue:** arq (Redis)
- **Cache:** Redis

## Getting Started
[Step-by-step setup instructions]

## Project Structure
backend/
├── app/
│   ├── api/           # API routes
│   ├── core/          # Configuration
│   ├── db/            # Database
│   ├── middleware/    # Middleware
│   ├── models/        # SQLModel models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic
│   ├── tasks/         # Background tasks
│   └── utils/         # Utilities
├── tests/             # Test suite
└── migrations/        # Alembic migrations

## Development Workflow
[Git workflow, branching strategy, PR process]

## Coding Standards
[PEP 8, type hints, docstrings, naming conventions]

## Testing Guide
[How to write and run tests]

## Common Tasks
[Adding new endpoints, migrations, services, etc.]

## Troubleshooting
[Common issues and solutions]
```

---

## 10.3 Deployment Guide

**File:** `docs/DEPLOYMENT.md`

**PRD Reference:** Section 21.2 (Deployment & DevOps Guide)

### Create Deployment Documentation
- [ ] Create `docs/DEPLOYMENT.md`
- [ ] Document production deployment steps
- [ ] Document staging environment setup
- [ ] Document environment variable configuration
- [ ] Document database migration procedures
- [ ] Document SSL/TLS certificate setup
- [ ] Document reverse proxy configuration
- [ ] Document monitoring setup
- [ ] Document backup procedures
- [ ] Document disaster recovery procedures

**Deployment Guide Sections:**
```markdown
# Deployment Guide

## Table of Contents
1. Prerequisites
2. Environment Setup
3. Database Configuration
4. Application Deployment
5. SSL/TLS Configuration
6. Monitoring & Logging
7. Backup & Recovery
8. Rollback Procedures
9. Troubleshooting

## Prerequisites
- Docker & Docker Compose installed
- Domain name configured (optional)
- Cloud service accounts (Aiven, Zilliz, B2, Resend)
- Environment variables prepared

## Environment Setup
[Step-by-step environment configuration]

## Database Configuration
[PostgreSQL setup, migrations, connection pooling]

## Application Deployment
[Docker deployment, multi-container orchestration]

## SSL/TLS Configuration
[Let's Encrypt, certbot, automatic renewal]

## Monitoring & Logging
[Health checks, uptime monitoring, error tracking]

## Backup & Recovery
[Automated backups, restore procedures, disaster recovery]

## Rollback Procedures
[How to rollback deployments, database migrations]

## Troubleshooting
[Common deployment issues and solutions]
```

---

## 10.4 Architecture Documentation

**File:** `docs/ARCHITECTURE.md`

### Create Architecture Documentation
- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Document system overview
- [ ] Create architecture diagrams
- [ ] Document data flow
- [ ] Document authentication flow
- [ ] Document document processing pipeline
- [ ] Document RAG chat flow
- [ ] Document background task architecture
- [ ] Document database schema
- [ ] Document API design decisions

**Architecture Diagram (ASCII):**
```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────┐
│          FastAPI Backend                 │
│  ┌────────────┐    ┌──────────────┐    │
│  │ API Routes │───▶│  Middleware  │    │
│  └────────────┘    │ (Auth, Rate) │    │
│         │          └──────────────┘    │
│         ▼                               │
│  ┌──────────────────────────────┐      │
│  │      Service Layer           │      │
│  │  ┌───────┐  ┌──────────┐    │      │
│  │  │ Auth  │  │ Document │    │      │
│  │  │ Chat  │  │ Storage  │    │      │
│  │  └───────┘  └──────────┘    │      │
│  └──────────────────────────────┘      │
└────┬────────────────┬────────────────┬─┘
     │                │                │
     ▼                ▼                ▼
┌─────────┐    ┌───────────┐    ┌──────────┐
│ PostgreSQL│    │  Milvus   │    │  B2      │
│ (Aiven)  │    │ (Zilliz)  │    │(Backblaze)│
└─────────┘    └───────────┘    └──────────┘
     │
     ▼
┌──────────┐
│  Redis   │
│ (Queue)  │
└────┬─────┘
     │
     ▼
┌───────────────┐
│  arq Worker   │
│ (Background)  │
└───────────────┘
```

---

## 10.5 Service Layer Documentation

**PRD Reference:** Section 21.1 (Service Layer Documentation)

### Document All Services
- [ ] Document `AuthService` - authentication and authorization
- [ ] Document `UserService` - user management
- [ ] Document `DocumentService` - document CRUD operations
- [ ] Document `CollectionService` - collection management
- [ ] Document `ConversationService` - conversation management
- [ ] Document `ChatService` - RAG query orchestration
- [ ] Document `B2Service` - object storage interface
- [ ] Document `MilvusService` - vector database interface
- [ ] Document `EmbeddingService` - text embedding generation
- [ ] Document `LLMService` - LLM interaction
- [ ] Document `EmailService` - email sending
- [ ] Document `AdminService` - admin operations
- [ ] Document `InviteService` - invite code management

**Service Documentation Template:**
```python
"""
Service for [purpose].

This service handles [what it does] and provides methods for:
- [operation 1]
- [operation 2]
- [operation 3]

Usage:
    from app.services.example_service import ExampleService

    result = await ExampleService.do_something(session, param1, param2)

Dependencies:
    - [dependency 1]
    - [dependency 2]

Notes:
    - [important note 1]
    - [important note 2]
"""
```

---

## 10.6 API Usage Examples

**File:** `docs/API_EXAMPLES.md`

### Create API Usage Guide
- [ ] Create `docs/API_EXAMPLES.md`
- [ ] Add authentication examples (register, login, refresh)
- [ ] Add document upload examples
- [ ] Add document management examples
- [ ] Add chat query examples
- [ ] Add collection management examples
- [ ] Add conversation management examples
- [ ] Add admin API examples
- [ ] Add error handling examples
- [ ] Add rate limit handling examples

**Example Documentation:**
```markdown
# API Usage Examples

## Authentication

### Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongP@ssw0rd",
    "invite_code": "KB-XXXX-XXXX-XXXX"
  }'
```

Response:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "user",
  "storage_used_bytes": 0,
  "storage_quota_bytes": 1073741824
}
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongP@ssw0rd"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "Bearer"
}
```

## Document Management

### Upload Document
```bash
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "collection_id=550e8400-e29b-41d4-a716-446655440001"
```

[Continue with more examples...]
```

---

## 10.7 Testing Documentation

**File:** `docs/TESTING.md`

### Create Testing Guide
- [ ] Create `docs/TESTING.md`
- [ ] Document test structure
- [ ] Document how to run tests
- [ ] Document test coverage requirements
- [ ] Document unit test examples
- [ ] Document integration test examples
- [ ] Document E2E test examples
- [ ] Document mocking strategies
- [ ] Document test database setup

**Testing Guide Sections:**
```markdown
# Testing Guide

## Overview
This project uses pytest for all testing with 60% overall coverage.

## Running Tests

### All Tests
```bash
cd backend
uv run pytest
```

### Specific Test File
```bash
uv run pytest tests/test_auth_service.py
```

### With Coverage
```bash
uv run pytest --cov=app --cov-report=html
```

## Test Structure
tests/
├── test_models.py         # Model tests
├── test_*_service.py      # Service layer tests
├── test_api_*.py          # API integration tests
├── e2e/                   # End-to-end tests
└── conftest.py            # Shared fixtures

## Writing Tests
[Guidelines for writing good tests]

## Test Coverage
- Overall: 60%
- Critical services: 100%
- Target: 85%

[Continue with test examples...]
```

---

## 10.8 Database Schema Documentation

**File:** `docs/DATABASE.md`

### Create Database Documentation
- [ ] Create `docs/DATABASE.md`
- [ ] Document all database tables
- [ ] Document relationships
- [ ] Document indexes
- [ ] Document constraints
- [ ] Create ER diagram
- [ ] Document migration procedures
- [ ] Document common queries

**Database Schema Example:**
```markdown
# Database Schema

## Tables

### users
Primary table for user accounts and authentication.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| user_id | UUID | No | gen_random_uuid() | Primary key |
| email | VARCHAR | No | - | Unique email |
| password_hash | TEXT | No | - | Argon2 hash |
| role | VARCHAR(20) | No | 'user' | user/admin |
| storage_used_bytes | BIGINT | No | 0 | Used storage |
| storage_quota_bytes | BIGINT | No | 1073741824 | Storage limit (1GB) |
| is_active | BOOLEAN | No | true | Account status |
| created_at | TIMESTAMP | No | now() | Creation time |

**Indexes:**
- PRIMARY KEY (user_id)
- UNIQUE INDEX (email)

**Relationships:**
- One-to-many with documents
- One-to-many with collections
- One-to-many with conversations

[Continue with other tables...]
```

---

## 10.9 Environment Variables Documentation

**File:** `docs/CONFIGURATION.md`

### Create Configuration Guide
- [ ] Create `docs/CONFIGURATION.md`
- [ ] Document all environment variables
- [ ] Document required vs optional variables
- [ ] Document default values
- [ ] Document security considerations
- [ ] Document service-specific configuration
- [ ] Add examples for each environment (dev, staging, prod)

**Configuration Guide:**
```markdown
# Configuration Guide

## Required Environment Variables

### Google AI API
```bash
GOOGLE_API_KEY=your_api_key
```
Get from: https://makersuite.google.com/app/apikey

### Database (PostgreSQL)
```bash
POSTGRES_URI=postgresql://user:pass@host:port/db
```
Get from: https://console.aiven.io/

[Continue with all variables...]

## Optional Variables
[Document optional configuration]

## Security Best Practices
- Never commit .env files
- Rotate secrets regularly
- Use different credentials per environment
- Enable SSL/TLS for all connections

## Environment-Specific Configurations
[Dev, staging, production differences]
```

---

## 10.10 Troubleshooting Guide

**File:** `docs/TROUBLESHOOTING.md`

### Create Troubleshooting Documentation
- [ ] Create `docs/TROUBLESHOOTING.md`
- [ ] Document common errors and solutions
- [ ] Document debugging tips
- [ ] Document performance issues
- [ ] Document deployment issues
- [ ] Document service connectivity issues
- [ ] Add FAQ section

**Troubleshooting Guide:**
```markdown
# Troubleshooting Guide

## Common Errors

### "Document stuck in PROCESSING status"
**Cause:** arq worker not running or crashed
**Solution:**
1. Check worker status: `docker ps | grep worker`
2. Check worker logs: `docker logs ai-kb-worker`
3. Restart worker: `docker restart ai-kb-worker`

### "Rate limit exceeded"
**Cause:** Too many requests in time window
**Solution:**
- Wait for rate limit to reset (shown in response headers)
- Check X-RateLimit-Reset header for reset time
- Implement exponential backoff in client

[Continue with more troubleshooting scenarios...]

## Debugging Tips
[How to debug common issues]

## FAQ
[Frequently asked questions]
```

---

## ✅ Phase 10 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check with PRD Section 21.1** (Service documentation)
- [ ] **Cross-check with PRD Section 21.2** (Deployment guide)
- [ ] **Verify all endpoints documented** (OpenAPI/Swagger)
- [ ] **Verify developer onboarding is complete** (setup to deployment)

Before moving to next phase, verify:
- [ ] API documentation is comprehensive (Swagger/ReDoc)
- [ ] Developer guide covers setup and development workflow
- [ ] Deployment guide covers production deployment
- [ ] Architecture diagrams are clear and accurate
- [ ] All services have docstring documentation
- [ ] API usage examples are provided
- [ ] Testing guide is complete
- [ ] Database schema is documented
- [ ] Configuration guide covers all env vars
- [ ] Troubleshooting guide addresses common issues
- [ ] All documentation files are in `docs/` directory
- [ ] Documentation is reviewed for accuracy
- [ ] Links between docs are working
- [ ] Code examples are tested and working

**Documentation Completeness:** ⬜ Incomplete / ⬜ Complete

---

**Next Phase:** Phase 12 - Frontend Development (React + Vite)
