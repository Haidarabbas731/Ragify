"""Admin-only document management API endpoints.

Handles document administration including listing all users' documents,
deleting individual documents, and bulk cleanup operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.document import Document
from app.models.user import User
from app.services.b2_service import get_b2_service
from app.services.milvus_service import get_milvus_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/documents")
async def list_all_documents(
    page: int = 1,
    limit: int = 50,
    user_id: str | None = None,
    status_filter: str | None = None,
    sort_by: str = "uploaded_at",
    order: str = "desc",
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all documents across all users (admin only).

    Args:
        page: Page number (1-indexed)
        limit: Items per page (max 100)
        user_id: Optional filter by specific user
        status_filter: Optional filter by status (processing, active, error, deleted)
        sort_by: Sort field (uploaded_at, file_size_bytes, filename)
        order: Sort order (asc, desc)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Paginated list of all documents with user emails

    Raises:
        HTTPException: 400 if invalid parameters
    """
    if page < 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Page must be >= 1")

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 100",
        )

    # Build query - include deleted documents for admin view
    query = select(Document)

    if user_id:
        query = query.where(Document.user_id == user_id)

    if status_filter:
        query = query.where(Document.status == status_filter)

    # Count total
    count_query = select(Document.document_id)

    if user_id:
        count_query = count_query.where(Document.user_id == user_id)
    if status_filter:
        count_query = count_query.where(Document.status == status_filter)

    total_result = await db.exec(count_query)
    total = len(total_result.all())

    # Sort
    sort_column = getattr(Document, sort_by, Document.uploaded_at)
    if order == "desc":
        query = query.order_by(sort_column.desc())  # type: ignore
    else:
        query = query.order_by(sort_column.asc())  # type: ignore

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.exec(query)
    documents = result.all()

    # Enrich with user emails
    user_ids = {doc.user_id for doc in documents}
    user_result = await db.exec(
        select(User.user_id, User.email).where(User.user_id.in_(user_ids))  # type: ignore
    )
    user_map = dict(user_result.all())

    documents_list = []
    for doc in documents:
        doc_dict = doc.model_dump()
        doc_dict["user_email"] = user_map.get(doc.user_id, "Unknown")
        documents_list.append(doc_dict)

    return {
        "documents": documents_list,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: str,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Delete a specific document (hard delete, admin only).

    Immediately deletes from database, B2, and Milvus.

    Args:
        document_id: Document ID to delete
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Deletion result

    Raises:
        HTTPException: 404 if document not found
    """
    # Get document
    result = await db.exec(select(Document).where(Document.document_id == document_id))
    document = result.one_or_none()

    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Get user for storage quota update
    user_result = await db.exec(select(User).where(User.user_id == document.user_id))
    user = user_result.one_or_none()

    errors = []

    # Initialize services
    b2_service = await get_b2_service()
    milvus_service = await get_milvus_service()
    await milvus_service.connect()

    # Delete from B2
    try:
        await b2_service.delete_file(document.storage_key)
    except Exception as e:
        if "not found" not in str(e).lower():
            errors.append(f"B2 deletion failed: {e}")

    # Delete from Milvus
    try:
        await milvus_service.delete_document_chunks(document_id)
    except Exception as e:
        errors.append(f"Milvus deletion failed: {e}")

    # Update user storage quota
    if user and document.file_size_bytes:
        user.storage_used_bytes = max(0, user.storage_used_bytes - document.file_size_bytes)
        db.add(user)

    # Delete from database
    await db.delete(document)
    await db.commit()

    return {
        "status": "success" if not errors else "partial_success",
        "message": f"Document {document_id} deleted",
        "document_id": document_id,
        "errors": errors if errors else None,
    }


@router.delete("/users/{user_id}/documents", status_code=status.HTTP_200_OK)
async def cleanup_user_documents(
    user_id: str,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Delete all documents for a specific user (hard delete).

    Admin-only endpoint. Immediately deletes from database, B2, and Milvus.

    Args:
        user_id: Target user ID
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Cleanup result with counts

    Raises:
        HTTPException: 404 if user not found
    """
    # Verify user exists
    result = await db.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Get all user documents
    result = await db.exec(select(Document).where(Document.user_id == user_id))
    documents = result.all()

    if not documents:
        return {
            "status": "success",
            "message": "No documents found for this user",
            "deleted_count": 0,
        }

    # Initialize services
    b2_service = await get_b2_service()
    milvus_service = await get_milvus_service()
    await milvus_service.connect()

    deleted_count = 0
    errors = []

    for doc in documents:
        try:
            # Delete from B2
            try:
                await b2_service.delete_file(doc.storage_key)
            except Exception as e:
                if "not found" not in str(e).lower():
                    errors.append(f"B2 deletion failed for {doc.document_id}: {e}")

            # Delete from Milvus
            try:
                await milvus_service.delete_document_chunks(doc.document_id)
            except Exception as e:
                errors.append(f"Milvus deletion failed for {doc.document_id}: {e}")

            # Delete from database
            await db.delete(doc)
            deleted_count += 1

        except Exception as e:
            errors.append(f"Failed to delete {doc.document_id}: {e}")

    # Update user storage quota
    user.storage_used_bytes = 0
    db.add(user)

    await db.commit()

    return {
        "status": "success" if not errors else "partial_success",
        "message": f"Deleted {deleted_count} documents for user {user_id}",
        "deleted_count": deleted_count,
        "total_documents": len(documents),
        "errors": errors if errors else None,
    }


@router.delete("/documents/cleanup-all", status_code=status.HTTP_200_OK)
async def cleanup_all_documents(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Delete ALL documents across all users (hard delete) - NUCLEAR OPTION.

    Admin-only endpoint for testing. USE WITH EXTREME CAUTION!

    This performs a complete system-wide cleanup:
    - Drops and recreates Milvus collection (deletes ALL vectors)
    - Deletes ALL files from B2 bucket
    - Deletes ALL document records from PostgreSQL
    - Resets all users' storage quotas to 0

    This guarantees a completely clean state across all systems,
    including orphaned data that may exist without database records.

    Args:
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Cleanup result with counts and any errors
    """
    errors = []
    milvus_cleaned = False
    b2_deleted_count = 0
    postgres_deleted_count = 0

    # Initialize services
    b2_service = await get_b2_service()
    milvus_service = await get_milvus_service()
    await milvus_service.connect()

    # 1. MILVUS: Drop and recreate collection (nuclear cleanup)
    try:
        await milvus_service.drop_and_recreate_collection()
        milvus_cleaned = True
    except Exception as e:
        errors.append(f"Milvus cleanup failed: {str(e)}")

    # 2. B2: Delete all files (nuclear cleanup)
    try:
        b2_deleted_count, b2_errors = await b2_service.delete_all_files()
        if b2_errors:
            errors.extend(b2_errors)
    except Exception as e:
        errors.append(f"B2 cleanup failed: {str(e)}")

    # 3. PostgreSQL: Delete all document records
    try:
        result = await db.exec(select(Document))
        documents = result.all()
        postgres_deleted_count = len(documents)

        for doc in documents:
            await db.delete(doc)

        # Reset all users' storage quotas
        result = await db.exec(select(User))
        users = result.all()
        for user in users:
            user.storage_used_bytes = 0
            db.add(user)

        await db.commit()
    except Exception as e:
        errors.append(f"PostgreSQL cleanup failed: {str(e)}")
        await db.rollback()

    # Build response
    status_msg = "success" if not errors else "partial_success"
    message_parts = []

    if milvus_cleaned:
        message_parts.append("Milvus collection reset")
    if b2_deleted_count > 0:
        message_parts.append(f"{b2_deleted_count} files from B2")
    if postgres_deleted_count > 0:
        message_parts.append(f"{postgres_deleted_count} documents from PostgreSQL")

    message = "Deleted: " + ", ".join(message_parts) if message_parts else "No data to clean"

    return {
        "status": status_msg,
        "message": message,
        "deleted_count": postgres_deleted_count,
        "milvus_cleaned": milvus_cleaned,
        "b2_files_deleted": b2_deleted_count,
        "errors": errors if errors else None,
    }
