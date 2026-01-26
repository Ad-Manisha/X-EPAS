# database.py - MongoDB connection setup using Motor (async driver)
# Motor allows non-blocking database operations for better performance

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import settings
import logging

# Set up logging to track connection status
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    """
    Database connection manager using Motor (async MongoDB driver)
    
    Why async? 
    - Allows FastAPI to handle multiple requests simultaneously
    - Database operations don't block other API calls
    - Better performance under load
    """
    
    def __init__(self):
        # Initialize connection variables as None
        # Actual connection happens in connect_to_mongo()
        self.client: AsyncIOMotorClient = None
        self.database = None
    
    async def connect_to_mongo(self):
        """
        Establish connection to MongoDB Atlas
        
        The 'async' keyword means this function can be paused and resumed
        The 'await' keyword means "wait for this operation, but let other code run"
        """
        try:
            logger.info(f"Attempting to connect to MongoDB Atlas...")
            
            # Create MongoDB client with simplified Atlas configuration
            # MongoDB Atlas handles SSL/TLS automatically with SRV connection strings
            self.client = AsyncIOMotorClient(
                settings.mongodb_url,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000,
                maxPoolSize=10
            )
            
            # Step 2: Test the connection with a ping
            # 'await' here means: "send ping to database, but don't freeze the app while waiting"
            await self.client.admin.command('ping')
            logger.info(" MongoDB ping successful")
            
            # Step 3: Get reference to our specific database
            # This doesn't create the database yet - MongoDB creates it when first data is inserted
            self.database = self.client[settings.database_name]
            
            logger.info(f" Successfully connected to MongoDB Atlas")
            logger.info(f" Database name: {settings.database_name}")

        except ServerSelectionTimeoutError as e:
            logger.error(f" MongoDB connection timeout: {e}")
            logger.error(" Check your internet connection and MongoDB Atlas cluster status")
            raise e
            
        except ConnectionFailure as e:
            # Handle specific MongoDB connection errors
            logger.error(f" MongoDB connection failed: {e}")
            logger.error(" Check your connection string and credentials")
            raise e
            
        except Exception as e:
            # Handle any other unexpected errors
            logger.error(f" Unexpected database error: {e}")
            raise e
    
    async def close_mongo_connection(self):
        """
        Properly close the database connection
        
        Important: Always close connections to free up resources
        FastAPI will call this when the app shuts down
        """
        if self.client:
            self.client.close()
            logger.info(" MongoDB connection closed")

# Create a single database instance for the entire application
# This follows the "singleton" pattern - one database connection shared by all
database = Database()

def get_database():
    """
    Get the database instance
    
    Why a function? 
    - Provides a clean way for other files to access the database
    - Makes testing easier (we can mock this function)
    - Follows FastAPI dependency injection patterns
    """
    return database.database

# Collection helper functions
# Collections in MongoDB are like tables in SQL databases

def get_collection(collection_name: str):
    """
    Get a specific collection by name
    
    Args:
        collection_name: The name of the collection (e.g., 'users', 'projects')
    
    Returns:
        Motor collection object for async operations
    """
    db = get_database()
    if db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return db[collection_name]

# Pre-defined collection getters for type safety and convenience
# These make it easy to get collections without typos in collection names

def get_admins_collection():
    """Get the admins collection - stores admin user data"""
    return get_collection("admins")

def get_employees_collection():
    """Get the employees collection - stores employee user data"""
    return get_collection("employees")

def get_projects_collection():
    """Get the projects collection - stores project information"""
    return get_collection("projects")

def get_tasks_collection():
    """Get the tasks collection - stores task assignments and submissions"""
    return get_collection("tasks")

def get_attendance_collection():
    """Get the attendance collection - stores employee attendance records"""
    return get_collection("attendance")
