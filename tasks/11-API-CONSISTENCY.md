# Phase 11: API Consistency - Request & Response Models

**Priority:** High
**Estimated Time:** 8-12 hours
**Dependencies:** All previous phases (affects all API endpoints)
**PRD Reference:** Section 11.1 (Project Structure), Section 13 (API Specifications)

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
Example: feat(api): add response models and UUID validation to all endpoints
```

---

## Overview

### Current Issues Found (39 Endpoints Audited):
1. ❌ **20 endpoints missing response_model** → Swagger docs incomplete
2. ❌ **26 UUID parameters without validation** → Security risk
3. ❌ **12 endpoints using manual query param validation** → Code duplication
4. ❌ **Query parameters as individual params** → Should use request schema models
5. ❌ **Inconsistent request/response patterns** across endpoints

### Goals:
- ✅ Add **response_model** to ALL endpoints (proper Swagger documentation)
- ✅ Add **request schemas** for query parameters (consistent patterns)
- ✅ Add **ONE reusable UUID validator** (used everywhere)
- ✅ Validate all UUID path/query/form parameters (26 locations)
- ✅ Create consistent patterns across all 39 endpoints

---

## 📊 Status Update (Comprehensive Audit - 47 Endpoints Total)

### ✅ What's Already Done:

**Request BODY Schemas (POST/PUT/PATCH):**
- ✅ All endpoints properly use Pydantic BaseModel schemas
- ✅ Existing schemas: `UserRegister`, `UserLogin`, `ChatQuery`, `CollectionCreate`, `CollectionUpdate`, `BatchDeleteRequest`, `InviteCodeCreate`, `SuspendUserRequest`, `PasswordResetRequest`, `PasswordResetConfirm`, `LogoutRequest`
- ✅ **No work needed here - all POST/PUT/PATCH endpoints have request body schemas**

**Response Models:**
- ✅ **Phase 1 Complete**: 17 admin endpoints + 2 main app endpoints (19/20 done)
- ✅ All auth, collections, conversations, documents endpoints already had response models
- ✅ Total: 46/47 endpoints have response_model decorators

### ⚠️ What Needs Work:

**Response Models:**
- ✅ **ALL COMPLETE**: All 47 endpoints have response_model decorators (Phase 4 complete)

**Query Parameter REQUEST Schemas:**
- ✅ **ALL COMPLETE**: All 6 endpoints refactored to use Pydantic schemas (Phase 3 complete)
  1. ✅ GET /conversations (uses `ConversationListParams`)
  2. ✅ GET /documents (uses `DocumentListParams`)
  3. ✅ GET /admin/users (uses `AdminUserListParams`)
  4. ✅ GET /admin/documents (uses `AdminDocumentListParams`)
  5. ✅ GET /admin/audit-logs (uses `AuditLogListParams`)
  6. ✅ GET /admin/invite-codes (uses `InviteCodeListParams`)

**UUID Validation:**
- ✅ **ALL COMPLETE**: UUID validation added to 20+ parameters (Phase 2 complete)
  - ✅ Reusable `validate_uuid()` utility created
  - ✅ Applied to path, query, form, and body fields across all endpoints
  - ⚠️ **Note:** `document_id` intentionally excluded (8-char format for Milvus compatibility)

---

## 11.1 Create Common Response Schemas ✅ COMPLETED

### Common Response Schemas
**File:** `backend/app/schemas/common.py` (NEW FILE)

- [x] Create file `backend/app/schemas/common.py`
- [x] Implement `MessageResponse` schema
  ```python
  class MessageResponse(BaseModel):
      message: str
  ```
- [x] Implement `HealthCheckResponse` schema
  ```python
  class HealthCheckResponse(BaseModel):
      status: str
      services: dict[str, str]
      app_info: dict[str, str]
      arq_worker: dict[str, Any]
  ```
- [x] Implement `RootResponse` schema
  ```python
  class RootResponse(BaseModel):
      message: str
      docs: str
      health: str
  ```
- [x] Add proper docstrings and Field descriptions

---

## 11.2 Create Admin Response Schemas ✅ COMPLETED

### Admin Response Schemas
**File:** `backend/app/schemas/admin.py` (UPDATE - add to existing file)

- [x] Implement `UsersListResponse` - Admin user list with pagination
  ```python
  class UsersListResponse(BaseModel):
      users: list[User]
      total: int
      page: int
      limit: int
      pages: int
  ```
- [x] Implement `UserDetailsResponse` - Detailed user info with stats
  ```python
  class UserDetailsResponse(BaseModel):
      user_id: str
      email: str
      role: str
      status: str
      storage_used_bytes: int
      storage_limit_bytes: int
      document_count: int
      conversation_count: int
      collection_count: int
      created_at: datetime
      last_login_at: datetime | None
  ```
- [x] Implement `SuspendUserResponse`
  ```python
  class SuspendUserResponse(BaseModel):
      message: str
      reason: str
  ```
- [x] Implement `AdminDocumentsListResponse`
  ```python
  class AdminDocumentsListResponse(BaseModel):
      documents: list[dict]  # Each dict has document + user_email
      total: int
      page: int
      limit: int
      pages: int
  ```
- [x] Implement `DeleteDocumentResponse`
  ```python
  class DeleteDocumentResponse(BaseModel):
      status: str
      message: str
      document_id: str
      errors: list[str] | None
  ```
- [x] Implement `CleanupDocumentsResponse`
  ```python
  class CleanupDocumentsResponse(BaseModel):
      status: str
      message: str
      deleted_count: int
      total_documents: int
      errors: list[str] | None
  ```
- [x] Implement `CleanupAllResponse`
  ```python
  class CleanupAllResponse(BaseModel):
      status: str
      message: str
      deleted_count: int
      milvus_cleaned: bool
      b2_files_deleted: int
      errors: list[str] | None
  ```
- [x] Implement `AuditLogsListResponse`
  ```python
  class AuditLogsListResponse(BaseModel):
      logs: list[AuditLogResponse]
      total: int
      page: int
      limit: int
      pages: int
  ```

---

## 11.3 Create Query Parameter Request Schemas (6 Schemas)

**Purpose:** Replace inline query parameters with Pydantic schemas for better validation, documentation, and consistency.

**Approach:** Add schemas directly to their respective schema files (not a separate params.py file).

---

### 11.3.1 ConversationListParams

**File:** `backend/app/schemas/conversation.py` (ADD to existing file)
**Used by:** `GET /conversations` (conversations.py:21)

- [ ] Add `ConversationListParams` schema to conversation.py:
  ```python
  class ConversationListParams(BaseModel):
      """Query parameters for listing conversations."""

      limit: int = Field(
          default=50,
          ge=1,
          le=100,
          description="Number of conversations to return"
      )
      offset: int = Field(
          default=0,
          ge=0,
          description="Number of conversations to skip"
      )
  ```

**Current Implementation (inline):**
```python
async def list_conversations(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    ...
)
```

**Target Implementation (schema):**
```python
async def list_conversations(
    params: ConversationListParams = Depends(),
    ...
):
    # Access as: params.limit, params.offset
```

---

### 11.3.2 DocumentListParams

**File:** `backend/app/schemas/document.py` (ADD to existing file)
**Used by:** `GET /documents` (documents.py:213)

- [ ] Add `DocumentListParams` schema to document.py:
  ```python
  class DocumentListParams(BaseModel):
      """Query parameters for listing user documents."""

      page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      collection_id: str | None = Field(
          default=None,
          description="Filter by collection UUID"
      )
      status_filter: str | None = Field(
          default=None,
          description="Filter by status (processing, active, error, deleted)"
      )
  ```

**Current Implementation (inline):**
```python
async def list_documents(
    page: int = 1,
    limit: int = 50,
    collection_id: str | None = None,
    status_filter: str | None = None,
    ...
)
```

**Target Implementation (schema):**
```python
async def list_documents(
    params: DocumentListParams = Depends(),
    ...
):
    # Access as: params.page, params.limit, params.collection_id, params.status_filter
```

---

### 11.3.3 AdminUserListParams

**File:** `backend/app/schemas/admin.py` (ADD to existing file)
**Used by:** `GET /admin/users` (admin/users.py:32)

- [ ] Add `AdminUserListParams` schema to admin.py:
  ```python
  class AdminUserListParams(BaseModel):
      """Query parameters for admin user list endpoint."""

      page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      status_filter: str | None = Field(
          default=None,
          description="Filter by status (active, suspended, pending)"
      )
      role: str | None = Field(
          default=None,
          description="Filter by role (user, admin)"
      )
      sort_by: str = Field(
          default="created_at",
          description="Sort field (created_at, email, storage_used_bytes, last_login_at)"
      )
      order: str = Field(
          default="desc",
          description="Sort order (asc, desc)"
      )
  ```

**Current Implementation (inline):**
```python
async def list_users(
    page: int = 1,
    limit: int = 50,
    status_filter: str | None = None,
    role: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
    ...
)
```

---

### 11.3.4 AdminDocumentListParams

**File:** `backend/app/schemas/admin.py` (ADD to existing file)
**Used by:** `GET /admin/documents` (admin/documents.py:26)

- [ ] Add `AdminDocumentListParams` schema to admin.py:
  ```python
  class AdminDocumentListParams(BaseModel):
      """Query parameters for admin document list endpoint."""

      page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      user_id: str | None = Field(
          default=None,
          description="Filter by specific user UUID"
      )
      status_filter: str | None = Field(
          default=None,
          description="Filter by status (processing, active, error, deleted)"
      )
      sort_by: str = Field(
          default="uploaded_at",
          description="Sort field (uploaded_at, file_size_bytes, filename)"
      )
      order: str = Field(
          default="desc",
          description="Sort order (asc, desc)"
      )
  ```

**Current Implementation (inline):**
```python
async def list_all_documents(
    page: int = 1,
    limit: int = 50,
    user_id: str | None = None,
    status_filter: str | None = None,
    sort_by: str = "uploaded_at",
    order: str = "desc",
    ...
)
```

---

### 11.3.5 AuditLogListParams

**File:** `backend/app/schemas/admin.py` (ADD to existing file)
**Used by:** `GET /admin/audit-logs` (admin/audit_logs.py:19)

- [ ] Add `AuditLogListParams` schema to admin.py:
  ```python
  class AuditLogListParams(BaseModel):
      """Query parameters for admin audit log list endpoint."""

      page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      admin_user_id: str | None = Field(
          default=None,
          description="Filter by admin user UUID who performed action"
      )
      action: str | None = Field(
          default=None,
          description="Filter by action type (SUSPEND_USER, ACTIVATE_USER, DELETE_USER, etc.)"
      )
      target_type: str | None = Field(
          default=None,
          description="Filter by target type (user, document, invite_code)"
      )
      start_date: datetime | None = Field(
          default=None,
          description="Filter from date (ISO format)"
      )
      end_date: datetime | None = Field(
          default=None,
          description="Filter to date (ISO format)"
      )
  ```

**Current Implementation (inline):**
```python
async def get_audit_logs(
    page: int = 1,
    limit: int = 50,
    admin_user_id: str | None = None,
    action: str | None = None,
    target_type: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    ...
)
```

---

### 11.3.6 InviteCodeListParams

**File:** `backend/app/schemas/admin.py` (ADD to existing file)
**Used by:** `GET /admin/invite-codes` (admin/invite_codes.py:41)

- [ ] Add `InviteCodeListParams` schema to admin.py:
  ```python
  class InviteCodeListParams(BaseModel):
      """Query parameters for admin invite code list endpoint."""

      status_filter: str | None = Field(
          default=None,
          description="Filter by status (active, expired, revoked)"
      )
      limit: int = Field(
          default=50,
          ge=1,
          le=100,
          description="Maximum number of results"
      )
      offset: int = Field(
          default=0,
          ge=0,
          description="Pagination offset"
      )
  ```

**Current Implementation (inline):**
```python
async def get_invite_codes(
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    ...
)
```

---

**Summary:**
- 1 schema in `conversation.py`
- 1 schema in `document.py`
- 4 schemas in `admin.py`
- **Total: 6 query parameter schemas**

---

## 11.4 Create UUID Validator Utility

### UUID Validation Helper
**File:** `backend/app/utils/validators.py` (NEW FILE)

- [ ] Create file `backend/app/utils/validators.py`
- [ ] Implement `validate_uuid(uuid_string, param_name)` function
  ```python
  def validate_uuid(uuid_string: str, param_name: str = "ID") -> str:
      """
      Validate if a string is a valid UUID format.

      Args:
          uuid_string: The string to validate
          param_name: Name of the parameter for error message

      Returns:
          str: The validated UUID string

      Raises:
          HTTPException: 400 if invalid UUID format
      """
      try:
          UUID(uuid_string)
          return uuid_string
      except (ValueError, AttributeError, TypeError):
          raise HTTPException(
              status_code=status.HTTP_400_BAD_REQUEST,
              detail=f"Invalid UUID format for {param_name}: {uuid_string}. "
                     f"Expected format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'",
          )
  ```
- [ ] Add proper imports (UUID, HTTPException, status)
- [ ] Add docstring with examples

---

## 11.5 Phase 1 - Add Response Models to Endpoints

### Main App Endpoints (2)
**File:** `backend/main.py`

- [x] Line 98: GET /api/v1/health → Add `response_model=HealthCheckResponse`
- [x] Line 201: GET / → Add `response_model=RootResponse`

### Auth Endpoints (3)
**File:** `backend/app/api/v1/auth.py`

- [x] Line 123: POST /auth/logout → Add `response_model=MessageResponse`
- [x] Line 184: POST /auth/password-reset/request → Add `response_model=MessageResponse`
- [x] Line 228: POST /auth/password-reset/confirm → Add `response_model=MessageResponse`

### Admin Users Endpoints (6)
**File:** `backend/app/api/v1/admin/users.py`

- [x] Line 25: GET /admin/users → Add `response_model=UsersListResponse`
- [x] Line 83: GET /admin/users/{user_id} → Add `response_model=UserDetailsResponse`
- [x] Line 113: POST /admin/users/{user_id}/suspend → Add `response_model=SuspendUserResponse`
- [x] Line 160: POST /admin/users/{user_id}/activate → Add `response_model=MessageResponse`
- [x] Line 197: DELETE /admin/users/{user_id} → Add `response_model=MessageResponse`
- [x] Line 244: GET /admin/stats → Add `response_model=SystemStatsResponse` (already exists in schemas/admin.py!)

### Admin Documents Endpoints (4)
**File:** `backend/app/api/v1/admin/documents.py`

- [x] Line 20: GET /admin/documents → Add `response_model=AdminDocumentsListResponse`
- [x] Line 115: DELETE /admin/documents/{document_id} → Add `response_model=DeleteDocumentResponse`
- [x] Line 185: DELETE /admin/users/{user_id}/documents → Add `response_model=CleanupDocumentsResponse`
- [x] Line 270: DELETE /admin/documents/cleanup-all → Add `response_model=CleanupAllResponse`

### Admin Audit Logs Endpoints (1)
**File:** `backend/app/api/v1/admin/audit_logs.py`

- [x] Line 18: GET /admin/audit-logs → Add `response_model=AuditLogsListResponse`

### Admin Invite Codes Endpoints (1)
**File:** `backend/app/api/v1/admin/invite_codes.py`

- [x] Line 62: DELETE /admin/invite-codes/{code} → Add `response_model=MessageResponse`

**✅ Total: 17 endpoints updated with response_model**

**Note:** 3 DELETE endpoints return 204 No Content (no response_model needed):
- DELETE /collections/{collection_id}
- DELETE /conversations/{conversation_id}
- DELETE /documents/{document_id}

---

## 11.5a Fix Chat Endpoint Response Model ✅ COMPLETED

### Chat Endpoint (Non-Streaming Mode)
**File:** `backend/app/api/v1/chat.py`

- [x] Line 21: POST /chat → Add `response_model=ChatResponse` for non-streaming mode
  - **✅ FIXED:** Added `response_model=ChatResponse` to decorator
  - **Schema Used:** `ChatResponse` from `backend/app/schemas/chat.py` ✓
  - **Note:** FastAPI automatically ignores response_model for StreamingResponse returns
  - **Implementation:**
    ```python
    @router.post("/chat", response_model=ChatResponse)
    async def chat_query(...):
        if stream:
            return StreamingResponse(...)  # No response_model (correct)
        else:
            return ChatResponse(...)  # Use response_model (to be fixed)
    ```
  - **Why Important:**
    - Provides proper OpenAPI documentation in Swagger UI
    - Automatic response validation via FastAPI
    - Consistent with all other POST endpoints

---

## 11.6 Phase 2 - Add UUID Validation ✅ COMPLETED

**Commit:** `c8c50eb` - feat(api): add UUID validation to all endpoints (Phase 2)

**IMPORTANT NOTE:** Document IDs (document_id) are kept as 8-character format (NOT full UUIDs) for Milvus compatibility. Chunk IDs use format `{document_id}_{index}` and Milvus has a 36-character limit. All other IDs (user_id, collection_id, conversation_id) use full UUID validation.

### Created UUID Validator Utility ✅
**File:** `backend/app/utils/validators.py` (CREATED)
- [x] Implemented `validate_uuid()` function with proper error handling
- [x] Returns HTTPException 400 with descriptive error message for invalid UUIDs

### Path Parameters - Collections (3 endpoints) ✅
**File:** `backend/app/api/v1/collections.py`
- [x] GET /collections/{collection_id}
- [x] PUT /collections/{collection_id}
- [x] DELETE /collections/{collection_id}

### Path Parameters - Conversations (2 endpoints) ✅
**File:** `backend/app/api/v1/conversations.py`
- [x] GET /conversations/{conversation_id}
- [x] DELETE /conversations/{conversation_id}

### Path Parameters - Documents (EXCLUDED - 8-char format) ⚠️
**File:** `backend/app/api/v1/documents.py`
- [x] Document IDs kept as 8-character format (not validated as UUIDs)
- [x] Reason: Milvus chunk_id format requires `{document_id}_{index}` under 36 chars

### Path Parameters - Admin Users (4 endpoints) ✅
**File:** `backend/app/api/v1/admin/users.py`
- [x] GET /admin/users/{user_id}
- [x] POST /admin/users/{user_id}/suspend
- [x] POST /admin/users/{user_id}/activate
- [x] DELETE /admin/users/{user_id}

### Path Parameters - Admin Documents (1 endpoint) ✅
**File:** `backend/app/api/v1/admin/documents.py`
- [x] DELETE /admin/users/{user_id}/documents

### Query Parameters (3 endpoints) ✅
- [x] `backend/app/api/v1/documents.py`: GET /documents → collection_id
- [x] `backend/app/api/v1/admin/documents.py`: GET /admin/documents → user_id
- [x] `backend/app/api/v1/admin/audit_logs.py`: GET /admin/audit-logs → admin_user_id

### Form Parameters (2 endpoints) ✅
**File:** `backend/app/api/v1/documents.py`
- [x] POST /documents/upload → collection_id
- [x] PUT /documents/{document_id} → collection_id

### Request Body Schema Fields (4 locations) ✅
- [x] `backend/app/schemas/chat.py` - ChatQuery schema (conversation_id, collection_id)
- [x] `backend/app/schemas/document.py` - BatchDeleteRequest schema (document_ids list)

**✅ Total: 20+ UUID validations added (document_id excluded for technical reasons)**
**✅ All tests passing (87/87)**
**✅ Linting clean**

---

## 11.7 Phase 3 - Refactor Query Parameters to Use Request Schemas ✅ COMPLETED

### 1. Conversations API ✅
**File:** `backend/app/api/v1/conversations.py` Line 21
**Schema:** `ConversationListParams` (from conversation.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def list_conversations(
      limit: int = Query(50, ge=1, le=100),
      offset: int = Query(0, ge=0),
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_session),
  ):

  # After:
  async def list_conversations(
      params: ConversationListParams = Depends(),
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_session),
  ):
  ```
- [x] Update variable usage: `limit` → `params.limit`, `offset` → `params.offset`
- [x] Add import: `from app.schemas.conversation import ConversationListParams`

---

### 2. Documents API ✅
**File:** `backend/app/api/v1/documents.py` Line 213
**Schema:** `DocumentListParams` (from document.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def list_documents(
      page: int = 1,
      limit: int = 50,
      collection_id: str | None = None,
      status_filter: str | None = None,
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_db),
  ):

  # After:
  async def list_documents(
      params: DocumentListParams = Depends(),
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- [x] Update variable usage: `page` → `params.page`, `limit` → `params.limit`, `collection_id` → `params.collection_id`, `status_filter` → `params.status_filter`
- [x] Add import: `from app.schemas.document import DocumentListParams`

---

### 3. Admin Users API ✅
**File:** `backend/app/api/v1/admin/users.py` Line 32
**Schema:** `AdminUserListParams` (from admin.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def list_users(
      page: int = 1,
      limit: int = 50,
      status_filter: str | None = None,
      role: str | None = None,
      sort_by: str = "created_at",
      order: str = "desc",
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):

  # After:
  async def list_users(
      params: AdminUserListParams = Depends(),
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- [x] Remove manual validation lines 62-69 (if page < 1, if limit...)
- [x] Update service call to use: `params.page`, `params.limit`, `params.status_filter`, `params.role`, `params.sort_by`, `params.order`
- [x] Add import: `from app.schemas.admin import AdminUserListParams`

---

### 4. Admin Documents API ✅
**File:** `backend/app/api/v1/admin/documents.py` Line 26
**Schema:** `AdminDocumentListParams` (from admin.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def list_all_documents(
      page: int = 1,
      limit: int = 50,
      user_id: str | None = None,
      status_filter: str | None = None,
      sort_by: str = "uploaded_at",
      order: str = "desc",
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):

  # After:
  async def list_all_documents(
      params: AdminDocumentListParams = Depends(),
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- [x] Remove manual validation lines 50-57 (if page < 1, if limit...)
- [x] Update variable usage to use params object throughout function body
- [x] Add import: `from app.schemas.admin import AdminDocumentListParams`

---

### 5. Admin Audit Logs API ✅
**File:** `backend/app/api/v1/admin/audit_logs.py` Line 19
**Schema:** `AuditLogListParams` (from admin.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def get_audit_logs(
      page: int = 1,
      limit: int = 50,
      admin_user_id: str | None = None,
      action: str | None = None,
      target_type: str | None = None,
      start_date: datetime | None = None,
      end_date: datetime | None = None,
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):

  # After:
  async def get_audit_logs(
      params: AuditLogListParams = Depends(),
      admin_user: User = Depends(get_current_admin),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- [x] Remove manual validation lines 64-71 (if page < 1, if limit...)
- [x] Update service call: `list_audit_logs(session=db, page=params.page, limit=params.limit, ...)`
- [x] Add import: `from app.schemas.admin import AuditLogListParams`

---

### 6. Admin Invite Codes API ✅
**File:** `backend/app/api/v1/admin/invite_codes.py` Line 41
**Schema:** `InviteCodeListParams` (from admin.py)

- [x] Replace function signature:
  ```python
  # Before:
  async def get_invite_codes(
      status_filter: str | None = None,
      limit: int = 50,
      offset: int = 0,
      session: AsyncSession = Depends(get_db),
      current_admin: User = Depends(get_current_admin),
  ):

  # After:
  async def get_invite_codes(
      params: InviteCodeListParams = Depends(),
      session: AsyncSession = Depends(get_db),
      current_admin: User = Depends(get_current_admin),
  ):
  ```
- [x] Update service call: `list_invite_codes(session=session, status=params.status_filter, limit=params.limit, offset=params.offset)`
- [x] Add import: `from app.schemas.admin import InviteCodeListParams`

---

**✅ Total: 6 endpoints refactored to use query param request schemas**

**Benefits:**
- Eliminates ~60-80 lines of duplicated validation code
- Automatic Pydantic validation (type checking, range validation)
- Better OpenAPI/Swagger documentation
- Consistent patterns across all endpoints
- Easier to maintain and extend

---

## 11.8 Update Schema Exports

### Update __init__.py
**File:** `backend/app/schemas/__init__.py`

- [ ] Add import and export for `common.py` schemas:
  ```python
  from app.schemas.common import MessageResponse, HealthCheckResponse, RootResponse
  ```
- [ ] Add import and export for `params.py` schemas:
  ```python
  from app.schemas.params import (
      PaginationParams,
      SortParams,
      DocumentFilterParams,
      UserListParams,
      AdminDocumentListParams,
      AuditLogFilterParams,
      InviteCodeFilterParams,
      ConversationListParams,
  )
  ```
- [ ] Add new admin response schemas to exports
- [x] Update __all__ list with new schema names

---

## 11.9 Testing & Validation

### Linting
- [ ] Run `cd backend && uv run ruff check --fix .`
- [ ] Fix any linting issues
- [ ] Ensure all imports are correct
- [ ] No unused imports

### Unit Tests
- [ ] Run `cd backend && uv run pytest -v`
- [ ] Verify all 87 tests still pass
- [ ] No new test failures introduced
- [ ] Test coverage maintained or improved

### Manual API Testing - Swagger UI
- [ ] Start server: `cd backend && uv run uvicorn main:app --reload`
- [ ] Open: http://localhost:8000/docs

#### Verify Response Models:
- [ ] All 39 endpoints show response schema in Swagger
- [ ] Response schemas have proper field descriptions
- [ ] Example values display correctly
- [ ] No "Successful Response" without schema

#### Verify Request Models (Query Params):
- [ ] Query parameters show constraints (min=1, max=100)
- [ ] Field descriptions visible in Swagger
- [ ] Default values displayed correctly
- [ ] Required vs optional params clearly marked

#### Verify UUID Validation:
- [ ] Test invalid UUID in path param: `curl http://localhost:8000/api/v1/documents/invalid-uuid`
  - Should return 400 with error: "Invalid UUID format for document_id: invalid-uuid. Expected format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'"
- [ ] Test valid UUID in path param: Should work normally
- [ ] Test invalid UUID in query param: Should return 400
- [ ] Test invalid UUID in form param: Should return 400
- [ ] Test invalid UUID in request body: Should return 422 (Pydantic validation)

#### Verify Query Param Validation:
- [ ] Test page=0: `curl "http://localhost:8000/api/v1/documents?page=0"`
  - Should fail with Pydantic validation error
- [ ] Test limit=200: `curl "http://localhost:8000/api/v1/documents?limit=200"`
  - Should fail with validation error (max is 100)
- [ ] Test valid params: `curl "http://localhost:8000/api/v1/documents?page=1&limit=50"`
  - Should work normally

### Integration Testing
- [ ] Test pagination works correctly (page, limit, offset)
- [ ] Test filtering works correctly (status, role, user_id)
- [ ] Test sorting works correctly (sort_by, order)
- [ ] Test date filtering works (start_date, end_date)
- [ ] Test UUID validation in all contexts (path, query, form, body)
- [ ] Test error messages are clear and helpful
- [ ] Test response models match actual responses

---

## 11.10 Final Comprehensive API Verification

**Purpose:** After completing all phases, run a final audit to ensure NO endpoints are missing request or response schemas.

### Final Audit Checklist

- [ ] **Audit ALL 47 API endpoints** one more time:
  - Auth endpoints (6)
  - Chat endpoints (1)
  - Collections endpoints (5)
  - Conversations endpoints (3)
  - Documents endpoints (8)
  - Admin users endpoints (7)
  - Admin documents endpoints (4)
  - Admin audit logs endpoints (1)
  - Admin invite codes endpoints (3)
  - Main app endpoints (2)

### What to Check:

**For Each POST/PUT/PATCH Endpoint:**
- [ ] Has request body schema (Pydantic BaseModel)?
  - If NO: Document it and add to task file
  - If using Form(): Acceptable for file uploads
- [ ] Has response_model decorator?
  - If NO: Add to task file

**For Each GET Endpoint with Query Parameters:**
- [ ] Has query parameter schema using Depends()?
  - If NO: Document inline parameters and add schema task
- [ ] Has response_model decorator?
  - If NO: Add to task file

**For Each DELETE Endpoint:**
- [ ] Returns 204 No Content OR has response_model?
  - 204 is acceptable (no response_model needed)
  - If returns data: Must have response_model

### Document Findings:

If any issues found during final audit:
- [ ] Add new section to this task file listing missing schemas
- [ ] Create checkboxes for each missing item
- [x] Update statistics in Overview section
- [ ] Create plan to fix remaining gaps

### Final Sign-Off:

- [ ] All POST/PUT/PATCH endpoints have request body schemas ✓
- [ ] All endpoints have response_model (except 204 responses) ✓
- [ ] All GET endpoints with query params use Pydantic schemas ✓
- [ ] UUID validation in place for all UUID parameters ✓
- [ ] Swagger documentation complete for all endpoints ✓
- [ ] No inline query parameters remaining ✓
- [ ] No manual validation code duplication ✓

**If all checks pass:** Phase 11 is COMPLETE
**If any checks fail:** Document and fix before marking complete

---

## 11.11 Documentation Updates

### Update Task File
- [ ] Mark all completed checkboxes as [x]
- [ ] Document any deviations from original plan
- [ ] Add notes about implementation decisions
- [ ] Add "UPDATE:" or "NOTE:" sections for changes
- [x] Update completion checklist at bottom

---

## ✅ Phase 11 Completion Checklist

**IMPORTANT: Verify Against Implementation**
- [ ] **All response models working correctly**
- [ ] **All request models (query params) working correctly**
- [ ] **All UUID validations working correctly**
- [ ] **Swagger UI documentation complete**

Before moving to next phase, verify:

### Response Models (Phase 1) - 17 endpoints
- [ ] All 17 endpoints have response_model added
- [ ] Swagger UI shows complete response documentation for each
- [ ] No endpoints returning undocumented dicts
- [ ] Example values generated correctly

### UUID Validation (Phase 2) - 26 parameters
- [ ] All 17 path parameters validated
- [ ] All 3 query parameters validated
- [ ] All 2 form parameters validated
- [ ] All 4 schema fields validated
- [ ] Invalid UUIDs return 400 with clear error message
- [ ] Valid UUIDs work correctly
- [ ] ONE reusable validate_uuid() function created and used everywhere

### Query Parameter Schemas (Phase 3) - 6 endpoints
- [ ] All 6 endpoints using query param request schemas
- [ ] Manual validation code removed (~80 lines eliminated)
- [ ] Consistent pattern across all GET endpoints
- [ ] Pydantic validation automatic (no manual if/else checks)

### Files Created (3)
- [ ] `backend/app/schemas/common.py` exists with 3 schemas
- [ ] `backend/app/schemas/params.py` exists with 7 schemas
- [ ] `backend/app/utils/validators.py` exists with validate_uuid()

### Files Modified (14)
- [ ] `backend/main.py` - 2 endpoints updated
- [ ] `backend/app/api/v1/auth.py` - 3 endpoints updated
- [ ] `backend/app/api/v1/collections.py` - 3 endpoints updated
- [ ] `backend/app/api/v1/conversations.py` - 2 endpoints updated
- [ ] `backend/app/api/v1/documents.py` - Multiple endpoints updated
- [ ] `backend/app/api/v1/admin/users.py` - 6 endpoints updated
- [ ] `backend/app/api/v1/admin/documents.py` - 4 endpoints updated
- [ ] `backend/app/api/v1/admin/audit_logs.py` - 1 endpoint updated
- [ ] `backend/app/api/v1/admin/invite_codes.py` - 1 endpoint updated
- [ ] `backend/app/schemas/admin.py` - 8 new schemas added
- [ ] `backend/app/schemas/chat.py` - UUID validation added
- [ ] `backend/app/schemas/document.py` - UUID validation added
- [ ] `backend/app/schemas/__init__.py` - Exports updated

### Testing Complete
- [ ] All 87 tests passing (`pytest -v`)
- [ ] Ruff checks passing (`ruff check --fix .`)
- [ ] Manual Swagger UI verification complete
- [ ] UUID validation tested (invalid and valid)
- [ ] Query param validation tested
- [ ] Integration tests passing

### Code Quality Verified
- [ ] No code duplication
- [ ] Consistent patterns across all 39 endpoints
- [ ] Clear, helpful error messages
- [ ] Type hints everywhere
- [ ] Proper docstrings with Field descriptions
- [ ] No breaking changes (100% backward compatible)

---

## 📊 Summary of Changes

### Statistics:
- **Total Endpoints Analyzed**: 39
- **Endpoints Updated**: 39 (100%)
- **Response Models Added**: 17 (20 needed, 3 are 204 No Content)
- **UUID Validations Added**: 26
- **Query Param Schemas Created**: 7
- **Endpoints Refactored with Query Schemas**: 6
- **Code Removed**: ~80 lines (duplicated validation)
- **Code Added**: ~400 lines (schemas + validation)
- **Net Result**: Massive quality improvement!

### New Schemas Created:

**Response Models (11 total):**
1. MessageResponse (reusable)
2. HealthCheckResponse
3. RootResponse
4. UsersListResponse
5. UserDetailsResponse
6. SuspendUserResponse
7. AdminDocumentsListResponse
8. DeleteDocumentResponse
9. CleanupDocumentsResponse
10. CleanupAllResponse
11. AuditLogsListResponse

**Request Models (7 total):**
1. PaginationParams (base class)
2. SortParams (base class)
3. DocumentFilterParams
4. UserListParams
5. AdminDocumentListParams
6. AuditLogFilterParams
7. InviteCodeFilterParams
8. ConversationListParams

---

## 🎯 Benefits Achieved

### API Documentation ✅
- Complete Swagger/OpenAPI documentation for all 39 endpoints
- All request parameters documented with descriptions and constraints
- All response structures documented with field types
- Example values generated automatically
- Clear validation rules visible to API consumers

### Security ✅
- All 26 UUID parameters validated before use
- Prevents crashes from invalid UUID strings
- Prevents SQL injection attempts via malformed UUIDs
- Clear error messages for validation failures
- Consistent validation across entire API

### Code Quality ✅
- Eliminated ~80 lines of duplicated validation code
- Single source of truth for validation rules (DRY principle)
- Consistent patterns across all endpoints
- Better type safety and IDE support
- Easier to maintain and extend

### Developer Experience ✅
- Clear API contracts for frontend developers
- Better client SDK generation (OpenAPI spec complete)
- Easier to add new endpoints (follow existing patterns)
- Reduced maintenance burden
- Self-documenting code

### User Experience ✅
- Consistent, helpful error messages
- Proper validation feedback before processing
- No unexpected crashes from invalid input
- Professional API behavior
- Clear documentation for API consumers

---

## 🚨 Breaking Changes

**NONE** - This refactoring is 100% backward compatible:
- ✅ Parameter names unchanged
- ✅ Default values preserved
- ✅ Response formats unchanged
- ✅ All existing clients continue working
- ✅ API contracts maintained
- ✅ Only adds validation and documentation

**NOTE:** UUID validation will reject invalid UUIDs that may have previously been accepted (this is intentional and improves security).

---

## 📝 Implementation Notes

### Implementation Strategy:
1. **Phase 1 First** - Create response schemas and add response_model (safest, additive only)
2. **Phase 2 Second** - Add UUID validation (security improvement, may break invalid input)
3. **Phase 3 Last** - Refactor query params to schemas (most complex, needs thorough testing)

### Rollback Strategy:
If issues found:
- Phase 3 can be rolled back independently (query param schemas)
- Phase 2 can be rolled back independently (UUID validation)
- Phase 1 is safe (only adds documentation, doesn't change behavior)

### Testing Priority:
1. **Critical**: UUID validation (security impact, may reject previously accepted input)
2. **High**: Query param schemas (affects multiple endpoints, complex refactoring)
3. **Medium**: Response models (documentation only, no behavior change)

### Common Pitfalls to Avoid:
- ❌ Don't forget to import new schemas in endpoint files
- ❌ Don't forget to call validate_uuid() at start of function (before any processing)
- ❌ Don't forget to update service calls when switching to params objects
- ❌ Don't forget to export new schemas in __init__.py
- ❌ Don't remove UUID validation from service layer (keep defense in depth)

---

**Next Phase:** Phase 8 (Testing & QA) or Phase 9 (Production Deployment)

---

## Example Code Patterns

### Response Model Pattern:
```python
# Before:
@router.get("/users")
async def list_users(...) -> dict:
    return {"users": users, "total": total}

# After:
@router.get("/users", response_model=UsersListResponse)
async def list_users(...) -> dict:
    return {"users": users, "total": total}
```

### UUID Validation Pattern:
```python
# Before:
@router.get("/documents/{document_id}")
async def get_document(document_id: str, ...):
    # No validation - could crash with invalid UUID

# After:
@router.get("/documents/{document_id}")
async def get_document(document_id: str, ...):
    validate_uuid(document_id, "document_id")  # Add this line
    # Now safe to use document_id
```

### Query Param Schema Pattern:
```python
# Before:
@router.get("/documents")
async def list_documents(
    page: int = 1,
    limit: int = 50,
    collection_id: str | None = None,
    ...
):
    if page < 1:
        raise HTTPException(...)  # Manual validation
    if limit < 1 or limit > 100:
        raise HTTPException(...)  # Manual validation

# After:
@router.get("/documents")
async def list_documents(
    params: DocumentFilterParams = Depends(),  # Single dependency
    ...
):
    # Validation automatic via Pydantic!
    # Access as: params.page, params.limit, params.collection_id
```
