"""Document processing background tasks.

Handles text extraction, chunking, embedding generation, and vector storage.
"""

from datetime import UTC, datetime
from io import BytesIO

from arq import Retry
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db.database import async_session_maker
from app.models.document import Document, DocumentStatus
from app.services.b2_service import get_b2_service
from app.services.embedding_service import get_embedding_service
from app.services.milvus_service import get_milvus_service
from app.utils.chunking import create_chunks_with_metadata
from app.utils.text_extraction import extract_text


async def process_document(ctx: dict, document_id: str, user_id: str) -> dict:
    """
    Process uploaded document: extract text, chunk, generate embeddings, store in Milvus.

    Workflow (PRD Section 7.1):
    1. Get document from database
    2. Download file from B2
    3. Extract text based on file type
    4. Split text into chunks (size=1000, overlap=200)
    5. Generate embeddings for all chunks (batch processing)
    6. Insert chunks + embeddings into Milvus
    7. Update document status to ACTIVE
    8. Update chunks_count

    Args:
        ctx: ARQ context
        document_id: Document ID to process
        user_id: User ID (for verification)

    Returns:
        Processing result dict with status and metrics

    Raises:
        Retry: If transient error occurs (will retry up to max_tries)
        Exception: If permanent error occurs (document marked as ERROR)
    """
    async with async_session_maker() as db:
        try:
            # Step 1: Get document from database
            result = await db.exec(
                select(Document).where(
                    Document.document_id == document_id,
                    Document.user_id == user_id,
                )
            )
            document = result.one_or_none()

            if not document:
                return {"status": "error", "error": f"Document {document_id} not found"}

            # Check if already processed
            if document.status == DocumentStatus.ACTIVE.value:
                return {"status": "already_processed", "document_id": document_id}

            # Step 2: Download file from B2
            b2_service = await get_b2_service()
            try:
                file_content = await b2_service.download_file(  # type:ignore
                    document.storage_key
                )  # type:ignore
            except Exception as e:
                error_msg = f"Failed to download file from storage: {str(e)}"
                await _mark_document_error(db, document, error_msg)
                return {"status": "error", "error": error_msg}

            # Step 3: Extract text based on file type
            try:
                text = extract_text(
                    file_path=BytesIO(file_content),
                    filename=document.filename,
                    file_type=document.file_type,
                )

                if not text or not text.strip():
                    error_msg = "No text content extracted from document"
                    await _mark_document_error(db, document, error_msg)
                    return {"status": "error", "error": error_msg}

            except Exception as e:
                error_msg = f"Text extraction failed: {str(e)}"
                await _mark_document_error(db, document, error_msg)
                return {"status": "error", "error": error_msg}

            # Step 4: Split text into chunks
            try:
                chunks_data = create_chunks_with_metadata(
                    text=text,
                    chunk_size=settings.CHUNK_SIZE,
                    chunk_overlap=settings.CHUNK_OVERLAP,
                )

                if not chunks_data:
                    error_msg = "No chunks created from text"
                    await _mark_document_error(db, document, error_msg)
                    return {"status": "error", "error": error_msg}

            except Exception as e:
                error_msg = f"Text chunking failed: {str(e)}"
                await _mark_document_error(db, document, error_msg)
                return {"status": "error", "error": error_msg}

            # Step 5: Generate embeddings for all chunks (batch processing)
            embedding_service = await get_embedding_service()
            try:
                chunk_texts = [chunk["text"] for chunk in chunks_data]
                embeddings = await embedding_service.embed_batch(chunk_texts)

                if len(embeddings) != len(chunks_data):
                    error_msg = f"Embedding count mismatch: {len(embeddings)} != {len(chunks_data)}"
                    await _mark_document_error(db, document, error_msg)
                    return {"status": "error", "error": error_msg}

            except Exception as e:
                # Embedding API errors might be transient (rate limits)
                if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                    raise Retry(defer=60) from e  # Retry after 60 seconds
                error_msg = f"Embedding generation failed: {str(e)}"
                await _mark_document_error(db, document, error_msg)
                return {"status": "error", "error": error_msg}

            # Step 6: Insert chunks + embeddings into Milvus
            milvus_service = await get_milvus_service()
            try:
                await milvus_service.connect()

                # Prepare data for Milvus insertion
                chunk_ids = []
                chunk_texts = []
                chunk_indices = []

                for i, (chunk, _embedding) in enumerate(
                    zip(chunks_data, embeddings, strict=True)
                ):
                    chunk_ids.append(f"{document_id}_{i}")
                    chunk_texts.append(chunk["text"])
                    chunk_indices.append(chunk["chunk_index"])

                # Insert into Milvus
                await milvus_service.insert_chunks(
                    chunk_ids=chunk_ids,
                    user_id=user_id,
                    document_id=document_id,
                    embeddings=embeddings,
                    chunk_texts=chunk_texts,
                    chunk_indices=chunk_indices,
                )  # type:ignore

            except Exception as e:
                # Milvus errors might be transient (connection issues)
                if "connection" in str(e).lower() or "timeout" in str(e).lower():
                    raise Retry(defer=30) from e  # Retry after 30 seconds
                error_msg = f"Vector storage failed: {str(e)}"
                await _mark_document_error(db, document, error_msg)
                return {"status": "error", "error": error_msg}

            # Step 7 & 8: Update document status to ACTIVE
            try:
                document.status = DocumentStatus.ACTIVE.value
                document.chunks_count = len(chunks_data)
                document.processed_at = datetime.now(UTC)
                document.error_message = None

                db.add(document)
                await db.commit()
                await db.refresh(document)

            except Exception as e:
                error_msg = f"Database update failed: {str(e)}"
                # Don't mark as error since processing succeeded
                # This will be retried by orphaned job recovery
                raise Retry(defer=10) from e

            return {
                "status": "success",
                "document_id": document_id,
                "chunks_count": len(chunks_data),
                "processing_time": (
                    datetime.now(UTC) - document.uploaded_at
                ).total_seconds(),
            }

        except Retry:
            # Re-raise Retry exceptions
            raise

        except Exception as e:
            # Unexpected errors
            error_msg = f"Unexpected error during processing: {str(e)}"
            try:
                result = await db.exec(
                    select(Document).where(Document.document_id == document_id)
                )
                doc = result.one_or_none()
                if doc:
                    await _mark_document_error(db, doc, error_msg)
            except Exception:
                pass  # Best effort error marking

            return {"status": "error", "error": error_msg}


async def _mark_document_error(
    db: AsyncSession, document: Document, error_message: str
) -> None:
    """
    Mark document as ERROR status with error message.

    Args:
        db: Database session
        document: Document to mark as error
        error_message: Error message to store
    """
    document.status = DocumentStatus.ERROR.value
    document.error_message = error_message[:500]  # Limit error message length
    document.processed_at = datetime.now(UTC)

    db.add(document)
    await db.commit()
