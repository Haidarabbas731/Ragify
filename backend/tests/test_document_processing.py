"""
Unit tests for the document processing worker task: the early vector-index check and the
retry decision on embedding failures.
"""

from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from arq import Retry

from app.models.document import Document, DocumentStatus
from app.services.providers.base import (
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderUnavailableError,
)
from app.tasks.document_processing import process_document


@pytest.fixture
def worker():
    """Patch the task's collaborators up to the embedding step; yields the mocks."""
    document = Document(
        document_id="doc-1",
        user_id="user-1",
        filename="a.pdf",
        file_type="pdf",
        size_bytes=10,
        storage_key="k",
        status=DocumentStatus.PROCESSING.value,
    )
    db = MagicMock()
    db.exec = AsyncMock(return_value=MagicMock(one_or_none=MagicMock(return_value=document)))

    @asynccontextmanager
    async def session_maker():
        yield db

    storage = MagicMock(download_file=AsyncMock(return_value=b"%PDF"))
    milvus = MagicMock()
    embedding = MagicMock(embed_batch=AsyncMock(return_value=[[0.1]]))

    with (
        patch("app.tasks.document_processing.async_session_maker", session_maker),
        patch("app.tasks.document_processing.get_b2_service", new=AsyncMock(return_value=storage)),
        patch("app.tasks.document_processing.extract_text", return_value="some text"),
        patch(
            "app.tasks.document_processing.create_chunks_with_metadata",
            return_value=[{"text": "some text", "chunk_index": 0}],
        ),
        patch("app.tasks.document_processing.get_milvus_service", new=AsyncMock(return_value=milvus)),
        patch(
            "app.tasks.document_processing.get_embedding_service",
            new=AsyncMock(return_value=embedding),
        ),
        patch("app.tasks.document_processing._mark_document_error", new=AsyncMock()) as mark_error,
    ):

        class Mocks:
            pass

        mocks = Mocks()
        mocks.milvus = milvus
        mocks.embedding = embedding
        mocks.mark_error = mark_error
        mocks.document = document
        yield mocks


@pytest.mark.asyncio
async def test_unusable_index_fails_before_any_embedding_call(worker):
    """If the vector index was built with another model, no embedding calls are wasted."""
    worker.milvus.ensure_index_usable.side_effect = RuntimeError("index built with other model")

    result = await process_document({}, "doc-1", "user-1")

    assert result == {"status": "error", "error": "index built with other model"}
    worker.embedding.embed_batch.assert_not_called()
    worker.mark_error.assert_awaited_once()
    assert "other model" in worker.mark_error.await_args.args[2]


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error", [ProviderRateLimitError("quota"), ProviderUnavailableError("overloaded")]
)
async def test_transient_embedding_errors_are_retried_later(worker, error):
    """Rate limits and outages are transient: the job is re-queued, not marked failed."""
    worker.embedding.embed_batch.side_effect = error

    with pytest.raises(Retry):
        await process_document({}, "doc-1", "user-1")

    worker.mark_error.assert_not_called()


@pytest.mark.asyncio
async def test_a_rejected_embedding_key_fails_the_document_without_retrying(worker):
    """A bad API key will not fix itself, so the document is marked failed with the reason."""
    worker.embedding.embed_batch.side_effect = ProviderAuthError("bad key")

    result = await process_document({}, "doc-1", "user-1")

    assert result["status"] == "error"
    assert "Embedding generation failed" in result["error"]
    worker.mark_error.assert_awaited_once()
