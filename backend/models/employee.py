# models/employee.py - Employee user data models
# Defines data structure for employee users with validation

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

# Reuse the same PyObjectId 
from models import PyObjectId

class EmployeeBase(BaseModel):
    """
    Base employee model with common fields
    """
    name: str = Field(..., min_length=2, max_length=100, description="Employee full name")
    email: EmailStr = Field(..., description="Employee email address")
    department: str = Field(..., min_length=2, max_length=50, description="Employee department")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@company.com",
                "department": "Backend"
            }
        }

class EmployeeCreate(EmployeeBase):
    """
    Model for creating new employees
    
    BEST PRACTICES APPLIED:
    - No emp_id (server generates it)
    - No timestamps (server handles them)
    - Clean input model
    """
    password: str = Field(..., min_length=8, description="Employee password (min 8 characters)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john.doe@company.com", 
                "department": "Backend",
                "password": "securepassword123"
            }
        }

class EmployeeInDB(EmployeeBase):
    """
    Model representing employee as stored in MongoDB
    
    INCLUDES:
    - Server-generated emp_id
    - Hashed password (never plain text)
    - Proper timestamp management
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    emp_id: str = Field(..., description="Server-generated employee ID (e.g., 'EMP001')")
    hashed_password: str = Field(..., description="Bcrypt hashed password")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="Whether employee account is active")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class EmployeeResponse(EmployeeBase):
    """
    Model for API responses containing employee data
    
    SECURITY:
    - No password fields
    - Clean response structure
    - Safe for frontend consumption
    """
    id: str = Field(..., description="Employee ID (converted from MongoDB _id)")
    emp_id: str = Field(..., description="Human-readable employee ID")
    created_at: datetime
    is_active: bool
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "emp_id": "EMP001", 
                "name": "John Doe",
                "email": "john.doe@company.com",
                "department": "Backend",
                "created_at": "2024-01-15T10:30:00Z",
                "is_active": True
            }
        }

class EmployeeUpdate(BaseModel):
    """
    Model for updating employee information
    
    BEST PRACTICES:
    - No updated_at (service layer handles it)
    - Only updatable fields
    - All fields optional for partial updates
    """
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    department: Optional[str] = Field(None, min_length=2, max_length=50)
    is_active: Optional[bool] = None

class EmployeeLogin(BaseModel):
    """
    Model for employee login requests
    
    IMPROVEMENT:
    - Uses 'identifier' instead of 'username' for clarity
    - Can accept email or emp_id
    """
    identifier: str = Field(..., description="Employee ID or email address")
    password: str = Field(..., description="Employee password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "identifier": "EMP001",  # or "john.doe@company.com"
                "password": "securepassword123"
            }
        }

# Additional model for employee listing (admin view)
class EmployeeListResponse(BaseModel):
    """
    Simplified model for employee lists
    Used when admin views all employees (less detailed)
    """
    id: str
    emp_id: str
    name: str
    email: str
    department: str
    is_active: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "emp_id": "EMP001",
                "name": "John Doe", 
                "email": "john.doe@company.com",
                "department": "Backend",
                "is_active": True
            }
        }
