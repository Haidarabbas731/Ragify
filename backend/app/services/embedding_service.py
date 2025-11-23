import logging

import google.generativeai as genai  # type: ignore

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Google Gemini embedding service for text vectorization."""

    def __init__(self):
        """Initialize Gemini API client."""
        self.model_name = settings.EMBEDDING_MODEL
        self.embedding_dim = settings.EMBEDDING_DIMENSION
        self._configured = False

    async def configure(self) -> bool:
        """
        Configure Gemini API with credentials.

        Returns:
            bool: True if configuration successful

        Raises:
            Exception: If Gemini API key is invalid
        """
        try:
            genai.configure(api_key=settings.GOOGLE_API_KEY)  # type: ignore
            self._configured = True
            logger.info(f"Gemini API configured successfully. Model: {self.model_name}")
            return True

        except Exception as e:
            logger.error(f"Gemini API configuration failed: {e}")
            self._configured = False
            raise

    def _ensure_configured(self):
        """Ensure Gemini API is configured before operations."""
        if not self._configured:
            raise RuntimeError("Gemini API not configured. Call configure() first.")

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
            result = genai.embed_content(  # type: ignore
                model=self.model_name,
                content=text,
                task_type="retrieval_document",  # For document indexing
                output_dimensionality=self.embedding_dim,  # Specify desired dimension
            )

            embedding = result["embedding"]

            if len(embedding) != self.embedding_dim:
                raise ValueError(
                    f"Expected {self.embedding_dim}-dim embedding, got {len(embedding)}"
                )

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

            # Generate embeddings for valid texts only
            embeddings = []
            for _i, text in valid_texts:
                result = genai.embed_content(  # type: ignore
                    model=self.model_name,
                    content=text,
                    task_type="retrieval_document",
                    output_dimensionality=self.embedding_dim,  # Specify desired dimension
                )
                embeddings.append(result["embedding"])

            # Validate dimensions
            for emb in embeddings:
                if len(emb) != self.embedding_dim:
                    raise ValueError(
                        f"Expected {self.embedding_dim}-dim embedding, got {len(emb)}"
                    )

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
            result = genai.embed_content(  # type: ignore
                model=self.model_name,
                content=query,
                task_type="retrieval_query",  # For query matching
                output_dimensionality=self.embedding_dim,  # Specify desired dimension
            )

            embedding = result["embedding"]

            if len(embedding) != self.embedding_dim:
                raise ValueError(
                    f"Expected {self.embedding_dim}-dim embedding, got {len(embedding)}"
                )

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
