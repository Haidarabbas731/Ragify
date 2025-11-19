import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.document import DocumentStatus
from app.services.document_service import (
    create_document,
    mark_document_as_deleted,
    update_document_status,
)


@pytest.mark.asyncio
async def test_document_creation_and_status_updates(session: AsyncSession, sample_user) -> None:
    document = await create_document(
        session=session,
        user_id=sample_user.user_id,
        filename="test.pdf",
        file_type="application/pdf",
        size_bytes=2048,
        storage_key="b2://bucket/test.pdf",
    )

    assert document.document_id is not None
    assert document.status == DocumentStatus.PROCESSING

    await update_document_status(
        session=session,
        document_id=document.document_id,
        status=DocumentStatus.ACTIVE,
    )

    await session.refresh(document)
    assert document.status == DocumentStatus.ACTIVE


@pytest.mark.asyncio
async def test_soft_delete_behavior(session: AsyncSession, sample_user) -> None:
    document = await create_document(
        session=session,
        user_id=sample_user.user_id,
        filename="delete_test.pdf",
        file_type="application/pdf",
        size_bytes=1024,
        storage_key="b2://bucket/delete_test.pdf",
    )

    await mark_document_as_deleted(session=session, document_id=document.document_id)

    await session.refresh(document)
    assert document.status == DocumentStatus.DELETED
    assert document.deleted_at is not None
