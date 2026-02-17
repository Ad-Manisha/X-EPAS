# config.py - Application configuration and settings
# This file manages all environment variables and app settings

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    Uses pydantic for validation and type checking
    """

    # App Info
    app_name: str = "X-EPAS Backend"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database Configuration
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "xepas"

    # JWT Authentication Settings
    jwt_secret_key: str = "your-super-secret-jwt-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # Password Hashing
    password_hash_rounds: int = 12

    # API Settings
    api_prefix: str = "/api/v1"
    cors_origins: list = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # GitHub Integration
    github_api_base_url: str = "https://api.github.com"
    github_pat_token: str = ""

    # Anthropic (Claude) Integration
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance for backwards compatibility
settings = Settings()
