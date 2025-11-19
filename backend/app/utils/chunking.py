

class RecursiveCharacterTextSplitter:
    """
    Split text into chunks recursively by separators.

    Maintains chunk overlap for context continuity.
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: list[str] | None = None
    ):
        """
        Initialize text splitter.

        Args:
            chunk_size: Maximum characters per chunk
            chunk_overlap: Character overlap between consecutive chunks
            separators: List of separators to split by (in order of preference)
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", " ", ""]

    def split_text(self, text: str) -> list[str]:
        """
        Split text into chunks.

        Args:
            text: Text to split

        Returns:
            List of text chunks
        """
        return self._split_text_recursive(text, self.separators)

    def _split_text_recursive(self, text: str, separators: list[str]) -> list[str]:
        """
        Recursively split text by separators.

        Args:
            text: Text to split
            separators: Remaining separators to try

        Returns:
            List of text chunks
        """
        chunks = []

        if len(text) <= self.chunk_size:
            return [text] if text else []

        if not separators:
            return self._split_by_character(text)

        separator = separators[0]
        remaining_separators = separators[1:]

        if separator == "":
            return self._split_by_character(text)

        splits = text.split(separator)

        current_chunk = []
        current_length = 0

        for _i, split in enumerate(splits):
            split_length = len(split)

            if current_length + split_length + len(separator) <= self.chunk_size:
                current_chunk.append(split)
                current_length += split_length + len(separator)
            else:
                if current_chunk:
                    chunk_text = separator.join(current_chunk)
                    if len(chunk_text) > self.chunk_size:
                        chunks.extend(
                            self._split_text_recursive(chunk_text, remaining_separators)
                        )
                    else:
                        chunks.append(chunk_text)

                current_chunk = [split]
                current_length = split_length

        if current_chunk:
            chunk_text = separator.join(current_chunk)
            if len(chunk_text) > self.chunk_size:
                chunks.extend(
                    self._split_text_recursive(chunk_text, remaining_separators)
                )
            else:
                chunks.append(chunk_text)

        return self._merge_chunks_with_overlap(chunks)

    def _split_by_character(self, text: str) -> list[str]:
        """
        Split text by character when no separators work.

        Args:
            text: Text to split

        Returns:
            List of chunks
        """
        chunks = []
        start = 0

        while start < len(text):
            end = start + self.chunk_size
            chunks.append(text[start:end])
            start = end - self.chunk_overlap

        return chunks

    def _merge_chunks_with_overlap(self, chunks: list[str]) -> list[str]:
        """
        Add overlap between chunks.

        Args:
            chunks: List of chunks without overlap

        Returns:
            List of chunks with overlap
        """
        if len(chunks) <= 1:
            return chunks

        result = []

        for i, chunk in enumerate(chunks):
            if i == 0:
                result.append(chunk)
            else:
                prev_chunk = chunks[i - 1]
                overlap_text = prev_chunk[-self.chunk_overlap:] if len(prev_chunk) > self.chunk_overlap else prev_chunk
                result.append(overlap_text + chunk)

        return result


def create_chunks_with_metadata(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> list[dict]:
    """
    Create chunks with metadata (index, position).

    Args:
        text: Text to chunk
        chunk_size: Maximum characters per chunk
        chunk_overlap: Character overlap

    Returns:
        List of dicts with 'text', 'chunk_index', 'start_pos', 'end_pos'
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )

    chunks = splitter.split_text(text)

    chunks_with_metadata = []
    current_position = 0

    for idx, chunk_text in enumerate(chunks):
        chunk_length = len(chunk_text)

        chunks_with_metadata.append({
            'text': chunk_text,
            'chunk_index': idx,
            'start_pos': current_position,
            'end_pos': current_position + chunk_length
        })

        current_position += chunk_length - chunk_overlap

    return chunks_with_metadata
