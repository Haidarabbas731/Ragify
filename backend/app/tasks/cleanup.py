"""Cleanup and recovery background tasks.

Handles orphaned job recovery and deleted document cleanup.
"""

from datetime import UTC, datetime, timedelta

from arq.connections import ArqRedis
from sqlmodel import select

from app.db.database import async_session_maker
from app.models.document import Document, DocumentStatus
from app.services.b2_service import get_b2_service
from app.services.milvus_service import get_milvus_service


async def cleanup_deleted_document(ctx: dict, document_id: str) -> dict:
    """
    Cleanup a deleted document by removing from B2, Milvus, and PostgreSQL.

    Workflow (PRD Section 9.4):
    1. Get document metadata from PostgreSQL
    2. Delete chunks from Milvus (by document_id)
    3. Delete file from B2 (storage_key)
    4. Hard delete document from PostgreSQL

    Args:
        ctx: ARQ context
        document_id: Document ID to cleanup

    Returns:
        Cleanup result dict

    Raises:
        Exception: If cleanup fails (will retry)
    """
    async with async_session_maker() as db:
        try:
            # Step 1: Get document metadata
            result = await db.exec(
                select(Document).where(
                    Document.document_id == document_id,
                    Document.status == DocumentStatus.DELETED.value,
                )
            )
            document = result.one_or_none()

            if not document:
                return {
                    "status": "not_found",
                    "document_id": document_id,
                    "message": "Document not found or not marked as deleted",
                }

            errors = []

            # Step 2: Delete chunks from Milvus
            try:
                milvus_service = await get_milvus_service()
                await milvus_service.connect()
                await milvus_service.delete_document_chunks(document_id)  # type:ignore
            except Exception as e:
                errors.append(f"Milvus deletion failed: {str(e)}")

            # Step 3: Delete file from B2
            try:
                b2_service = await get_b2_service()
                await b2_service.delete_file(document.storage_key)
            except Exception as e:
                # File might already be deleted or not exist
                if "not found" not in str(e).lower():
                    errors.append(f"B2 deletion failed: {str(e)}")

            # Step 4: Hard delete from PostgreSQL
            try:
                await db.delete(document)
                await db.commit()
            except Exception as e:
                errors.append(f"Database deletion failed: {str(e)}")
                raise  # Re-raise to trigger retry

            if errors:
                return {
                    "status": "partial_success",
                    "document_id": document_id,
                    "errors": errors,
                }

            return {
                "status": "success",
                "document_id": document_id,
                "message": "Document fully cleaned up",
            }

        except Exception as e:
            return {"status": "error", "document_id": document_id, "error": str(e)}


async def cleanup_all_deleted_documents(ctx: dict) -> dict:
    """
    Find and cleanup all deleted documents older than 1 hour.

    Scheduled cron job (PRD Section 9.4 - runs every 6 hours).

    Args:
        ctx: ARQ context with redis pool

    Returns:
        Cleanup result dict with count of enqueued jobs
    """
    async with async_session_maker() as db:
        try:
            # Find deleted documents older than 1 hour
            cutoff_time = datetime.now(UTC) - timedelta(hours=1)

            result = await db.exec(
                select(Document.document_id).where(
                    Document.status == DocumentStatus.DELETED.value,
                    Document.deleted_at <= cutoff_time,  # type:ignore
                )
            )
            document_ids = [row[0] for row in result.all()]

            if not document_ids:
                return {
                    "status": "success",
                    "count": 0,
                    "message": "No documents to cleanup",
                }

            # Enqueue cleanup jobs
            redis: ArqRedis = ctx["redis"]
            enqueued = 0

            for doc_id in document_ids:
                try:
                    await redis.enqueue_job("cleanup_deleted_document", document_id=doc_id)
                    enqueued += 1
                except Exception as e:
                    print(f"Failed to enqueue cleanup for {doc_id}: {e}")

            return {
                "status": "success",
                "count": enqueued,
                "total_found": len(document_ids),
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}


async def recover_orphaned_jobs(ctx: dict) -> dict:
    """
    Recover orphaned processing jobs (documents stuck in PROCESSING > 30 mins).

    Scheduled cron job (PRD Section 11.3.5 - runs every 15 minutes).

    Args:
        ctx: ARQ context with redis pool

    Returns:
        Recovery result dict with count of re-enqueued jobs
    """
    async with async_session_maker() as db:
        try:
            # Find documents stuck in PROCESSING for > 30 minutes
            cutoff_time = datetime.now(UTC) - timedelta(minutes=30)

            result = await db.exec(
                select(Document).where(
                    Document.status == DocumentStatus.PROCESSING.value,
                    Document.uploaded_at <= cutoff_time,
                    Document.processed_at.is_(None),  # Not yet processed # type:ignore
                )
            )
            orphaned_docs = result.all()

            if not orphaned_docs:
                return {
                    "status": "success",
                    "count": 0,
                    "message": "No orphaned jobs found",
                }

            # Re-enqueue processing jobs
            redis: ArqRedis = ctx["redis"]
            recovered = 0

            for doc in orphaned_docs:
                try:
                    await redis.enqueue_job(
                        "process_document",
                        document_id=doc.document_id,
                        user_id=doc.user_id,
                    )
                    recovered += 1
                except Exception as e:
                    print(f"Failed to recover job for {doc.document_id}: {e}")

            return {
                "status": "success",
                "count": recovered,
                "total_found": len(orphaned_docs),
            }

        except Exception as e:
            return {"status": "error", "error": str(e)}
