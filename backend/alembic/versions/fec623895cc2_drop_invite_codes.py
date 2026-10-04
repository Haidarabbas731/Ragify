"""drop invite codes

Revision ID: fec623895cc2
Revises: 46eba7548d06
Create Date: 2026-10-04 09:34:22.153981

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fec623895cc2'
down_revision: Union[str, Sequence[str], None] = '46eba7548d06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop the invite-codes feature: sign-up is open, so the codes table and the per-user columns go."""
    op.drop_index(op.f('ix_invite_codes_code'), table_name='invite_codes')
    op.drop_table('invite_codes')
    op.drop_column('users', 'invited_by_code')
    op.drop_column('users', 'invited_at')


def downgrade() -> None:
    """Recreate the invite-codes table and user columns (empty: dropped codes are not restored)."""
    op.add_column('users', sa.Column('invited_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True))
    op.add_column('users', sa.Column('invited_by_code', sa.VARCHAR(length=24), autoincrement=False, nullable=True))
    op.create_table('invite_codes',
    sa.Column('invite_code_id', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('code', sa.VARCHAR(length=24), autoincrement=False, nullable=False),
    sa.Column('created_by', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('expires_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
    sa.Column('max_uses', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('current_uses', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.Column('status', sa.VARCHAR(length=20), autoincrement=False, nullable=False),
    sa.Column('description', sa.VARCHAR(length=255), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('invite_code_id', name=op.f('invite_codes_pkey'))
    )
    op.create_index(op.f('ix_invite_codes_code'), 'invite_codes', ['code'], unique=True)
