import io
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import pytest
from fastapi import UploadFile

from app.services.b2_service import B2Service, get_b2_service


@pytest.fixture
def b2_service():
    """Create a B2Service instance with mocked API."""
    service = B2Service()
    service._authorized = True
    service._bucket = MagicMock()
    return service


@pytest.fixture
def mock_upload_file():
    """Create a mock UploadFile for testing."""
    file_content = b"test file content"
    file = Mock(spec=UploadFile)
    file.filename = "test.pdf"
    file.read = AsyncMock(return_value=file_content)
    file.seek = AsyncMock(return_value=None)
    return file


@pytest.mark.asyncio
async def test_authorize_success():
    """Test successful B2 authorization."""
    with patch("app.services.b2_service.B2Api") as MockB2Api:
        mock_api = MockB2Api.return_value
        mock_bucket = MagicMock()
        mock_api.get_bucket_by_name.return_value = mock_bucket

        service = B2Service()
        result = await service.authorize()

        assert result is True
        assert service._authorized is True
        assert service._bucket is mock_bucket
        mock_api.authorize_account.assert_called_once()


@pytest.mark.asyncio
async def test_authorize_failure():
    """Test B2 authorization failure."""
    with patch("app.services.b2_service.B2Api") as MockB2Api:
        mock_api = MockB2Api.return_value
        mock_api.authorize_account.side_effect = Exception("Invalid credentials")

        service = B2Service()

        with pytest.raises(Exception, match="Invalid credentials"):
            await service.authorize()

        assert service._authorized is False


@pytest.mark.asyncio
async def test_upload_file_success(b2_service, mock_upload_file):
    """Test successful file upload to B2."""
    user_id = "test-user-123"
    expected_content = b"test file content"

    b2_service._bucket.upload_bytes.return_value = MagicMock()

    storage_key = await b2_service.upload_file(mock_upload_file, user_id)

    assert storage_key.startswith(f"documents/{user_id}/")
    assert storage_key.endswith("-test.pdf")
    b2_service._bucket.upload_bytes.assert_called_once()

    call_args = b2_service._bucket.upload_bytes.call_args
    assert call_args[1]["data_bytes"] == expected_content
    assert call_args[1]["file_name"] == storage_key

    mock_upload_file.seek.assert_called_once_with(0)


@pytest.mark.asyncio
async def test_upload_file_not_authorized(mock_upload_file):
    """Test upload fails when not authorized."""
    service = B2Service()
    service._authorized = False

    with pytest.raises(RuntimeError, match="B2 not authorized"):
        await service.upload_file(mock_upload_file, "test-user-123")


@pytest.mark.asyncio
async def test_upload_file_api_failure(b2_service, mock_upload_file):
    """Test upload handles B2 API errors."""
    b2_service._bucket.upload_bytes.side_effect = Exception("Network error")

    with pytest.raises(Exception, match="Network error"):
        await b2_service.upload_file(mock_upload_file, "test-user-123")

    mock_upload_file.seek.assert_called_once_with(0)


@pytest.mark.asyncio
async def test_generate_presigned_url_success(b2_service):
    """Test presigned URL generation."""
    storage_key = "documents/user-123/test.pdf"
    download_url = "https://f000.backblazeb2.com/file/bucket/documents/user-123/test.pdf"
    auth_token = "test-token-12345"

    b2_service.api.get_download_url_for_file_name = Mock(return_value=download_url)
    b2_service.api.get_download_authorization = Mock(return_value=auth_token)

    result = await b2_service.generate_presigned_url(storage_key, expiration=900)

    assert result == f"{download_url}?Authorization={auth_token}"
    b2_service.api.get_download_url_for_file_name.assert_called_once()
    b2_service.api.get_download_authorization.assert_called_once()


@pytest.mark.asyncio
async def test_generate_presigned_url_not_authorized():
    """Test presigned URL fails when not authorized."""
    service = B2Service()
    service._authorized = False

    with pytest.raises(RuntimeError, match="B2 not authorized"):
        await service.generate_presigned_url("test-key")


@pytest.mark.asyncio
async def test_download_file_success(b2_service):
    """Test successful file download from B2."""
    storage_key = "documents/user-123/test.pdf"
    expected_content = b"downloaded file content"

    mock_download = MagicMock()
    mock_download.save_to = Mock()
    b2_service._bucket.download_file_by_name = Mock(return_value=mock_download)

    with patch("builtins.open", MagicMock(return_value=io.BytesIO(expected_content))):
        with patch("tempfile.NamedTemporaryFile", MagicMock(return_value=MagicMock(__enter__=lambda _: MagicMock(name="temp_file"), __exit__=lambda *_: None))):
            with patch("os.path.exists", return_value=True):
                with patch("os.unlink"):
                    content = await b2_service.download_file(storage_key)

    assert content == expected_content
    b2_service._bucket.download_file_by_name.assert_called_once_with(storage_key)


@pytest.mark.asyncio
async def test_download_file_not_authorized():
    """Test download fails when not authorized."""
    service = B2Service()
    service._authorized = False

    with pytest.raises(RuntimeError, match="B2 not authorized"):
        await service.download_file("test-key")


@pytest.mark.asyncio
async def test_delete_file_success(b2_service):
    """Test successful file deletion from B2."""
    storage_key = "documents/user-123/test.pdf"
    mock_file_info = MagicMock()
    mock_file_info.id_ = "file-version-id-123"

    b2_service._bucket.get_file_info_by_name = Mock(return_value=mock_file_info)
    b2_service.api.delete_file_version = Mock()

    result = await b2_service.delete_file(storage_key)

    assert result is True
    b2_service._bucket.get_file_info_by_name.assert_called_once_with(storage_key)
    b2_service.api.delete_file_version.assert_called_once_with("file-version-id-123", storage_key)


@pytest.mark.asyncio
async def test_delete_file_not_found(b2_service):
    """Test delete handles file not found gracefully."""
    storage_key = "documents/user-123/nonexistent.pdf"
    b2_service._bucket.get_file_info_by_name = Mock(side_effect=Exception("File not found"))

    result = await b2_service.delete_file(storage_key)

    assert result is True


@pytest.mark.asyncio
async def test_delete_file_not_authorized():
    """Test delete fails when not authorized."""
    service = B2Service()
    service._authorized = False

    with pytest.raises(RuntimeError, match="B2 not authorized"):
        await service.delete_file("test-key")


@pytest.mark.asyncio
async def test_list_all_files_success(b2_service):
    """Test listing all files in bucket."""
    mock_file_1 = MagicMock()
    mock_file_1.file_name = "documents/user-1/file1.pdf"
    mock_file_2 = MagicMock()
    mock_file_2.file_name = "documents/user-2/file2.txt"

    b2_service._bucket.ls = Mock(return_value=[
        (mock_file_1, None),
        (mock_file_2, None),
    ])

    result = await b2_service.list_all_files()

    assert len(result) == 2
    assert "documents/user-1/file1.pdf" in result
    assert "documents/user-2/file2.txt" in result


@pytest.mark.asyncio
async def test_list_all_files_empty(b2_service):
    """Test listing files when bucket is empty."""
    b2_service._bucket.ls = Mock(return_value=[])

    result = await b2_service.list_all_files()

    assert len(result) == 0
    assert result == []


@pytest.mark.asyncio
async def test_delete_all_files_success(b2_service):
    """Test deleting all files from bucket."""
    mock_files = ["file1.pdf", "file2.txt", "file3.docx"]
    b2_service._bucket.ls = Mock(return_value=[
        (MagicMock(file_name=name), None) for name in mock_files
    ])

    mock_file_info = MagicMock()
    mock_file_info.id_ = "test-id"
    b2_service._bucket.get_file_info_by_name = Mock(return_value=mock_file_info)
    b2_service.api.delete_file_version = Mock()

    deleted_count, errors = await b2_service.delete_all_files()

    assert deleted_count == 3
    assert len(errors) == 0
    assert b2_service.api.delete_file_version.call_count == 3


@pytest.mark.asyncio
async def test_delete_all_files_with_partial_failure(b2_service):
    """Test delete all files handles partial failures."""
    mock_files = ["file1.pdf", "file2.txt", "file3.docx"]
    b2_service._bucket.ls = Mock(return_value=[
        (MagicMock(file_name=name), None) for name in mock_files
    ])

    mock_file_info = MagicMock()
    mock_file_info.id_ = "test-id"

    def mock_get_file_info(name):
        if name == "file2.txt":
            raise Exception("Access denied")
        return mock_file_info

    b2_service._bucket.get_file_info_by_name = Mock(side_effect=mock_get_file_info)
    b2_service.api.delete_file_version = Mock()

    deleted_count, errors = await b2_service.delete_all_files()

    assert deleted_count == 2
    assert len(errors) == 1
    assert "file2.txt" in errors[0]


@pytest.mark.asyncio
async def test_delete_all_files_empty_bucket(b2_service):
    """Test delete all files when bucket is already empty."""
    b2_service._bucket.ls = Mock(return_value=[])

    deleted_count, errors = await b2_service.delete_all_files()

    assert deleted_count == 0
    assert len(errors) == 0


@pytest.mark.asyncio
async def test_get_b2_service_singleton():
    """Test B2 service singleton pattern."""
    with patch("app.services.b2_service.B2Service") as MockB2Service:
        mock_instance = MockB2Service.return_value
        mock_instance.authorize = AsyncMock(return_value=True)

        service1 = await get_b2_service()
        service2 = await get_b2_service()

        assert service1 is service2
        MockB2Service.assert_called_once()
        mock_instance.authorize.assert_called_once()
