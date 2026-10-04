"""add email verified at

Revision ID: fd4898a0e99a
Revises: fec623895cc2
Create Date: 2026-10-04 09:43:47.355054

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd4898a0e99a'
down_revision: Union[str, Sequence[str], None] = 'fec623895cc2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add users.email_verified_at and mark every existing user as verified.

    Accounts that exist before verification was introduced were never asked to verify, so they
    are backfilled (with their sign-up time) instead of being locked out.
    """
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE users SET email_verified_at = COALESCE(created_at, now())")


def downgrade() -> None:
    """Drop users.email_verified_at."""
    op.drop_column('users', 'email_verified_at')
