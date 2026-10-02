import logging

from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base exception for application errors"""

    def __init__(self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class FileTooLargeError(AppException):
    def __init__(self, filename: str, size_mb: float):
        super().__init__(
            message=f"File '{filename}' exceeds 50MB limit ({size_mb:.1f}MB)",
            status_code=400,
            error_code="FILE_TOO_LARGE",
        )


class UnsupportedFormatError(AppException):
    def __init__(self, filename: str, format: str):
        super().__init__(
            message=f"File '{filename}' format '{format}' not supported. Use PDF, DOCX, TXT, or MD",
            status_code=400,
            error_code="UNSUPPORTED_FORMAT",
        )


class DocumentProcessingError(AppException):
    def __init__(self, filename: str, reason: str):
        super().__init__(
            message=f"Failed to process '{filename}': {reason}",
            status_code=500,
            error_code="PROCESSING_FAILED",
        )


class EmbeddingGenerationError(AppException):
    def __init__(self, detail: str = "Embedding generation failed"):
        super().__init__(
            message=f"AI service error: {detail}",
            status_code=503,
            error_code="EMBEDDING_FAILED",
        )


class VectorDBError(AppException):
    def __init__(self, operation: str):
        super().__init__(
            message=f"Vector database error during {operation}",
            status_code=503,
            error_code="VECTOR_DB_ERROR",
        )


class NoResultsFoundError(AppException):
    def __init__(self, query: str):
        super().__init__(
            message="No relevant information found in knowledge base",
            status_code=404,
            error_code="NO_RESULTS",
        )


async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions"""
    logger.error(
        f"App exception: {exc.error_code} - {exc.message}",
        extra={"status_code": exc.status_code, "path": request.url.path},
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "message": exc.message, "path": request.url.path},
    )


_MAX_LISTED_ERRORS = 3


def _field_label(location: tuple) -> str:
    """Readable name of the field an error is about, e.g. ("body", "invite_code") -> "Invite code"."""
    names = [str(part) for part in location if part != "body" and not isinstance(part, int)]
    return names[-1].replace("_", " ").capitalize() if names else "Request"


def _friendly_reason(error: dict) -> str:
    """Turn a validation error's technical message into something a user can act on."""
    message = str(error.get("msg", "Invalid value")).removeprefix("Value error, ")
    if "special-use or reserved name" in message:
        return "use a real email address (domains like .local and .test cannot receive email)"
    return message.removeprefix("value is not a valid email address: ")


def summarize_validation_errors(errors: list[dict]) -> str:
    """
    Build one readable sentence from validation errors, e.g. "Email: use a real email address ...".

    Args:
        errors: Error dicts as returned by ``RequestValidationError.errors()``

    Returns:
        str: Up to three "Field: reason" entries joined with "; ", plus a count of the rest
    """
    parts = [
        f"{_field_label(tuple(error.get('loc', ())))}: {_friendly_reason(error)}"
        for error in errors[:_MAX_LISTED_ERRORS]
    ]
    if len(errors) > _MAX_LISTED_ERRORS:
        parts.append(f"and {len(errors) - _MAX_LISTED_ERRORS} more")
    return "; ".join(parts) or "Invalid request data"


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI validation errors"""
    logger.warning(f"Validation error: {exc.errors()}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "VALIDATION_ERROR",
            "message": "Invalid request data",
            # Readable summary in `detail`, the field every form already reads
            "detail": summarize_validation_errors(exc.errors()),
            "details": exc.errors(),
        },
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all handler for unexpected errors"""
    logger.exception("Unhandled exception occurred", exc_info=exc)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


def register_exception_handlers(app):
    """Register all exception handlers"""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
