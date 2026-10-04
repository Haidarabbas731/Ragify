from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "Ragify"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # Database (PostgreSQL with asyncpg)
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str
    REDIS_PASSWORD: str | None = None

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Milvus — use VECTOR_DB_URI to avoid clashing with pymilvus's own MILVUS_URI env var
    # Dev: ./milvus_ragify.db (Milvus Lite, no container)
    # Prod: https://your-instance.cloud.zilliz.com
    VECTOR_DB_URI: str = "./milvus_ragify.db"
    MILVUS_COLLECTION: str = "knowledge_base"
    VECTOR_DB_TOKEN: str | None = None

    # File Storage
    # "local" (default): store documents on disk under STORAGE_LOCAL_PATH — no external account needed.
    # "b2": store documents in Backblaze B2 — requires the B2_* credentials below.
    STORAGE_BACKEND: str = "local"
    STORAGE_LOCAL_PATH: str = "./storage/documents"

    # Backblaze B2 (only required when STORAGE_BACKEND=b2)
    B2_APPLICATION_KEY_ID: str | None = None
    B2_APPLICATION_KEY: str | None = None
    B2_BUCKET_NAME: str | None = None

    # Provider suggested in the AI settings screen: "gemini" or "openrouter". The server holds
    # no chat key; every user adds their own (Profile > AI model).
    LLM_PROVIDER: str = "gemini"
    # Optional: key used to encrypt users' saved provider API keys. When empty (the default)
    # one is derived from JWT_SECRET_KEY, so saving keys works with no extra setup. Either
    # way, changing the secret makes saved keys unreadable and users must enter them again.
    # Generate: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    APP_ENCRYPTION_KEY: str | None = None
    # Chat generation includes retrieved document context, so give calls more room than a
    # bare prompt needs before the request is aborted as timed out (all providers).
    # The old name GEMINI_RAG_TIMEOUT_SECONDS is still accepted.
    LLM_TIMEOUT_SECONDS: int = Field(
        default=30,
        validation_alias=AliasChoices("LLM_TIMEOUT_SECONDS", "GEMINI_RAG_TIMEOUT_SECONDS"),
    )

    # Google Gemini (chat): suggested model name only
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Thinking effort for chat/agent calls: "minimal", "low", "medium" or "high" (which
    # levels are valid depends on the model). Empty leaves the model default. If the
    # model rejects the setting, the call is retried without it.
    GEMINI_THINKING_LEVEL: str = "low"

    # OpenRouter (chat, OpenAI-compatible API): suggested model name only
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"

    # Cohere (embeddings): the one server-side key, needed to index files and embed questions
    COHERE_API_KEY: str
    EMBEDDING_MODEL: str = "embed-v4.0"
    # Embedding dimension. Cohere embed-v4.0 supports 256, 512, 1024 or 1536.
    # Changing the model or dimension requires re-indexing: vectors from different models
    # are not comparable (the Milvus collection records which model built it).
    EMBEDDING_DIMENSION: int = 1024

    @property
    def embedding_fingerprint(self) -> str:
        """Identifies the embedding setup that built the vector index (model and dimension)."""
        return f"{self.EMBEDDING_MODEL}:{self.EMBEDDING_DIMENSION}"

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    MAX_UPLOAD_BATCH: int = 10  # Maximum number of files per bulk upload
    ALLOWED_FILE_TYPES: str = "pdf,docx,txt,md"

    @property
    def allowed_file_types_list(self) -> list[str]:
        """Parse comma-separated file types into a list."""
        return [ft.strip() for ft in self.ALLOWED_FILE_TYPES.split(",")]

    # Text Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # RAG Chat
    CONVERSATION_HISTORY_LIMIT: int = (
        5  # Number of previous messages to include for context
    )
    AGENT_MAX_TOOL_ROUNDS: int = 3  # Max search rounds the chat agent may run per question

    # Storage Quotas
    STORAGE_QUOTA_DEFAULT: int = 1073741824  # 1GB in bytes

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    # Seed admin credentials (used only on first run)
    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Email (Resend)
    RESEND_API_KEY: str
    EMAIL_FROM_ADDRESS: str
    EMAIL_FROM_NAME: str = "Ragify"
    PASSWORD_RESET_TOKEN_EXPIRY: int = 900  # 15 minutes in seconds

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()  # type:ignore
