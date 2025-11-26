"""Common response schemas used across multiple API endpoints."""

from typing import Any

from pydantic import BaseModel, Field


class MessageResponse(BaseModel):
    """Generic message response for simple success/error messages."""

    message: str = Field(..., description="Response message")


class HealthCheckResponse(BaseModel):
    """Health check endpoint response."""

    status: str = Field(..., description="Overall system status")
    services: dict[str, str] = Field(..., description="Individual service statuses")
    app_info: dict[str, str] = Field(..., description="Application information")
    arq_worker: dict[str, Any] = Field(..., description="ARQ worker statistics")


class RootResponse(BaseModel):
    """Root endpoint response."""

    message: str = Field(..., description="Welcome message")
    docs: str = Field(..., description="API documentation URL")
    health: str = Field(..., description="Health check URL")
