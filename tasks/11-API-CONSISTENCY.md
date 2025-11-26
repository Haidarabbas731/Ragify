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

## 11.3 Create Query Parameter Request Schemas

### Query Parameter Schemas (REQUEST MODELS)
**File:** `backend/app/schemas/params.py` (NEW FILE)

- [ ] Create file `backend/app/schemas/params.py`
- [ ] Create base `PaginationParams` - Reusable pagination
  ```python
  class PaginationParams(BaseModel):
      page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
  ```
- [ ] Create base `SortParams` - Reusable sorting
  ```python
  class SortParams(BaseModel):
      sort_by: str = Field(default="created_at", description="Field to sort by")
      order: str = Field(default="desc", regex="^(asc|desc)$", description="Sort order")
  ```
- [ ] Create `DocumentFilterParams` - Document list query params
  ```python
  class DocumentFilterParams(PaginationParams):
      collection_id: str | None = Field(default=None, description="Filter by collection")
      status_filter: str | None = Field(default=None, description="Filter by status")
  ```
- [ ] Create `UserListParams` - Admin user list query params
  ```python
  class UserListParams(PaginationParams, SortParams):
      status_filter: str | None = Field(default=None, description="Filter by status")
      role: str | None = Field(default=None, description="Filter by role")
  ```
- [ ] Create `AdminDocumentListParams` - Admin document list query params
  ```python
  class AdminDocumentListParams(PaginationParams, SortParams):
      user_id: str | None = Field(default=None, description="Filter by user")
      status_filter: str | None = Field(default=None, description="Filter by status")
  ```
- [ ] Create `AuditLogFilterParams` - Audit log query params
  ```python
  class AuditLogFilterParams(PaginationParams):
      admin_user_id: str | None = Field(default=None, description="Filter by admin")
      action: str | None = Field(default=None, description="Filter by action type")
      target_type: str | None = Field(default=None, description="Filter by target type")
      start_date: datetime | None = Field(default=None, description="Filter from date")
      end_date: datetime | None = Field(default=None, description="Filter to date")
  ```
- [ ] Create `InviteCodeFilterParams` - Invite code list query params
  ```python
  class InviteCodeFilterParams(BaseModel):
      status_filter: str | None = Field(default=None, description="Filter by status")
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      offset: int = Field(default=0, ge=0, description="Offset for pagination")
  ```
- [ ] Create `ConversationListParams` - Conversation list query params
  ```python
  class ConversationListParams(BaseModel):
      limit: int = Field(default=50, ge=1, le=100, description="Items per page")
      offset: int = Field(default=0, ge=0, description="Offset for pagination")
  ```

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

## 11.6 Phase 2 - Add UUID Validation

### Path Parameters - Collections (3 endpoints)
**File:** `backend/app/api/v1/collections.py`

- [ ] Line 64: GET /collections/{collection_id}
  - Add first line in function: `validate_uuid(collection_id, "collection_id")`
- [ ] Line 84: PUT /collections/{collection_id}
  - Add first line in function: `validate_uuid(collection_id, "collection_id")`
- [ ] Line 119: DELETE /collections/{collection_id}
  - Add first line in function: `validate_uuid(collection_id, "collection_id")`

### Path Parameters - Conversations (2 endpoints)
**File:** `backend/app/api/v1/conversations.py`

- [ ] Line 58: GET /conversations/{conversation_id}
  - Add first line in function: `validate_uuid(conversation_id, "conversation_id")`
- [ ] Line 89: DELETE /conversations/{conversation_id}
  - Add first line in function: `validate_uuid(conversation_id, "conversation_id")`

### Path Parameters - Documents (4 endpoints)
**File:** `backend/app/api/v1/documents.py`

- [ ] Line 179: GET /documents/{document_id}
  - Add: `validate_uuid(document_id, "document_id")`
- [ ] Line 294: DELETE /documents/{document_id}
  - Add: `validate_uuid(document_id, "document_id")`
- [ ] Line 507: POST /documents/{document_id}/retry
  - Add: `validate_uuid(document_id, "document_id")`
- [ ] Line 580: PUT /documents/{document_id}
  - Add: `validate_uuid(document_id, "document_id")`

### Path Parameters - Admin Users (4 endpoints)
**File:** `backend/app/api/v1/admin/users.py`

- [ ] Line 83: GET /admin/users/{user_id}
  - Add: `validate_uuid(user_id, "user_id")`
- [ ] Line 113: POST /admin/users/{user_id}/suspend
  - Add: `validate_uuid(user_id, "user_id")`
- [ ] Line 160: POST /admin/users/{user_id}/activate
  - Add: `validate_uuid(user_id, "user_id")`
- [ ] Line 197: DELETE /admin/users/{user_id}
  - Add: `validate_uuid(user_id, "user_id")`

### Path Parameters - Admin Documents (2 endpoints)
**File:** `backend/app/api/v1/admin/documents.py`

- [ ] Line 115: DELETE /admin/documents/{document_id}
  - Add: `validate_uuid(document_id, "document_id")`
- [ ] Line 185: DELETE /admin/users/{user_id}/documents
  - Add: `validate_uuid(user_id, "user_id")`

**✅ Subtotal: 17 path parameters validated**

### Query Parameters (3 endpoints)
**File:** Multiple files

- [ ] `backend/app/api/v1/documents.py` Line 213: GET /documents
  - Add: `if collection_id: validate_uuid(collection_id, "collection_id")`
- [ ] `backend/app/api/v1/admin/documents.py` Line 20: GET /admin/documents
  - Add: `if user_id: validate_uuid(user_id, "user_id")`
- [ ] `backend/app/api/v1/admin/audit_logs.py` Line 18: GET /admin/audit-logs
  - Add: `if admin_user_id: validate_uuid(admin_user_id, "admin_user_id")`

**✅ Subtotal: 3 query parameters validated**

### Form Parameters (2 endpoints)
**File:** `backend/app/api/v1/documents.py`

- [ ] Line 30: POST /documents/upload
  - Add: `if collection_id: validate_uuid(collection_id, "collection_id")`
- [ ] Line 580: PUT /documents/{document_id}
  - Add: `if collection_id: validate_uuid(collection_id, "collection_id")`

**✅ Subtotal: 2 form parameters validated**

### Request Body Schema Fields (4 locations)
**File:** Multiple schema files

- [ ] `backend/app/schemas/chat.py` - ChatQuery schema
  - Add `@field_validator` for conversation_id (optional UUID)
  - Add `@field_validator` for collection_id (optional UUID)
  ```python
  @field_validator('conversation_id', 'collection_id')
  @classmethod
  def validate_uuid_fields(cls, v):
      if v is not None:
          validate_uuid(v, "UUID field")
      return v
  ```
- [ ] `backend/app/schemas/document.py` - BatchDeleteRequest schema
  - Add `@field_validator` for document_ids (list of UUIDs)
  ```python
  @field_validator('document_ids')
  @classmethod
  def validate_document_ids(cls, v):
      for doc_id in v:
          validate_uuid(doc_id, "document_id")
      return v
  ```

**✅ Subtotal: 4 schema field validations**

**✅ Total: 26 UUID validations added**

---

## 11.7 Phase 3 - Refactor Query Parameters to Use Request Schemas

### Documents API (1 endpoint)
**File:** `backend/app/api/v1/documents.py` Line 213

- [ ] Replace function signature:
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
      params: DocumentFilterParams = Depends(),
      current_user: User = Depends(get_current_user),
      db: AsyncSession = Depends(get_db),
  ):
  ```
- [ ] Remove manual validation lines 241-248 (if page < 1, if limit...)
- [ ] Update variable usage: `page` → `params.page`, `limit` → `params.limit`, etc.

### Admin Users API (1 endpoint)
**File:** `backend/app/api/v1/admin/users.py` Line 25

- [ ] Replace 6 individual params with: `params: UserListParams = Depends()`
- [ ] Remove manual validation lines 55-62
- [ ] Update service call to use: `params.page`, `params.limit`, `params.status_filter`, `params.role`, `params.sort_by`, `params.order`

### Admin Documents API (1 endpoint)
**File:** `backend/app/api/v1/admin/documents.py` Line 20

- [ ] Replace 6 individual params with: `params: AdminDocumentListParams = Depends()`
- [ ] Remove manual validation lines 50-57
- [ ] Update variable usage to use params object

### Admin Audit Logs API (1 endpoint)
**File:** `backend/app/api/v1/admin/audit_logs.py` Line 18

- [ ] Replace 7 individual params with: `params: AuditLogFilterParams = Depends()`
- [ ] Remove manual validation lines 64-71
- [ ] Update service call to use params object

### Admin Invite Codes API (1 endpoint)
**File:** `backend/app/api/v1/admin/invite_codes.py` Line 40

- [ ] Replace 3 individual params with: `params: InviteCodeFilterParams = Depends()`
- [ ] Update variable usage

### Conversations API (1 endpoint)
**File:** `backend/app/api/v1/conversations.py` Line 21

- [ ] Replace Query() params with: `params: ConversationListParams = Depends()`
- [ ] Update to use `params.limit`, `params.offset`

**✅ Total: 6 endpoints refactored to use query param request schemas**

**Benefit:** Eliminates ~80 lines of duplicated validation code!

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
- [ ] Update __all__ list with new schema names

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

## 11.10 Documentation Updates

### Update Task File
- [ ] Mark all completed checkboxes as [x]
- [ ] Document any deviations from original plan
- [ ] Add notes about implementation decisions
- [ ] Add "UPDATE:" or "NOTE:" sections for changes
- [ ] Update completion checklist at bottom

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
