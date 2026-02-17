# database.py - MongoDB connection setup using Beanie ODM
# Beanie provides async ODM (Object Document Mapper) for MongoDB

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import get_settings
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


class MongoDB:
    """MongoDB connection manager using Beanie ODM."""
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


mongodb = MongoDB()


def get_document_models() -> list:
    """
    Get all Beanie document models to register.
    Import here to avoid circular imports.
    """
    from models.github_pr import GithubLink
    # Add more document models here as you convert them:
    # from models.admin import AdminDocument
    # from models.employee import EmployeeDocument
    # from models.project import ProjectDocument
    # from models.task import TaskDocument

    return [GithubLink]


async def connect_to_mongo():
    """Initialize MongoDB connection and Beanie ODM."""
    logger.info(f"Connecting to MongoDB at {settings.mongodb_url}...")

    try:
        mongodb.client = AsyncIOMotorClient(
            settings.mongodb_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=10
        )

        # Test connection
        await mongodb.client.admin.command('ping')
        logger.info("MongoDB ping successful")

        mongodb.db = mongodb.client[settings.database_name]

        # Initialize Beanie with document models
        await init_beanie(
            database=mongodb.db,
            document_models=get_document_models()
        )

        logger.info(f"Successfully connected to MongoDB with Beanie ODM")
        logger.info(f"Database name: {settings.database_name}")

    except ServerSelectionTimeoutError as e:
        logger.error(f"MongoDB connection timeout: {e}")
        logger.error("Check if MongoDB is running and accessible")
        raise e
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed: {e}")
        logger.error("Check your connection string and credentials")
        raise e
    except Exception as e:
        logger.error(f"Unexpected database error: {e}")
        raise e


async def close_mongo_connection():
    """Close MongoDB connection."""
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance."""
    return mongodb.db


# =============================================================================
# BACKWARDS COMPATIBILITY - Collection getters for non-Beanie code
# These will be deprecated once all models are converted to Beanie Documents
# =============================================================================

def get_collection(collection_name: str):
    """Get a specific collection by name."""
    db = get_database()
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db[collection_name]


def get_admins_collection():
    """Get the admins collection."""
    return get_collection("admins")


def get_employees_collection():
    """Get the employees collection."""
    return get_collection("employees")


def get_projects_collection():
    """Get the projects collection."""
    return get_collection("projects")


def get_tasks_collection():
    """Get the tasks collection."""
    return get_collection("tasks")


def get_attendance_collection():
    """Get the attendance collection."""
    return get_collection("attendance")


# Legacy Database class for backwards compatibility
class Database:
    """Legacy database class - use mongodb instance instead."""

    def __init__(self):
        self.client = None
        self.database = None

    async def connect_to_mongo(self):
        await connect_to_mongo()
        self.client = mongodb.client
        self.database = mongodb.db

    async def close_mongo_connection(self):
        await close_mongo_connection()


# Legacy instance for backwards compatibility
database = Database()
