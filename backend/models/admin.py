# models/admin.py - Admin user data models (improved version)
# Defines data structure for admin users with validation

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

# Custom type for MongoDB ObjectId handling
from models import PyObjectId

class AdminBase(BaseModel):
    """
    Base admin model with common fields
    Used as foundation for other admin models
    """
    email: EmailStr = Field(..., description="Admin email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "email": "admin@company.com",
                "username": "admin_user"
            }
        }

class AdminCreate(AdminBase):
    """
    Model for creating new admin users
    
    IMPROVEMENTS:
    - No admin_id field (server generates it)
    - No timestamps (server handles them)
    - Clean, minimal input model
    """
    password: str = Field(..., min_length=8, description="Admin password (min 8 characters)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@company.com", 
                "username": "admin_user",
                "password": "securepassword123"
            }
        }

class AdminInDB(AdminBase):
    """
    Model representing admin as stored in MongoDB
    
    IMPROVEMENTS:
    - Cleaner _id handling with proper alias
    - Server-generated admin_id
    - Proper timestamp management
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    admin_id: str = Field(..., description="Server-generated admin ID (e.g., 'ADM001')")
    hashed_password: str = Field(..., description="Bcrypt hashed password")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="Whether admin account is active")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AdminResponse(AdminBase):
    """
    Model for API responses containing admin data
    
    IMPROVEMENTS:
    - Consistent id field (converted from _id)
    - No password-related fields
    - Clean response structure
    """
    id: str = Field(..., description="Admin ID (converted from MongoDB _id)")
    admin_id: str = Field(..., description="Human-readable admin ID")
    created_at: datetime
    is_active: bool
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "admin_id": "ADM001", 
                "email": "admin@company.com",
                "username": "admin_user",
                "created_at": "2024-01-15T10:30:00Z",
                "is_active": True
            }
        }

class AdminUpdate(BaseModel):
    """
    Model for updating admin information
    
    IMPROVEMENTS:
    - No updated_at field (service layer handles timestamps)
    - Only fields that can actually be updated by client
    - Simpler, cleaner model
    """
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    is_active: Optional[bool] = None

class AdminLogin(BaseModel):
    """
    Model for admin login requests
    
    IMPROVEMENTS:
    - Renamed 'username' to 'identifier' for clarity
    - Can accept either username or email
    - More intuitive field name
    """
    identifier: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Admin password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "admin_user",  # or "admin@company.com"
                "password": "securepassword123"
            }
        }
