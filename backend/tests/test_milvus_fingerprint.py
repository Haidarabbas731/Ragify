"""
Unit tests for the embedding-model guard on the Milvus collection.

The fingerprint (embedding model and dimension) is recorded in the database, because Milvus
Lite does not persist collection descriptions. Opening a non-empty index built with a
different setup is blocked instead of mixing incompatible vectors; an empty one is adopted.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings
from app.services.milvus_service import FINGERPRINT_KEY, MilvusService


@pytest.fixture
def milvus():
    """MilvusService with a mocked client that has an existing, loaded collection."""
    service = MilvusService()
    service.client = MagicMock()
    service.client.has_collection.return_value = True
    service.client.get_collection_stats.return_value = {"row_count": 0}
    return service


@pytest.fixture
def state():
    """Mock the database-backed state; yields (get_state, set_state) mocks."""
    with (
        patch("app.services.milvus_service.get_state", new=AsyncMock(return_value=None)) as get,
        patch("app.services.milvus_service.set_state", new=AsyncMock()) as set_,
    ):
        yield get, set_


def test_fingerprint_is_model_and_dimension():
    """The fingerprint combines the configured model and dimension."""
    assert settings.embedding_fingerprint == (
        f"{settings.EMBEDDING_MODEL}:{settings.EMBEDDING_DIMENSION}"
    )


@pytest.mark.asyncio
async def test_matching_record_loads_the_collection(milvus, state):
    """A collection recorded as built with the current setup loads normally."""
    get, set_ = state
    get.return_value = settings.embedding_fingerprint
    milvus.client.get_collection_stats.return_value = {"row_count": 500}

    await milvus._init_collection()

    assert milvus.index_mismatch is None
    milvus.client.load_collection.assert_called_once_with(milvus.collection_name)
    set_.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("recorded", ["models/gemini-embedding-001:1024", None])
async def test_non_empty_index_from_another_setup_is_flagged_not_fatal(milvus, state, recorded):
    """Existing vectors from another (or unknown) model block search, but connecting still works."""
    get, set_ = state
    get.return_value = recorded
    milvus.client.get_collection_stats.return_value = {"row_count": 12}

    await milvus._init_collection()  # must not raise: the cleanup has to be able to run

    assert (recorded or "unknown") in milvus.index_mismatch
    assert settings.embedding_fingerprint in milvus.index_mismatch
    assert "drop the collection and re-upload" in milvus.index_mismatch
    milvus.client.load_collection.assert_not_called()
    set_.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("recorded", ["models/gemini-embedding-001:1024", None])
async def test_empty_index_adopts_the_current_setup(milvus, state, recorded):
    """With nothing stored there is nothing to protect, so the new setup is just recorded."""
    get, set_ = state
    get.return_value = recorded
    milvus.client.get_collection_stats.return_value = {"row_count": 0}

    await milvus._init_collection()

    assert milvus.index_mismatch is None
    set_.assert_awaited_once_with(FINGERPRINT_KEY, settings.embedding_fingerprint)
    milvus.client.load_collection.assert_called_once_with(milvus.collection_name)


@pytest.mark.asyncio
async def test_a_new_collection_records_the_setup(milvus, state):
    """Creating a collection records which embedding setup it is for."""
    _, set_ = state
    milvus.client.has_collection.return_value = False

    await milvus._init_collection()

    milvus.client.create_collection.assert_called_once()
    set_.assert_awaited_once_with(FINGERPRINT_KEY, settings.embedding_fingerprint)


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
async def test_drop_and_recreate_clears_the_mismatch_and_records_the_setup(milvus, state):
    """The cleanup path rebuilds the collection and unblocks the index."""
    _, set_ = state
    milvus.index_mismatch = "built with other embeddings"
    milvus.client.has_collection.side_effect = [True, False]  # exists, then gone after drop

    await milvus.drop_and_recreate_collection()

    milvus.client.drop_collection.assert_called_once_with(milvus.collection_name)
    assert milvus.index_mismatch is None
    set_.assert_awaited_once_with(FINGERPRINT_KEY, settings.embedding_fingerprint)
    milvus.ensure_index_usable()  # no longer raises
