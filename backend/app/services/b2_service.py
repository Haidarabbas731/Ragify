import logging
import uuid

from b2sdk.v2 import B2Api, InMemoryAccountInfo
from fastapi import UploadFile

from app.core.config import settings

logger = logging.getLogger(__name__)


class B2Service:
    """Backblaze B2 storage service for file uploads and downloads."""

    def __init__(self):
        """Initialize B2 API client with credentials from settings."""
        self.info = InMemoryAccountInfo()
        self.api = B2Api(self.info)  # type:ignore
        self._authorized = False
        self._bucket = None

    async def authorize(self) -> bool:
        """
        Authorize B2 API with application credentials.

        Returns:
            bool: True if authorization successful

        Raises:
            Exception: If B2 credentials are invalid or connection fails
        """
        try:
            self.api.authorize_account(
                "production",
                settings.B2_APPLICATION_KEY_ID,
                settings.B2_APPLICATION_KEY,
            )
            self._bucket = self.api.get_bucket_by_name(settings.B2_BUCKET_NAME)
            self._authorized = True
            logger.info(
                f"B2 authorized successfully. Bucket: {settings.B2_BUCKET_NAME}"
            )
            return True
        except Exception as e:
            logger.error(f"B2 authorization failed: {e}")
            self._authorized = False
            raise

    def _ensure_authorized(self):
        """Ensure B2 is authorized before operations."""
        if not self._authorized:
            raise RuntimeError("B2 not authorized. Call authorize() first.")

    async def upload_file(self, file: UploadFile, user_id: str) -> str:
        """
        Upload file to B2 bucket.

        Args:
            file: FastAPI UploadFile object
            user_id: User ID for organizing files

        Returns:
            str: Storage key (path) of uploaded file

        Raises:
            Exception: If upload fails
        """
        self._ensure_authorized()

        unique_id = str(uuid.uuid4())
        storage_key = f"documents/{user_id}/{unique_id}-{file.filename}"

        try:
            # Read file content
            content = await file.read()

            # Upload to B2
            self._bucket.upload_bytes(  # type:ignore
                data_bytes=content,
                file_name=storage_key,
            )

            logger.info(f"File uploaded to B2: {storage_key} ({len(content)} bytes)")
            return storage_key

        except Exception as e:
            logger.error(f"B2 upload failed for {file.filename}: {e}")
            raise
        finally:
            await file.seek(0)  # Reset file pointer

    async def generate_presigned_url(
        self, storage_key: str, expiration: int = 900
    ) -> str:
        """
        Generate presigned download URL for file.

        Args:
            storage_key: B2 file path
            expiration: URL validity in seconds (default: 900 = 15 minutes)

        Returns:
            str: Presigned download URL

        Raises:
            Exception: If URL generation fails
        """
        self._ensure_authorized()

        try:
            download_url = self.api.get_download_url_for_file_name(
                settings.B2_BUCKET_NAME, storage_key
            )

            # B2 download URLs with authorization
            auth_token = self.api.get_download_authorization(  # type:ignore
                settings.B2_BUCKET_NAME, storage_key, expiration
            )

            presigned_url = f"{download_url}?Authorization={auth_token}"
            logger.info(
                f"Generated presigned URL for {storage_key} (expires in {expiration}s)"
            )
            return presigned_url

        except Exception as e:
            logger.error(f"Failed to generate presigned URL for {storage_key}: {e}")
            raise

    async def download_file(self, storage_key: str) -> bytes:
        """
        Download file from B2 bucket.

        Args:
            storage_key: B2 file path

        Returns:
            bytes: File content

        Raises:
            Exception: If download fails
        """
        self._ensure_authorized()

        try:
            # Download file from B2 - use save_to method with BytesIO
            from io import BytesIO
            buffer = BytesIO()
            downloaded_file = self._bucket.download_file_by_name(storage_key)  # type:ignore
            downloaded_file.save_to(buffer)  # type:ignore
            content = buffer.getvalue()

            logger.info(f"File downloaded from B2: {storage_key} ({len(content)} bytes)")
            return content

        except Exception as e:
            logger.error(f"B2 download failed for {storage_key}: {e}")
            raise

    async def delete_file(self, storage_key: str) -> bool:
        """
        Delete file from B2 bucket.

        Args:
            storage_key: B2 file path

        Returns:
            bool: True if deletion successful

        Raises:
            Exception: If deletion fails (except file not found)
        """
        self._ensure_authorized()

        try:
            # Get file version ID
            file_version = self._bucket.get_file_info_by_name(  # type:ignore
                storage_key
            )

            # Delete file
            self.api.delete_file_version(file_version.id_, storage_key)

            logger.info(f"File deleted from B2: {storage_key}")
            return True

        except Exception as e:
            if "not found" in str(e).lower():
                logger.warning(f"File not found in B2: {storage_key}")
                return True  # Already deleted

            logger.error(f"B2 deletion failed for {storage_key}: {e}")
            raise


# Singleton instance
_b2_service: B2Service | None = None


async def get_b2_service() -> B2Service:
    """
    Get or create B2 service singleton.

    Returns:
        B2Service: Initialized B2 service instance
    """
    global _b2_service

    if _b2_service is None:
        _b2_service = B2Service()
        await _b2_service.authorize()

    return _b2_service
