"""
North Star AI Chatbot — FastAPI Application Entry Point.

Sets up the FastAPI app with:
  - CORS middleware for the Next.js frontend
  - Lifespan handler for MongoDB + Qdrant connection management
  - All API routers mounted
  - Seed data loaded on startup
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.mongodb import mongo
from db.qdrant import qdrant
from db.seed import seed_all

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-25s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# =============================================================================
# Application Lifespan
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown.

    Startup:  Connect to MongoDB + Qdrant, initialize collections, seed data.
    Shutdown: Disconnect from all services.
    """
    logger.info("=" * 60)
    logger.info("  North Star AI Chatbot — Starting Up")
    logger.info("=" * 60)

    # Connect to databases
    await mongo.connect()
    qdrant.connect()
    qdrant.init_collection()

    # Seed data (only if collections are empty)
    await seed_all()

    logger.info("=" * 60)
    logger.info("  Ready to serve requests!")
    logger.info("=" * 60)

    yield  # Application runs here

    # Shutdown
    logger.info("Shutting down...")
    await mongo.disconnect()
    qdrant.disconnect()
    logger.info("Goodbye! 🏔️")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="North Star AI Chatbot",
    description="AI-powered customer support for North Star Outfitters",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Mount Routers
# =============================================================================

from api.chat import router as chat_router
from api.orders import router as orders_router
from api.products import router as products_router
from api.sessions import router as sessions_router

app.include_router(sessions_router)
app.include_router(orders_router)
app.include_router(products_router)
app.include_router(chat_router)


# =============================================================================
# Health Check
# =============================================================================


@app.get("/health", tags=["system"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "North Star AI Chatbot",
        "version": "0.1.0",
    }


@app.get("/", tags=["system"])
async def root():
    """Root endpoint — service info."""
    return {
        "service": "North Star AI Chatbot API",
        "docs": "/docs",
        "health": "/health",
    }
