import logging
from typing import Any

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    MilvusClient,
    connections,
    utility,
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class MilvusService:
    """Milvus vector database service for document embeddings."""

    def __init__(self):
        """Initialize Milvus client."""
        self.client: MilvusClient | None = None
        self.collection_name = settings.MILVUS_COLLECTION
        self.embedding_dim = settings.EMBEDDING_DIMENSION
        self.collection: Collection | None = None
        self._connected = False

    async def connect(self) -> bool:
        """
        Connect to Milvus server.

        Returns:
            bool: True if connection successful

        Raises:
            Exception: If Milvus connection fails
        """
        try:
            # Use URI directly from settings (supports both local and Zilliz Cloud)
            connections.connect(
                alias="default",
                uri=settings.MILVUS_URI,
                token=settings.MILVUS_TOKEN,  # type:ignore
            )
            self._connected = True
            logger.info(f"Milvus connected successfully. URI: {settings.MILVUS_URI}")

            # Initialize collection if it doesn't exist
            await self._init_collection()
            return True

        except Exception as e:
            logger.error(f"Milvus connection failed: {e}")
            self._connected = False
            raise

    def _ensure_connected(self):
        """Ensure Milvus is connected before operations."""
        if not self._connected:
            raise RuntimeError("Milvus not connected. Call connect() first.")

    async def _init_collection(self):
        """
        Initialize Milvus collection with schema.

        Schema:
        - chunk_id: Primary key (VARCHAR 36)
        - user_id: User ID for isolation (VARCHAR 36)
        - document_id: Reference to document (VARCHAR 36)
        - collection_id: Collection ID for filtering (VARCHAR 36, nullable)
        - embedding: Vector embedding (FLOAT_VECTOR from config)
        - chunk_text: Original text chunk (VARCHAR 65535)
        - chunk_index: Chunk position in document (INT64)
        """
        if utility.has_collection(self.collection_name):
            self.collection = Collection(self.collection_name)
            logger.info(f"Collection '{self.collection_name}' already exists")
            return

        # Define schema
        fields = [
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, is_primary=True, max_length=36),
            FieldSchema(name="user_id", dtype=DataType.VARCHAR, max_length=36),
            FieldSchema(name="document_id", dtype=DataType.VARCHAR, max_length=36),
            FieldSchema(name="collection_id", dtype=DataType.VARCHAR, max_length=36, nullable=True),
            FieldSchema(
                name="embedding",
                dtype=DataType.FLOAT_VECTOR,
                dim=self.embedding_dim,
            ),
            FieldSchema(name="chunk_text", dtype=DataType.VARCHAR, max_length=65535),
            FieldSchema(name="chunk_index", dtype=DataType.INT64),
        ]

        schema = CollectionSchema(
            fields=fields, description="Knowledge base document chunks with embeddings"
        )

        # Create collection
        self.collection = Collection(name=self.collection_name, schema=schema)

        # Create IVF_FLAT index for vector similarity search
        index_params = {
            "index_type": "IVF_FLAT",
            "metric_type": "COSINE",  # Cosine similarity
            "params": {"nlist": 128},  # Number of clusters
        }

        self.collection.create_index(field_name="embedding", index_params=index_params)  # type:ignore
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
        """
        Insert document chunks with embeddings into Milvus.

        Args:
            chunk_ids: List of chunk IDs
            user_id: User ID for isolation
            document_id: Document ID reference
            embeddings: List of embedding vectors (dimension from config)
            chunk_texts: List of original text chunks
            chunk_indices: List of chunk positions
            collection_id: Collection ID for filtering (optional)

        Returns:
            bool: True if insertion successful

        Raises:
            ValueError: If input lists have different lengths
            Exception: If insertion fails
        """
        self._ensure_connected()

        # Validate input
        if not all(len(chunk_ids) == len(lst) for lst in [embeddings, chunk_texts, chunk_indices]):
            raise ValueError("All input lists must have the same length")

        try:
            # Prepare data
            data = [
                chunk_ids,
                [user_id] * len(chunk_ids),
                [document_id] * len(chunk_ids),
                [collection_id if collection_id else ""] * len(chunk_ids),
                embeddings,
                chunk_texts,
                chunk_indices,
            ]

            # Insert into collection
            self.collection.insert(data)  # type:ignore
            self.collection.flush()  # type:ignore

            logger.info(
                f"Inserted {len(chunk_ids)} chunks for document {document_id} (user {user_id}, collection {collection_id})"
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
        """
        Search for similar chunks using vector similarity.

        Args:
            user_id: User ID for isolation
            query_embedding: Query vector (dimension from config)
            top_k: Number of results to return (default: 5)
            document_ids: Optional filter by document IDs
            collection_id: Optional filter by collection ID

        Returns:
            list[dict]: List of search results with chunk data and scores

        Raises:
            Exception: If search fails
        """
        self._ensure_connected()

        try:
            # Load collection into memory for search
            self.collection.load()  # type:ignore

            # Build filter expression for user isolation
            filter_expr = f"user_id == '{user_id}'"

            # Add collection filter if specified
            if collection_id:
                filter_expr += f" and collection_id == '{collection_id}'"

            # Add document filter if specified
            if document_ids:
                doc_filter = " or ".join([f"document_id == '{d}'" for d in document_ids])
                filter_expr += f" and ({doc_filter})"

            # Search parameters
            search_params = {
                "metric_type": "COSINE",
                "params": {"nprobe": 10},  # Number of clusters to search
            }

            # Perform search
            results = self.collection.search(  # type:ignore
                data=[query_embedding],
                anns_field="embedding",
                param=search_params,
                limit=top_k,
                expr=filter_expr,
                output_fields=[
                    "chunk_id",
                    "document_id",
                    "collection_id",
                    "chunk_text",
                    "chunk_index",
                ],
            )

            # Format results
            formatted_results = []
            for hits in results:  # type:ignore
                for hit in hits:
                    formatted_results.append(
                        {
                            "chunk_id": hit.entity.get("chunk_id"),
                            "document_id": hit.entity.get("document_id"),
                            "collection_id": hit.entity.get("collection_id"),
                            "chunk_text": hit.entity.get("chunk_text"),
                            "chunk_index": hit.entity.get("chunk_index"),
                            "score": hit.score,  # Cosine similarity score
                        }
                    )

            logger.info(f"Found {len(formatted_results)} similar chunks for user {user_id}")
            return formatted_results

        except Exception as e:
            logger.error(f"Milvus search failed for user {user_id}: {e}")
            raise

    async def delete_document_chunks(self, document_id: str) -> bool:
        """
        Delete all chunks for a document.

        Args:
            document_id: Document ID to delete

        Returns:
            bool: True if deletion successful

        Raises:
            Exception: If deletion fails
        """
        self._ensure_connected()

        try:
            filter_expr = f"document_id == '{document_id}'"
            self.collection.delete(filter_expr)  # type:ignore
            self.collection.flush()  # type:ignore

            logger.info(f"Deleted chunks for document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Milvus deletion failed for document {document_id}: {e}")
            raise

    async def delete_user_data(self, user_id: str) -> bool:
        """
        Delete all data for a user (for soft delete cleanup).

        Args:
            user_id: User ID to delete

        Returns:
            bool: True if deletion successful

        Raises:
            Exception: If deletion fails
        """
        self._ensure_connected()

        try:
            filter_expr = f"user_id == '{user_id}'"
            self.collection.delete(filter_expr)  # type:ignore
            self.collection.flush()  # type:ignore

            logger.info(f"Deleted all chunks for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Milvus user deletion failed for user {user_id}: {e}")
            raise

    async def get_document_chunk_count(self, document_id: str) -> int:
        """
        Get total number of chunks for a document.

        Args:
            document_id: Document ID

        Returns:
            int: Number of chunks

        Raises:
            Exception: If query fails
        """
        self._ensure_connected()

        try:
            filter_expr = f"document_id == '{document_id}'"
            query_result = self.collection.query(  # type:ignore
                expr=filter_expr, output_fields=["chunk_id"]
            )

            count = len(query_result)  # type:ignore
            logger.info(f"Document {document_id} has {count} chunks")
            return count

        except Exception as e:
            logger.error(f"Milvus chunk count failed for document {document_id}: {e}")
            raise

    async def create_collection(self) -> bool:
        """
        Create collection with schema (public method for recreation).

        Returns:
            bool: True if creation successful

        Raises:
            Exception: If creation fails
        """
        return await self._init_collection()

    async def drop_and_recreate_collection(self) -> bool:
        """
        Drop collection and recreate it (nuclear cleanup option).

        This is the most thorough way to clean all vectors from Milvus.
        USE WITH CAUTION - deletes ALL chunks for ALL users!

        Returns:
            bool: True if operation successful

        Raises:
            Exception: If operation fails
        """
        self._ensure_connected()

        try:
            # Drop collection if exists
            if utility.has_collection(self.collection_name):
                utility.drop_collection(self.collection_name)
                logger.info(f"Dropped collection: {self.collection_name}")

            # Recreate collection
            await self._init_collection()
            logger.info(f"Recreated collection: {self.collection_name}")
            return True

        except Exception as e:
            logger.error(f"Failed to drop/recreate collection: {e}")
            raise

    def disconnect(self):
        """Disconnect from Milvus server."""
        if self._connected:
            connections.disconnect(alias="default")
            self._connected = False
            logger.info("Milvus disconnected")


# Singleton instance
_milvus_service: MilvusService | None = None


async def get_milvus_service() -> MilvusService:
    """
    Get or create Milvus service singleton.

    Returns:
        MilvusService: Initialized Milvus service instance
    """
    global _milvus_service

    if _milvus_service is None:
        _milvus_service = MilvusService()
        await _milvus_service.connect()

    return _milvus_service
