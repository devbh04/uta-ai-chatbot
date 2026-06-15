"""
Async MongoDB connection manager.

Provides a singleton client with typed accessors for each collection.
Uses motor for async operations compatible with FastAPI.
"""

import logging

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from config import settings

logger = logging.getLogger(__name__)


class MongoManager:
    """Manages the MongoDB connection lifecycle and collection access."""

    def __init__(self) -> None:
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        """Establish connection to MongoDB and create indexes."""
        logger.info("Connecting to MongoDB at %s ...", settings.mongodb_uri)
        self._client = AsyncIOMotorClient(settings.mongodb_uri)
        self._db = self._client[settings.mongodb_db_name]

        # Create indexes for fast lookups
        await self._db.orders.create_index("order_id", unique=True)
        await self._db.sessions.create_index("session_id", unique=True)
        await self._db.products.create_index("product_id", unique=True)

        logger.info("MongoDB connected — database: %s", settings.mongodb_db_name)

    async def disconnect(self) -> None:
        """Close the MongoDB connection."""
        if self._client:
            self._client.close()
            logger.info("MongoDB disconnected.")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get the database instance."""
        if self._db is None:
            raise RuntimeError("MongoDB is not connected. Call connect() first.")
        return self._db

    @property
    def orders(self):
        """Orders collection."""
        return self.db.orders

    @property
    def sessions(self):
        """Chat sessions collection."""
        return self.db.sessions

    @property
    def products(self):
        """Products collection."""
        return self.db.products


# Singleton instance — import this throughout the app
mongo = MongoManager()
