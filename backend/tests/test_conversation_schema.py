"""
Unit tests for the conversation message schema, including messages stored before sources
were typed.
"""

from datetime import UTC, datetime

from app.schemas.chat import SourceCitation
from app.schemas.conversation import Message

STORED_SOURCE = {
    "document_id": "d1",
    "document_name": "policy.pdf",
    "filename": "policy.pdf",
    "chunk_index": 2,
    "chunk_text": "excerpt",
    "relevance_score": 0.87,
}


def test_stored_source_dicts_parse_into_source_citations():
    """Messages saved as plain dicts (the stored JSON shape) load as typed sources."""
    message = Message(
        role="assistant", content="answer", timestamp=datetime.now(UTC), sources=[STORED_SOURCE]
    )

    assert isinstance(message.sources[0], SourceCitation)
    assert message.sources[0].filename == "policy.pdf"
    assert message.model_dump()["sources"][0] == STORED_SOURCE


def test_messages_without_sources_still_load():
    """User messages and old assistant messages have no sources."""
    message = Message(role="user", content="hi", timestamp=datetime.now(UTC))

    assert message.sources == []
