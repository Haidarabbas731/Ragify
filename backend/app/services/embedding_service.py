import asyncio
import logging

import cohere
import httpx

from app.core.config import settings
from app.services.providers.base import (
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

logger = logging.getLogger(__name__)

# Cohere accepts at most 96 texts per embed request
_BATCH_SIZE = 96
# Concurrent embed requests when a document needs more than one batch
_CONCURRENCY = 3
# The SDK retries 408/429/5xx with backoff on its own; this is its retry budget per request
_MAX_RETRIES = 3


def _map_error(error: Exception) -> Exception:
    """Translate Cohere/network errors into `ProviderError`s; pass others through."""
    if isinstance(error, cohere.TooManyRequestsError):
        return ProviderRateLimitError(str(error))
    if isinstance(error, (cohere.UnauthorizedError, cohere.ForbiddenError)):
        return ProviderAuthError(str(error))
    if isinstance(
        error,
        (cohere.GatewayTimeoutError, cohere.ClientClosedRequestError, httpx.TimeoutException),
    ):
        return ProviderTimeoutError(str(error))
    if isinstance(
        error, (cohere.ServiceUnavailableError, cohere.InternalServerError, httpx.ConnectError)
    ):
        return ProviderUnavailableError(str(error))
    return error


class EmbeddingService:
    """Cohere embedding service for text vectorization."""

    def __init__(self, api_key: str, model: str, dimension: int):
        """
        Args:
            api_key: Cohere API key
            model: Embedding model, e.g. ``embed-v4.0``
            dimension: Output dimension (embed-v4.0: 256, 512, 1024 or 1536)
        """
        self.model_name = model
        self.embedding_dim = dimension
        self._client = cohere.AsyncClientV2(api_key=api_key)

    async def _embed(self, texts: list[str], input_type: str) -> list[list[float]]:
        """
        Embed texts in batches of up to 96 and validate each vector's dimension.

        Args:
            texts: Non-empty texts to embed
            input_type: ``search_document`` for indexing, ``search_query`` for questions

        Returns:
            list[list[float]]: One vector per text, in input order

        Raises:
            ProviderError: On rate limits, bad keys, timeouts or outages
            ValueError: If the returned dimension does not match the configured one
        """
        semaphore = asyncio.Semaphore(_CONCURRENCY)

        async def embed_batch(batch: list[str]) -> list[list[float]]:
            async with semaphore:
                try:
                    response = await self._client.embed(
                        texts=batch,
                        model=self.model_name,
                        input_type=input_type,
                        embedding_types=["float"],
                        output_dimension=self.embedding_dim,
                        request_options={"max_retries": _MAX_RETRIES},
                    )
                except Exception as e:
                    mapped = _map_error(e)
                    if mapped is e:
                        raise
                    raise mapped from e
                return [list(vector) for vector in response.embeddings.float_ or []]

        batches = [texts[i : i + _BATCH_SIZE] for i in range(0, len(texts), _BATCH_SIZE)]
        embeddings = [v for batch in await asyncio.gather(*map(embed_batch, batches)) for v in batch]

        if len(embeddings) != len(texts):
            raise ValueError(f"Expected {len(texts)} embeddings, got {len(embeddings)}")
        for vector in embeddings:
            if len(vector) != self.embedding_dim:
                raise ValueError(
                    f"Expected {self.embedding_dim}-dim embedding, got {len(vector)}"
                )
        return embeddings

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed document chunks for indexing. Blank texts are skipped.

        Args:
            texts: Texts to embed

        Returns:
            list[list[float]]: Embedding vectors for the non-blank texts, in order

        Raises:
            ValueError: If the list is empty or every text is blank
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")

        valid_texts = [text for text in texts if text.strip()]
        if not valid_texts:
            raise ValueError("All texts are empty")

        embeddings = await self._embed(valid_texts, "search_document")
        logger.info(f"Generated {len(embeddings)} embeddings in batch")
        return embeddings

    async def embed_query(self, query: str) -> list[float]:
        """
        Embed a search query.

        Args:
            query: Search query text

        Returns:
            list[float]: Embedding vector

        Raises:
            ValueError: If the query is empty
        """
        if not query or not query.strip():
            raise ValueError("Query cannot be empty")

        return (await self._embed([query], "search_query"))[0]


# Singleton instance
_embedding_service: EmbeddingService | None = None


async def get_embedding_service() -> EmbeddingService:
    """
    Get or create the embedding service singleton.

    Returns:
        EmbeddingService: Embedding service configured from settings
    """
    global _embedding_service

    if _embedding_service is None:
        _embedding_service = EmbeddingService(
            settings.COHERE_API_KEY, settings.EMBEDDING_MODEL, settings.EMBEDDING_DIMENSION
        )

    return _embedding_service
