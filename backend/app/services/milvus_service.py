import logging
from typing import Any

from pymilvus import DataType, MilvusClient

from app.core.config import settings

logger = logging.getLogger(__name__)


class MilvusService:
    """Milvus vector database service for document embeddings."""

    def __init__(self):
        self.client: MilvusClient | None = None
        self.collection_name = settings.MILVUS_COLLECTION
        self.embedding_dim = settings.EMBEDDING_DIMENSION

    async def connect(self) -> bool:
        """
        Connect to Milvus.

        Works with both Milvus Lite (local .db file) and Zilliz Cloud (remote URI).
        Token is only passed when set — local/Lite has no auth.
        """
        try:
            kwargs: dict[str, Any] = {"uri": settings.VECTOR_DB_URI}
            if settings.VECTOR_DB_TOKEN:
                kwargs["token"] = settings.VECTOR_DB_TOKEN

            self.client = MilvusClient(**kwargs)
            logger.info(f"Milvus connected. URI: {settings.VECTOR_DB_URI}")

            await self._init_collection()
            return True

        except Exception as e:
            logger.error(f"Milvus connection failed: {e}")
            self.client = None
            raise

    def _ensure_connected(self):
        if self.client is None:
            raise RuntimeError("Milvus not connected. Call connect() first.")

    async def _init_collection(self):
        """
        Create collection with schema if it doesn't exist.

        Schema fields:
        - chunk_id: Primary key (VARCHAR 36)
        - user_id: User isolation (VARCHAR 36)
        - document_id: Source document reference (VARCHAR 36)
        - collection_id: Optional collection filter (VARCHAR 36)
        - embedding: Vector (FLOAT_VECTOR)
        - chunk_text: Raw text content (VARCHAR 65535)
        - chunk_index: Position in document (INT64)
        """
        self._ensure_connected()

        if self.client.has_collection(self.collection_name):  # type: ignore
            self.client.load_collection(self.collection_name)  # type: ignore
            logger.info(f"Collection '{self.collection_name}' already exists, loaded")
            return

        schema = MilvusClient.create_schema(auto_id=False, enable_dynamic_field=False)
        schema.add_field("chunk_id", DataType.VARCHAR, is_primary=True, max_length=36)
        schema.add_field("user_id", DataType.VARCHAR, max_length=36)
        schema.add_field("document_id", DataType.VARCHAR, max_length=36)
        schema.add_field("collection_id", DataType.VARCHAR, max_length=36, nullable=True)
        schema.add_field("embedding", DataType.FLOAT_VECTOR, dim=self.embedding_dim)
        schema.add_field("chunk_text", DataType.VARCHAR, max_length=65535)
        schema.add_field("chunk_index", DataType.INT64)

        index_params = self.client.prepare_index_params()  # type: ignore
        index_params.add_index(
            field_name="embedding",
            index_type="IVF_FLAT",
            metric_type="COSINE",
            params={"nlist": 128},
        )

        self.client.create_collection(  # type: ignore
            collection_name=self.collection_name,
            schema=schema,
            index_params=index_params,
        )
        self.client.load_collection(self.collection_name)  # type: ignore
        logger.info(f"Collection '{self.collection_name}' created with IVF_FLAT index")

    async def insert_chunks(
        self,
        chunk_ids: list[str],
        user_id: str,
        document_id: str,
        embeddings: list[list[float]],
        chunk_texts: list[str],
        chunk_indices: list[int],
        collection_id: str | None = None,
    ) -> bool:
        """Insert document chunks with embeddings into Milvus."""
        self._ensure_connected()

        if not all(
            len(chunk_ids) == len(lst)
            for lst in [embeddings, chunk_texts, chunk_indices]
        ):
            raise ValueError("All input lists must have the same length")

        try:
            data = [
                {
                    "chunk_id": chunk_ids[i],
                    "user_id": user_id,
                    "document_id": document_id,
                    "collection_id": collection_id or None,
                    "embedding": embeddings[i],
                    "chunk_text": chunk_texts[i],
                    "chunk_index": chunk_indices[i],
                }
                for i in range(len(chunk_ids))
            ]

            self.client.insert(collection_name=self.collection_name, data=data)  # type: ignore
            logger.info(
                f"Inserted {len(chunk_ids)} chunks for document {document_id} "
                f"(user {user_id}, collection {collection_id})"
            )
            return True

        except Exception as e:
            logger.error(f"Milvus insertion failed for document {document_id}: {e}")
            raise

    async def search_similar(
        self,
        user_id: str,
        query_embedding: list[float],
        top_k: int = 5,
        document_ids: list[str] | None = None,
        collection_id: str | None = None,
    ) -> list[dict[str, Any]]:
        """Search for similar chunks using vector similarity."""
        self._ensure_connected()

        try:
            filter_expr = f"user_id == '{user_id}'"

            if collection_id:
                filter_expr += f" and collection_id == '{collection_id}'"

            if document_ids:
                doc_filter = " or ".join(
                    [f"document_id == '{d}'" for d in document_ids]
                )
                filter_expr += f" and ({doc_filter})"

            results = self.client.search(  # type: ignore
                collection_name=self.collection_name,
                data=[query_embedding],
                filter=filter_expr,
                limit=top_k,
                output_fields=[
                    "chunk_id",
                    "document_id",
                    "collection_id",
                    "chunk_text",
                    "chunk_index",
                ],
                search_params={"metric_type": "COSINE", "params": {"nprobe": 10}},
            )

            formatted = [
                {
                    "chunk_id": hit["entity"].get("chunk_id"),
                    "document_id": hit["entity"].get("document_id"),
                    "collection_id": hit["entity"].get("collection_id"),
                    "chunk_text": hit["entity"].get("chunk_text"),
                    "chunk_index": hit["entity"].get("chunk_index"),
                    "score": hit["distance"],
                }
                for hits in results
                for hit in hits
            ]

            logger.info(f"Found {len(formatted)} similar chunks for user {user_id}")
            return formatted

        except Exception as e:
            logger.error(f"Milvus search failed for user {user_id}: {e}")
            raise

    async def delete_document_chunks(self, document_id: str) -> bool:
        """Delete all chunks for a document."""
        self._ensure_connected()

        try:
            self.client.delete(  # type: ignore
                collection_name=self.collection_name,
                filter=f"document_id == '{document_id}'",
            )
            logger.info(f"Deleted chunks for document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Milvus deletion failed for document {document_id}: {e}")
            raise

    async def delete_user_data(self, user_id: str) -> bool:
        """Delete all data for a user."""
        self._ensure_connected()

        try:
            self.client.delete(  # type: ignore
                collection_name=self.collection_name,
                filter=f"user_id == '{user_id}'",
            )
            logger.info(f"Deleted all chunks for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Milvus user deletion failed for user {user_id}: {e}")
            raise

    async def get_document_chunks(
        self, document_id: str, user_id: str
    ) -> list[dict[str, Any]]:
        """Get all chunks for a document, ordered by chunk_index."""
        self._ensure_connected()

        try:
            results = self.client.query(  # type: ignore
                collection_name=self.collection_name,
                filter=f"document_id == '{document_id}' && user_id == '{user_id}'",
                output_fields=["chunk_id", "chunk_text", "chunk_index"],
            )

            chunks = sorted(results, key=lambda x: x.get("chunk_index", 0))
            logger.info(f"Retrieved {len(chunks)} chunks for document {document_id}")
            return chunks  # type: ignore

        except Exception as e:
            logger.error(f"Error retrieving chunks for document {document_id}: {e}")
            return []

    async def get_document_chunk_count(self, document_id: str) -> int:
        """Get total number of chunks for a document."""
        self._ensure_connected()

        try:
            results = self.client.query(  # type: ignore
                collection_name=self.collection_name,
                filter=f"document_id == '{document_id}'",
                output_fields=["chunk_id"],
            )
            count = len(results)
            logger.info(f"Document {document_id} has {count} chunks")
            return count

        except Exception as e:
            logger.error(f"Milvus chunk count failed for document {document_id}: {e}")
            raise

    async def create_collection(self) -> bool:
        """Create collection with schema (public method for recreation)."""
        await self._init_collection()
        return True

    async def drop_and_recreate_collection(self) -> bool:
        """Drop and recreate collection. Deletes ALL data — use with caution."""
        self._ensure_connected()

        try:
            if self.client.has_collection(self.collection_name):  # type: ignore
                self.client.drop_collection(self.collection_name)  # type: ignore
                logger.info(f"Dropped collection: {self.collection_name}")

            await self._init_collection()
            logger.info(f"Recreated collection: {self.collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to drop/recreate collection: {e}")
            raise

    def disconnect(self):
        """Close Milvus connection."""
        if self.client is not None:
            self.client.close()
            self.client = None
            logger.info("Milvus disconnected")


# Singleton instance
_milvus_service: MilvusService | None = None


async def get_milvus_service() -> MilvusService:
    """Get or create Milvus service singleton."""
    global _milvus_service

    if _milvus_service is None:
        _milvus_service = MilvusService()
        await _milvus_service.connect()

    return _milvus_service
