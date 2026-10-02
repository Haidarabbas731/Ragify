"""widen documents.file_type

The model allowed 100 characters but the column was created as VARCHAR(10).

Revision ID: 8c2f5d7a91b3
Revises: 74567e1e8882
Create Date: 2026-10-02 12:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c2f5d7a91b3'
down_revision: Union[str, Sequence[str], None] = '74567e1e8882'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        'documents',
        'file_type',
        existing_type=sa.String(length=10),
        type_=sa.String(length=100),
        existing_nullable=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'documents',
        'file_type',
        existing_type=sa.String(length=100),
        type_=sa.String(length=10),
        existing_nullable=False,
    )
