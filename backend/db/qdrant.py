"""
Qdrant vector database client and embedding pipeline.

Manages a single 'products' collection. Embeds product text using
Gemini text-embedding-004 (768 dimensions) and provides semantic search.
"""

import logging
from datetime import datetime

from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from config import settings

logger = logging.getLogger(__name__)

# Gemini embedding model configuration
EMBEDDING_MODEL = "text-embedding-004"
EMBEDDING_DIMENSIONS = 768


class QdrantManager:
    """Manages Qdrant connection, embedding, and search operations."""

    def __init__(self) -> None:
        self._client: QdrantClient | None = None
        self._genai_client: genai.Client | None = None

    def connect(self) -> None:
        """Initialize Qdrant and Gemini clients."""
        logger.info("Connecting to Qdrant at %s ...", settings.qdrant_url)

        # Connect to Qdrant (cloud or local)
        if settings.qdrant_api_key:
            self._client = QdrantClient(
                url=settings.qdrant_url,
                api_key=settings.qdrant_api_key,
            )
        else:
            self._client = QdrantClient(url=settings.qdrant_url)

        # Initialize Gemini client for embeddings
        self._genai_client = genai.Client(api_key=settings.gemini_api_key)

        logger.info("Qdrant connected.")

    def disconnect(self) -> None:
        """Close the Qdrant connection."""
        if self._client:
            self._client.close()
            logger.info("Qdrant disconnected.")

    @property
    def client(self) -> QdrantClient:
        """Get the Qdrant client instance."""
        if self._client is None:
            raise RuntimeError("Qdrant is not connected. Call connect() first.")
        return self._client

    def init_collection(self) -> None:
        """Create the products collection if it doesn't exist."""
        collection_name = settings.qdrant_collection
        collections = [c.name for c in self.client.get_collections().collections]

        if collection_name not in collections:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=EMBEDDING_DIMENSIONS,
                    distance=Distance.COSINE,
                ),
            )
            logger.info("Created Qdrant collection: %s", collection_name)
        else:
            logger.info("Qdrant collection '%s' already exists.", collection_name)

    def embed_text(self, text: str) -> list[float]:
        """Generate an embedding vector for the given text using Gemini."""
        if self._genai_client is None:
            raise RuntimeError("Gemini client is not initialized.")

        result = self._genai_client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        return result.embeddings[0].values

    def _build_embed_text(self, product_data: dict) -> str:
        """Build the text string to embed for a product."""
        parts = [
            product_data.get("name", ""),
            product_data.get("description", ""),
            product_data.get("category", ""),
        ]
        tags = product_data.get("tags", [])
        if tags:
            parts.append(" ".join(tags))
        return " ".join(parts)

    def upsert_product(self, product_data: dict) -> None:
        """Embed a product and upsert it into Qdrant."""
        embed_text = self._build_embed_text(product_data)
        vector = self.embed_text(embed_text)

        # Use product_id hash as the Qdrant point ID
        point_id = abs(hash(product_data["product_id"])) % (2**63)

        self.client.upsert(
            collection_name=settings.qdrant_collection,
            points=[
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "product_id": product_data["product_id"],
                        "name": product_data["name"],
                        "description": product_data["description"],
                        "category": product_data["category"],
                        "price": product_data["price"],
                        "image_url": product_data["image_url"],
                        "in_stock": product_data["in_stock"],
                        "tags": product_data.get("tags", []),
                        "embedded_at": datetime.utcnow().isoformat(),
                    },
                )
            ],
        )
        logger.info("Upserted product '%s' to Qdrant.", product_data["name"])

    def search_products(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.7,
    ) -> list[dict]:
        """
        Semantic search over the product catalog.

        Returns products with similarity score >= threshold.
        """
        query_vector = self.embed_text(query)

        results = self.client.query_points(
            collection_name=settings.qdrant_collection,
            query=query_vector,
            limit=limit,
            score_threshold=score_threshold,
        )

        return [
            {**point.payload, "score": point.score}
            for point in results.points
        ]

    def get_nearest_products(self, query: str, limit: int = 3) -> list[dict]:
        """
        Fallback search — always returns top-N results regardless of score.

        Used when search_products returns no results above threshold.
        """
        query_vector = self.embed_text(query)

        results = self.client.query_points(
            collection_name=settings.qdrant_collection,
            query=query_vector,
            limit=limit,
        )

        return [
            {**point.payload, "score": point.score}
            for point in results.points
        ]

    def delete_product(self, product_id: str) -> None:
        """Remove a product from Qdrant by its product_id."""
        point_id = abs(hash(product_id)) % (2**63)
        self.client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=[point_id],
        )
        logger.info("Deleted product '%s' from Qdrant.", product_id)


# Singleton instance
qdrant = QdrantManager()
