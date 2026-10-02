"""add system state

Revision ID: 46eba7548d06
Revises: 8c2f5d7a91b3
Create Date: 2026-10-02 12:57:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46eba7548d06'
down_revision: Union[str, Sequence[str], None] = '8c2f5d7a91b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # The app's startup (create_all) may already have created the table when new code was
    # hot-reloaded before this migration ran. Its shape is identical, so just keep it.
    if sa.inspect(op.get_bind()).has_table('system_state'):
        return

    op.create_table(
        'system_state',
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('key'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('system_state')
