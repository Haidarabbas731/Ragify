from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

MAX_REQUEST_SIZE = 50 * 1024 * 1024  # 50MB in bytes


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforce 50MB request size limit at the middleware level.

    This prevents large requests from consuming server resources
    before reaching the upload endpoint.
    """

    async def dispatch(self, request: Request, call_next):
        if request.method in ["POST", "PUT", "PATCH"]:
            content_length = request.headers.get("content-length")

            if content_length:
                content_length_bytes = int(content_length)

                if content_length_bytes > MAX_REQUEST_SIZE:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": "FILE_TOO_LARGE",
                            "message": f"Request size {content_length_bytes / 1024 / 1024:.1f}MB exceeds 50MB limit",
                            "max_size_mb": 50,
                        },
                    )

        return await call_next(request)
