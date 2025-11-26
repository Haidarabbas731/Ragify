# Testing Documentation

## Overview

Comprehensive test suite for the AI Knowledge Base Chat System with 173 tests achieving 52% overall code coverage. All critical RAG (Retrieval-Augmented Generation) functionality is production-ready with extensive test coverage.

## Test Statistics

- **Total Tests:** 173 passing
- **Overall Coverage:** 52%
- **Test Execution Time:** ~40 seconds

### Coverage by Service

| Service | Coverage | Tests | Status |
|---------|----------|-------|--------|
| auth_service.py | 100% | 15 | Complete |
| conversation_service.py | 100% | 22 | Complete |
| document_service.py | 100% | 16 | Complete |
| collection_service.py | 100% | 20 | Complete |
| embedding_service.py | 100% | 23 | Complete |
| chat_service.py | 91% | 13 | Complete (defensive code untested) |
| b2_service.py | 90% | 18 | Complete |
| milvus_service.py | 89% | 23 | Complete |
| user_service.py | 61% | 4 | Basic coverage |
| security.py | 52% | 12 | Basic coverage |
| llm_service.py | 19% | - | Needs unit tests |
| redis_service.py | 18% | - | Needs unit tests |
| invite_service.py | 19% | - | Needs unit tests |
| admin_service.py | 17% | - | Needs unit tests |
| email_service.py | 14% | - | Needs unit tests |

## Test Organization

```
backend/tests/
├── README.md                               # This file
├── conftest.py                            # Test fixtures and configuration
│
├── e2e/                                   # End-to-end integration tests
│   ├── README.md                          # E2E testing documentation
│   ├── test_auth_flow_manual.py          # Manual auth workflow test
│   └── test_phase5_integration_manual.py # Manual RAG workflow test
│
├── test_auth_service.py                   # Auth logic (15 tests, 100%)
├── test_b2_service.py                     # B2 storage (18 tests, 90%)
├── test_chat_service.py                   # RAG orchestration (13 tests, 91%)
├── test_collection_service.py             # Collections CRUD (20 tests, 100%)
├── test_conversation_service.py           # Conversations (22 tests, 100%)
├── test_document_service.py               # Documents CRUD (16 tests, 100%)
├── test_embedding_service.py              # Embeddings (23 tests, 100%)
├── test_milvus_service.py                 # Vector DB (23 tests, 89%)
├── test_models.py                         # SQLModel tests (4 tests)
├── test_security.py                       # Password security (12 tests, 52%)
└── test_user_service.py                   # User CRUD (4 tests, 61%)
```

## Running Tests

### All Tests

```bash
cd backend
uv run pytest
```

### Specific Test File

```bash
uv run pytest tests/test_auth_service.py
```

### With Verbose Output

```bash
uv run pytest -v
```

### With Coverage Report

```bash
uv run pytest --cov=app --cov-report=html
# View coverage report: open htmlcov/index.html
```

### Specific Test Function

```bash
uv run pytest tests/test_chat_service.py::test_execute_rag_query_success -v
```

### Run Only Unit Tests (Exclude E2E)

```bash
uv run pytest --ignore=tests/e2e
```

### Run Only E2E Tests

```bash
uv run pytest tests/e2e -v
```

## Test Patterns

### 1. Async Testing with pytest-asyncio

All async functions are tested using `@pytest.mark.asyncio`:

```python
@pytest.mark.asyncio
async def test_create_document(session: AsyncSession, sample_user):
    """Test creating a new document."""
    document = await create_document(
        session,
        user_id=sample_user.user_id,
        filename="test.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="b2://bucket/test.pdf",
    )

    assert document.document_id is not None
    assert document.user_id == sample_user.user_id
```

### 2. Database Session Fixtures

Tests use isolated database sessions with transaction rollback:

```python
@pytest.fixture
async def session() -> AsyncSession:
    """Create a fresh database session for each test."""
    async with async_engine.connect() as connection:
        async with connection.begin() as transaction:
            async with AsyncSession(
                bind=connection,
                expire_on_commit=False,
            ) as session:
                yield session
                await transaction.rollback()
```

### 3. Mocking External Services

External services (B2, Milvus, LLM, Embedding) are mocked using `unittest.mock`:

```python
@pytest.mark.asyncio
async def test_execute_rag_query_success(session, mock_user_id):
    """Test successful RAG query execution."""
    with patch("app.services.chat_service.embedding_service") as mock_embed, \
         patch("app.services.chat_service.milvus_service") as mock_milvus, \
         patch("app.services.chat_service.llm_service") as mock_llm:

        # Setup mocks
        mock_embed.embed_query.return_value = [0.1] * 768
        mock_milvus.search_similar.return_value = [...]
        mock_llm.generate_response.return_value = "Answer..."

        # Execute test
        result = await execute_rag_query(...)
```

### 4. User Isolation Testing

All tests validate that users can only access their own data:

```python
@pytest.mark.asyncio
async def test_get_collection_by_id_wrong_user(session, sample_user):
    """Test getting collection with wrong user_id returns None."""
    collection = await create_collection(session, sample_user.user_id, "Test")

    wrong_user_id = str(uuid.uuid4())
    retrieved = await get_collection_by_id(
        session, collection.collection_id, wrong_user_id
    )

    assert retrieved is None  # User isolation enforced
```

### 5. Foreign Key Constraint Testing

Tests verify database referential integrity:

```python
@pytest.mark.asyncio
async def test_delete_collection_with_documents(session, sample_user):
    """Test deleting collection with documents raises FK constraint error."""
    collection = await create_collection(session, sample_user.user_id, "With Docs")

    # Add document to collection
    await create_document(
        session, sample_user.user_id, "doc.pdf", "pdf", 1024, "key",
        collection_id=collection.collection_id
    )

    from sqlalchemy.exc import IntegrityError
    with pytest.raises(IntegrityError):
        await delete_collection(session, collection.collection_id, sample_user.user_id)
```

### 6. Async Generator Mocking (Streaming)

Streaming responses use proper async generator mocks:

```python
async def mock_stream_gen(system_prompt, user_prompt, timeout=10):
    """Mock async generator for streaming responses."""
    yield "You "
    yield "get "
    yield "the answer."

@pytest.mark.asyncio
async def test_execute_rag_query_stream_success():
    """Test streaming RAG query."""
    with patch("app.services.chat_service.llm_service") as mock_llm:
        mock_llm.generate_response_stream.side_effect = mock_stream_gen

        chunks = []
        async for chunk in execute_rag_query_stream(...):
            chunks.append(chunk)

        assert "".join(chunks) == "You get the answer."
```

## Test Fixtures (conftest.py)

### Database Session

- **`async_engine`**: Async SQLAlchemy engine with NullPool
- **`session`**: Async database session with transaction rollback

### Sample Data

- **`sample_user`**: Pre-created user for testing
- **`sample_admin`**: Pre-created admin user for testing

### Event Loop (Windows Compatibility)

```python
@pytest.fixture(scope="session")
def event_loop_policy():
    """Windows-specific event loop for asyncpg compatibility."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
```

## Known Issues and Workarounds

### 1. Windows AsyncPG Event Loop

Some tests may fail on Windows with asyncpg. Use `@pytest.mark.xfail` decorator:

```python
@pytest.mark.xfail(sys.platform == "win32", reason="Windows asyncpg issue")
async def test_database_operation():
    ...
```

### 2. Chat Service 91% Coverage

The missing 9% coverage in `chat_service.py` is defensive error handling code (generic exception catches) that is acceptable to leave untested:

```python
try:
    # Main RAG logic
except Exception as e:
    # Generic fallback - difficult to trigger in tests
    logger.error(f"Unexpected error: {e}")
```

### 3. Manual E2E Tests

E2E tests in `tests/e2e/` require a running server and all external services configured. See `tests/e2e/README.md` for details.

## CI/CD Integration

### Pre-commit Hook

Automatically runs before every commit:

```bash
# .git/hooks/pre-commit
cd backend
uv run ruff check --fix .
uv run pytest
```

### Bypass Pre-commit (Not Recommended)

```bash
git commit --no-verify -m "message"
```

## Best Practices

### 1. Test Isolation

- Each test runs in its own database transaction
- Transaction is rolled back after test completes
- No test data persists between tests

### 2. Test Naming

- Use descriptive names: `test_<function>_<scenario>`
- Examples: `test_create_document_success`, `test_authenticate_user_wrong_password`

### 3. Docstrings

All tests have docstrings explaining what they verify:

```python
@pytest.mark.asyncio
async def test_update_collection_name(session, sample_user):
    """Test updating collection name."""
    # Test implementation
```

### 4. Assert Patterns

- Test one thing per test function
- Use specific assertions (not just `assert result`)
- Validate all important fields

### 5. Mocking Strategy

- Mock external services (B2, Milvus, LLM, Email)
- Don't mock internal service layer functions
- Use real database for integration testing

## Future Testing Improvements

### High Priority (Missing Coverage)

1. **API Integration Tests**: Test FastAPI endpoints directly
2. **LLM Service Tests**: Unit tests for Gemini LLM integration
3. **Redis Service Tests**: Token blocklist and caching logic
4. **Email Service Tests**: Password reset and notification emails
5. **Admin Service Tests**: Admin-only operations

### Medium Priority

1. **Document Processing Tests**: Test arq worker tasks
2. **Cleanup Tasks Tests**: Test scheduled cleanup jobs
3. **Text Extraction Tests**: Test PDF/DOCX extraction
4. **Chunking Tests**: Test text chunking algorithms
5. **Rate Limiting Tests**: Test middleware rate limits

### Low Priority

1. **Security Headers Tests**: Middleware security headers
2. **File Size Limit Tests**: Middleware file size validation
3. **Sanitization Tests**: Input sanitization utilities

## Coverage Goals

- **Current Overall:** 52%
- **Short-term Goal:** 70% (add critical service tests)
- **Long-term Goal:** 85% (comprehensive coverage)

## Test Maintenance

### Adding New Tests

1. Create test file: `test_<service_name>.py`
2. Import fixtures from `conftest.py`
3. Use `@pytest.mark.asyncio` for async tests
4. Mock external services
5. Validate user isolation
6. Run tests: `uv run pytest tests/test_<service_name>.py -v`

### Updating Existing Tests

1. Ensure tests still pass after code changes
2. Update mocks if service signatures change
3. Add new test cases for new functionality
4. Maintain 100% coverage for critical services

## Resources

- **pytest documentation:** https://docs.pytest.org/
- **pytest-asyncio:** https://github.com/pytest-dev/pytest-asyncio
- **unittest.mock:** https://docs.python.org/3/library/unittest.mock.html
- **SQLModel testing:** https://sqlmodel.tiangolo.com/tutorial/testing/

## Contact

For questions about testing or to report test failures, please check:

- Task tracker: `tasks/08-TESTING-QA.md`
- PRD: `docs/PRD.md`
- Project README: `../README.md`
