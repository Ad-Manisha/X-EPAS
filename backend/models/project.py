# models/project.py - Project data models
# Defines data structure for projects with employee assignments

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from enum import Enum

# Reuse PyObjectId
from models import PyObjectId

class ProjectStatus(str, Enum):
    """
    Project status enumeration
    Defines possible project states
    """
    PLANNING = "planning"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"

class ProjectBase(BaseModel):
    """
    Base project model with common fields
    """
    name: str = Field(..., min_length=3, max_length=100, description="Project name")
    description: Optional[str] = Field(None, max_length=500, description="Project description")
    status: ProjectStatus = Field(default=ProjectStatus.PLANNING, description="Project status")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Employee Portal Redesign",
                "description": "Redesign the employee portal with modern UI/UX",
                "status": "planning"
            }
        }

class ProjectCreate(ProjectBase):
    """
    Model for creating new projects
    
    BEST PRACTICES APPLIED:
    - No project_id (server generates it)
    - No employee assignments yet (done separately)
    - No completion_percentage (calculated from tasks)
    - No timestamps (server handles them)
    """
    pass  # Inherits all fields from ProjectBase

class ProjectInDB(ProjectBase):
    """
    Model representing project as stored in MongoDB
    
    INCLUDES:
    - Server-generated project_id
    - Employee references (list of employee IDs)
    - Calculated completion percentage
    - Proper timestamp management
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    project_id: str = Field(..., description="Server-generated project ID (e.g., 'PRJ001')")
    employees: List[str] = Field(default=[], description="List of employee IDs assigned to project")
    completion_percentage: float = Field(default=0.0, ge=0, le=100, description="Project completion (0-100%)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="Admin ID who created the project")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProjectResponse(ProjectBase):
    """
    Model for API responses containing project data
    
    INCLUDES:
    - Employee details (not just IDs)
    - Clean response structure
    """
    id: str = Field(..., description="Project ID (converted from MongoDB _id)")
    project_id: str = Field(..., description="Human-readable project ID")
    employees: List[str] = Field(..., description="List of employee IDs")
    completion_percentage: float = Field(..., description="Project completion percentage")
    created_at: datetime
    created_by: str = Field(..., description="Admin who created the project")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "project_id": "PRJ001",
                "name": "Employee Portal Redesign",
                "description": "Redesign the employee portal with modern UI/UX",
                "status": "in_progress",
                "employees": ["EMP001", "EMP002", "EMP003"],
                "completion_percentage": 65.5,
                "created_at": "2024-01-15T10:30:00Z",
                "created_by": "ADM001"
            }
        }

class ProjectUpdate(BaseModel):
    """
    Model for updating project information
    
    BEST PRACTICES:
    - No updated_at (service layer handles it)
    - Only updatable fields
    - All fields optional for partial updates
    """
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    status: Optional[ProjectStatus] = None
    # Note: employees and completion_percentage updated through separate endpoints

class ProjectEmployeeAssignment(BaseModel):
    """
    Model for assigning/removing employees to/from projects
    Separate model for clarity and validation
    """
    employee_ids: List[str] = Field(..., description="List of employee IDs to assign")
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_ids": ["EMP001", "EMP002", "EMP003"]
            }
        }

class ProjectListResponse(BaseModel):
    """
    Simplified model for project lists
    Used in admin dashboards and employee views
    """
    id: str
    project_id: str
    name: str
    status: ProjectStatus
    completion_percentage: float
    employee_count: int = Field(..., description="Number of assigned employees")
    created_at: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "project_id": "PRJ001",
                "name": "Employee Portal Redesign",
                "status": "in_progress",
                "completion_percentage": 65.5,
                "employee_count": 3,
                "created_at": "2024-01-15T10:30:00Z"
            }
        }

# Model for employee's project view (what projects they're assigned to)
class EmployeeProjectView(BaseModel):
    """
    Project information from employee perspective
    Shows only relevant information for assigned employees
    """
    id: str
    project_id: str
    name: str
    description: Optional[str]
    status: ProjectStatus
    completion_percentage: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439013",
                "project_id": "PRJ001",
                "name": "Employee Portal Redesign",
                "description": "Redesign the employee portal with modern UI/UX",
                "status": "in_progress",
                "completion_percentage": 65.5
            }
        }
