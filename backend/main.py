# main.py - FastAPI application entry point
# This file starts the web server and connects all components together

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from database import database
from config import settings
from routes.admin import router as admin_router
from routes.employee import router as employee_router
import logging

# Set up logging to see what's happening
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application instance
app = FastAPI(
    title=settings.app_name,           # Shows in API docs
    version=settings.app_version,      # Shows in API docs  
    description="Employee Performance Assessment System Backend API",
    docs_url="/docs",                  # Swagger UI at http://localhost:8000/docs
    redoc_url="/redoc"                 # ReDoc UI at http://localhost:8000/redoc
)

# Add CORS middleware to allow frontend connections
# CORS = Cross-Origin Resource Sharing (lets React frontend talk to FastAPI backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],    # Which frontend URLs can access this API
    allow_credentials=True,                 # Allow cookies/auth headers
    allow_methods=["GET", "POST", "PUT", "DELETE"],  # Which HTTP methods allowed
    allow_headers=["*"],                    # Which headers allowed
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(employee_router)

# Application lifecycle events
# These run when the server starts up and shuts down

@app.on_event("startup")
async def startup_event():
    """
    Run when FastAPI server starts
    - Connect to MongoDB
    - Initialize any other services
    """
    logger.info("Starting X-EPAS Backend Server...")
    
    try:
        # Connect to MongoDB using our database module
        await database.connect_to_mongo()
        logger.info("Server startup completed successfully")
        
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        # In production, you might want to exit here
        raise e

@app.on_event("shutdown")
async def shutdown_event():
    """
    Run when FastAPI server shuts down
    - Close database connections
    - Clean up resources
    """
    logger.info("Shutting down X-EPAS Backend Server...")
    
    try:
        # Close MongoDB connection
        await database.close_mongo_connection()
        logger.info("Server shutdown completed successfully")
        
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# Basic API endpoints for testing

@app.get("/")
async def root():
    """
    Root endpoint - basic server info
    Test with: GET http://localhost:8000/
    """
    return {
        "message": "Welcome to X-EPAS Backend API!",
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint - verify server and database are working
    Test with: GET http://localhost:8000/health
    """
    try:
        # Test database connection by getting database info
        db = database.database
        if db is not None:
            # Try to list collections (this tests if DB connection works)
            collections = await db.list_collection_names()
            return {
                "status": "healthy",
                "database": "connected",
                "database_name": settings.database_name,
                "collections_count": len(collections)
            }
        else:
            return {
                "status": "unhealthy", 
                "database": "not connected",
                "error": "Database instance is None"
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "connection failed", 
            "error": str(e)
        }

@app.get("/api/v1/info")
async def api_info():
    """
    API information endpoint
    Test with: GET http://localhost:8000/api/v1/info
    """
    return {
        "api_name": settings.app_name,
        "api_version": settings.app_version,
        "api_prefix": settings.api_prefix,
        "features": [
            "User Authentication (JWT)",
            "Admin Management", 
            "Employee Task Management",
            "Performance Evaluation",
            "Attendance Tracking"
        ]
    }

# This runs when you execute: python main.py
if __name__ == "__main__":
    import uvicorn
    
    # Run the server
    uvicorn.run(
        "main:app",                    # app instance to run
        host="0.0.0.0",               # Listen on all network interfaces
        port=8000,                    # Port number
        reload=True,                  # Auto-reload when code changes (development only)
        log_level="info"              # Logging level
    )
