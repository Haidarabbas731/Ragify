# Missing Tasks Analysis (PRD vs Current Tasks)

Generated: 2025-11-19

## Missing from Phase 0 (00-SETUP.md)

### According to PRD Section 11.1 (Project Structure):

**Files that should be created but are NOT in tasks:**

1. ✅ `app/api/exceptions.py` - **NOW CREATED** (custom exception handlers)
2. ❌ `app/api/dependencies.py` - Shared dependencies (get_db, get_current_user)
3. ❌ `app/middleware/security_headers.py` - Security headers middleware
4. ❌ `app/middleware/rate_limit.py` - Rate limiting middleware (PRD Section 11.4)
5. ❌ `app/middleware/size_limit.py` - Request size limiting
6. ❌ `app/utils/text_extraction.py` - PDF/DOCX text extraction
7. ❌ `app/utils/chunking.py` - Text chunking utilities
8. ❌ `app/utils/sanitization.py` - Input sanitization

### Database Files (PRD says different structure):

**PRD specifies:**
- `app/db/base.py` - SQLAlchemy Base
- `app/db/session.py` - Database session management
- `app/db/init_db.py` - Database initialization

**Current implementation:**
- `app/db/database.py` - Combined all in one file

**Status:** ✅ OK (we consolidated, which is fine)

---

## Missing from Phase 1 (01-CORE-MODELS.md)

### Models Missing (PRD Section 11.1):

1. ❌ `app/models/document_chunk.py` - Document chunk model (for Milvus metadata)
   - **IMPORTANT:** Not in current tasks but in PRD!

### Services Missing (PRD Section 11.1):

1. ❌ `app/services/auth_service.py` - Authentication logic
2. ❌ `app/services/embedding_service.py` - Embedding generation
3. ❌ `app/services/milvus_service.py` - Milvus operations
4. ❌ `app/services/b2_service.py` - Backblaze B2 operations
5. ❌ `app/services/chat_service.py` - RAG chat logic
6. ❌ `app/services/email_service.py` - Email sending via Resend
7. ❌ `app/services/admin_service.py` - Admin operations

**Note:** Current Phase 1 only has:
- ✅ user_service.py
- ✅ document_service.py
- ✅ collection_service.py
- ✅ invite_service.py

---

## Missing Task Files

### Based on PRD Section 11, we should have these phases:

1. ✅ Phase 0: Setup & Infrastructure
2. ✅ Phase 1: Core Models & Database
3. ✅ Phase 2: Authentication System (exists)
4. ✅ Phase 3: Storage Services (exists)
5. ✅ Phase 4: Document Processing (exists)
6. ✅ Phase 5: RAG Chat System (exists)
7. ❌ **Phase 6: Email Service** (MISSING - PRD mentions it)
8. ❌ **Phase 7: Admin Features** (MISSING - PRD mentions it)
9. ❌ **Phase 8: Testing & QA** (MISSING - PRD Section 11.7)
10. ❌ **Phase 9: Deployment** (IMPLIED but not explicit in PRD)
11. ❌ **Phase 10: Middleware & Security** (Rate limiting, security headers)

**Note:** tasks/README.md mentions Phases 6-10 but files don't exist!

---

## Incorrect/Extra Tasks

### Phase 1 has items that belong elsewhere:

1. `API Dependencies` section - Should be in Phase 2 (Authentication)
2. Database migration - Should be done AFTER models are complete

---

## PRD Section 11 Coverage

### ✅ Completed:
- 11.1 Project Structure (mostly - missing middleware/utils)
- 11.2.1 Dependencies (pyproject.toml) ✅
- 11.2.2 Database Configuration ✅
- 11.2.3 Database Session Management ✅
- 11.5 Logging & Observability ✅ **NOW FIXED**
- 11.5 Exception Handling ✅ **NOW FIXED**

### ❌ Missing:
- 11.2.4 Alembic Configuration (partially - migration not created)
- 11.2.5 SQLAlchemy Models Example (document_chunk missing!)
- 11.3 Background Worker Configuration (arq) - Not in any phase!
- 11.4 Milvus Configuration - Not in setup!
- 11.4 Rate Limit Hierarchy & Coordination - Not created!
- 11.7 Testing Strategy (pytest) - No test tasks!
- 11.8 Development Workflow - Partially done

---

## Recommendations

### Immediate Actions:

1. **Add missing model:** `document_chunk.py` to Phase 1
2. **Create Phase 6:** Email Service (06-EMAIL-SERVICE.md)
3. **Create Phase 7:** Admin Features (07-ADMIN-FEATURES.md)
4. **Create Phase 8:** Testing & QA (08-TESTING.md)
5. **Create Phase 9:** Deployment (09-DEPLOYMENT.md)
6. **Update Phase 0:** Add middleware and utils file creation tasks

### File Creation Priority:

**HIGH (Should be in early phases):**
- `app/api/dependencies.py` - Phase 2
- `app/models/document_chunk.py` - Phase 1
- `app/middleware/rate_limit.py` - Phase 0 or Phase 2
- `app/tasks/worker.py` - Phase 4 (Document Processing needs it)

**MEDIUM (Later phases):**
- `app/services/auth_service.py` - Phase 2
- `app/services/embedding_service.py` - Phase 4
- `app/services/milvus_service.py` - Phase 3 or 4
- `app/services/b2_service.py` - Phase 3
- `app/services/chat_service.py` - Phase 5
- `app/services/email_service.py` - Phase 6
- `app/services/admin_service.py` - Phase 7

**LOW (Utilities):**
- `app/utils/text_extraction.py` - Phase 4
- `app/utils/chunking.py` - Phase 4
- `app/utils/sanitization.py` - Phase 2 or 4
- `app/middleware/security_headers.py` - Phase 0 or 8
- `app/middleware/size_limit.py` - Phase 0 or 8

---

## Summary

**Total Missing Tasks:** ~25-30 items
**Missing Files:** ~18 files
**Missing Phases:** 4 phase files (06, 07, 08, 09)

**Priority:** Review and update task files to match PRD exactly before continuing implementation.
