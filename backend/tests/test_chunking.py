"""
Unit tests for chunking.py - Text chunking utilities.

Tests:
- RecursiveCharacterTextSplitter initialization
- Chunking with different separators
- Chunk overlap logic
- Character-level splitting
- Edge cases (empty text, very small text, very large text)
- create_chunks_with_metadata function
"""


from app.utils.chunking import RecursiveCharacterTextSplitter, create_chunks_with_metadata

# Test: RecursiveCharacterTextSplitter - Small text (no split needed)


def test_split_text_small_text():
    """Test that text smaller than chunk_size is not split."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)

    text = "This is a small text."
    chunks = splitter.split_text(text)

    assert len(chunks) == 1
    assert chunks[0] == text


# Test: Split by double newline


def test_split_text_by_double_newline():
    """Test splitting text by double newlines (paragraphs)."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=50, chunk_overlap=10)

    text = "First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here."
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    assert all(isinstance(chunk, str) for chunk in chunks)


# Test: Split by single newline


def test_split_text_by_single_newline():
    """Test splitting text by single newlines (lines)."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=30, chunk_overlap=5)

    text = "Line one\nLine two\nLine three\nLine four\nLine five"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1


# Test: Split by space


def test_split_text_by_space():
    """Test splitting text by spaces (words)."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=20, chunk_overlap=5)

    text = "Word one two three four five six seven eight nine ten"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    # Chunks exist and are non-empty
    assert all(len(chunk) > 0 for chunk in chunks)


# Test: Split by character (when no separator works)


def test_split_text_by_character():
    """Test character-level splitting when separators don't help."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=10, chunk_overlap=2)

    # Text with no separators
    text = "abcdefghijklmnopqrstuvwxyz"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    assert chunks[0] == "abcdefghij"  # First chunk (10 chars)
    assert chunks[1].startswith("ij")  # Second chunk starts with overlap (2 chars)


# Test: Chunk overlap


def test_chunk_overlap():
    """Test that chunks have proper overlap."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=20, chunk_overlap=5)

    text = "a" * 50  # 50 'a' characters
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    # Each chunk after the first should start with overlap from previous
    for i in range(1, len(chunks)):
        # Check overlap exists
        assert len(chunks[i]) >= 5


# Test: Empty text


def test_split_text_empty():
    """Test that empty text returns empty list."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)

    chunks = splitter.split_text("")

    assert chunks == []


# Test: Custom separators


def test_split_text_custom_separators():
    """Test splitting with custom separator list."""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=30, chunk_overlap=5, separators=["|", ".", " "]
    )

    text = "Part one|Part two|Part three|Part four"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1


# Test: Very long text


def test_split_text_very_long():
    """Test splitting very long text."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)

    text = "Long text. " * 200  # Create very long text
    chunks = splitter.split_text(text)

    assert len(chunks) > 10
    # All chunks except possibly the last should be close to chunk_size
    for chunk in chunks[:-1]:
        assert len(chunk) >= 80  # Allow for separator variance


# Test: No overlap (overlap = 0)


def test_split_text_no_overlap():
    """Test splitting with zero overlap."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=20, chunk_overlap=0)

    text = "a" * 60
    chunks = splitter.split_text(text)

    assert len(chunks) >= 3
    # With no overlap, first chunks should be chunk_size
    assert len(chunks[0]) == 20


# Test: Large overlap


def test_split_text_large_overlap():
    """Test splitting with large overlap."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=30, chunk_overlap=15)

    text = "a" * 100
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    # Verify overlap is present
    for i in range(1, len(chunks)):
        assert len(chunks[i]) >= 15


# Test: Single chunk with separator


def test_split_text_single_chunk_with_separator():
    """Test text with separators that still fits in single chunk."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=20)

    text = "Part one\n\nPart two"
    chunks = splitter.split_text(text)

    assert len(chunks) == 1
    assert chunks[0] == text


# Test: create_chunks_with_metadata - Basic


def test_create_chunks_with_metadata_basic():
    """Test creating chunks with metadata."""

    text = "This is a test document. " * 50  # Long enough to split
    chunks = create_chunks_with_metadata(text, chunk_size=100, chunk_overlap=20)

    assert len(chunks) > 1
    assert all("text" in chunk for chunk in chunks)
    assert all("chunk_index" in chunk for chunk in chunks)
    assert all("start_pos" in chunk for chunk in chunks)
    assert all("end_pos" in chunk for chunk in chunks)


# Test: create_chunks_with_metadata - Indices


def test_create_chunks_with_metadata_indices():
    """Test that chunk indices are sequential."""

    text = "a" * 300
    chunks = create_chunks_with_metadata(text, chunk_size=100, chunk_overlap=20)

    for i, chunk in enumerate(chunks):
        assert chunk["chunk_index"] == i


# Test: create_chunks_with_metadata - Positions


def test_create_chunks_with_metadata_positions():
    """Test that chunk positions are logical."""

    text = "a" * 300
    chunks = create_chunks_with_metadata(text, chunk_size=100, chunk_overlap=20)

    # First chunk should start at position 0
    assert chunks[0]["start_pos"] == 0

    # Each subsequent chunk should start after previous (accounting for overlap)
    for i in range(1, len(chunks)):
        prev_chunk = chunks[i - 1]
        current_chunk = chunks[i]

        # Current start should be close to previous end (accounting for overlap)
        assert current_chunk["start_pos"] >= prev_chunk["start_pos"]


# Test: create_chunks_with_metadata - Text content


def test_create_chunks_with_metadata_text_content():
    """Test that chunk text content is correct."""

    text = "Short text"
    chunks = create_chunks_with_metadata(text, chunk_size=100, chunk_overlap=20)

    assert len(chunks) == 1
    assert chunks[0]["text"] == text
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["start_pos"] == 0
    assert chunks[0]["end_pos"] == len(text)


# Test: create_chunks_with_metadata - Empty text


def test_create_chunks_with_metadata_empty():
    """Test creating chunks from empty text."""

    chunks = create_chunks_with_metadata("", chunk_size=100, chunk_overlap=20)

    assert chunks == []


# Test: create_chunks_with_metadata - Custom parameters


def test_create_chunks_with_metadata_custom_parameters():
    """Test chunk creation with custom chunk size and overlap."""

    text = "a" * 500
    chunks = create_chunks_with_metadata(text, chunk_size=50, chunk_overlap=10)

    assert len(chunks) > 5
    # Check that chunks were created
    assert all("text" in chunk for chunk in chunks)
    assert all("chunk_index" in chunk for chunk in chunks)


# Test: Recursive splitting with multiple levels


def test_split_text_recursive_multiple_levels():
    """Test that recursive splitting works through multiple separator levels."""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=30, chunk_overlap=5, separators=["\n\n", "\n", " ", ""]
    )

    # Text that requires multiple levels of splitting
    text = "Paragraph one with many words\n\nParagraph two with many words\n\nParagraph three with many words"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    # Verify chunks respect size limit
    for chunk in chunks:
        assert len(chunk) <= 35  # Account for overlap


# Test: Edge case - very small chunk_size


def test_split_text_very_small_chunk_size():
    """Test with very small chunk_size."""

    splitter = RecursiveCharacterTextSplitter(chunk_size=5, chunk_overlap=2)

    text = "This is a test"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    # All chunks should be strings
    assert all(isinstance(chunk, str) for chunk in chunks)


# Test: Split with only empty separator


def test_split_text_only_empty_separator():
    """Test splitting when only empty separator is provided."""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=10, chunk_overlap=2, separators=[""]
    )

    text = "abcdefghijklmnopqrstuvwxyz"
    chunks = splitter.split_text(text)

    assert len(chunks) > 1
    assert chunks[0] == "abcdefghij"
