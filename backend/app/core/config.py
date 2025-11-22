from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "AI Knowledge Base"
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

    # Milvus
    MILVUS_HOST: str = "localhost"
    MILVUS_PORT: int = 19530
    MILVUS_COLLECTION: str = "knowledge_base"
    MILVUS_TOKEN: str | None = None

    # Backblaze B2
    B2_APPLICATION_KEY_ID: str
    B2_APPLICATION_KEY: str
    B2_BUCKET_NAME: str

    # Google Gemini
    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    # Embedding dimension: 768 (standard), 1024 (better quality - CURRENT), 3072 (maximum)
    # Higher = better semantic understanding but slower search and more storage
    # 1024 provides best balance of quality vs performance
    EMBEDDING_DIMENSION: int = 1024

    # File Upload
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: str = "pdf,docx,txt,md"
    MAX_UPLOAD_BATCH: int = 10

    @property
    def allowed_file_types_list(self) -> list[str]:
        """Parse comma-separated file types into a list."""
        return [ft.strip() for ft in self.ALLOWED_FILE_TYPES.split(",")]

    # Text Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Storage Quotas
    STORAGE_QUOTA_DEFAULT: int = 1073741824  # 1GB in bytes

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    # Invite-Only Registration
    INVITE_ONLY: bool = True
    ADMIN_EMAIL: str | None = None

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Email (Resend)
    RESEND_API_KEY: str
    EMAIL_FROM_ADDRESS: str
    EMAIL_FROM_NAME: str = "AI Knowledge Base"
    PASSWORD_RESET_TOKEN_EXPIRY: int = 900  # 15 minutes in seconds

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True
    )


settings = Settings()  # type:ignore
