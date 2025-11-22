from io import BytesIO
from pathlib import Path
from typing import BinaryIO

import pypdf
from docx import Document


def extract_text_from_pdf(file_path: str | BinaryIO) -> str:
    """
    Extract text from PDF file.

    Args:
        file_path: Path to PDF file or file-like object (BytesIO)

    Returns:
        Extracted text from all pages

    Raises:
        ValueError: If PDF is encrypted or corrupted
    """
    try:
        # Handle both file paths and file-like objects
        if isinstance(file_path, (str, Path)):
            reader = pypdf.PdfReader(file_path)
        else:
            reader = pypdf.PdfReader(file_path)

        if reader.is_encrypted:
            raise ValueError("PDF is encrypted and cannot be processed")

        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)

        return "\n".join(text_parts)

    except pypdf.errors.PdfReadError as e:
        raise ValueError(f"Corrupted or invalid PDF file: {str(e)}") from e


def extract_text_from_docx(file_path: str | BinaryIO) -> str:
    """
    Extract text from DOCX file including paragraphs, tables, headers, and footers.

    Args:
        file_path: Path to DOCX file or file-like object (BytesIO)

    Returns:
        Extracted text from document

    Raises:
        ValueError: If DOCX is corrupted
    """
    try:
        # python-docx accepts both file paths and file-like objects
        doc = Document(file_path)

        text_parts = []

        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_parts.append(paragraph.text)

        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        text_parts.append(cell.text)

        return "\n".join(text_parts)

    except Exception as e:
        raise ValueError(f"Corrupted or invalid DOCX file: {str(e)}") from e


def extract_text_from_txt(file_path: str | BinaryIO) -> str:
    """
    Extract text from TXT/MD file with encoding detection.

    Args:
        file_path: Path to text file or file-like object (BytesIO)

    Returns:
        File contents as string

    Raises:
        ValueError: If file cannot be read
    """
    encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']

    # Handle file-like objects (BytesIO)
    if isinstance(file_path, (BytesIO, BinaryIO)) or hasattr(file_path, 'read'):
        content = file_path.read()
        if isinstance(content, str):
            return content

        # Try to decode bytes
        for encoding in encodings:
            try:
                return content.decode(encoding)
            except (UnicodeDecodeError, AttributeError):
                continue

        raise ValueError(f"Could not decode file with any supported encoding: {encodings}")

    # Handle file paths
    for encoding in encodings:
        try:
            with open(file_path, encoding=encoding) as f:
                return f.read()
        except UnicodeDecodeError:
            continue

    raise ValueError(f"Could not decode file with any supported encoding: {encodings}")


def detect_file_type(file_path: str) -> str | None:
    """
    Detect file type from extension and validate.

    Args:
        file_path: Path to file

    Returns:
        File extension (pdf, docx, txt, md) or None if invalid
    """
    path = Path(file_path)
    extension = path.suffix.lower().lstrip('.')

    valid_extensions = {'pdf', 'docx', 'txt', 'md'}

    if extension in valid_extensions:
        return extension

    return None


def extract_text(file_path: str | BinaryIO, file_type: str | None = None, filename: str | None = None) -> str:
    """
    Extract text from file based on type.

    Args:
        file_path: Path to file or file-like object (BytesIO)
        file_type: Optional file type override (pdf, docx, txt, md)
        filename: Original filename (required if file_path is BytesIO)

    Returns:
        Extracted text

    Raises:
        ValueError: If file type is unsupported or extraction fails
    """
    if file_type is None:
        # For file-like objects, filename must be provided
        if not isinstance(file_path, (str, Path)):
            if not filename:
                raise ValueError("filename must be provided for file-like objects")
            file_type = detect_file_type(filename)
        else:
            file_type = detect_file_type(file_path)

    if file_type is None:
        raise ValueError(f"Unsupported file type for: {file_path}")

    if file_type == 'pdf':
        return extract_text_from_pdf(file_path)
    elif file_type == 'docx':
        return extract_text_from_docx(file_path)
    elif file_type in ('txt', 'md'):
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
