"""
Unit tests for the embedding-model guard on the Milvus collection.

A collection records which embedding model and dimension built it; opening it with a
different configuration must fail loudly instead of mixing incompatible vectors.
"""

from unittest.mock import MagicMock

import pytest

from app.core.config import settings
from app.services.milvus_service import MilvusService


@pytest.fixture
def milvus():
    """MilvusService with a mocked client."""
    service = MilvusService()
    service.client = MagicMock()
    return service


def test_fingerprint_is_model_and_dimension():
    """The fingerprint combines the configured model and dimension."""
    assert settings.embedding_fingerprint == (
        f"{settings.EMBEDDING_MODEL}:{settings.EMBEDDING_DIMENSION}"
    )


@pytest.mark.asyncio
async def test_existing_collection_with_matching_fingerprint_is_loaded(milvus):
    """A collection built with the current embedding setup loads normally."""
    milvus.client.has_collection.return_value = True
    milvus.client.describe_collection.return_value = {"description": settings.embedding_fingerprint}

    await milvus._init_collection()

    milvus.client.load_collection.assert_called_once_with(milvus.collection_name)
    milvus.client.create_collection.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("built_with", ["models/gemini-embedding-001:1024", "", None])
async def test_existing_collection_with_other_fingerprint_is_refused(milvus, built_with):
    """A collection from another model (or an unlabeled one) is refused with clear guidance."""
    milvus.client.has_collection.return_value = True
    milvus.client.describe_collection.return_value = {"description": built_with}

    with pytest.raises(RuntimeError, match="drop the collection and re-upload"):
        await milvus._init_collection()

    milvus.client.load_collection.assert_not_called()


@pytest.mark.asyncio
async def test_new_collection_records_the_fingerprint(milvus):
    """Creating a collection stores the fingerprint in its description."""
    milvus.client.has_collection.return_value = False

    await milvus._init_collection()

    schema = milvus.client.create_collection.call_args.kwargs["schema"]
    assert schema.description == settings.embedding_fingerprint
