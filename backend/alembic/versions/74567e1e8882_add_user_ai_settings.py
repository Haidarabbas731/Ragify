"""add user ai settings

Revision ID: 74567e1e8882
Revises: 45e479aa17a6
Create Date: 2026-10-02 10:56:52.203148

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74567e1e8882'
down_revision: Union[str, Sequence[str], None] = '45e479aa17a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'user_ai_settings',
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('provider', sa.String(length=20), nullable=False),
        sa.Column('model', sa.String(length=200), nullable=False),
        sa.Column('encrypted_api_key', sa.Text(), nullable=False),
        sa.Column('key_last4', sa.String(length=4), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('user_ai_settings')
