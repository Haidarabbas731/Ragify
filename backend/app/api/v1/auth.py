from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_db
from app.schemas.user import TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import authenticate_user, logout_user, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, session: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Register a new user.

    - **email**: Valid email address
    - **password**: Min 8 chars, 1 uppercase, 1 number, 1 special char
    - **invite_code**: Required if INVITE_ONLY=true (format: KB-XXXX-XXXX-XXXX)
    """
    success, message, user_data = await register_user(
        session, data.email, data.password, data.invite_code
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return UserResponse(**user_data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Authenticate user and return JWT tokens.

    - **email**: User email address
    - **password**: User password

    Returns access token (1 hour) and refresh token (7 days).
    """
    success, message, auth_data = await authenticate_user(
        session, data.email, data.password
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    return TokenResponse(
        access_token=auth_data["access_token"],
        refresh_token=auth_data["refresh_token"],
        token_type=auth_data["token_type"],
        expires_in=auth_data["expires_in"],
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    access_token: str, refresh_token: str
):
    """
    Logout user by revoking tokens.

    - **access_token**: Current access token
    - **refresh_token**: Current refresh token

    Tokens will be added to blocklist and cannot be used again.
    """
    success, message = await logout_user(access_token, refresh_token)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return None
