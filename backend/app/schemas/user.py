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

    email: EmailStr
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
