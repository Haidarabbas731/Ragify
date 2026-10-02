"""
Tests for the public sign-up config and the invite-code rule it describes.
"""

from unittest.mock import patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1.auth import get_auth_config
from app.core.config import settings
from app.services.invite_service import validate_invite_code_for_registration


@pytest.mark.asyncio
@pytest.mark.parametrize("invite_only", [True, False])
async def test_the_config_reports_the_servers_invite_only_setting(invite_only):
    """The frontend learns the mode from the API, so one variable controls both sides."""
    with patch.object(settings, "INVITE_ONLY", invite_only):
        result = await get_auth_config()

    assert result.model_dump() == {"invite_only": invite_only}


@pytest.mark.asyncio
async def test_open_registration_needs_no_code(session: AsyncSession):
    """With INVITE_ONLY off, registering without a code is accepted."""
    with patch.object(settings, "INVITE_ONLY", False):
        assert await validate_invite_code_for_registration(session, None) == (True, None)


@pytest.mark.asyncio
async def test_invite_only_registration_requires_a_code(session: AsyncSession):
    """With INVITE_ONLY on, a missing code is refused with a clear reason."""
    with patch.object(settings, "INVITE_ONLY", True):
        valid, reason = await validate_invite_code_for_registration(session, None)

    assert valid is False
    assert "required" in reason


@pytest.mark.asyncio
async def test_invite_only_registration_accepts_a_valid_code_and_refuses_an_unknown_one(
    session: AsyncSession, test_invite_code
):
    """With INVITE_ONLY on, a real active code passes and a made-up one does not."""
    with patch.object(settings, "INVITE_ONLY", True):
        assert await validate_invite_code_for_registration(session, test_invite_code.code) == (
            True,
            None,
        )
        valid, reason = await validate_invite_code_for_registration(session, "KB-ZZZZ-ZZZZ-ZZZZ")

    assert valid is False
    assert "Invalid or expired" in reason
