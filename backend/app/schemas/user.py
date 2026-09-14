from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """Schema for user registration."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    invite_code: str | None = Field(
        default=None, pattern=r"^KB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$"
    )


class UserLogin(BaseModel):
    """Schema for user login."""

    email: str = Field(max_length=255)
    password: str


class TokenResponse(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Schema for user data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    role: str
    status: str
    storage_used_bytes: int
    storage_limit_bytes: int
    created_at: datetime
    last_login_at: datetime | None


class UserProfile(BaseModel):
    """Schema for user profile with storage statistics."""

    model_config = ConfigDict(from_attributes=True)

    user_id: str
    email: str
    role: str
    status: str
    storage_used_bytes: int
    storage_limit_bytes: int
    storage_used_mb: float
    storage_limit_mb: float
    storage_percentage: float
    created_at: datetime
    last_login_at: datetime | None


class LogoutRequest(BaseModel):
    """Schema for logout request with optional refresh token."""

    refresh_token: str | None = None


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset."""

    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset."""

    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class UserUpdateRequest(BaseModel):
    """Schema for updating user profile."""

    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    """Schema for changing password while logged in."""

    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class UserStatsResponse(BaseModel):
    """Schema for user dashboard statistics."""

    total_documents: int
    total_chunks: int
    storage_used_mb: float
    storage_limit_mb: float
    storage_percentage: float
    collections_count: int
    conversations_count: int
    documents_by_status: dict[str, int]
