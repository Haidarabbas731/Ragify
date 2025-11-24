from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest

from app.services.milvus_service import MilvusService, get_milvus_service


@pytest.fixture
def milvus_service():
    """Create a Milvus service instance with mocked connection."""
    service = MilvusService()
    service._connected = True
    service.collection = MagicMock()
    return service


@pytest.fixture
def sample_chunks():
    """Create sample chunk data for testing."""
    return {
        "chunk_ids": ["chunk-1", "chunk-2", "chunk-3"],
        "user_id": "user-123",
        "document_id": "doc-456",
        "embeddings": [[0.1] * 1024, [0.2] * 1024, [0.3] * 1024],
        "chunk_texts": ["Text chunk 1", "Text chunk 2", "Text chunk 3"],
        "chunk_indices": [0, 1, 2],
    }


@pytest.mark.asyncio
async def test_connect_success():
    """Test successful Milvus connection."""
    with patch("app.services.milvus_service.connections") as mock_connections:
        with patch("app.services.milvus_service.utility") as mock_utility:
            mock_utility.has_collection.return_value = True
            with patch("app.services.milvus_service.Collection"):
                service = MilvusService()
                result = await service.connect()

                assert result is True
                assert service._connected is True
                mock_connections.connect.assert_called_once()


@pytest.mark.asyncio
async def test_connect_failure():
    """Test Milvus connection failure."""
    with patch("app.services.milvus_service.connections") as mock_connections:
        mock_connections.connect.side_effect = Exception("Connection refused")

        service = MilvusService()

        with pytest.raises(Exception, match="Connection refused"):
            await service.connect()

        assert service._connected is False


@pytest.mark.asyncio
async def test_init_collection_creates_new():
    """Test collection creation when it doesn't exist."""
    with patch("app.services.milvus_service.utility") as mock_utility:
        with patch("app.services.milvus_service.Collection") as MockCollection:
            with patch("app.services.milvus_service.CollectionSchema") as MockSchema:
                mock_utility.has_collection.return_value = False
                mock_collection_instance = MagicMock()
                MockCollection.return_value = mock_collection_instance

                service = MilvusService()
                service._connected = True
                await service._init_collection()

                MockSchema.assert_called_once()
                MockCollection.assert_called_once()
                mock_collection_instance.create_index.assert_called_once()


@pytest.mark.asyncio
async def test_init_collection_uses_existing():
    """Test using existing collection."""
    with patch("app.services.milvus_service.utility") as mock_utility:
        with patch("app.services.milvus_service.Collection") as MockCollection:
            mock_utility.has_collection.return_value = True
            mock_collection_instance = MagicMock()
            MockCollection.return_value = mock_collection_instance

            service = MilvusService()
            service._connected = True
            await service._init_collection()

            MockCollection.assert_called_once()
            assert service.collection is mock_collection_instance


@pytest.mark.asyncio
async def test_insert_chunks_success(milvus_service, sample_chunks):
    """Test successful chunk insertion."""
    milvus_service.collection.insert = Mock()
    milvus_service.collection.flush = Mock()

    result = await milvus_service.insert_chunks(**sample_chunks)

    assert result is True
    milvus_service.collection.insert.assert_called_once()
    milvus_service.collection.flush.assert_called_once()


@pytest.mark.asyncio
async def test_insert_chunks_not_connected(sample_chunks):
    """Test insert fails when not connected."""
    service = MilvusService()
    service._connected = False

    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.insert_chunks(**sample_chunks)


@pytest.mark.asyncio
async def test_insert_chunks_mismatched_lengths(milvus_service):
    """Test insert fails with mismatched input lengths."""
    with pytest.raises(ValueError, match="All input lists must have the same length"):
        await milvus_service.insert_chunks(
            chunk_ids=["chunk-1", "chunk-2"],
            user_id="user-123",
            document_id="doc-456",
            embeddings=[[0.1] * 1024],  # Only 1 embedding for 2 chunks
            chunk_texts=["Text 1", "Text 2"],
            chunk_indices=[0, 1],
        )


@pytest.mark.asyncio
async def test_insert_chunks_api_failure(milvus_service, sample_chunks):
    """Test insert handles Milvus API errors."""
    milvus_service.collection.insert.side_effect = Exception("Storage full")

    with pytest.raises(Exception, match="Storage full"):
        await milvus_service.insert_chunks(**sample_chunks)


@pytest.mark.asyncio
async def test_search_similar_success(milvus_service):
    """Test successful similarity search."""
    query_embedding = [0.5] * 1024
    user_id = "user-123"

    # Mock search results
    mock_hit_1 = MagicMock()
    mock_hit_1.entity.get = Mock(side_effect=lambda key: {
        "chunk_id": "chunk-1",
        "document_id": "doc-456",
        "chunk_text": "Text chunk 1",
        "chunk_index": 0,
    }.get(key))
    mock_hit_1.score = 0.95

    mock_hit_2 = MagicMock()
    mock_hit_2.entity.get = Mock(side_effect=lambda key: {
        "chunk_id": "chunk-2",
        "document_id": "doc-456",
        "chunk_text": "Text chunk 2",
        "chunk_index": 1,
    }.get(key))
    mock_hit_2.score = 0.87

    mock_hits = [mock_hit_1, mock_hit_2]
    milvus_service.collection.load = Mock()
    milvus_service.collection.search = Mock(return_value=[mock_hits])

    results = await milvus_service.search_similar(user_id, query_embedding, top_k=2)

    assert len(results) == 2
    assert results[0]["chunk_id"] == "chunk-1"
    assert results[0]["score"] == 0.95
    assert results[1]["chunk_id"] == "chunk-2"
    assert results[1]["score"] == 0.87

    milvus_service.collection.load.assert_called_once()
    milvus_service.collection.search.assert_called_once()


@pytest.mark.asyncio
async def test_search_similar_with_document_filter(milvus_service):
    """Test search with document ID filter."""
    query_embedding = [0.5] * 1024
    user_id = "user-123"
    document_ids = ["doc-456", "doc-789"]

    milvus_service.collection.load = Mock()
    milvus_service.collection.search = Mock(return_value=[[]])

    await milvus_service.search_similar(
        user_id, query_embedding, top_k=5, document_ids=document_ids
    )

    # Verify search was called with document filter
    call_args = milvus_service.collection.search.call_args
    expr = call_args[1]["expr"]
    assert "user_id == 'user-123'" in expr
    assert "document_id == 'doc-456'" in expr
    assert "document_id == 'doc-789'" in expr


@pytest.mark.asyncio
async def test_search_similar_not_connected():
    """Test search fails when not connected."""
    service = MilvusService()
    service._connected = False

    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.search_similar("user-123", [0.5] * 1024)


@pytest.mark.asyncio
async def test_search_similar_api_failure(milvus_service):
    """Test search handles Milvus API errors."""
    milvus_service.collection.load = Mock()
    milvus_service.collection.search = Mock(side_effect=Exception("Index not loaded"))

    with pytest.raises(Exception, match="Index not loaded"):
        await milvus_service.search_similar("user-123", [0.5] * 1024)


@pytest.mark.asyncio
async def test_delete_document_chunks_success(milvus_service):
    """Test successful document chunk deletion."""
    document_id = "doc-456"

    milvus_service.collection.delete = Mock()
    milvus_service.collection.flush = Mock()

    result = await milvus_service.delete_document_chunks(document_id)

    assert result is True
    milvus_service.collection.delete.assert_called_once()
    milvus_service.collection.flush.assert_called_once()


@pytest.mark.asyncio
async def test_delete_document_chunks_not_connected():
    """Test delete fails when not connected."""
    service = MilvusService()
    service._connected = False

    with pytest.raises(RuntimeError, match="Milvus not connected"):
        await service.delete_document_chunks("doc-456")


@pytest.mark.asyncio
async def test_delete_user_data_success(milvus_service):
    """Test successful user data deletion."""
    user_id = "user-123"

    milvus_service.collection.delete = Mock()
    milvus_service.collection.flush = Mock()

    result = await milvus_service.delete_user_data(user_id)

    assert result is True
    milvus_service.collection.delete.assert_called_once()

    # Verify filter expression uses user_id
    call_args = milvus_service.collection.delete.call_args
    filter_expr = call_args[0][0]
    assert "user_id == 'user-123'" in filter_expr


@pytest.mark.asyncio
async def test_get_document_chunk_count_success(milvus_service):
    """Test getting document chunk count."""
    document_id = "doc-456"

    # Mock query result with 3 chunks
    mock_chunks = [
        {"chunk_id": "chunk-1"},
        {"chunk_id": "chunk-2"},
        {"chunk_id": "chunk-3"},
    ]
    milvus_service.collection.query = Mock(return_value=mock_chunks)

    count = await milvus_service.get_document_chunk_count(document_id)

    assert count == 3
    milvus_service.collection.query.assert_called_once()


@pytest.mark.asyncio
async def test_get_document_chunk_count_zero(milvus_service):
    """Test chunk count when document has no chunks."""
    milvus_service.collection.query = Mock(return_value=[])

    count = await milvus_service.get_document_chunk_count("doc-789")

    assert count == 0


@pytest.mark.asyncio
async def test_drop_and_recreate_collection_success(milvus_service):
    """Test dropping and recreating collection."""
    with patch("app.services.milvus_service.utility") as mock_utility:
        with patch("app.services.milvus_service.Collection") as MockCollection:
            with patch("app.services.milvus_service.CollectionSchema"):
                mock_utility.has_collection.return_value = True
                mock_utility.drop_collection = Mock()
                MockCollection.return_value = MagicMock()

                result = await milvus_service.drop_and_recreate_collection()

                assert result is True
                mock_utility.drop_collection.assert_called_once()
                MockCollection.assert_called()


@pytest.mark.asyncio
async def test_drop_and_recreate_collection_not_exists(milvus_service):
    """Test recreating collection when it doesn't exist."""
    with patch("app.services.milvus_service.utility") as mock_utility:
        with patch("app.services.milvus_service.Collection") as MockCollection:
            with patch("app.services.milvus_service.CollectionSchema"):
                mock_utility.has_collection.return_value = False
                mock_utility.drop_collection = Mock()
                MockCollection.return_value = MagicMock()

                result = await milvus_service.drop_and_recreate_collection()

                assert result is True
                mock_utility.drop_collection.assert_not_called()
                MockCollection.assert_called()


@pytest.mark.asyncio
async def test_disconnect(milvus_service):
    """Test Milvus disconnection."""
    with patch("app.services.milvus_service.connections") as mock_connections:
        milvus_service.disconnect()

        assert milvus_service._connected is False
        mock_connections.disconnect.assert_called_once_with(alias="default")


@pytest.mark.asyncio
async def test_disconnect_when_not_connected():
    """Test disconnect when already disconnected."""
    with patch("app.services.milvus_service.connections") as mock_connections:
        service = MilvusService()
        service._connected = False

        service.disconnect()

        mock_connections.disconnect.assert_not_called()


@pytest.mark.asyncio
async def test_get_milvus_service_singleton():
    """Test Milvus service singleton pattern."""
    with patch("app.services.milvus_service.MilvusService") as MockMilvusService:
        mock_instance = MockMilvusService.return_value
        mock_instance.connect = AsyncMock(return_value=True)

        service1 = await get_milvus_service()
        service2 = await get_milvus_service()

        assert service1 is service2
        MockMilvusService.assert_called_once()
        mock_instance.connect.assert_called_once()


@pytest.mark.asyncio
async def test_user_data_isolation(milvus_service):
    """Test that search respects user data isolation."""
    user_id_1 = "user-123"
    user_id_2 = "user-456"
    query_embedding = [0.5] * 1024

    milvus_service.collection.load = Mock()
    milvus_service.collection.search = Mock(return_value=[[]])

    # Search for user 1
    await milvus_service.search_similar(user_id_1, query_embedding)

    # Verify filter includes user_id_1
    call_args = milvus_service.collection.search.call_args
    expr = call_args[1]["expr"]
    assert f"user_id == '{user_id_1}'" in expr

    # Search for user 2
    await milvus_service.search_similar(user_id_2, query_embedding)

    # Verify filter includes user_id_2
    call_args = milvus_service.collection.search.call_args
    expr = call_args[1]["expr"]
    assert f"user_id == '{user_id_2}'" in expr
