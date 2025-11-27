"""
Tests for app/utils/sanitization.py utility functions.

Tests all sanitization and validation functions:
- sanitize_email()
- sanitize_text_input()
- sanitize_filename()
- validate_file_extension()
- sanitize_query()
- validate_collection_name()
"""


from app.utils.sanitization import (
    sanitize_email,
    sanitize_filename,
    sanitize_query,
    sanitize_text_input,
    validate_collection_name,
    validate_file_extension,
)

# Test sanitize_email


def test_sanitize_email_lowercase():
    """Test email is converted to lowercase."""
    assert sanitize_email("TEST@EXAMPLE.COM") == "test@example.com"


def test_sanitize_email_trim():
    """Test email whitespace is trimmed."""
    assert sanitize_email("  test@example.com  ") == "test@example.com"


def test_sanitize_email_both():
    """Test email is lowercased and trimmed."""
    assert sanitize_email("  TEST@EXAMPLE.COM  ") == "test@example.com"


# Test sanitize_text_input


def test_sanitize_text_removes_null_bytes():
    """Test null bytes are removed from text."""
    text = "Hello\x00World"
    assert sanitize_text_input(text) == "HelloWorld"


def test_sanitize_text_removes_control_chars():
    """Test control characters are removed (except newline, carriage return, tab)."""
    text = "Hello\x01\x02World"
    assert sanitize_text_input(text) == "HelloWorld"


def test_sanitize_text_keeps_newlines():
    """Test newlines are preserved."""
    text = "Hello\nWorld"
    assert sanitize_text_input(text) == "Hello\nWorld"


def test_sanitize_text_keeps_tabs():
    """Test tabs are preserved."""
    text = "Hello\tWorld"
    assert sanitize_text_input(text) == "Hello\tWorld"


def test_sanitize_text_keeps_carriage_returns():
    """Test carriage returns are preserved."""
    text = "Hello\rWorld"
    assert sanitize_text_input(text) == "Hello\rWorld"


def test_sanitize_text_trims_whitespace():
    """Test leading/trailing whitespace is removed."""
    text = "  Hello World  "
    assert sanitize_text_input(text) == "Hello World"


# Test sanitize_filename


def test_sanitize_filename_removes_path():
    """Test path components are removed, only filename kept."""
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("/path/to/file.txt") == "file.txt"


def test_sanitize_filename_removes_dangerous_chars():
    """Test dangerous characters are removed."""
    assert sanitize_filename('file<>:"|?*.txt') == "file.txt"


def test_sanitize_filename_removes_path_traversal():
    """Test .. is removed to prevent path traversal."""
    assert sanitize_filename("..file.txt") == "file.txt"


def test_sanitize_filename_replaces_spaces():
    """Test spaces are replaced with underscores."""
    assert sanitize_filename("my file name.txt") == "my_file_name.txt"


def test_sanitize_filename_adds_prefix_if_starts_with_dot():
    """Test files starting with . get 'file' prefix."""
    assert sanitize_filename(".hidden") == "file.hidden"


def test_sanitize_filename_adds_prefix_if_empty():
    """Test empty filename gets 'file' prefix."""
    assert sanitize_filename("") == "file"
    assert sanitize_filename("...") == "file."  # ".." removed leaves single "."


def test_sanitize_filename_truncates_long_names():
    """Test filenames longer than 255 chars are truncated."""
    long_name = "a" * 300 + ".txt"
    result = sanitize_filename(long_name)
    assert len(result) == 255


# Test validate_file_extension


def test_validate_file_extension_valid():
    """Test valid file extensions are accepted."""
    assert validate_file_extension("file.pdf", ["pdf", "docx"])
    assert validate_file_extension("file.DOCX", ["pdf", "docx"])  # Case insensitive


def test_validate_file_extension_invalid():
    """Test invalid file extensions are rejected."""
    assert not validate_file_extension("file.exe", ["pdf", "docx"])
    assert not validate_file_extension("file.txt", ["pdf", "docx"])


def test_validate_file_extension_no_extension():
    """Test files without extension are rejected."""
    assert not validate_file_extension("file", ["pdf", "docx"])


def test_validate_file_extension_case_insensitive():
    """Test extension matching is case insensitive."""
    assert validate_file_extension("file.PDF", ["pdf"])
    assert validate_file_extension("file.pdf", ["PDF"])


# Test sanitize_query


def test_sanitize_query_basic():
    """Test basic query sanitization."""
    query = "  Hello World  "
    assert sanitize_query(query) == "Hello World"


def test_sanitize_query_removes_control_chars():
    """Test control characters are removed from queries."""
    query = "Hello\x00\x01World"
    assert sanitize_query(query) == "HelloWorld"


def test_sanitize_query_max_length_default():
    """Test query is truncated to default 1000 chars."""
    query = "a" * 2000
    result = sanitize_query(query)
    assert len(result) == 1000


def test_sanitize_query_max_length_custom():
    """Test query is truncated to custom max length."""
    query = "a" * 500
    result = sanitize_query(query, max_length=100)
    assert len(result) == 100


def test_sanitize_query_preserves_newlines():
    """Test newlines are preserved in queries."""
    query = "Line 1\nLine 2"
    assert sanitize_query(query) == "Line 1\nLine 2"


# Test validate_collection_name


def test_validate_collection_name_valid():
    """Test valid collection names are accepted."""
    assert validate_collection_name("My Collection")
    assert validate_collection_name("test-collection")
    assert validate_collection_name("test_collection")
    assert validate_collection_name("Collection123")


def test_validate_collection_name_empty():
    """Test empty collection name is rejected."""
    assert not validate_collection_name("")


def test_validate_collection_name_too_long():
    """Test collection name longer than 255 chars is rejected."""
    long_name = "a" * 256
    assert not validate_collection_name(long_name)


def test_validate_collection_name_exactly_255():
    """Test collection name of exactly 255 chars is accepted."""
    name = "a" * 255
    assert validate_collection_name(name)


def test_validate_collection_name_invalid_chars():
    """Test collection names with invalid characters are rejected."""
    assert not validate_collection_name("collection@name")
    assert not validate_collection_name("collection#name")
    assert not validate_collection_name("collection/name")
    assert not validate_collection_name("collection\\name")


def test_validate_collection_name_special_chars_allowed():
    """Test allowed special characters: spaces, hyphens, underscores."""
    assert validate_collection_name("My Collection Name")
    assert validate_collection_name("test-collection-name")
    assert validate_collection_name("test_collection_name")
    assert validate_collection_name("Mixed-Name_123 Test")
