# Phase 4: Document Processing Pipeline

**Priority:** Critical  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 3 (Storage Services)  
**PRD Reference:** Section 7.1 (Document Upload Flow), Section 11.3 (Background Worker - arq), Section 8.1 (Document Management)

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
Example: feat(docs): implement document processing pipeline
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

## 4.1 Utility Files Setup

**IMPORTANT:** All database operations use SQLModel with AsyncSession (PRD Section 10)

### Utility Files
**PRD Reference:** Section 11.1 (Project Structure - utils/)
- [ ] Create `backend/app/utils/text_extraction.py` (this section)
- [ ] Create `backend/app/utils/chunking.py` (section 4.2)
- [ ] Verify `backend/app/utils/sanitization.py` exists from Phase 2
- [ ] Expand sanitization with document-specific validation

---

## 4.2 Text Extraction Utilities

### PDF Text Extraction
**PRD Reference:** Section 7.1 (Document Upload Flow - Step 5)
- [ ] Install `pypdf` dependency (already in pyproject.toml)
- [ ] Implement in `backend/app/utils/text_extraction.py`
- [ ] Install `pypdf` dependency
- [ ] Implement `extract_text_from_pdf(file_path: str) -> str`
- [ ] Handle encrypted PDFs (return error message)
- [ ] Handle corrupted PDFs gracefully
- [ ] Extract text from all pages
- [ ] Test with sample PDF files

### DOCX Text Extraction
- [ ] Install `python-docx` dependency
- [ ] Implement `extract_text_from_docx(file_path: str) -> str`
- [ ] Extract text from paragraphs, tables, headers, footers
- [ ] Handle corrupted DOCX files
- [ ] Test with sample DOCX files

### TXT and MD Extraction
- [ ] Implement `extract_text_from_txt(file_path: str) -> str`
- [ ] Simply read file contents
- [ ] Handle different encodings (UTF-8, Latin-1, etc.)
- [ ] Test with various text files

### File Type Detection
- [ ] Install `python-magic` dependency
- [ ] Implement `detect_file_type(file_path: str) -> str`
- [ ] Verify file type matches extension
- [ ] Prevent malicious file upload (e.g., .exe renamed to .pdf)
- [ ] Test file type detection

### Enhanced Sanitization for Documents
**PRD Reference:** Section 11.1 (utils/sanitization.py expansion)
- [ ] Extend `backend/app/utils/sanitization.py` from Phase 2
- [ ] Implement `sanitize_filename(filename: str) -> str` - remove path traversal chars
- [ ] Implement `validate_file_extension(filename: str, allowed: List[str]) -> bool`
- [ ] Test sanitization with malicious filenames

---

## 4.3 Text Chunking Service

### Recursive Character Text Splitter
**PRD Reference:** Section 7.1 (Document Upload Flow - Step 6), Section 5 (CHUNK_SIZE=1000, CHUNK_OVERLAP=200)
- [ ] Implement in `backend/app/utils/chunking.py`
- [ ] Implement `RecursiveCharacterTextSplitter` class
- [ ] Parameters: chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", " ", ""]
- [ ] Split text recursively by separators
- [ ] Maintain chunk overlap for context continuity
- [ ] Return list of text chunks
- [ ] Test chunking with sample text

### Chunk Metadata
- [ ] Add chunk metadata: chunk_index, start_position, end_position
- [ ] Optionally extract page numbers (for PDF)
- [ ] Optionally detect section headers
- [ ] Test metadata extraction

---

## 4.4 Document Upload Endpoint

### File Upload API
**PRD Reference:** Section 9.1 (Upload Documents API)
- [ ] Create `backend/app/api/v1/documents.py`
- [ ] Implement `POST /api/v1/documents/upload` endpoint
- [ ] Accept `multipart/form-data` with file + optional metadata
- [ ] Require authentication (`get_current_user` dependency)
- [ ] Validate file type (PDF, DOCX, TXT, MD only)
- [ ] Validate file size (max 50MB)
- [ ] Check user storage quota before upload
- [ ] Generate unique filename: `{uuid}-{original_filename}`
- [ ] Upload to B2 and get storage_key
- [ ] Create document record in PostgreSQL (status=PROCESSING)
- [ ] Update user storage_used_bytes
- [ ] Enqueue background processing job (arq)
- [ ] Return document_id and status
- [ ] Test upload endpoint

### Concurrent Upload Handling
**PRD Reference:** Section 8.1 (Concurrent Upload Handling)
- [ ] Support up to 10 concurrent file uploads per user
- [ ] Each file gets independent task ID
- [ ] Frontend polls for status updates
- [ ] Test concurrent uploads

---

## 4.5 Background Processing Worker (arq)

### Worker Configuration
**PRD Reference:** Section 11.3 (Background Worker Configuration)
- [ ] Create `backend/app/tasks/worker.py` (main worker setup)
- [ ] Configure arq WorkerSettings
- [ ] Set max_jobs=10, job_timeout=3600 (1 hour)
- [ ] Set max_tries=3, retry_jobs=True
- [ ] Configure Redis connection from settings
- [ ] Test worker startup: `arq app.tasks.worker.WorkerSettings`

### Document Processing Task
**PRD Reference:** Section 7.1 (Document Upload Flow - Steps 5-9)
- [ ] Create `backend/app/tasks/document_processing.py`
- [ ] Implement `async def process_document(ctx, document_id: str, user_id: str)`
- [ ] Step 1: Get document from database
- [ ] Step 2: Download file from B2 (or read from temp storage)
- [ ] Step 3: Extract text based on file_type
- [ ] Step 4: Split text into chunks (chunk_size=1000, overlap=200)
- [ ] Step 5: Generate embeddings for all chunks (batch processing)
- [ ] Step 6: Insert chunks + embeddings into Milvus
- [ ] Step 7: Update document status to ACTIVE
- [ ] Step 8: Update document chunks_count
- [ ] Handle errors: set status=ERROR, store error_message
- [ ] Test processing task

### Error Handling
**PRD Reference:** Section 8.4 (Error Handling & User Experience)
- [ ] Catch text extraction errors (corrupted files, encrypted PDFs)
- [ ] Catch embedding API errors (rate limits, timeouts)
- [ ] Catch Milvus errors (connection, storage full)
- [ ] Store user-friendly error messages in document.error_message
- [ ] Log detailed errors for debugging
- [ ] Test error scenarios

### Orphaned Job Recovery
**PRD Reference:** Section 11.3.5 (Worker Failure Recovery)
- [ ] Create `backend/app/tasks/cleanup.py`
- [ ] Implement `async def recover_orphaned_jobs(ctx)`
- [ ] Find documents with status=PROCESSING and uploaded_at > 30 minutes ago
- [ ] Re-enqueue processing jobs for orphaned documents
- [ ] Schedule as cron job (every 15 minutes)
- [ ] Test orphaned job recovery

---

## 4.6 Model Migration & Re-indexing Support

### Embedding Model Migration
**PRD Reference:** Section 14 (Embedding Model Migration & Re-indexing), MISSING_TASKS_ANALYSIS.md
- [ ] Add `embedding_model` field to DocumentChunk model (if not already added in Phase 1)
- [ ] Store model identifier (e.g., "text-embedding-004") with each chunk
- [ ] Design migration script structure in `backend/scripts/migrate_embeddings.py` (implementation in Phase 8)
- [ ] Plan re-indexing strategy:
  - Background job to regenerate embeddings for all chunks
  - Update Milvus collection with new embeddings
  - Track migration progress in Redis
- [ ] Document migration process in code comments

---

## 4.7 Document Status Polling

### Get Document Status
**PRD Reference:** Section 9.10 (Document Metadata API)
- [ ] Implement `GET /api/v1/documents/{document_id}` endpoint
- [ ] Require authentication
- [ ] Verify document ownership (document.user_id == current_user.user_id)
- [ ] Return document with current status (PROCESSING, ACTIVE, ERROR)
- [ ] Return error_message if status=ERROR
- [ ] Test status retrieval

### Frontend Polling Strategy
**PRD Reference:** Section 9.1 (Checking Processing Status)
- [ ] Document polling strategy in API docs
- [ ] Frontend should poll every 5 seconds
- [ ] Max 60 attempts (5 minutes timeout)
- [ ] Stop polling when status changes to ACTIVE or ERROR
- [ ] Test polling behavior

---

## 4.8 Document Management Endpoints

### List Documents
**PRD Reference:** Section 9.3 (List Documents API)
- [ ] Implement `GET /api/v1/documents` endpoint
- [ ] Query parameters: page, limit, collection_id, status, sort, order
- [ ] Filter by user_id (data isolation)
- [ ] Exclude soft-deleted documents (status != DELETED)
- [ ] Return paginated response
- [ ] Test listing with filters

### Get Single Document
**PRD Reference:** Section 9.10 (Document Metadata API)
- [ ] Already implemented in 4.5
- [ ] Verify ownership check
- [ ] Test access control

### Update Document Metadata
**PRD Reference:** Section 9.10 (Update Document Metadata)
- [ ] Implement `PUT /api/v1/documents/{document_id}` endpoint
- [ ] Allow updating: collection_id, tags, category
- [ ] Verify ownership
- [ ] Update document.metadata JSONB field
- [ ] Test metadata updates

### Delete Document (Soft Delete)
**PRD Reference:** Section 9.4 (Delete Document API - Soft Delete)
- [ ] Implement `DELETE /api/v1/documents/{document_id}` endpoint
- [ ] Verify ownership
- [ ] Set status=DELETED, deleted_at=now()
- [ ] Update user storage_used_bytes (subtract file size immediately)
- [ ] Enqueue background cleanup job
- [ ] Return success immediately (don't wait for cleanup)
- [ ] Test soft delete

### Retry Failed Document
**PRD Reference:** Section 9.10 (Retry Failed Document Processing)
- [ ] Implement `POST /api/v1/documents/{document_id}/retry` endpoint
- [ ] Verify document status=ERROR
- [ ] Set status=PROCESSING
- [ ] Clear error_message
- [ ] Re-enqueue processing job
- [ ] Test retry functionality

---

## 4.9 Document Cleanup Jobs

### Cleanup Deleted Documents
**PRD Reference:** Section 9.4 (Soft Delete - Background Cleanup)
- [ ] Create `async def cleanup_deleted_document(ctx, document_id: str)` in cleanup.py
- [ ] Get document metadata from PostgreSQL
- [ ] Delete chunks from Milvus (by document_id)
- [ ] Delete file from B2 (storage_key)
- [ ] Hard delete document from PostgreSQL
- [ ] Handle errors with retry logic
- [ ] Test cleanup job

### Scheduled Cleanup
**PRD Reference:** Section 9.4 (Scheduled Cleanup)
- [ ] Implement `async def cleanup_all_deleted_documents(ctx)`
- [ ] Find all documents with status=DELETED and deleted_at > 1 hour ago
- [ ] Enqueue cleanup_deleted_document for each
- [ ] Schedule as cron job (every 6 hours)
- [ ] Test scheduled cleanup

---

## 4.10 Testing Document Processing

### Unit Tests
- [ ] Create `backend/tests/test_text_extraction.py`
- [ ] Test PDF extraction
- [ ] Test DOCX extraction
- [ ] Test TXT extraction
- [ ] Test error handling for corrupted files

### Chunking Tests
- [ ] Create `backend/tests/test_chunking.py`
- [ ] Test chunk size and overlap
- [ ] Test recursive splitting
- [ ] Test metadata extraction

### Integration Tests
- [ ] Create `backend/tests/test_document_api.py`
- [ ] Test file upload endpoint
- [ ] Test storage quota enforcement
- [ ] Test concurrent uploads
- [ ] Test document listing with filters
- [ ] Test soft delete
- [ ] Test retry failed document

### Worker Tests
- [ ] Test document processing task end-to-end
- [ ] Test error handling (corrupted file)
- [ ] Test orphaned job recovery
- [ ] Test cleanup jobs

---

## ✅ Phase 4 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check document upload flow with PRD Section 7.1**
- [ ] **Verify chunk size (1000) and overlap (200) match PRD Section 5**
- [ ] **Confirm file size limit (50MB) matches PRD Section 8.1**
- [ ] **Verify supported file types match PRD (PDF, DOCX, TXT, MD)**
- [ ] **Check status state machine matches PRD Section 10.1.1**
- [ ] **Verify soft delete pattern matches PRD Section 9.4**
- [ ] **Confirm arq worker config matches PRD Section 11.3**

Before moving to Phase 5, verify:
- [ ] Document upload endpoint working
- [ ] Text extraction working for all file types
- [ ] Chunking working with correct size/overlap
- [ ] Background processing working (arq worker)
- [ ] Embeddings generated and stored in Milvus
- [ ] Document status updates correctly (PROCESSING → ACTIVE)
- [ ] Error handling working (corrupted files)
- [ ] Soft delete working
- [ ] Cleanup jobs working
- [ ] Retry failed document working
- [ ] Storage quota enforcement working
- [ ] All tests passing (`pytest backend/tests/test_document*.py`)
- [ ] Can upload a PDF and see it processed
- [ ] Can list documents
- [ ] Can delete document

---

**Next Phase:** [Phase 5: RAG Chat System](05-RAG-CHAT.md)
