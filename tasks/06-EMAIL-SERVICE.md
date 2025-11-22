# Phase 6: Email Service Integration

**Priority:** Medium  
**Estimated Time:** 1-2 days  
**Dependencies:** Phase 2 (Authentication completed)  
**PRD Reference:** Section 13.9 (Email Service via Resend), Section 9.7 (Password Reset Email)

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
Example: feat(email): integrate Resend email service
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

## 6.1 Resend Email Service Setup

### Resend Client Configuration
**PRD Reference:** Section 13.9 (Email Service via Resend)
- [ ] Install `resend` dependency (already in pyproject.toml)
- [ ] Add to `.env`: RESEND_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME
- [ ] Create `backend/app/services/email_service.py`
- [ ] Initialize Resend client with API key
- [ ] Test connection with Resend API

### Email Templates
**PRD Reference:** Section 13.9 (Email Templates)
- [ ] Create `backend/app/templates/email/` directory
- [ ] Create `password_reset.html` template
- [ ] Create `welcome_email.html` template (optional)
- [ ] Create `invite_code_notification.html` template (optional for admin)
- [ ] Use basic HTML for email compatibility

---

## 6.2 Core Email Functions

### Send Email Base Function
- [ ] Implement `send_email(to: str, subject: str, html: str) -> bool`
- [ ] Use Resend API to send email
- [ ] Handle errors (invalid email, API failures)
- [ ] Log email sending attempts
- [ ] Return True if successful, False otherwise
- [ ] Test email sending with test address

### Email Template Rendering
- [ ] Implement `render_template(template_name: str, context: dict) -> str`
- [ ] Use Jinja2 or simple string formatting
- [ ] Support variables in templates (username, reset_link, etc.)
- [ ] Test template rendering

---

## 6.3 Password Reset Email

### Send Password Reset Email
**PRD Reference:** Section 9.7 (Password Reset Flow), Section 13.9
- [ ] Implement `send_password_reset_email(email: str, reset_token: str, user_name: str)`
- [ ] Build reset URL: `{FRONTEND_URL}/reset-password?token={reset_token}`
- [ ] Render password_reset.html template with reset URL
- [ ] Send email with subject "Reset Your Password"
- [ ] Add 15-minute expiry notice in email
- [ ] Test password reset email end-to-end

### Email Content
**PRD Reference:** Section 13.9 (Email Template Structure)
- [ ] Include user-friendly message
- [ ] Include reset link button
- [ ] Add security notice: "If you didn't request this, ignore this email"
- [ ] Add footer with app name and contact info
- [ ] Test email renders correctly in major email clients

---

## 6.4 Welcome Email (Optional)

### Send Welcome Email
- [ ] Implement `send_welcome_email(email: str, user_name: str)`
- [ ] Send after successful registration
- [ ] Include getting started guide
- [ ] Include support contact
- [ ] Test welcome email

---

## 6.5 Admin Notification Emails (Optional)

### Invite Code Usage Notification
- [ ] Implement `send_invite_usage_notification(admin_email: str, invite_code: str, new_user_email: str)`
- [ ] Notify admin when their invite code is used
- [ ] Include new user's email
- [ ] Include timestamp
- [ ] Test notification email

---

## 6.6 Email Rate Limiting & Security

### Rate Limiting
**PRD Reference:** Section 11.4 (Rate Limit Hierarchy)
- [ ] Add rate limit: max 3 password reset emails per hour per email
- [ ] Use Redis for rate limiting
- [ ] Return error if rate limit exceeded
- [ ] Test rate limiting

### Email Validation
- [ ] Implement `validate_email_format(email: str) -> bool`
- [ ] Use regex or email-validator library
- [ ] Reject invalid email formats before sending
- [ ] Test email validation

### Prevent Email Enumeration
**PRD Reference:** Section 9.7 (Password Reset - Always Return Success)
- [ ] Always return success message, even if email doesn't exist
- [ ] Don't reveal whether email exists in system
- [ ] Log actual failures for debugging
- [ ] Test enumeration prevention

---

## 6.7 Email Service Health Check

### Health Check Integration
- [ ] Add email service check to `/api/v1/health` endpoint
- [ ] Check Resend API connectivity
- [ ] Return "up" if Resend is reachable
- [ ] Return "down" if Resend API fails
- [ ] Test health check

---

## 6.8 Testing Email Service

### Unit Tests
- [ ] Create `backend/tests/test_email_service.py`
- [ ] Test send_email with mock Resend client
- [ ] Test template rendering
- [ ] Test email validation
- [ ] Test rate limiting

### Integration Tests
- [ ] Test password reset email flow end-to-end
- [ ] Test welcome email sending
- [ ] Test rate limit enforcement
- [ ] Use test email addresses (e.g., Resend test mode)

### Manual Testing
- [ ] Send test password reset email to real email address
- [ ] Verify email arrives in inbox
- [ ] Verify reset link works
- [ ] Check email rendering in Gmail, Outlook, Apple Mail

---

## ✅ Phase 6 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check email service with PRD Section 13.9**
- [ ] **Verify password reset flow matches PRD Section 9.7**
- [ ] **Confirm rate limiting matches PRD (3 emails/hour for password reset)**
- [ ] **Verify email enumeration prevention**

Before moving to Phase 7, verify:
- [ ] Email service implemented with Resend
- [ ] Password reset email working end-to-end
- [ ] Email templates created and rendering correctly
- [ ] Rate limiting enforced
- [ ] Email validation working
- [ ] Health check includes email service status
- [ ] All tests passing (`pytest backend/tests/test_email*.py`)
- [ ] Can request password reset and receive email
- [ ] Reset link in email works correctly
- [ ] Email renders correctly in major email clients

---

**Next Phase:** [Phase 7: Admin Features](07-ADMIN-FEATURES.md)
