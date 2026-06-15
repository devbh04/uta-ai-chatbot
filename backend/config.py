"""
Centralized application configuration.

Loads settings from environment variables / .env file.
All config values are validated and type-safe via Pydantic Settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Gemini ---
    gemini_api_key: str = ""

    # --- GCP / Vertex AI ---
    gcp_credentials_path: str = ""
    gcp_project: str = ""
    gcp_location: str = "us-central1"

    # --- MongoDB ---
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "northstar"

    # --- Qdrant ---
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""
    qdrant_collection: str = "products"

    # --- App ---
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Singleton instance — import this throughout the app
settings = Settings()
