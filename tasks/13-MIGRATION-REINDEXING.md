# Phase 13: Model Migration & Re-Indexing

**Priority:** Low (Post-MVP)
**Estimated Time:** 2-3 days
**Dependencies:** Phase 4 (Document Processing), Phase 9 (Deployment)
**PRD Reference:** Section 14 (Model Migration & Re-Indexing)

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
Example: feat(migration): add embedding model migration script
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

## 13.1 Migration Overview

**PRD Reference:** Section 14.1 (The Re-Indexing Problem)

### Problem Statement
When switching to a new embedding model (e.g., `text-embedding-004` → `text-embedding-005`):
- Different vector dimensions (768 → 1024)
- Different semantic spaces (incompatible)
- Cannot search across different embedding models
- Requires full re-processing of all documents

### Solution: Backblaze B2 as Source of Truth
**PRD Reference:** Section 14.1 (Why B2 Storage Solves This)

- [x] B2 stores original uploaded files (Phase 4 implementation)
- [ ] Migration script fetches files from B2
- [ ] Re-extract text from original files
- [ ] Re-chunk with same/updated settings
- [ ] Generate new embeddings with new model
- [ ] Insert into new Milvus collection
- [ ] Atomic switchover to new collection

**Key Benefit:** No user re-upload required, fully automated migration.

---

## 13.2 Migration Architecture

**PRD Reference:** Section 14.2 (Migration Architecture)

### 6 Key Components

#### 1. Backblaze B2 Storage (Already exists)
- [ ] Verify B2 stores original files with metadata
- [ ] Verify files organized by: `{user_id}/{document_id}/{filename}`
- [ ] Verify metadata includes: `user_id`, `document_id`, `collection_id`, `file_type`

#### 2. New Milvus Collection
**File:** `backend/app/services/milvus_service.py`

- [ ] Add method to create new collection with different schema
- [ ] Support different embedding dimensions (768, 1024, etc.)
- [ ] Collection naming convention: `kb_embeddings_v2`, `kb_embeddings_v3`
- [ ] Preserve same index configuration (HNSW, cosine)

**Example:**
```python
async def create_migration_collection(
    self,
    collection_name: str,
    embedding_dim: int = 1024
) -> None:
    """
    Create a new Milvus collection for migration.

    Args:
        collection_name: Name of new collection (e.g., 'kb_embeddings_v2')
        embedding_dim: Dimension of new embedding model
    """
    pass
```

#### 3. Migration Worker (arq background task)
**File:** `backend/app/tasks/migration_tasks.py` (NEW)

- [ ] Create `migration_tasks.py` in `app/tasks/`
- [ ] Add `migrate_user_documents` task (per-user migration)
- [ ] Add `migrate_single_document` task (per-document migration)
- [ ] Add progress tracking in Redis
- [ ] Add error handling and retry logic (3 retries)
- [ ] Log migration progress to database

**Task Signature:**
```python
async def migrate_user_documents(
    ctx: dict,
    user_id: str,
    old_collection: str,
    new_collection: str,
    new_embedding_model: str
) -> dict:
    """
    Migrate all documents for a single user.

    Args:
        ctx: arq context
        user_id: User to migrate documents for
        old_collection: Current Milvus collection
        new_collection: New Milvus collection
        new_embedding_model: New embedding model name

    Returns:
        Migration statistics (success, failed, total)
    """
    pass
```

#### 4. Migration Service
**File:** `backend/app/services/migration_service.py` (NEW)

- [ ] Create `migration_service.py` in `app/services/`
- [ ] Add `fetch_document_from_b2()` method
- [ ] Add `re_extract_text()` method (reuse existing extractors)
- [ ] Add `re_chunk_text()` method (reuse chunking logic)
- [ ] Add `generate_new_embeddings()` method (use new model)
- [ ] Add `insert_to_new_collection()` method
- [ ] Add `verify_migration()` method (compare counts)

**Core Methods:**
```python
class MigrationService:
    """
    Service for migrating documents to new embedding models.
    """

    async def migrate_document(
        self,
        document_id: str,
        new_collection: str,
        new_embedding_model: str
    ) -> bool:
        """
        Migrate a single document to new embedding model.

        Steps:
        1. Fetch document metadata from PostgreSQL
        2. Download original file from B2
        3. Re-extract text (PDF, DOCX, TXT)
        4. Re-chunk text (same chunk_size, overlap)
        5. Generate new embeddings
        6. Insert to new Milvus collection
        7. Update document metadata (embedding_model, collection)

        Args:
            document_id: Document to migrate
            new_collection: New Milvus collection name
            new_embedding_model: New embedding model name

        Returns:
            True if migration successful, False otherwise
        """
        pass
```

#### 5. Admin API Endpoints
**File:** `backend/app/api/v1/admin.py` (NEW)

- [ ] Create `admin.py` in `app/api/v1/`
- [ ] Add `POST /api/v1/admin/migration/start` endpoint
- [ ] Add `GET /api/v1/admin/migration/status` endpoint
- [ ] Add `POST /api/v1/admin/migration/cancel` endpoint
- [ ] Add `POST /api/v1/admin/migration/rollback` endpoint
- [ ] Require admin role for all endpoints
- [ ] Add rate limiting (1 migration per 5 minutes)

**Endpoint Examples:**
```python
@router.post("/migration/start")
async def start_migration(
    migration_config: MigrationConfig,
    current_admin: User = Depends(require_admin)
) -> MigrationResponse:
    """
    Start embedding model migration.

    Admin only. Triggers background migration for all users.
    """
    pass

@router.get("/migration/status")
async def get_migration_status(
    migration_id: str,
    current_admin: User = Depends(require_admin)
) -> MigrationStatusResponse:
    """
    Get migration progress status.

    Returns: total, completed, failed, estimated time remaining.
    """
    pass
```

#### 6. Migration Metadata Table
**File:** `backend/app/models/migration.py` (NEW)

- [ ] Create `Migration` model in `app/models/migration.py`
- [ ] Add Alembic migration to create `migrations` table
- [ ] Track: migration_id, status, old_collection, new_collection, old_model, new_model
- [ ] Track: start_time, end_time, total_documents, completed, failed
- [ ] Track: created_by (admin user_id)

**Migration Model:**
```python
class Migration(SQLModel, table=True):
    """
    Track embedding model migrations.
    """
    __tablename__ = "migrations"

    migration_id: str = Field(primary_key=True)
    status: str  # 'pending', 'running', 'completed', 'failed', 'cancelled'
    old_collection: str
    new_collection: str
    old_embedding_model: str
    new_embedding_model: str

    total_documents: int
    completed_documents: int
    failed_documents: int

    start_time: datetime
    end_time: datetime | None
    created_by: str  # admin user_id

    error_message: str | None
```

---

## 13.3 Migration Flow

**PRD Reference:** Section 14.3 (Migration Flow Diagram)

### Step-by-Step Migration Process

#### Step 1: Admin Triggers Migration
- [ ] Admin calls `POST /api/v1/admin/migration/start`
- [ ] System validates new embedding model is available
- [ ] Create new Milvus collection (`kb_embeddings_v2`)
- [ ] Create migration record in database (`status='pending'`)
- [ ] Enqueue migration tasks for all users

#### Step 2: Background Migration (arq)
- [ ] For each user:
  - [ ] Fetch all documents from PostgreSQL
  - [ ] For each document:
    - [ ] Fetch metadata (document_id, file_path, user_id)
    - [ ] Download original file from B2
    - [ ] Re-extract text (use existing extractors)
    - [ ] Re-chunk text (same chunk_size, chunk_overlap)
    - [ ] Generate new embeddings (new model, new dimensions)
    - [ ] Insert chunks to new Milvus collection
    - [ ] Update progress counter in Redis
    - [ ] Log success/failure in database

#### Step 3: Verification
- [ ] Compare document counts (PostgreSQL vs Milvus new collection)
- [ ] Verify embedding dimensions match new model
- [ ] Sample test searches in new collection
- [ ] Check for missing documents

#### Step 4: Atomic Switchover
- [ ] Update application configuration (point to new collection)
- [ ] Update all document records (`embedding_model`, `milvus_collection`)
- [ ] Mark migration as `status='completed'`
- [ ] Keep old collection for 7 days (rollback window)

#### Step 5: Cleanup (After 7 days)
- [ ] Drop old Milvus collection
- [ ] Archive migration logs
- [ ] Send completion notification to admin

---

## 13.4 Migration Script Implementation

**File:** `backend/app/services/migration_service.py`

### Core Migration Logic

```python
class MigrationService:
    """
    Service for embedding model migrations.
    """

    def __init__(
        self,
        db: AsyncSession,
        milvus: MilvusService,
        storage: StorageService,
        embedding: EmbeddingService,
        redis: Redis
    ):
        self.db = db
        self.milvus = milvus
        self.storage = storage
        self.embedding = embedding
        self.redis = redis

    async def migrate_document(
        self,
        document_id: str,
        new_collection: str,
        new_embedding_model: str
    ) -> bool:
        """
        Migrate a single document to new embedding model.
        """
        try:
            # 1. Fetch document metadata
            doc = await self._get_document(document_id)

            # 2. Download original file from B2
            file_content = await self.storage.download_file(
                f"{doc.user_id}/{doc.document_id}/{doc.filename}"
            )

            # 3. Re-extract text
            text = await self._extract_text(file_content, doc.file_type)

            # 4. Re-chunk text
            chunks = self._chunk_text(text, chunk_size=1000, overlap=200)

            # 5. Generate new embeddings
            embeddings = await self.embedding.generate_embeddings(
                chunks, model=new_embedding_model
            )

            # 6. Insert to new Milvus collection
            await self.milvus.insert_embeddings(
                collection_name=new_collection,
                embeddings=embeddings,
                metadata=[{"document_id": doc.document_id, "user_id": doc.user_id}] * len(chunks)
            )

            # 7. Update document metadata
            await self._update_document_collection(
                document_id, new_collection, new_embedding_model
            )

            return True

        except Exception as e:
            logger.error(f"Migration failed for {document_id}: {e}")
            return False
```

### Tasks to Implement

- [ ] Create `MigrationService` class
- [ ] Implement `migrate_document()` method
- [ ] Implement `_extract_text()` method (reuse extractors)
- [ ] Implement `_chunk_text()` method (reuse chunking)
- [ ] Add error handling and retries
- [ ] Add progress tracking in Redis
- [ ] Add migration logging to database

---

## 13.5 Admin API Implementation

**File:** `backend/app/api/v1/admin.py`

### Admin Endpoints

```python
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.post("/migration/start")
async def start_migration(
    config: MigrationConfig,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
) -> MigrationResponse:
    """
    Start embedding model migration.

    Admin only. Enqueues migration tasks for all users.
    """
    # 1. Validate new embedding model
    # 2. Create new Milvus collection
    # 3. Create migration record
    # 4. Enqueue migration tasks
    # 5. Return migration_id
    pass

@router.get("/migration/status/{migration_id}")
async def get_migration_status(
    migration_id: str,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
) -> MigrationStatusResponse:
    """
    Get migration progress.

    Returns: total, completed, failed, estimated time.
    """
    pass
```

### Tasks to Implement

- [ ] Create `admin.py` router
- [ ] Implement `start_migration()` endpoint
- [ ] Implement `get_migration_status()` endpoint
- [ ] Implement `cancel_migration()` endpoint
- [ ] Implement `rollback_migration()` endpoint
- [ ] Add admin role validation (`require_admin` dependency)
- [ ] Add rate limiting (1 migration per 5 minutes)
- [ ] Add request validation (Pydantic schemas)

---

## 13.6 Migration Monitoring & Progress Tracking

### Redis Progress Tracking

**Key:** `migration:{migration_id}:progress`

- [ ] Store progress in Redis hash
- [ ] Track: `total`, `completed`, `failed`, `current_user`
- [ ] Update every document processed
- [ ] Expire after 7 days

**Example:**
```python
await redis.hset(
    f"migration:{migration_id}:progress",
    mapping={
        "total": total_docs,
        "completed": completed_docs,
        "failed": failed_docs,
        "current_user": user_id,
        "last_updated": datetime.utcnow().isoformat()
    }
)
```

### Database Migration Logs

**Table:** `migration_logs`

- [ ] Create `MigrationLog` model
- [ ] Log each document migration attempt
- [ ] Track: migration_id, document_id, user_id, status, error_message
- [ ] Add Alembic migration for table creation

---

## 13.7 Rollback Procedures

### Rollback Strategy

- [ ] Keep old Milvus collection for 7 days
- [ ] Implement `POST /api/v1/admin/migration/rollback` endpoint
- [ ] Restore old collection reference in config
- [ ] Revert document metadata (embedding_model, collection)
- [ ] Mark migration as `status='rolled_back'`

### Rollback Implementation

```python
@router.post("/migration/rollback/{migration_id}")
async def rollback_migration(
    migration_id: str,
    current_admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_session)
) -> dict:
    """
    Rollback a migration to previous embedding model.

    Only works within 7 days of migration completion.
    """
    # 1. Fetch migration record
    # 2. Verify rollback window (< 7 days)
    # 3. Restore old collection reference
    # 4. Update all document records
    # 5. Mark migration as 'rolled_back'
    pass
```

---

## 13.8 Testing Migration

### Migration Testing Strategy

- [ ] Create test migration script
- [ ] Test with small dataset (10 documents)
- [ ] Verify text extraction
- [ ] Verify chunking consistency
- [ ] Verify embedding generation
- [ ] Verify Milvus insertion
- [ ] Verify search functionality in new collection
- [ ] Test rollback procedure

### Test Files to Create

**File:** `backend/tests/test_migration.py`

- [ ] Test `MigrationService.migrate_document()`
- [ ] Test migration task enqueueing
- [ ] Test progress tracking
- [ ] Test error handling and retries
- [ ] Test admin API endpoints
- [ ] Test rollback procedure

---

## 13.9 Migration Configuration

### Environment Variables

**File:** `backend/.env.example`

- [ ] Add `MIGRATION_BATCH_SIZE=100` (documents per batch)
- [ ] Add `MIGRATION_RETRY_ATTEMPTS=3`
- [ ] Add `MIGRATION_ROLLBACK_WINDOW_DAYS=7`
- [ ] Add `MIGRATION_WORKER_CONCURRENCY=5` (parallel workers)

### Migration Config Schema

**File:** `backend/app/schemas/migration.py` (NEW)

```python
from pydantic import BaseModel

class MigrationConfig(BaseModel):
    """
    Configuration for embedding model migration.
    """
    new_embedding_model: str  # e.g., 'text-embedding-005'
    new_collection_name: str  # e.g., 'kb_embeddings_v2'
    batch_size: int = 100
    retry_attempts: int = 3

class MigrationResponse(BaseModel):
    """
    Response after starting migration.
    """
    migration_id: str
    status: str
    estimated_time: str
    total_documents: int

class MigrationStatusResponse(BaseModel):
    """
    Migration progress status.
    """
    migration_id: str
    status: str
    total_documents: int
    completed_documents: int
    failed_documents: int
    progress_percentage: float
    estimated_time_remaining: str
```

- [ ] Create `migration.py` schemas
- [ ] Add validation for embedding model names
- [ ] Add validation for collection names

---

## ✅ Phase 13 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check migration architecture with PRD Section 14**
- [ ] **Verify B2 storage is source of truth** (no user re-upload required)
- [ ] **Confirm atomic switchover strategy** (zero downtime)
- [ ] **Test migration on staging environment** (before production)

Before marking Phase 13 complete:
- [ ] `MigrationService` implemented with all core methods
- [ ] `migrate_user_documents` arq task implemented
- [ ] Admin API endpoints created (`/admin/migration/*`)
- [ ] `Migration` model created with Alembic migration
- [ ] Progress tracking in Redis implemented
- [ ] Rollback procedure implemented and tested
- [ ] Migration logs stored in database
- [ ] Test migration script created and tested
- [ ] Documentation for migration process added
- [ ] Environment variables added to `.env.example`
- [ ] All tests passing: `uv run pytest tests/test_migration.py`
- [ ] Linting passing: `uv run ruff check .`

**Migration Readiness:** ⬜ Not Started / ⬜ In Progress / ⬜ Ready for Testing / ⬜ Production Ready

---

**Note:** This phase is **Post-MVP**. Implement only when:
1. MVP is live and stable
2. Google releases a new/better embedding model
3. Current embeddings are significantly outdated
4. Performance improvements justify re-indexing effort

---

**Next Phase:** Phase 14 - Monitoring & Observability
