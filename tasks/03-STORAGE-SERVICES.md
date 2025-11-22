# Phase 3: Storage Services (Backblaze B2 & Milvus)

**Priority:** Critical  
**Estimated Time:** 2-3 days  
**Dependencies:** Phase 1 (Core Models), Phase 2 (Authentication)  
**PRD Reference:** Section 5 (Technical Architecture - Storage), Section 7.1 (Document Upload Flow), Section 11.4 (Milvus Configuration)

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
Example: feat(storage): implement B2 upload service
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

## 3.1 Service Layer Files Setup

**IMPORTANT:** All database operations use SQLModel with AsyncSession (PRD Section 10)

### Storage Service Files
**PRD Reference:** Section 11.1 (Project Structure - services/)
- [ ] Verify all service files from Phase 1-2 exist (user, document, collection, invite, auth)
- [ ] Create `backend/app/services/b2_service.py` (this section)
- [ ] Create `backend/app/services/milvus_service.py` (section 3.2)
- [ ] Create `backend/app/services/embedding_service.py` (section 3.3)

---

## 3.2 Backblaze B2 Service

### B2 Client Setup
**PRD Reference:** Section 5 (Technical Architecture - Backblaze B2)
- [ ] Install `b2sdk` dependency
- [ ] Add B2 credentials to `.env`: B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME
- [ ] Create `backend/app/services/b2_service.py`
- [ ] Initialize B2 client with credentials
- [ ] Implement connection test in health check endpoint
- [ ] Test B2 authentication

### File Upload to B2
**PRD Reference:** Section 7.1 (Document Upload Flow), Section 9.1 (Upload API)
- [ ] Implement `upload_file(file: UploadFile, user_id: str) -> storage_key`
- [ ] Generate unique storage key: `documents/{user_id}/{uuid}-{filename}.{ext}`
- [ ] Upload file to B2 bucket
- [ ] Return storage_key for database reference
- [ ] Handle upload errors gracefully
- [ ] Test file upload with different file types

### File Download from B2
**PRD Reference:** Section 9.5 (Download Original File API)
- [ ] Implement `generate_presigned_url(storage_key, expiration=900) -> str`
- [ ] Generate temporary download URL (15-minute expiry)
- [ ] Use B2 S3-compatible API for pre-signed URLs
- [ ] Return URL for frontend download
- [ ] Test URL generation and expiry

### File Deletion from B2
**PRD Reference:** Section 9.4 (Delete Document API - Soft Delete)
- [ ] Implement `delete_file(storage_key) -> bool`
- [ ] Delete file from B2 bucket
- [ ] Handle "file not found" errors gracefully
- [ ] Test deletion

### Storage Quota Management
**PRD Reference:** Section 10.1 (User Model - storage fields)
- [ ] Implement `check_user_storage_quota(user_id, file_size) -> bool`
- [ ] Query user's `storage_used_bytes` and `storage_limit_bytes`
- [ ] Return False if `storage_used + file_size > storage_limit`
- [ ] Implement `update_user_storage(user_id, delta_bytes)`
- [ ] Increment/decrement `storage_used_bytes` atomically
- [ ] Test quota enforcement

---

## 3.3 Milvus Vector Database Service

### Milvus Client Setup
**PRD Reference:** Section 11.4 (Milvus Configuration)
- [ ] Install `pymilvus` dependency
- [ ] Add Milvus credentials to `.env`: MILVUS_HOST, MILVUS_PORT, MILVUS_TOKEN (for Zilliz Cloud)
- [ ] Create `backend/app/services/milvus_service.py`
- [ ] Initialize Milvus client with connection
- [ ] Test Milvus connection

### Create Collection Schema
**PRD Reference:** Section 10.2 (Chunk Model - Milvus Collection)
- [ ] Define collection name: `knowledge_chunks`
- [ ] Define schema fields:
  - `chunk_id` (VARCHAR, primary key)
  - `document_id` (VARCHAR, indexed)
  - `user_id` (VARCHAR, indexed) - **CRITICAL for data isolation**
  - `text` (VARCHAR)
  - `embedding` (FLOAT_VECTOR, dim=768)
  - `chunk_index` (INT64)
  - `metadata` (JSON) - document_name, page_number, etc.
- [ ] Create collection with schema
- [ ] Create index on `embedding` field (IVF_FLAT or HNSW)
- [ ] Test collection creation

### Insert Embeddings
**PRD Reference:** Section 7.1 (Document Upload Flow - Step 8)
- [ ] Implement `insert_chunks(chunks: List[ChunkData]) -> bool`
- [ ] Prepare data for insertion (chunk_id, document_id, user_id, text, embedding, etc.)
- [ ] Batch insert chunks (100-500 per batch)
- [ ] Flush data to disk
- [ ] Test insertion with sample data

### Vector Search
**PRD Reference:** Section 7.2 (Chat Query Flow - Step 5)
- [ ] Implement `search_similar_chunks(query_embedding, user_id, top_k=5, collection_id=None) -> List[SearchResult]`
- [ ] Build search expression: `user_id == "{user_id}"`
- [ ] Add collection filter if provided: `AND collection_id == "{collection_id}"`
- [ ] Execute vector similarity search
- [ ] Return results with: chunk_id, document_id, text, similarity_score, metadata
- [ ] Test search with sample embeddings

### Delete Chunks by Document
**PRD Reference:** Section 9.4 (Delete Document API - Cleanup Job)
- [ ] Implement `delete_by_document_id(document_id) -> bool`
- [ ] Delete all chunks where `document_id == "{document_id}"`
- [ ] Test deletion

### Delete Chunks by User
**PRD Reference:** Section 9.12 (User Profile API - Delete Account)
- [ ] Implement `delete_by_user_id(user_id) -> bool`
- [ ] Delete all chunks where `user_id == "{user_id}"`
- [ ] Used for account deletion cleanup
- [ ] Test deletion

### Health Check
- [ ] Implement `health_check() -> bool`
- [ ] Check Milvus server connectivity
- [ ] Check collection exists and is loaded
- [ ] Return True if healthy
- [ ] Test health check

---

## 3.4 Google AI Embedding Service

### Google AI Client Setup
**PRD Reference:** Section 5 (Technical Architecture - Google AI)
- [ ] Install `google-generativeai` dependency
- [ ] Add GOOGLE_API_KEY to `.env`
- [ ] Create `backend/app/services/embedding_service.py`
- [ ] Initialize Google AI client with API key
- [ ] Test API connection

### Generate Embeddings
**PRD Reference:** Section 7.1 (Document Upload Flow - Step 7), Section 11.2 (Embedding Strategy)
- [ ] Implement `generate_embedding(text: str) -> List[float]`
- [ ] Use model: `models/text-embedding-004` (768 dimensions)
- [ ] Call Google AI embedding API
- [ ] Return 768-dimensional vector
- [ ] Handle API errors (rate limits, timeouts)
- [ ] Test embedding generation

### Batch Embedding Generation
- [ ] Implement `generate_embeddings_batch(texts: List[str]) -> List[List[float]]`
- [ ] Batch process multiple texts (max 100 per batch)
- [ ] Reduce API call overhead
- [ ] Test batch processing

### Embedding Caching (Optional)
- [ ] Implement Redis caching for frequently queried embeddings
- [ ] Cache key: `embedding:{hash(text)}`
- [ ] TTL: 24 hours
- [ ] Test cache hit/miss

---

## 3.5 Redis Service (Expanded)

### Redis Client
**PRD Reference:** Section 5 (Technical Architecture - Redis)
- [ ] Verify `backend/app/services/redis_service.py` exists
- [ ] Ensure basic get/set/delete operations work

### Session Management
- [ ] Implement `store_session(user_id, session_data, ttl=3600)`
- [ ] Session key: `session:{user_id}:{session_id}`
- [ ] Store session metadata (IP, user agent, login time)
- [ ] Test session storage

### Rate Limiting
**PRD Reference:** Section 11.4 (Rate Limit Hierarchy)
- [ ] Implement `check_rate_limit(key, max_requests, window_seconds) -> bool`
- [ ] Use Redis INCR with EXPIRE
- [ ] Return False if limit exceeded
- [ ] Implement hierarchical rate limits:
  - Document upload: 10 per hour
  - Chat query: 100 per hour
  - Authentication: 5 failed attempts per 15 minutes
- [ ] Test rate limiting

### Cache Operations
- [ ] Implement `cache_get(key) -> Any`
- [ ] Implement `cache_set(key, value, ttl)`
- [ ] Implement `cache_delete(key)`
- [ ] Test caching

---

## 3.6 Testing Storage Services

### B2 Service Tests
- [ ] Create `backend/tests/test_b2_service.py`
- [ ] Test file upload with mock data
- [ ] Test pre-signed URL generation
- [ ] Test file deletion
- [ ] Test storage quota checking

### Milvus Service Tests
- [ ] Create `backend/tests/test_milvus_service.py`
- [ ] Test collection creation
- [ ] Test chunk insertion
- [ ] Test vector search with sample embeddings
- [ ] Test deletion by document_id
- [ ] Test deletion by user_id
- [ ] Test user data isolation (user A cannot see user B's chunks)

### Embedding Service Tests
- [ ] Create `backend/tests/test_embedding_service.py`
- [ ] Test embedding generation with sample text
- [ ] Test batch embedding generation
- [ ] Test embedding dimension (must be 768)
- [ ] Test error handling for API failures

### Redis Service Tests
- [ ] Test rate limiting enforcement
- [ ] Test session storage and retrieval
- [ ] Test cache operations

---

## 3.7 Integration with Health Check

### Update Health Check Endpoint
**PRD Reference:** Section 9.11 (Health Check API)
- [ ] Update `GET /api/v1/health` endpoint
- [ ] Add B2 service health check
- [ ] Add Milvus service health check
- [ ] Add Redis service health check
- [ ] Return service status: `{"b2_storage": "up", "milvus": "up", "redis": "up"}`
- [ ] Test health check returns all services

---

## ✅ Phase 3 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check B2 implementation with PRD Section 5 (Backblaze B2)**
- [ ] **Verify Milvus collection schema matches PRD Section 10.2 (Chunk Model)**
- [ ] **Confirm embedding dimension is 768 (PRD Section 5 - Google text-embedding-004)**
- [ ] **Verify storage quota logic matches PRD Section 10.1 (User storage fields)**
- [ ] **Check rate limit hierarchy matches PRD Section 11.4**
- [ ] **Verify user data isolation in Milvus (user_id filter)**

Before moving to Phase 4, verify:
- [ ] B2 service implemented (upload, download, delete)
- [ ] Milvus service implemented (insert, search, delete)
- [ ] Embedding service implemented (generate embeddings)
- [ ] Redis service expanded (sessions, rate limiting, cache)
- [ ] Storage quota enforcement working
- [ ] All services tested with unit tests
- [ ] Health check endpoint shows all services "up"
- [ ] Can upload file to B2 and get storage_key
- [ ] Can generate embeddings for text
- [ ] Can insert embeddings into Milvus
- [ ] Can search Milvus and get similar chunks
- [ ] User data isolation verified (users cannot see each other's chunks)
- [ ] Rate limiting working
- [ ] All tests passing (`pytest backend/tests/test_*_service.py`)

---

**Next Phase:** [Phase 4: Document Processing Pipeline](04-DOCUMENT-PROCESSING.md)
