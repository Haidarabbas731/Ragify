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
async def test_existing_collection_with_other_fingerprint_is_flagged_not_fatal(milvus, built_with):
    """A collection from another model (or an unlabeled one) connects but is marked unusable."""
    milvus.client.has_collection.return_value = True
    milvus.client.describe_collection.return_value = {"description": built_with}

    await milvus._init_collection()  # must not raise: cleanup has to be able to run

    assert "drop the collection and re-upload" in milvus.index_mismatch
    assert settings.embedding_fingerprint in milvus.index_mismatch
    milvus.client.load_collection.assert_not_called()


@pytest.mark.asyncio
async def test_a_mismatched_index_refuses_search_and_insert_with_the_reason(milvus):
    """Reads and writes fail with the explanation instead of mixing incompatible vectors."""
    milvus.index_mismatch = "built with other embeddings"

    with pytest.raises(RuntimeError, match="built with other embeddings"):
        await milvus.search_similar("user-1", [0.1] * settings.EMBEDDING_DIMENSION)
    with pytest.raises(RuntimeError, match="built with other embeddings"):
        await milvus.insert_chunks(["c1"], "user-1", "doc-1", [[0.1]], ["t"], [0])
    with pytest.raises(RuntimeError, match="built with other embeddings"):
        milvus.ensure_index_usable()

    milvus.client.search.assert_not_called()
    milvus.client.insert.assert_not_called()


@pytest.mark.asyncio
async def test_drop_and_recreate_clears_the_mismatch(milvus):
    """The cleanup path rebuilds the collection with the current fingerprint and unblocks the index."""
    milvus.index_mismatch = "built with other embeddings"
    milvus.client.has_collection.side_effect = [True, False]  # exists, then gone after drop

    await milvus.drop_and_recreate_collection()

    milvus.client.drop_collection.assert_called_once_with(milvus.collection_name)
    assert milvus.index_mismatch is None
    assert milvus.client.create_collection.call_args.kwargs["schema"].description == (
        settings.embedding_fingerprint
    )
    milvus.ensure_index_usable()  # no longer raises


@pytest.mark.asyncio
async def test_new_collection_records_the_fingerprint(milvus):
    """Creating a collection stores the fingerprint in its description."""
    milvus.client.has_collection.return_value = False

    await milvus._init_collection()

    schema = milvus.client.create_collection.call_args.kwargs["schema"]
    assert schema.description == settings.embedding_fingerprint
