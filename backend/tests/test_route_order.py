"""
Route-order checks: static paths must not be swallowed by `{param}` routes declared earlier.
"""

import pytest
from starlette.routing import Match

from main import app


def first_match(method: str, path: str):
    """The route FastAPI would dispatch this request to."""
    scope = {"type": "http", "method": method, "path": path}
    for route in app.routes:
        match, _ = route.matches(scope)
        if match == Match.FULL:
            return route
    return None


@pytest.mark.parametrize(
    ("method", "path", "handler"),
    [
        ("DELETE", "/api/v1/admin/documents/cleanup-all", "cleanup_all_documents"),
        ("DELETE", "/api/v1/admin/documents/some-document-id", "delete_document"),
        ("POST", "/api/v1/documents/delete-all-mine", "delete_all_my_documents"),
    ],
)
def test_static_paths_reach_their_own_handler(method, path, handler):
    """cleanup-all and delete-all-mine are not mistaken for document ids."""
    route = first_match(method, path)

    assert route is not None
    assert route.name == handler
