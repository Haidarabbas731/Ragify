# Phase 7: Admin Features & User Management

**Priority:** Medium  
**Estimated Time:** 2-3 days  
**Dependencies:** Phase 2 (Authentication), Phase 5 (RAG Chat)  
**PRD Reference:** Section 13.8 (Admin User & Document Management), Section 10.6 (Admin Audit Log)

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
Example: feat(admin): implement user management endpoints
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

## 7.1 Admin Service Layer

### Admin Service
**PRD Reference:** Section 11.1 (Project Structure - services/admin_service.py)
- [ ] Create `backend/app/services/admin_service.py`
- [ ] Implement `list_all_users(filters, pagination, db) -> List[User]`
- [ ] Implement `get_user_details(user_id, db) -> User`
- [ ] Implement `suspend_user(user_id, reason, db)`
- [ ] Implement `activate_user(user_id, db)`
- [ ] Implement `get_system_stats(db) -> SystemStats`
- [ ] Test admin service functions

---

## 7.2 Admin User Management

### List All Users
**PRD Reference:** Section 13.8 (Admin User & Document Management)
- [ ] Create `backend/app/api/v1/admin/users.py`
- [ ] Implement `GET /api/v1/admin/users` endpoint
- [ ] Require admin authentication (`get_current_admin` dependency)
- [ ] Query parameters: page, limit, status, role, sort, order
- [ ] Return paginated list of users
- [ ] Include: user_id, email, role, status, storage_used, created_at, last_login
- [ ] Test listing with filters

### Get User Details
- [ ] Implement `GET /api/v1/admin/users/{user_id}` endpoint
- [ ] Return full user details
- [ ] Include document count, storage usage, conversation count
- [ ] Test user details retrieval

### Suspend User
**PRD Reference:** Section 13.8 (Suspend User Account)
- [ ] Implement `POST /api/v1/admin/users/{user_id}/suspend` endpoint
- [ ] Set user status to 'suspended'
- [ ] Revoke all active sessions (blocklist tokens)
- [ ] Log audit event with reason
- [ ] Return success message
- [ ] Test suspension

### Activate User
- [ ] Implement `POST /api/v1/admin/users/{user_id}/activate` endpoint
- [ ] Set user status to 'active'
- [ ] Log audit event
- [ ] Return success message
- [ ] Test activation

### Delete User Account (Admin)
**PRD Reference:** Section 13.8 (Delete User Account)
- [ ] Implement `DELETE /api/v1/admin/users/{user_id}` endpoint
- [ ] Soft delete user (set is_active=False)
- [ ] Enqueue background job to:
  - Delete all user documents
  - Delete all user chunks from Milvus
  - Delete all conversations
  - Delete files from B2
- [ ] Log audit event
- [ ] Return success message
- [ ] Test user deletion

---

## 7.3 Admin Document Management

### List All Documents (Admin)
**PRD Reference:** Section 13.8 (View All Documents)
- [ ] Create `backend/app/api/v1/admin/documents.py`
- [ ] Implement `GET /api/v1/admin/documents` endpoint
- [ ] Query parameters: page, limit, user_id, status, sort, order
- [ ] Return documents from all users
- [ ] Include: document_id, user_id, filename, status, size, uploaded_at
- [ ] Test listing

### Delete Document (Admin)
**PRD Reference:** Section 13.8 (Delete Any User's Document)
- [ ] Implement `DELETE /api/v1/admin/documents/{document_id}` endpoint
- [ ] No ownership check (admin can delete any document)
- [ ] Soft delete document
- [ ] Enqueue cleanup job
- [ ] Update user storage_used_bytes
- [ ] Log audit event
- [ ] Return success message
- [ ] Test deletion

---

## 7.4 System Statistics & Monitoring

### System Stats Endpoint
**PRD Reference:** Section 9.11 (Admin - System Stats)
- [ ] Implement `GET /api/v1/admin/stats` endpoint
- [ ] Return system statistics:
  - Total users count
  - Active users (last 30 days)
  - Total documents count
  - Total storage used
  - Total conversations count
  - Active invite codes count
  - Failed documents (status=ERROR) count
- [ ] Cache stats in Redis (TTL: 5 minutes)
- [ ] Test stats endpoint

### User Activity Stats
- [ ] Implement `GET /api/v1/admin/users/{user_id}/stats` endpoint
- [ ] Return user-specific stats:
  - Document count
  - Storage used/limit
  - Conversation count
  - Last login
  - Registration date
  - Total chat queries (from audit log or separate tracking)
- [ ] Test user stats

---

## 7.5 Audit Logging

### Audit Log Service
**PRD Reference:** Section 10.6 (AdminAuditLog Model)
- [ ] Implement audit logging in `admin_service.py`
- [ ] Create `log_admin_action(admin_user_id, action, target_type, target_id, details, ip, db)`
- [ ] Actions: SUSPEND_USER, ACTIVATE_USER, DELETE_USER, DELETE_DOCUMENT, CREATE_INVITE, REVOKE_INVITE
- [ ] Store details as JSONB (reason, old_value, new_value, etc.)
- [ ] Test audit logging

### View Audit Logs
**PRD Reference:** Section 13.8 (Audit Logging)
- [ ] Create `backend/app/api/v1/admin/audit_logs.py`
- [ ] Implement `GET /api/v1/admin/audit-logs` endpoint
- [ ] Query parameters: page, limit, admin_user_id, action, target_type, start_date, end_date
- [ ] Return paginated audit logs
- [ ] Include: audit_id, admin_user_id, action, target_type, target_id, details, ip, timestamp
- [ ] Test audit log retrieval

---

## 7.6 Invite Code Management (Admin)

### List Invite Codes
**PRD Reference:** Section 13.7.1 (Invite Code Management)
- [ ] Implement `GET /api/v1/admin/invite-codes` endpoint (may already exist from Phase 2)
- [ ] Filter by: status, created_by, is_expired
- [ ] Show usage: current_uses / max_uses
- [ ] Test listing

### Create Invite Code
**PRD Reference:** Section 13.7.1 (Generate Invite Codes)
- [ ] Implement `POST /api/v1/admin/invite-codes` endpoint (may already exist from Phase 2)
- [ ] Request: InviteCodeCreate(max_uses, expires_at, description)
- [ ] Generate code in KB-XXXX-XXXX-XXXX format
- [ ] Log audit event
- [ ] Test creation

### Revoke Invite Code
- [ ] Implement `DELETE /api/v1/admin/invite-codes/{code}` endpoint
- [ ] Set status to 'revoked'
- [ ] Log audit event
- [ ] Test revocation

---

## 7.7 Admin Dashboard Data

### Dashboard Metrics
- [ ] Create `GET /api/v1/admin/dashboard` endpoint
- [ ] Return combined metrics for admin dashboard:
  - System stats
  - Recent audit logs (last 10)
  - Recent user registrations (last 10)
  - Failed documents (last 10)
  - Storage usage by user (top 10)
- [ ] Cache dashboard data (TTL: 5 minutes)
- [ ] Test dashboard endpoint

---

## 7.8 Rate Limiting for Admin Endpoints

### Admin Rate Limits
**PRD Reference:** Section 11.4 (Rate Limit Hierarchy)
- [ ] Apply rate limits to admin endpoints:
  - Admin user management: 100 requests/minute
  - Admin document management: 100 requests/minute
  - Audit logs: 50 requests/minute
- [ ] Use Redis rate limiting
- [ ] Test rate limits

---

## 7.9 Testing Admin Features

### Unit Tests
- [ ] Create `backend/tests/test_admin_service.py`
- [ ] Test user suspension/activation
- [ ] Test system stats calculation
- [ ] Test audit logging

### Integration Tests
- [ ] Create `backend/tests/test_admin_api.py`
- [ ] Test admin can list all users
- [ ] Test admin can suspend user
- [ ] Test admin can delete user
- [ ] Test admin can delete any document
- [ ] Test non-admin cannot access admin endpoints (403 Forbidden)
- [ ] Test audit logs are created for admin actions

### Security Tests
- [ ] Test admin endpoints require admin role
- [ ] Test regular users get 403 on admin endpoints
- [ ] Test audit logs cannot be modified
- [ ] Test rate limiting on admin endpoints

---

## ✅ Phase 7 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check admin features with PRD Section 13.8**
- [ ] **Verify audit log model matches PRD Section 10.6**
- [ ] **Confirm invite code management matches PRD Section 13.7.1**
- [ ] **Verify all admin actions are logged**

Before moving to Phase 8, verify:
- [ ] Admin service implemented
- [ ] Admin user management working (list, suspend, activate, delete)
- [ ] Admin document management working
- [ ] System stats endpoint working
- [ ] Audit logging working for all admin actions
- [ ] Invite code management working
- [ ] Admin dashboard endpoint working
- [ ] Non-admin users blocked from admin endpoints (403)
- [ ] All tests passing (`pytest backend/tests/test_admin*.py`)
- [ ] Admin can view all users
- [ ] Admin can suspend/activate users
- [ ] Admin can view audit logs
- [ ] All admin actions logged correctly

---

**Next Phase:** [Phase 8: Testing & QA](08-TESTING.md)
