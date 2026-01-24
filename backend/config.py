# config.py - Application configuration and settings
# This file manages all environment variables and app settings

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables
    Uses pydantic for validation and type checking
    """
    
    # App Info
    app_name: str = "X-EPAS Backend"
    app_version: str = "1.0.0"
    
    # Database Configuration
    mongodb_url: str = "mongodb://localhost:27017"  # Default local MongoDB
    database_name: str = "xepas_db"
    
    # JWT Authentication Settings
    jwt_secret_key: str = "your-super-secret-jwt-key-change-this-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24  # Token expires in 24 hours
    
    # Password Hashing
    password_hash_rounds: int = 12  # bcrypt rounds (higher = more secure but slower)
    
    # API Settings
    api_prefix: str = "/api/v1"
    cors_origins: list = ["http://localhost:3000"]  # React frontend URL
    
    class Config:
        # This tells pydantic to load values from .env file
        env_file = ".env"
        case_sensitive = False

# Create a global settings instance
settings = Settings()
