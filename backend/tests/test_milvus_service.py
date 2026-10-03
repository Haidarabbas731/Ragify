"""
Tests for the Milvus vector service.

The first group mocks the `MilvusClient` to check what the service asks it to do (filters,
payloads, error handling). The last group runs the real service against a throwaway Milvus Lite
file, so search, user isolation and deletion are tested against an actual vector store without
touching the application's data.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings
from app.services.milvus_service import MilvusService, get_milvus_service


@pytest.fixture
def milvus_service():
    """Service wired to a mocked client, as if already connected."""
    service = MilvusService()
    service.client = MagicMock()
    return service


@pytest.fixture
def sample_chunks():
    """Sample chunk data for testing."""
    return {
        "chunk_ids": ["chunk-1", "chunk-2", "chunk-3"],
        "user_id": "user-123",
        "document_id": "doc-456",
        "embeddings": [[0.1] * 1024, [0.2] * 1024, [0.3] * 1024],
        "chunk_texts": ["Text chunk 1", "Text chunk 2", "Text chunk 3"],
        "chunk_indices": [0, 1, 2],
        "collection_id": "coll-789",
    }


@pytest.fixture
def state():
    """Mock the database-backed embedding fingerprint; yields (get_state, set_state)."""
    with (
        patch("app.services.milvus_service.get_state", new=AsyncMock(return_value=None)) as get,
        patch("app.services.milvus_service.set_state", new=AsyncMock()) as set_,
    ):
        yield get, set_


# --------------------------------------------------------------------------- connect


@pytest.mark.asyncio
async def test_connect_success():
    """Connecting builds a client from the configured URI and prepares the collection."""
    with (
        patch("app.services.milvus_service.MilvusClient") as client_class,
        patch.object(MilvusService, "_init_collection", new=AsyncMock()) as init,
        patch.object(settings, "VECTOR_DB_URI", "./some.db"),
        patch.object(settings, "VECTOR_DB_TOKEN", ""),
    ):
        service = MilvusService()
        result = await service.connect()

    assert result is True
    assert service.client is client_class.return_value
    client_class.assert_called_once_with(uri="./some.db")
    init.assert_awaited_once()


@pytest.mark.asyncio
async def test_connect_passes_token_when_set():
    """A remote cluster token is forwarded; local files get none."""
    with (
        patch("app.services.milvus_service.MilvusClient") as client_class,
        patch.object(MilvusService, "_init_collection", new=AsyncMock()),
        patch.object(settings, "VECTOR_DB_URI", "https://cluster.example"),
        patch.object(settings, "VECTOR_DB_TOKEN", "secret-token"),
    ):
        await MilvusService().connect()

    client_class.assert_called_once_with(uri="https://cluster.example", token="secret-token")


@pytest.mark.asyncio
async def test_connect_failure():
    """A failing connection raises and leaves the service disconnected."""
    with patch(
        "app.services.milvus_service.MilvusClient", side_effect=Exception("Connection refused")
    ):
        service = MilvusService()
        with pytest.raises(Exception, match="Connection refused"):
            await service.connect()

    assert service.client is None


# ---------------------------------------------------------------- collection setup


@pytest.mark.asyncio
async def test_init_collection_creates_new(milvus_service, state):
    """A missing collection is created with an index, loaded, and its fingerprint recorded."""
    _, set_ = state
    milvus_service.client.has_collection.return_value = False

    with patch("app.services.milvus_service.MilvusClient.create_schema") as create_schema:
        await milvus_service._init_collection()

    schema = create_schema.return_value
    field_names = [call.args[0] for call in schema.add_field.call_args_list]
    assert field_names == [
        "chunk_id",
        "user_id",
        "document_id",
        "collection_id",
        "embedding",
        "chunk_text",
        "chunk_index",
    ]
    milvus_service.client.create_collection.assert_called_once()
    milvus_service.client.load_collection.assert_called_once_with(milvus_service.collection_name)
    set_.assert_awaited_once()


@pytest.mark.asyncio
async def test_init_collection_uses_existing(milvus_service, state):
    """An existing, matching collection is loaded, not recreated."""
    get, _ = state
    get.return_value = settings.embedding_fingerprint
    milvus_service.client.has_collection.return_value = True
    milvus_service.client.get_collection_stats.return_value = {"row_count": 10}

    await milvus_service._init_collection()

    milvus_service.client.create_collection.assert_not_called()
    milvus_service.client.load_collection.assert_called_once_with(milvus_service.collection_name)


@pytest.mark.asyncio
async def test_operations_require_connection(sample_chunks):
    """Every operation refuses to run before connect()."""
    service = MilvusService()

    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.insert_chunks(**sample_chunks)
    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.search_similar("user-123", [0.1] * 1024)
    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.delete_document_chunks("doc-456")
    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.delete_user_data("user-123")


# ------------------------------------------------------------------------- insert


@pytest.mark.asyncio
async def test_insert_chunks_success(milvus_service, sample_chunks):
    """Chunks are sent as one row per chunk, with a null collection when none is given."""
    result = await milvus_service.insert_chunks(**sample_chunks)

    assert result is True
    kwargs = milvus_service.client.insert.call_args.kwargs
    assert kwargs["collection_name"] == milvus_service.collection_name
    rows = kwargs["data"]
    assert [row["chunk_id"] for row in rows] == ["chunk-1", "chunk-2", "chunk-3"]
    assert all(row["user_id"] == "user-123" for row in rows)
    assert all(row["collection_id"] == "coll-789" for row in rows)
    assert rows[1]["chunk_text"] == "Text chunk 2"
    assert rows[2]["chunk_index"] == 2


@pytest.mark.asyncio
async def test_insert_chunks_without_collection_stores_null(milvus_service, sample_chunks):
    """No collection means NULL, not an empty string."""
    sample_chunks["collection_id"] = None

    await milvus_service.insert_chunks(**sample_chunks)

    rows = milvus_service.client.insert.call_args.kwargs["data"]
    assert all(row["collection_id"] is None for row in rows)


@pytest.mark.asyncio
async def test_insert_chunks_mismatched_lengths(milvus_service):
    """Inputs of different lengths are rejected before anything is sent."""
    with pytest.raises(ValueError, match="All input lists must have the same length"):
        await milvus_service.insert_chunks(
            chunk_ids=["chunk-1", "chunk-2"],
            user_id="user-123",
            document_id="doc-456",
            embeddings=[[0.1] * 1024],  # only one embedding for two chunks
            chunk_texts=["Text 1", "Text 2"],
            chunk_indices=[0, 1],
        )

    milvus_service.client.insert.assert_not_called()


@pytest.mark.asyncio
async def test_insert_chunks_api_failure(milvus_service, sample_chunks):
    """Errors from Milvus propagate to the caller."""
    milvus_service.client.insert.side_effect = Exception("Storage full")

    with pytest.raises(Exception, match="Storage full"):
        await milvus_service.insert_chunks(**sample_chunks)


@pytest.mark.asyncio
async def test_insert_refused_when_index_built_with_another_model(milvus_service, sample_chunks):
    """A mismatched embedding index blocks writes."""
    milvus_service.index_mismatch = "built with other embeddings"

    with pytest.raises(RuntimeError, match="built with other embeddings"):
        await milvus_service.insert_chunks(**sample_chunks)

    milvus_service.client.insert.assert_not_called()


# ------------------------------------------------------------------------- search


def _hit(chunk_id: str, score: float, **extra) -> dict:
    entity = {
        "chunk_id": chunk_id,
        "document_id": "doc-456",
        "collection_id": None,
        "chunk_text": f"Text {chunk_id}",
        "chunk_index": 0,
        **extra,
    }
    return {"entity": entity, "distance": score}


@pytest.mark.asyncio
async def test_search_similar_success(milvus_service):
    """Hits are flattened into plain dicts with a score."""
    milvus_service.client.search.return_value = [[_hit("chunk-1", 0.95), _hit("chunk-2", 0.85)]]

    results = await milvus_service.search_similar("user-123", [0.5] * 1024, top_k=2)

    assert [r["chunk_id"] for r in results] == ["chunk-1", "chunk-2"]
    assert results[0]["score"] == 0.95
    assert results[0]["chunk_text"] == "Text chunk-1"
    assert milvus_service.client.search.call_args.kwargs["limit"] == 2


@pytest.mark.asyncio
async def test_search_similar_with_filters(milvus_service):
    """Document and collection filters are added to the user filter."""
    milvus_service.client.search.return_value = [[]]

    await milvus_service.search_similar(
        "user-123",
        [0.5] * 1024,
        document_ids=["doc-1", "doc-2"],
        collection_id="coll-9",
    )

    expression = milvus_service.client.search.call_args.kwargs["filter"]
    assert "user_id == 'user-123'" in expression
    assert "collection_id == 'coll-9'" in expression
    assert "document_id == 'doc-1'" in expression
    assert "document_id == 'doc-2'" in expression


@pytest.mark.asyncio
async def test_search_similar_api_failure(milvus_service):
    """Search errors propagate."""
    milvus_service.client.search.side_effect = Exception("Search failed")

    with pytest.raises(Exception, match="Search failed"):
        await milvus_service.search_similar("user-123", [0.5] * 1024)


@pytest.mark.asyncio
async def test_search_always_filters_by_user(milvus_service):
    """Each search is restricted to the asking user's own chunks."""
    milvus_service.client.search.return_value = [[]]

    await milvus_service.search_similar("user-123", [0.5] * 1024)
    assert "user_id == 'user-123'" in milvus_service.client.search.call_args.kwargs["filter"]

    await milvus_service.search_similar("user-456", [0.5] * 1024)
    assert "user_id == 'user-456'" in milvus_service.client.search.call_args.kwargs["filter"]


# ------------------------------------------------------------------------- delete


@pytest.mark.asyncio
async def test_delete_document_chunks_success(milvus_service):
    """Deleting a document filters on its id."""
    assert await milvus_service.delete_document_chunks("doc-456") is True

    kwargs = milvus_service.client.delete.call_args.kwargs
    assert kwargs["collection_name"] == milvus_service.collection_name
    assert kwargs["filter"] == "document_id == 'doc-456'"


@pytest.mark.asyncio
async def test_delete_user_data_success(milvus_service):
    """Deleting a user's data filters on their id."""
    assert await milvus_service.delete_user_data("user-123") is True

    assert milvus_service.client.delete.call_args.kwargs["filter"] == "user_id == 'user-123'"


# --------------------------------------------------------------------- read chunks


@pytest.mark.asyncio
async def test_get_document_chunks_sorted_by_index(milvus_service):
    """Chunks come back in document order, scoped to the user."""
    milvus_service.client.query.return_value = [
        {"chunk_id": "b", "chunk_text": "second", "chunk_index": 1},
        {"chunk_id": "a", "chunk_text": "first", "chunk_index": 0},
    ]

    chunks = await milvus_service.get_document_chunks("doc-456", "user-123")

    assert [c["chunk_id"] for c in chunks] == ["a", "b"]
    expression = milvus_service.client.query.call_args.kwargs["filter"]
    assert "doc-456" in expression
    assert "user-123" in expression


@pytest.mark.asyncio
async def test_get_document_chunks_returns_empty_on_error(milvus_service):
    """A read failure is logged and yields an empty list, not an exception."""
    milvus_service.client.query.side_effect = Exception("down")

    assert await milvus_service.get_document_chunks("doc-456", "user-123") == []


@pytest.mark.asyncio
async def test_get_document_chunk_count(milvus_service):
    """The count is the number of rows returned for the document."""
    milvus_service.client.query.return_value = [{"chunk_id": "a"}, {"chunk_id": "b"}]
    assert await milvus_service.get_document_chunk_count("doc-456") == 2

    milvus_service.client.query.return_value = []
    assert await milvus_service.get_document_chunk_count("doc-456") == 0


# ------------------------------------------------------------------ drop / recreate


@pytest.mark.asyncio
async def test_drop_and_recreate_collection(milvus_service, state):
    """An existing collection is dropped, then created again."""
    milvus_service.client.has_collection.side_effect = [True, False]

    with patch("app.services.milvus_service.MilvusClient.create_schema"):
        assert await milvus_service.drop_and_recreate_collection() is True

    milvus_service.client.drop_collection.assert_called_once_with(milvus_service.collection_name)
    milvus_service.client.create_collection.assert_called_once()


@pytest.mark.asyncio
async def test_drop_and_recreate_when_collection_missing(milvus_service, state):
    """A missing collection is simply created."""
    milvus_service.client.has_collection.return_value = False

    with patch("app.services.milvus_service.MilvusClient.create_schema"):
        assert await milvus_service.drop_and_recreate_collection() is True

    milvus_service.client.drop_collection.assert_not_called()
    milvus_service.client.create_collection.assert_called_once()


# ---------------------------------------------------------------- disconnect / singleton


def test_disconnect_closes_the_client(milvus_service):
    """Disconnecting closes the client and clears it."""
    client = milvus_service.client

    milvus_service.disconnect()

    client.close.assert_called_once()
    assert milvus_service.client is None


def test_disconnect_when_not_connected_does_nothing():
    """Disconnecting twice, or before connecting, is harmless."""
    service = MilvusService()

    service.disconnect()

    assert service.client is None


@pytest.mark.asyncio
async def test_get_milvus_service_singleton():
    """The getter builds and connects one shared service."""
    get_milvus_service.reset()  # type: ignore[attr-defined]
    with patch("app.services.milvus_service.MilvusService") as service_class:
        instance = service_class.return_value
        instance.connect = AsyncMock(return_value=True)

        first = await get_milvus_service()
        second = await get_milvus_service()

        assert first is second
        service_class.assert_called_once()
        instance.connect.assert_awaited_once()
    get_milvus_service.reset()  # type: ignore[attr-defined]


# --------------------------------------------------- real store (throwaway Milvus Lite)


@pytest.fixture
async def real_service(tmp_path):
    """The real service on a temporary Milvus Lite file, with 4-dimensional vectors."""
    pytest.importorskip("milvus_lite")
    with (
        patch.object(settings, "VECTOR_DB_URI", str(tmp_path / "test.db")),
        patch.object(settings, "VECTOR_DB_TOKEN", ""),
        patch.object(settings, "MILVUS_COLLECTION", "test_chunks"),
        patch.object(settings, "EMBEDDING_DIMENSION", 4),
        patch("app.services.milvus_service.get_state", new=AsyncMock(return_value=None)),
        patch("app.services.milvus_service.set_state", new=AsyncMock()),
    ):
        service = MilvusService()
        await service.connect()
        yield service
        service.disconnect()
        # Stop the throwaway server now, not at interpreter exit when logging is already closed
        from milvus_lite.server_manager import server_manager_instance

        server_manager_instance.release_all()


async def _add(service, user_id, document_id, vectors, collection_id=None):
    await service.insert_chunks(
        chunk_ids=[f"{document_id}-{i}" for i in range(len(vectors))],
        user_id=user_id,
        document_id=document_id,
        embeddings=vectors,
        chunk_texts=[f"{document_id} passage {i}" for i in range(len(vectors))],
        chunk_indices=list(range(len(vectors))),
        collection_id=collection_id,
    )


@pytest.mark.asyncio
async def test_real_store_search_ranks_the_closest_chunk_first(real_service):
    """The nearest vector comes back first, with its text and a score."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0], [0, 1, 0, 0]])

    results = await real_service.search_similar("u1", [1, 0, 0, 0], top_k=2)

    assert results[0]["chunk_id"] == "doc-a-0"
    assert results[0]["chunk_text"] == "doc-a passage 0"
    assert results[0]["score"] > results[1]["score"]


@pytest.mark.asyncio
async def test_real_store_never_returns_another_users_chunks(real_service):
    """Search only sees the asking user's data, even for an identical vector."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0]])
    await _add(real_service, "u2", "doc-b", [[1, 0, 0, 0]])

    mine = await real_service.search_similar("u1", [1, 0, 0, 0], top_k=10)
    theirs = await real_service.search_similar("u2", [1, 0, 0, 0], top_k=10)

    assert {r["document_id"] for r in mine} == {"doc-a"}
    assert {r["document_id"] for r in theirs} == {"doc-b"}


@pytest.mark.asyncio
async def test_real_store_collection_and_document_filters(real_service):
    """Scoping a search to a collection or specific documents narrows the results."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0]], collection_id="c1")
    await _add(real_service, "u1", "doc-b", [[1, 0, 0, 0]], collection_id="c2")
    await _add(real_service, "u1", "doc-c", [[1, 0, 0, 0]])

    in_c1 = await real_service.search_similar("u1", [1, 0, 0, 0], collection_id="c1")
    only_b = await real_service.search_similar("u1", [1, 0, 0, 0], document_ids=["doc-b"])

    assert {r["document_id"] for r in in_c1} == {"doc-a"}
    assert {r["document_id"] for r in only_b} == {"doc-b"}


@pytest.mark.asyncio
async def test_real_store_chunks_and_counts(real_service):
    """Chunks come back ordered, and the count matches what was stored."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]])

    chunks = await real_service.get_document_chunks("doc-a", "u1")

    assert [c["chunk_index"] for c in chunks] == [0, 1, 2]
    assert await real_service.get_document_chunk_count("doc-a") == 3
    assert await real_service.get_document_chunks("doc-a", "someone-else") == []


@pytest.mark.asyncio
async def test_real_store_delete_document_and_user(real_service):
    """Deleting a document removes only its chunks; deleting a user removes all of theirs."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0]])
    await _add(real_service, "u1", "doc-b", [[0, 1, 0, 0]])
    await _add(real_service, "u2", "doc-c", [[0, 0, 1, 0]])

    await real_service.delete_document_chunks("doc-a")
    assert await real_service.get_document_chunk_count("doc-a") == 0
    assert await real_service.get_document_chunk_count("doc-b") == 1

    await real_service.delete_user_data("u1")
    assert await real_service.get_document_chunk_count("doc-b") == 0
    assert await real_service.get_document_chunk_count("doc-c") == 1


@pytest.mark.asyncio
async def test_real_store_drop_and_recreate_empties_the_index(real_service):
    """Dropping and recreating removes every stored vector."""
    await _add(real_service, "u1", "doc-a", [[1, 0, 0, 0]])

    await real_service.drop_and_recreate_collection()

    assert await real_service.get_document_chunk_count("doc-a") == 0
