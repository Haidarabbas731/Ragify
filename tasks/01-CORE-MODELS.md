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
- [x] Create `backend/app/models/user.py`
- [x] Import: `from sqlmodel import SQLModel, Field`
- [x] Define `User` class: `class User(SQLModel, table=True)`
- [x] Add `__tablename__ = "users"`
- [x] Add fields: user_id (UUID), email, password_hash, role
- [x] Add storage fields: storage_used_bytes, storage_limit_bytes
- [x] Add status field with Enum (active, suspended, pending)
- [x] Add timestamps: created_at, updated_at, last_login_at
- [x] Add soft delete: is_active boolean
- [x] Add unique constraint on email
- [x] Add indexes on email and user_id

### Document Model
**PRD Reference:** Section 10.2 (Document Model), Section 10.1.1 (Document Status State Machine)
- [x] Create `backend/app/models/document.py`
- [x] Define `DocumentStatus` enum (PROCESSING, ACTIVE, DELETED, ERROR)
- [x] Define `Document` class: `class Document(SQLModel, table=True)`
- [x] Add `__tablename__ = "documents"`
- [x] Add foreign key to User (user_id)
- [x] Add foreign key to Collection (collection_id, nullable)
- [x] Add fields: document_id, filename, file_type, size_bytes, chunks_count
- [x] Add storage_key for B2 object reference
- [x] Add metadata JSONB field
- [x] Add status field with DocumentStatus enum
- [x] Add error_message for failed processing
- [x] Add timestamps: uploaded_at, processed_at, deleted_at
- [x] Add relationship to User and Collection
- [x] Add indexes on user_id, status, uploaded_at

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

### DocumentChunk Model
**PRD Reference:** Section 10.2 (Chunk Model - Milvus Collection)
- [x] ~~Create `backend/app/models/document_chunk.py`~~ **NOT NEEDED - Chunks stored in Milvus only**
- [x] Document chunks are stored directly in Milvus vector database
- [x] Chunk schema: chunk_id, document_id, user_id, text, embedding (768-dim), chunk_index, metadata
- [x] No PostgreSQL table needed for chunks (Phase 3/4 will implement Milvus service)

### Conversation Model
**PRD Reference:** Section 10.4 (Conversation Model)
- [x] Create `backend/app/models/conversation.py`
- [x] Define `Conversation` class: `class Conversation(SQLModel, table=True)`
- [x] Add `__tablename__ = "conversations"`
- [x] Add fields: conversation_id, user_id
- [x] Add messages JSONB field (array of message objects)
- [x] Add message_count integer (denormalized)
- [x] Add timestamps: created_at, updated_at
- [x] Add foreign key to User
- [x] Add relationship to User
- [x] Add index on user_id, created_at

### InviteCode Model
**PRD Reference:** Section 10.5 (InviteCode Model), Section 13.7 (Invite-Only Registration)
- [x] Create `backend/app/models/invite_code.py`
- [x] Define `InviteCode` class: `class InviteCode(SQLModel, table=True)`
- [x] Add `__tablename__ = "invite_codes"`
- [x] Add fields: invite_code_id, code (KB-XXXX-XXXX-XXXX format)
- [x] Add created_by (admin user_id, nullable)
- [x] Add expiration: expires_at (nullable)
- [x] Add usage: max_uses, current_uses
- [x] Add status enum (active, expired, revoked)
- [x] Add description field
- [x] Add created_at timestamp
- [x] Add unique constraint on code
- [x] Add index on code for fast lookup

### AdminAuditLog Model
**PRD Reference:** Section 10.6 (AdminAuditLog Model), Section 13.8 (Admin User Management)
- [x] Create `backend/app/models/admin_audit_log.py`
- [x] Define `AdminAuditLog` class: `class AdminAuditLog(SQLModel, table=True)`
- [x] Add `__tablename__ = "admin_audit_logs"`
- [x] Add fields: audit_id, admin_user_id, action
- [x] Add target_type, target_id
- [x] Add details JSONB field
- [x] Add ip_address field
- [x] Add timestamp
- [x] Add indexes on admin_user_id, action, timestamp

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
- [x] Ensure all models imported in `alembic/env.py`
- [x] Import User, Document, Collection, Conversation, InviteCode, AdminAuditLog
- [x] Verify Base.metadata includes all tables

### Create Migration
- [x] Run `alembic revision --autogenerate -m "Create all core models"`
- [x] Review generated migration file
- [x] Check foreign key constraints are correct
- [x] Check indexes are created
- [x] Check enum types are created
- [x] Verify unique constraints

### Apply Migration
- [x] Run `alembic upgrade head`
- [x] Connect to database and verify tables exist
- [x] Check table schemas match models
- [x] Verify indexes created: `\di` in psql
- [x] Verify foreign keys: `\d+ documents` in psql

---

## 1.4 Database Session & Dependencies
**PRD Reference:** Section 11.2.3 (Database Session Management)

### Session Management (SQLModel Async)
- [x] Session management already implemented in `backend/app/db/database.py`
- [x] Import: `from sqlmodel import create_engine`
- [x] Import: `from sqlmodel.ext.asyncio.session import AsyncSession, AsyncEngine`
- [x] Create async engine: `create_async_engine(DATABASE_URL, echo=DEBUG, ...)`
- [x] Create async session maker: `async_sessionmaker(engine, class_=AsyncSession, ...)`
- [x] Ensure connection pooling settings
- [x] Create `get_session()` dependency function for FastAPI (in database.py)
- [x] Test session creation with `get_session()` dependency

### API Dependencies
- [x] Create `backend/app/api/dependencies.py`
- [x] Import `get_session` from db.database and create `get_db()` wrapper
- [x] Create placeholder for `get_current_user` *(Implemented in Phase 2)* ✅
- [x] Create placeholder for `get_current_admin` *(Implemented in Phase 2)* ✅

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

### Additional Services (To be implemented in later phases)
**Note:** These services belong in Phase 2-7 but are listed here for reference
- [x] `auth_service.py` - Authentication logic *(Phase 2 - Done)* ✅
- [x] `embedding_service.py` - Embedding generation *(Phase 3 - Done)* ✅
- [x] `milvus_service.py` - Milvus operations *(Phase 3 - Done)* ✅
- [x] `b2_service.py` - Backblaze B2 operations *(Phase 3 - Done)* ✅
- [ ] `chat_service.py` - RAG chat logic (Phase 5)
- [x] `email_service.py` - Email sending via Resend *(Phase 2 - Done)* ✅
- [ ] `admin_service.py` - Admin operations (Phase 7)

---

## 1.6 Testing Database Layer

### Unit Tests for Models
- [x] Create `backend/tests/test_models.py`
- [x] Test User model creation
- [x] Test Document status transitions
- [x] Test Collection relationships
- [x] Test InviteCode validation logic

### Unit Tests for CRUD Operations
- [x] Create `backend/tests/test_user_service.py`
- [x] Test create_user with valid data
- [x] Test get_user_by_email
- [x] Test storage quota updates
- [x] Create `backend/tests/test_document_service.py`
- [x] Test document creation and status updates
- [x] Test soft delete behavior
- [x] Create `backend/tests/test_invite_service.py`
- [x] Test invite code generation
- [x] Test invite code validation
- [x] Test invite code usage increment

### Test Fixtures
- [x] Create `backend/tests/conftest.py`
- [x] Add fixture for test database session
- [x] Add fixture for sample user
- [x] Add fixture for sample document
- [x] Add fixture for sample invite code
- [x] Configure pytest-asyncio

---

## ✅ Phase 1 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [x] **Cross-check all models with PRD Section 10 (Data Models)**
- [x] **Verify ALL models use SQLModel (NOT SQLAlchemy ORM)**
- [x] **Verify User model matches PRD Section 10.1 exactly (SQLModel definition)**
- [x] **Verify Document model matches PRD Section 10.2 exactly**
- [x] **Verify Collection model matches PRD Section 10.3 exactly**
- [x] **Verify Conversation model matches PRD Section 10.4 exactly**
- [x] **Verify InviteCode model matches PRD Section 10.5 exactly**
- [x] **Verify AdminAuditLog model matches PRD Section 10.6 exactly**
- [x] **Check Pydantic schemas follow PRD Section 11.2.6 examples**
- [x] **Confirm status enums match PRD specifications**
- [x] **Verify AsyncSession imports from sqlmodel.ext.asyncio.session**

Before moving to Phase 2, verify:
- [x] All 6 models created (User, Document, Collection, Conversation, InviteCode, AdminAuditLog)
- [x] All Pydantic schemas created and validated
- [x] Database migration created and applied successfully
- [x] All tables visible in database (`\dt` in psql shows 6 tables)
- [x] All CRUD services implemented
- [x] Unit tests pass with `pytest` (14/14 passing)
- [x] No linting errors with `ruff check .`
- [x] Type checking passes (using `ruff` - mypy not needed)
- [x] Can create a user in database
- [x] Can create a document in database
- [x] Can generate and validate invite codes

---

**Next Phase:** [Phase 2: Authentication System](02-AUTHENTICATION.md)
