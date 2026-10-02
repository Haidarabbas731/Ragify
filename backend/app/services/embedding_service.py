import asyncio
import logging

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# Max concurrent embedding requests when embedding a batch of texts
_BATCH_CONCURRENCY = 5


class EmbeddingService:
    """Google Gemini embedding service for text vectorization."""

    def __init__(self):
        """Initialize Gemini API client."""
        self.model_name = settings.EMBEDDING_MODEL
        self.embedding_dim = settings.EMBEDDING_DIMENSION
        self._client: genai.Client | None = None

    @property
    def _configured(self) -> bool:
        """Whether the Gemini client has been created."""
        return self._client is not None

    async def configure(self) -> bool:
        """
        Create the Gemini API client with credentials.

        Returns:
            bool: True if configuration successful

        Raises:
            Exception: If Gemini API key is invalid
        """
        try:
            self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            logger.info(f"Gemini API configured successfully. Model: {self.model_name}")
            return True

        except Exception as e:
            logger.error(f"Gemini API configuration failed: {e}")
            self._client = None
            raise

    def _ensure_configured(self):
        """Ensure Gemini API is configured before operations."""
        if self._client is None:
            raise RuntimeError("Gemini API not configured. Call configure() first.")

    async def _embed(self, text: str, task_type: str) -> list[float]:
        """
        Embed one text with the given task type and validate its dimension.

        Args:
            text: Text to embed
            task_type: Gemini task type (e.g. "retrieval_document", "retrieval_query")

        Returns:
            list[float]: Embedding vector

        Raises:
            ValueError: If the returned dimension does not match the configured one
        """
        assert self._client is not None  # guaranteed by _ensure_configured()
        result = await self._client.aio.models.embed_content(
            model=self.model_name,
            contents=text,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=self.embedding_dim,
            ),
        )
        embedding = list(result.embeddings[0].values)  # type: ignore[index]

        if len(embedding) != self.embedding_dim:
            raise ValueError(f"Expected {self.embedding_dim}-dim embedding, got {len(embedding)}")

        return embedding

    async def embed_text(self, text: str) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed

        Returns:
            list[float]: Embedding vector (dimension from config)

        Raises:
            ValueError: If text is empty
            Exception: If embedding generation fails
        """
        self._ensure_configured()

        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        try:
            embedding = await self._embed(text, "retrieval_document")

            logger.debug(f"Generated embedding for text ({len(text)} chars)")
            return embedding

        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for multiple texts in batch.

        Args:
            texts: List of texts to embed

        Returns:
            list[list[float]]: List of embedding vectors (dimension from config)

        Raises:
            ValueError: If texts list is empty
            Exception: If batch embedding fails
        """
        self._ensure_configured()

        if not texts:
            raise ValueError("Texts list cannot be empty")

        try:
            # Filter out empty texts and keep track of indices
            valid_texts = [(i, text) for i, text in enumerate(texts) if text.strip()]

            if not valid_texts:
                raise ValueError("All texts are empty")

            # Embed valid texts concurrently (bounded), preserving input order
            semaphore = asyncio.Semaphore(_BATCH_CONCURRENCY)

            async def embed_one(text: str) -> list[float]:
                async with semaphore:
                    return await self._embed(text, "retrieval_document")

            embeddings = await asyncio.gather(*(embed_one(text) for _i, text in valid_texts))

            logger.info(f"Generated {len(embeddings)} embeddings in batch")
            return embeddings

        except Exception as e:
            logger.error(f"Batch embedding generation failed: {e}")
            raise

    async def embed_query(self, query: str) -> list[float]:
        """
        Generate embedding for search query.

        Args:
            query: Search query text

        Returns:
            list[float]: Embedding vector (dimension from config)

        Raises:
            ValueError: If query is empty
            Exception: If embedding generation fails
        """
        self._ensure_configured()

        if not query or not query.strip():
            raise ValueError("Query cannot be empty")

        try:
            embedding = await self._embed(query, "retrieval_query")

            logger.debug(f"Generated query embedding ({len(query)} chars)")
            return embedding

        except Exception as e:
            logger.error(f"Query embedding generation failed: {e}")
            raise


# Singleton instance
_embedding_service: EmbeddingService | None = None


async def get_embedding_service() -> EmbeddingService:
    """
    Get or create embedding service singleton.

    Returns:
        EmbeddingService: Initialized embedding service instance
    """
    global _embedding_service

    if _embedding_service is None:
        _embedding_service = EmbeddingService()
        await _embedding_service.configure()

    return _embedding_service
