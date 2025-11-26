# End-to-End Manual Tests

These tests require a live running server and all external services configured.

## Prerequisites

1. **Start the development server:**
   ```bash
   cd backend
   uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Ensure all services are running:**
   - PostgreSQL database
   - Redis server
   - Milvus vector database (or Zilliz Cloud)
   - Backblaze B2 storage configured
   - Google Gemini API key configured
   - Resend email service configured

3. **For Phase 5 integration test:**
   - Ensure test document exists: `public/docs/Internal Employee Handbook (HR Policy).txt`
   - Test users should exist in database (admin@test.com, user@example.com)

## Running Tests

```bash
# Run individual test
cd backend
uv run python tests/e2e/test_auth_flow_manual.py

# Or using pytest
uv run pytest tests/e2e/test_auth_flow_manual.py -v
uv run pytest tests/e2e/test_phase5_integration_manual.py -v

# Run all E2E tests
uv run pytest tests/e2e/ -v
```

## Test Files

### `test_auth_flow_manual.py`
Tests complete authentication flow:
- User registration
- Login with credentials
- Protected endpoint access
- Token refresh
- Logout
- Token revocation
- Password reset request

**Runtime:** ~5-10 seconds

### `test_phase5_integration_manual.py`
Tests complete RAG workflow:
- Collection creation
- Document upload
- Document processing (background worker)
- Chat with collection filter
- Chat without collection filter
- Conversation history
- Source citations

**Runtime:** 60-120 seconds (includes document processing wait time)

## Notes

- ⚠️ These tests create real data in the database
- ⚠️ Tests may take 1-2 minutes to complete (document processing)
- ⚠️ Ensure invite-only mode is properly configured
- ⚠️ Tests use hardcoded credentials - ensure they exist in your database
- ✅ These tests verify the entire system works end-to-end
- ✅ Run these before deploying to production

## Troubleshooting

**Server not running:**
```
Error: Connection refused
Fix: Start uvicorn server first
```

**Test document not found:**
```
Error: Test document not found: public/docs/...
Fix: Ensure test document exists in project root
```

**Services not configured:**
```
Error: B2/Milvus/Gemini connection failed
Fix: Check .env file has all required credentials
```
