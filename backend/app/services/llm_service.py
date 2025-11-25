import logging
from collections.abc import AsyncIterator

import google.generativeai as genai  # type: ignore

from app.core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Google Gemini LLM service for RAG chat generation."""

    def __init__(self):
        """Initialize Gemini API client."""
        self.model_name = settings.GEMINI_MODEL
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
            logger.info(f"Gemini LLM configured successfully. Model: {self.model_name}")
            return True

        except Exception as e:
            logger.error(f"Gemini LLM configuration failed: {e}")
            self._configured = False
            raise

    def _ensure_configured(self):
        """Ensure Gemini API is configured before operations."""
        if not self._configured:
            raise RuntimeError("Gemini LLM not configured. Call configure() first.")

    async def generate_response(
        self, system_prompt: str, user_prompt: str, timeout: int = 10
    ) -> str:
        """
        Generate AI response using Gemini LLM.

        Args:
            system_prompt: System instructions for the model
            user_prompt: User query with context
            timeout: Timeout in seconds (default: 10)

        Returns:
            str: Generated response text

        Raises:
            RuntimeError: If LLM not configured
            ValueError: If prompts are empty
            TimeoutError: If request times out
            Exception: If generation fails
        """
        self._ensure_configured()

        if not system_prompt or not system_prompt.strip():
            raise ValueError("System prompt cannot be empty")

        if not user_prompt or not user_prompt.strip():
            raise ValueError("User prompt cannot be empty")

        try:
            # Combine system and user prompts
            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            # Create model instance
            model = genai.GenerativeModel(self.model_name)  # type: ignore

            # Generate response with timeout
            response = model.generate_content(  # type: ignore
                full_prompt,
                request_options={"timeout": timeout},
            )

            # Extract text from response
            if not response.text:
                raise ValueError("LLM returned empty response")

            logger.info(
                f"Generated LLM response ({len(response.text)} chars) for prompt ({len(user_prompt)} chars)"
            )
            return response.text

        except TimeoutError as e:
            logger.error(f"LLM request timed out after {timeout}s")
            raise TimeoutError(f"LLM request timed out after {timeout} seconds") from e

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    async def generate_response_stream(
        self, system_prompt: str, user_prompt: str, timeout: int = 10
    ) -> AsyncIterator[str]:
        """
        Generate AI response using Gemini LLM with streaming.

        Args:
            system_prompt: System instructions for the model
            user_prompt: User query with context
            timeout: Timeout in seconds (default: 10)

        Yields:
            str: Text chunks as they are generated

        Raises:
            RuntimeError: If LLM not configured
            ValueError: If prompts are empty
            TimeoutError: If request times out
            Exception: If generation fails
        """
        self._ensure_configured()

        if not system_prompt or not system_prompt.strip():
            raise ValueError("System prompt cannot be empty")

        if not user_prompt or not user_prompt.strip():
            raise ValueError("User prompt cannot be empty")

        try:
            # Combine system and user prompts
            full_prompt = f"{system_prompt}\n\n{user_prompt}"

            # Create model instance
            model = genai.GenerativeModel(self.model_name)  # type: ignore

            # Generate streaming response with timeout
            response = model.generate_content(  # type: ignore
                full_prompt,
                stream=True,
                request_options={"timeout": timeout},
            )

            # Yield text chunks as they arrive
            total_chars = 0
            for chunk in response:
                if chunk.text:
                    total_chars += len(chunk.text)
                    yield chunk.text

            logger.info(
                f"Streamed LLM response ({total_chars} chars) for prompt ({len(user_prompt)} chars)"
            )

        except TimeoutError as e:
            logger.error(f"LLM streaming request timed out after {timeout}s")
            raise TimeoutError(f"LLM request timed out after {timeout} seconds") from e

        except Exception as e:
            logger.error(f"LLM streaming generation failed: {e}")
            raise


# Singleton instance
_llm_service: LLMService | None = None


async def get_llm_service() -> LLMService:
    """
    Get or create LLM service singleton.

    Returns:
        LLMService: Initialized LLM service instance
    """
    global _llm_service

    if _llm_service is None:
        _llm_service = LLMService()
        await _llm_service.configure()

    return _llm_service
