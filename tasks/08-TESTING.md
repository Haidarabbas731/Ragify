# Phase 8: Comprehensive Testing & Quality Assurance

**Priority:** Critical  
**Estimated Time:** 3-4 days  
**Dependencies:** All previous phases (1-7)  
**PRD Reference:** Section 11.7 (Testing Strategy)

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
Example: test(e2e): add end-to-end RAG chat flow tests
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

## 8.1 Test Infrastructure Setup

### Pytest Configuration
**PRD Reference:** Section 11.7 (Testing Strategy)
- [ ] Verify `backend/pytest.ini` configuration
- [ ] Configure test database (separate from dev database)
- [ ] Configure pytest-asyncio for async tests
- [ ] Add pytest-cov for coverage reports
- [ ] Test fixtures in `conftest.py`

### Test Database Setup
- [ ] Create `backend/tests/conftest.py` (if not exists)
- [ ] Add fixture: `test_db` - async test database session
- [ ] Add fixture: `test_client` - FastAPI TestClient
- [ ] Add fixture: `test_user` - sample user for testing
- [ ] Add fixture: `test_admin` - sample admin user
- [ ] Add fixture: `test_document` - sample document
- [ ] Add fixture: `test_invite_code` - sample invite code
- [ ] Test fixtures work correctly

### Mock External Services
- [ ] Create mock for B2 service (avoid real uploads in tests)
- [ ] Create mock for Milvus service (or use test collection)
- [ ] Create mock for Google AI embedding service
- [ ] Create mock for Google Gemini LLM service
- [ ] Create mock for Resend email service
- [ ] Test mocks work correctly

---

## 8.2 Unit Tests (Service Layer)

### Model Tests
- [ ] Create `backend/tests/test_models.py` (may exist from Phase 1)
- [ ] Test all model field validations
- [ ] Test model relationships (User → Document, Document → Collection)
- [ ] Test enum constraints (DocumentStatus, UserRole, etc.)
- [ ] Test unique constraints
- [ ] Coverage: 100% of models

### Service Tests
- [ ] Test `user_service.py` - create, get, update, delete users
- [ ] Test `document_service.py` - CRUD operations
- [ ] Test `collection_service.py` - CRUD operations
- [ ] Test `invite_service.py` - generation, validation, usage
- [ ] Test `auth_service.py` - authentication logic
- [ ] Test `b2_service.py` - upload, download, delete (with mocks)
- [ ] Test `milvus_service.py` - insert, search, delete (with mocks)
- [ ] Test `embedding_service.py` - embedding generation (with mocks)
- [ ] Test `llm_service.py` - LLM response generation (with mocks)
- [ ] Test `chat_service.py` - RAG query orchestration
- [ ] Test `email_service.py` - email sending (with mocks)
- [ ] Test `admin_service.py` - admin operations
- [ ] Coverage: >90% of services

### Utility Tests
- [ ] Test `text_extraction.py` - PDF, DOCX, TXT extraction
- [ ] Test `chunking.py` - chunk size, overlap, splitting logic
- [ ] Test `sanitization.py` - input sanitization
- [ ] Coverage: 100% of utilities

---

## 8.3 Integration Tests (API Layer)

### Authentication API Tests
- [ ] Test registration with valid invite code
- [ ] Test registration with invalid/expired invite code
- [ ] Test login with valid credentials
- [ ] Test login with invalid credentials
- [ ] Test token refresh
- [ ] Test logout
- [ ] Test password reset request
- [ ] Test password reset confirmation
- [ ] Test protected endpoint access with/without token

### Document API Tests
- [ ] Test document upload (valid file)
- [ ] Test document upload (invalid file type)
- [ ] Test document upload (file too large)
- [ ] Test document upload (quota exceeded)
- [ ] Test list documents with filters
- [ ] Test get document details
- [ ] Test update document metadata
- [ ] Test delete document (soft delete)
- [ ] Test retry failed document

### Chat API Tests
- [ ] Test chat query with valid knowledge base
- [ ] Test chat query with empty knowledge base
- [ ] Test chat query with collection filter
- [ ] Test chat query returns sources
- [ ] Test conversation creation
- [ ] Test multi-turn conversation
- [ ] Test list conversations
- [ ] Test delete conversation

### Collection API Tests
- [ ] Test create collection
- [ ] Test list user collections
- [ ] Test update collection
- [ ] Test delete collection
- [ ] Test unique constraint (user_id, name)

### Admin API Tests
- [ ] Test admin can list all users
- [ ] Test admin can suspend/activate users
- [ ] Test admin can delete users
- [ ] Test admin can view all documents
- [ ] Test admin can delete any document
- [ ] Test admin can view system stats
- [ ] Test admin can view audit logs
- [ ] Test non-admin gets 403 on admin endpoints

---

## 8.4 End-to-End Tests

### Complete User Journey Test
- [ ] Test: Register → Upload document → Wait for processing → Chat → Get answer
- [ ] Test: Register → Create collection → Upload to collection → Chat with filter
- [ ] Test: Register → Upload → Delete document → Verify cleanup
- [ ] Test: User A cannot see User B's documents/conversations
- [ ] Test: Admin suspend user → User cannot login

### RAG Quality Tests
- [ ] Upload sample PDF with known content
- [ ] Ask questions about the content
- [ ] Verify answers are relevant
- [ ] Verify source citations are correct
- [ ] Test query with no relevant documents
- [ ] Test query with ambiguous content

---

## 8.5 Performance Tests

### Load Testing
- [ ] Test concurrent document uploads (10 users)
- [ ] Test concurrent chat queries (50 users)
- [ ] Measure response time for chat query (<3 seconds target)
- [ ] Measure document processing time
- [ ] Test rate limiting under load

### Database Performance
- [ ] Test query performance with 1000+ documents
- [ ] Test Milvus search performance with 10,000+ chunks
- [ ] Verify indexes are used (explain query plans)
- [ ] Test connection pooling

---

## 8.6 Security Tests

### Authentication Security
- [ ] Test JWT token expiration
- [ ] Test token blocklist prevents reuse
- [ ] Test password hashing (cannot reverse)
- [ ] Test password strength validation
- [ ] Test invite code single-use enforcement

### Authorization Tests
- [ ] Test user data isolation (User A cannot access User B's data)
- [ ] Test admin-only endpoints blocked for regular users
- [ ] Test document ownership verification
- [ ] Test conversation ownership verification

### Input Validation Tests
- [ ] Test SQL injection attempts (should be blocked)
- [ ] Test XSS attempts (should be sanitized)
- [ ] Test path traversal in filenames (should be blocked)
- [ ] Test malicious file uploads (.exe renamed to .pdf)

### Rate Limiting Tests
- [ ] Test IP-based rate limiting (300/min)
- [ ] Test user-based rate limiting (100/min)
- [ ] Test cost-based rate limiting (1000 units/hour)
- [ ] Test password reset rate limiting (3/hour)

---

## 8.7 Error Handling Tests

### Service Failure Tests
- [ ] Test behavior when PostgreSQL is down
- [ ] Test behavior when Redis is down
- [ ] Test behavior when Milvus is down
- [ ] Test behavior when B2 is down
- [ ] Test behavior when Google AI API is down
- [ ] Test behavior when Resend is down
- [ ] Verify graceful degradation

### Edge Case Tests
- [ ] Test empty file upload
- [ ] Test corrupted PDF upload
- [ ] Test encrypted PDF upload
- [ ] Test very large document (50MB)
- [ ] Test document with no extractable text
- [ ] Test chat query with very long text (>1000 chars)

---

## 8.8 Data Migration Tests

### Embedding Model Migration
**PRD Reference:** Section 14 (Embedding Model Migration & Re-indexing)
- [ ] Create `backend/scripts/migrate_embeddings.py`
- [ ] Implement migration logic:
  - Fetch all documents
  - Re-extract text and chunks
  - Generate new embeddings with new model
  - Update Milvus collection
  - Track progress in Redis
- [ ] Test migration with sample data
- [ ] Test rollback mechanism
- [ ] Document migration process

---

## 8.9 Test Coverage & Reporting

### Coverage Analysis
- [ ] Run `pytest --cov=app --cov-report=html`
- [ ] Verify coverage >85% overall
- [ ] Verify coverage >90% for critical paths (auth, chat, document processing)
- [ ] Identify uncovered code
- [ ] Add tests for uncovered code

### Test Reports
- [ ] Generate HTML coverage report
- [ ] Generate JUnit XML report (for CI/CD)
- [ ] Document test results

---

## 8.10 Continuous Integration Setup (Optional)

### GitHub Actions / GitLab CI
- [ ] Create `.github/workflows/test.yml`
- [ ] Run tests on every push to dev branch
- [ ] Run linting (ruff) on every push
- [ ] Run type checking (mypy) on every push
- [ ] Block merge if tests fail
- [ ] Generate coverage badge

---

## ✅ Phase 8 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check test coverage with PRD Section 11.7**
- [ ] **Verify all security tests pass**
- [ ] **Confirm performance targets met (<3s for chat)**
- [ ] **Verify user data isolation in all tests**

Before moving to deployment, verify:
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Test coverage >85%
- [ ] Security tests all pass
- [ ] Performance tests meet targets
- [ ] Rate limiting tests pass
- [ ] Data migration script tested
- [ ] All edge cases covered
- [ ] Error handling tested
- [ ] Can run full test suite: `pytest backend/tests/ -v`
- [ ] No flaky tests (tests pass consistently)

---

**Next Steps:** Deployment preparation (Phase 9 - not in current task list)
