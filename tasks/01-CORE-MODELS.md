# Phase 1: Core Models & Database Layer

**Priority:** Critical  
**Estimated Time:** 2-3 days  
**Dependencies:** Phase 0 (Setup completed)  
**PRD Reference:** Section 10 (Data Models), Section 11.2 (Database Setup)

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
Example: feat(models): add User model
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

## 1.1 SQLModel Models Creation
**IMPORTANT:** Use SQLModel, not SQLAlchemy ORM (PRD Section 10)

### User Model
**PRD Reference:** Section 10.1 (User Model - SQLModel Definition)
- [ ] Create `backend/app/models/user.py`
- [ ] Import: `from sqlmodel import SQLModel, Field`
- [ ] Define `User` class: `class User(SQLModel, table=True)`
- [ ] Add `__tablename__ = "users"`
- [ ] Add fields: user_id (UUID), email, password_hash, role
- [ ] Add storage fields: storage_used_bytes, storage_limit_bytes
- [ ] Add status field with Enum (active, suspended, pending)
- [ ] Add timestamps: created_at, updated_at, last_login_at
- [ ] Add soft delete: is_active boolean
- [ ] Add unique constraint on email
- [ ] Add indexes on email and user_id

### Document Model
**PRD Reference:** Section 10.2 (Document Model), Section 10.1.1 (Document Status State Machine)
- [ ] Create `backend/app/models/document.py`
- [ ] Define `DocumentStatus` enum (PROCESSING, ACTIVE, DELETED, ERROR)
- [ ] Define `Document` class: `class Document(SQLModel, table=True)`
- [ ] Add `__tablename__ = "documents"`
- [ ] Add foreign key to User (user_id)
- [ ] Add foreign key to Collection (collection_id, nullable)
- [ ] Add fields: document_id, filename, file_type, size_bytes, chunks_count
- [ ] Add storage_key for B2 object reference
- [ ] Add metadata JSONB field
- [ ] Add status field with DocumentStatus enum
- [ ] Add error_message for failed processing
- [ ] Add timestamps: uploaded_at, processed_at, deleted_at
- [ ] Add relationship to User and Collection
- [ ] Add indexes on user_id, status, uploaded_at

### Collection Model
**PRD Reference:** Section 10.3 (Collection Model)
- [x] Create `backend/app/models/collection.py`
- [x] Define `Collection` class: `class Collection(SQLModel, table=True)`
- [x] Add `__tablename__ = "collections"`
- [x] Add fields: collection_id, user_id, name, description
- [x] Add foreign key to User
- [x] Add timestamps: created_at, updated_at
- [x] Add relationship to Document (one-to-many)
- [x] Add relationship to User
- [x] Add unique constraint on (user_id, name)

### DocumentChunk Model (CRITICAL - Missing!)
**PRD Reference:** Section 11.1 (Project Structure - models/document_chunk.py)
- [ ] Create `backend/app/models/document_chunk.py`
- [ ] Define `DocumentChunk` class for Milvus metadata tracking
- [ ] Add fields: chunk_id, document_id, user_id, chunk_index
- [ ] Add text field for chunk content
- [ ] Add milvus_id for vector DB reference
- [ ] Add embedding_model field (for migration support - Section 14)
- [ ] Add timestamps: created_at
- [ ] Add foreign key to Document
- [ ] Add index on document_id, milvus_id

### Conversation Model
**PRD Reference:** Section 10.4 (Conversation Model)
- [ ] Create `backend/app/models/conversation.py`
- [ ] Define `Conversation` class: `class Conversation(SQLModel, table=True)`
- [ ] Add `__tablename__ = "conversations"`
- [ ] Add fields: conversation_id, user_id
- [ ] Add messages JSONB field (array of message objects)
- [ ] Add message_count integer (denormalized)
- [ ] Add timestamps: created_at, updated_at
- [ ] Add foreign key to User
- [ ] Add relationship to User
- [ ] Add index on user_id, created_at

### InviteCode Model
**PRD Reference:** Section 10.5 (InviteCode Model), Section 13.7 (Invite-Only Registration)
- [ ] Create `backend/app/models/invite_code.py`
- [ ] Define `InviteCode` class: `class InviteCode(SQLModel, table=True)`
- [ ] Add `__tablename__ = "invite_codes"`
- [ ] Add fields: invite_code_id, code (KB-XXXX-XXXX-XXXX format)
- [ ] Add created_by (admin user_id, nullable)
- [ ] Add expiration: expires_at (nullable)
- [ ] Add usage: max_uses, current_uses
- [ ] Add status enum (active, expired, revoked)
- [ ] Add description field
- [ ] Add created_at timestamp
- [ ] Add unique constraint on code
- [ ] Add index on code for fast lookup

### AdminAuditLog Model
**PRD Reference:** Section 10.6 (AdminAuditLog Model), Section 13.8 (Admin User Management)
- [ ] Create `backend/app/models/admin_audit_log.py`
- [ ] Define `AdminAuditLog` class: `class AdminAuditLog(SQLModel, table=True)`
- [ ] Add `__tablename__ = "admin_audit_logs"`
- [ ] Add fields: audit_id, admin_user_id, action
- [ ] Add target_type, target_id
- [ ] Add details JSONB field
- [ ] Add ip_address field
- [ ] Add timestamp
- [ ] Add indexes on admin_user_id, action, timestamp

---

## 1.2 Pydantic Schemas Creation
**PRD Reference:** Section 11.2.6 (Pydantic Schemas Example)

### User Schemas
- [x] Create `backend/app/schemas/user.py`
- [x] Define `UserRegister` (email, password, invite_code)
- [x] Define `UserLogin` (email, password)
- [x] Define `UserResponse` (exclude password_hash)
- [x] Define `TokenResponse` (access_token, refresh_token, token_type, expires_in)
- [x] Define `UserProfile` (with storage stats)
- [x] Add model_config with from_attributes=True

### Document Schemas
- [x] Create `backend/app/schemas/document.py`
- [x] Define `DocumentUpload` (category, tags, collection_id)
- [x] Define `DocumentResponse` (all public fields)
- [x] Define `DocumentUpdate` (collection_id, tags, category)
- [x] Define `DocumentListResponse` (pagination wrapper)
- [x] Add validation for file types and sizes

### Collection Schemas
- [x] Create `backend/app/schemas/collection.py`
- [x] Define `CollectionCreate` (name, description)
- [x] Define `CollectionUpdate` (name, description)
- [x] Define `CollectionResponse` (with document_count)
- [x] Add name validation (min_length=1, max_length=255)

### Conversation Schemas
- [x] Create `backend/app/schemas/conversation.py`
- [x] Define `Message` (role, content, timestamp, sources)
- [x] Define `ConversationResponse` (full conversation)
- [x] Define `ConversationListItem` (lightweight for listing)
- [x] Add role validation (user|assistant pattern)

### Chat Schemas
- [x] Create `backend/app/schemas/chat.py`
- [x] Define `ChatQuery` (query, conversation_id, top_k)
- [x] Define `ChatResponse` (answer, sources, conversation_id, timestamp)
- [x] Define `SourceCitation` (document_id, chunk_id, text, score)

### Admin Schemas
- [x] Create `backend/app/schemas/admin.py`
- [x] Define `InviteCodeCreate` (max_uses, expires_at, description)
- [x] Define `InviteCodeResponse`
- [x] Define `AuditLogResponse`
- [x] Define `SystemStatsResponse`

---

## 1.3 Database Migration
**PRD Reference:** Section 11.2.4 (Alembic Configuration)

### Alembic Configuration
- [ ] Ensure all models imported in `alembic/env.py`
- [ ] Import User, Document, Collection, Conversation, InviteCode, AdminAuditLog
- [ ] Verify Base.metadata includes all tables

### Create Migration
- [ ] Run `alembic revision --autogenerate -m "Create all core models"`
- [ ] Review generated migration file
- [ ] Check foreign key constraints are correct
- [ ] Check indexes are created
- [ ] Check enum types are created
- [ ] Verify unique constraints

### Apply Migration
- [ ] Run `alembic upgrade head`
- [ ] Connect to database and verify tables exist
- [ ] Check table schemas match models
- [ ] Verify indexes created: `\di` in psql
- [ ] Verify foreign keys: `\d+ documents` in psql

---

## 1.4 Database Session & Dependencies
**PRD Reference:** Section 11.2.3 (Database Session Management)

### Session Management (SQLModel Async)
- [ ] Create `backend/app/db/session.py`
- [ ] Import: `from sqlmodel import create_engine`
- [ ] Import: `from sqlmodel.ext.asyncio.session import AsyncSession, AsyncEngine`
- [ ] Create async engine: `create_async_engine(DATABASE_URL, echo=DEBUG, ...)`
- [ ] Create async session maker: `async_sessionmaker(engine, class_=AsyncSession, ...)`
- [ ] Ensure connection pooling settings
- [ ] Create `get_db()` dependency function for FastAPI
- [ ] Test session creation with `get_db()` dependency

### API Dependencies
- [ ] Create `backend/app/api/dependencies.py`
- [ ] Import `get_db` from db.session
- [ ] Create placeholder for `get_current_user` (will implement in Phase 2)
- [ ] Create placeholder for `get_current_admin` (will implement in Phase 2)

---

## 1.5 Basic CRUD Operations (Database Layer)

### User CRUD (Using SQLModel)
**PRD Reference:** PRD shows SQLModel with AsyncSession usage
- [x] Create `backend/app/services/user_service.py`
- [x] Import: `from sqlmodel import select`
- [x] Import: `from sqlmodel.ext.asyncio.session import AsyncSession`
- [x] Implement `create_user(session: AsyncSession, email, password_hash, invite_code)`
- [x] Implement `get_user_by_id(session: AsyncSession, user_id)` - use `select(User)`
- [x] Implement `get_user_by_email(session: AsyncSession, email)` - use `select(User).where(User.email == email)`
- [x] Implement `update_user_storage(session: AsyncSession, user_id, delta_bytes)`
- [x] Implement `update_user_last_login(session: AsyncSession, user_id)`
- [x] Implement `soft_delete_user(session: AsyncSession, user_id)`

### Document CRUD (Using SQLModel)
- [x] Create `backend/app/services/document_service.py`
- [x] Use SQLModel `select()` for all queries
- [x] Implement `create_document(session: AsyncSession, user_id, filename, file_type, size_bytes, storage_key)`
- [x] Implement `get_document_by_id(session: AsyncSession, document_id)`
- [x] Implement `list_user_documents(session: AsyncSession, user_id, filters, pagination)`
- [x] Implement `update_document_status(session: AsyncSession, document_id, status)`
- [x] Implement `mark_document_as_deleted(session: AsyncSession, document_id)`
- [x] Implement `update_document_metadata(session: AsyncSession, document_id, metadata)`

### Collection CRUD (Using SQLModel)
- [x] Create `backend/app/services/collection_service.py`
- [x] Use SQLModel `select()` for all queries
- [x] Implement `create_collection(session: AsyncSession, user_id, name, description)`
- [x] Implement `list_user_collections(session: AsyncSession, user_id)`
- [x] Implement `get_collection_by_id(session: AsyncSession, collection_id)`
- [x] Implement `update_collection(session: AsyncSession, collection_id, name, description)`
- [x] Implement `delete_collection(session: AsyncSession, collection_id)`

### InviteCode CRUD (Using SQLModel)
- [x] Create `backend/app/services/invite_service.py`
- [x] Use SQLModel `select()` for all queries
- [x] Implement `generate_invite_code(session: AsyncSession, created_by, max_uses, expires_at)`
- [x] Implement `validate_invite_code(session: AsyncSession, code)` (check active, not expired, uses < max)
- [x] Implement `use_invite_code(session: AsyncSession, code)` (increment current_uses)
- [x] Implement `revoke_invite_code(session: AsyncSession, code)`
- [x] Implement `list_invite_codes(session: AsyncSession, filters)`

---

## 1.6 Testing Database Layer

### Unit Tests for Models
- [ ] Create `backend/tests/test_models.py`
- [ ] Test User model creation
- [ ] Test Document status transitions
- [ ] Test Collection relationships
- [ ] Test InviteCode validation logic

### Unit Tests for CRUD Operations
- [ ] Create `backend/tests/test_user_service.py`
- [ ] Test create_user with valid data
- [ ] Test get_user_by_email
- [ ] Test storage quota updates
- [ ] Create `backend/tests/test_document_service.py`
- [ ] Test document creation and status updates
- [ ] Test soft delete behavior
- [ ] Create `backend/tests/test_invite_service.py`
- [ ] Test invite code generation
- [ ] Test invite code validation
- [ ] Test invite code usage increment

### Test Fixtures
- [ ] Create `backend/tests/conftest.py`
- [ ] Add fixture for test database session
- [ ] Add fixture for sample user
- [ ] Add fixture for sample document
- [ ] Add fixture for sample invite code
- [ ] Configure pytest-asyncio

---

## ✅ Phase 1 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check all models with PRD Section 10 (Data Models)**
- [ ] **Verify ALL models use SQLModel (NOT SQLAlchemy ORM)**
- [ ] **Verify User model matches PRD Section 10.1 exactly (SQLModel definition)**
- [ ] **Verify Document model matches PRD Section 10.2 exactly**
- [ ] **Verify Collection model matches PRD Section 10.3 exactly**
- [ ] **Verify Conversation model matches PRD Section 10.4 exactly**
- [ ] **Verify InviteCode model matches PRD Section 10.5 exactly**
- [ ] **Verify AdminAuditLog model matches PRD Section 10.6 exactly**
- [ ] **Check Pydantic schemas follow PRD Section 11.2.6 examples**
- [ ] **Confirm status enums match PRD specifications**
- [ ] **Verify AsyncSession imports from sqlmodel.ext.asyncio.session**

Before moving to Phase 2, verify:
- [ ] All 6 models created (User, Document, Collection, Conversation, InviteCode, AdminAuditLog)
- [ ] All Pydantic schemas created and validated
- [ ] Database migration created and applied successfully
- [ ] All tables visible in database (`\dt` in psql shows 6+ tables)
- [ ] All CRUD services implemented
- [ ] Unit tests pass with `pytest`
- [ ] No linting errors with `ruff check .`
- [ ] Type checking passes with `mypy`
- [ ] Can create a user in database
- [ ] Can create a document in database
- [ ] Can generate and validate invite codes

---

**Next Phase:** [Phase 2: Authentication System](02-AUTHENTICATION.md)
