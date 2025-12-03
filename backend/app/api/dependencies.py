from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.security import decode_token
from app.db.database import get_session
from app.models.user import User
from app.services.redis_service import (
    is_jti_blocklisted,
    is_token_issued_before_password_change,
)

security = HTTPBearer()


class TokenBearer(HTTPBearer):
    """
    Base Bearer token class that handles token validation and blocklist checking.
    """

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(  # type:ignore
        self, request: Request
    ) -> HTTPAuthorizationCredentials | dict | None:
        """
        Extract and validate token from Authorization header.

        Returns:
            Token payload dict if valid, None if auto_error=False
        """
        creds = await super().__call__(request)
        if not creds:
            return None

        token = creds.credentials  # type: ignore
        token_data = decode_token(token)

        if not self.token_valid(token):
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "This token is invalid or expired",
                        "resolution": "Please get new token",
                    },
                )
            return None

        jti = token_data.get("jti")  # type: ignore
        if jti and await is_jti_blocklisted(jti):
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "error": "This token is invalid or has been revoked",
                        "resolution": "Please get new token",
                    },
                )
            return None

        self.verify_token_data(token_data)  # type: ignore

        return token_data  # type: ignore

    def token_valid(self, token: str) -> bool:
        """
        Check if token is valid (not expired, correct signature).

        Args:
            token: JWT token string

        Returns:
            True if valid, False otherwise
        """
        token_data = decode_token(token)
        return token_data is not None

    def verify_token_data(self, token_data: dict) -> None:
        """
        Verify token data meets requirements.
        Override in child classes.

        Args:
            token_data: Decoded token payload

        Raises:
            HTTPException: If token doesn't meet requirements
        """
        raise NotImplementedError("Please override this method in child classes")


class AccessTokenBearer(TokenBearer):
    """
    Bearer class for access tokens only.
    Rejects refresh tokens.
    """

    def verify_token_data(self, token_data: dict) -> None:
        """
        Verify token is an access token (not refresh).

        Args:
            token_data: Decoded token payload

        Raises:
            HTTPException: If token is a refresh token
        """
        if token_data and token_data.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please provide an access token",
            )


class RefreshTokenBearer(TokenBearer):
    """
    Bearer class for refresh tokens only.
    Rejects access tokens.
    """

    def verify_token_data(self, token_data: dict) -> None:
        """
        Verify token is a refresh token (not access).

        Args:
            token_data: Decoded token payload

        Raises:
            HTTPException: If token is an access token
        """
        if token_data and not token_data.get("refresh"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please provide a refresh token",
            )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session dependency."""
    async for session in get_session():
        yield session


async def get_current_user(
    token_details: dict = Depends(AccessTokenBearer()),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    """
    Get current authenticated user from JWT token.

    Uses AccessTokenBearer to automatically:
    - Extract token from Authorization header
    - Validate token signature and expiry
    - Check token not in blocklist
    - Verify it's an access token (not refresh)

    Validates:
    - User sessions not revoked
    - User exists and is active

    Raises:
        HTTPException: 401/403 if authentication fails
    """
    user_id = token_details.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Check if token was issued before password change
    token_iat = token_details.get("iat")
    if token_iat and await is_token_issued_before_password_change(user_id, token_iat):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired due to password change. Please login again.",
        )

    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user),  # noqa: B008
) -> User:
    """
    Get current admin user.

    Requires user to have 'admin' role.

    Raises:
        HTTPException: 403 if user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


async def get_current_user_sse(
    request: Request,
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User:
    """
    Get current authenticated user for SSE connections.

    EventSource doesn't support custom headers, so we accept token from:
    1. Query parameter: ?token=xxx (for EventSource compatibility)
    2. Authorization header: Bearer xxx (fallback)

    Args:
        request: FastAPI request object
        session: Database session

    Returns:
        Authenticated user

    Raises:
        HTTPException: 401/403 if authentication fails
    """
    # Try query parameter first (EventSource compatibility)
    token = request.query_params.get("token")

    # Fallback to Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    # Decode and validate token
    try:
        token_data = decode_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        ) from e

    # Check token type (refresh field: False = access token, True = refresh token)
    is_refresh = token_data.get("refresh", True)  # type:ignore
    if is_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
        )

    # Check if token is blocklisted
    jti = token_data.get("jti")  # type:ignore
    if jti and await is_jti_blocklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    # Get user from token
    user_id = token_data.get("sub")  # type:ignore
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    # Check if token was issued before password change
    token_iat = token_data.get("iat")  # type:ignore
    if token_iat and await is_token_issued_before_password_change(user_id, token_iat):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired due to password change. Please login again.",
        )

    # Fetch user from database
    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is suspended",
        )

    return user


async def get_current_user_optional(
    token_details: dict | None = Depends(TokenBearer(auto_error=False)),  # noqa: B008
    session: AsyncSession = Depends(get_db),  # noqa: B008
) -> User | None:
    """
    Get current user if token is provided, otherwise return None.

    Use for public endpoints that optionally use authentication.

    Returns:
        User if authenticated, None otherwise
    """
    if not token_details:
        return None

    # Verify it's an access token if provided
    if token_details.get("refresh"):
        return None  # Don't accept refresh tokens here

    user_id = token_details.get("sub")
    if not user_id:
        return None

    # Check if token was issued before password change
    token_iat = token_details.get("iat")
    if token_iat and await is_token_issued_before_password_change(user_id, token_iat):
        return None

    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user or not user.is_active:
        return None

    return user
