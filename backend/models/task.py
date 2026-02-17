# models/task.py - Task data models
# Defines data structure for tasks with submissions and AI evaluations

from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import List, Optional
from datetime import datetime, date
from bson import ObjectId
from enum import Enum

# Reuse PyObjectId
from models import PyObjectId

class TaskStatus(str, Enum):
    """
    Task status enumeration
    Defines possible task states throughout lifecycle
    """
    ASSIGNED = "assigned"           # Task assigned to employee
    IN_PROGRESS = "in_progress"     # Employee working on task
    SUBMITTED = "submitted"         # GitHub link submitted, awaiting AI evaluation
    EVALUATED = "evaluated"         # AI evaluation completed
    COMPLETED = "completed"         # Task fully completed
    OVERDUE = "overdue"            # Past deadline without submission

class TaskBase(BaseModel):
    """
    Base task model with common fields
    """
    title: str = Field(..., min_length=3, max_length=100, description="Task title")
    description: str = Field(..., min_length=10, max_length=1000, description="Task description")
    deadline: date = Field(..., description="Task deadline (YYYY-MM-DD)")
    department: str = Field(..., min_length=2, max_length=50, description="Target department")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Implement User Authentication",
                "description": "Create JWT-based authentication system with login/logout functionality",
                "deadline": "2024-02-15",
                "department": "Engineering"
            }
        }

class TaskCreate(TaskBase):
    """
    Model for creating new tasks
    
    BEST PRACTICES APPLIED:
    - No task_id (server generates it)
    - No project_id in body (comes from URL path)
    - No assigned_to (done separately)
    - No timestamps (server handles them)
    """
    pass  # Inherits all fields from TaskBase

class TaskInDB(TaskBase):
    """
    Model representing task as stored in MongoDB
    
    INCLUDES:
    - All relationships (project, employee)
    - Submission data (GitHub link, submission date)
    - AI evaluation results (score, feedback)
    - Complete task lifecycle data
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    task_id: str = Field(..., description="Server-generated task ID (e.g., 'TSK001')")
    project_id: str = Field(..., description="Project this task belongs to")
    assigned_to: Optional[str] = Field(None, description="Employee ID assigned to this task")
    status: TaskStatus = Field(default=TaskStatus.ASSIGNED, description="Current task status")
    
    # Submission fields (nullable until submitted)
    github_link: Optional[HttpUrl] = Field(None, description="GitHub repository link")
    submission_date: Optional[datetime] = Field(None, description="When task was submitted")
    
    # AI evaluation fields (nullable until evaluated)
    score: Optional[float] = Field(None, ge=0, le=100, description="Overall AI evaluation score (0-100)")
    creativity_score: Optional[int] = Field(None, ge=0, le=10, description="Creativity score (0-10)")
    efficiency_score: Optional[int] = Field(None, ge=0, le=10, description="Efficiency score (0-10)")
    edge_case_handling_score: Optional[int] = Field(None, ge=0, le=10, description="Edge case handling score (0-10)")
    feedback: Optional[str] = Field(None, max_length=2000, description="AI evaluation summary")
    review_comments: Optional[List[dict]] = Field(None, description="Line-specific review comments from AI")
    evaluated_at: Optional[datetime] = Field(None, description="When AI evaluation was completed")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="Admin ID who created the task")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class TaskResponse(TaskBase):
    """
    Model for API responses containing task data
    
    COMPLETE TASK INFORMATION:
    - All task details
    - Assignment information
    - Submission status
    - AI evaluation results (if available)
    """
    id: str = Field(..., description="Task ID (converted from MongoDB _id)")
    task_id: str = Field(..., description="Human-readable task ID")
    project_id: str = Field(..., description="Project this task belongs to")
    assigned_to: Optional[str] = Field(None, description="Employee ID assigned to this task")
    status: TaskStatus = Field(..., description="Current task status")
    
    # Submission information
    github_link: Optional[str] = Field(None, description="GitHub repository link")
    submission_date: Optional[datetime] = Field(None, description="When task was submitted")
    
    # AI evaluation results
    score: Optional[float] = Field(None, description="Overall AI evaluation score (0-100)")
    creativity_score: Optional[int] = Field(None, description="Creativity score (0-10)")
    efficiency_score: Optional[int] = Field(None, description="Efficiency score (0-10)")
    edge_case_handling_score: Optional[int] = Field(None, description="Edge case handling score (0-10)")
    feedback: Optional[str] = Field(None, description="AI evaluation summary")
    review_comments: Optional[List[dict]] = Field(None, description="Line-specific review comments")
    evaluated_at: Optional[datetime] = Field(None, description="When AI evaluation was completed")

    # Metadata
    created_at: datetime
    created_by: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "task_id": "TSK001",
                "title": "Implement User Authentication",
                "description": "Create JWT-based authentication system",
                "deadline": "2024-02-15",
                "department": "Engineering",
                "project_id": "PRJ001",
                "assigned_to": "EMP001",
                "status": "evaluated",
                "github_link": "https://github.com/user/auth-system/pull/1",
                "submission_date": "2024-02-10T14:30:00Z",
                "score": 83.3,
                "creativity_score": 8,
                "efficiency_score": 9,
                "edge_case_handling_score": 8,
                "feedback": "Good implementation with clean code structure",
                "review_comments": [{"path": "src/auth.py", "line": 12, "body": "Consider adding input validation"}],
                "evaluated_at": "2024-02-10T16:45:00Z",
                "created_at": "2024-02-01T09:00:00Z",
                "created_by": "ADM001"
            }
        }

class TaskUpdate(BaseModel):
    """
    Model for updating task information (admin only)
    
    BEST PRACTICES:
    - No updated_at (service layer handles it)
    - Only fields admin can update
    - Assignment handled separately
    """
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, min_length=10, max_length=1000)
    deadline: Optional[date] = None
    department: Optional[str] = Field(None, min_length=2, max_length=50)

class TaskAssignment(BaseModel):
    """
    Model for assigning tasks to employees
    Separate model for clarity and validation
    """
    employee_id: str = Field(..., description="Employee ID to assign task to")
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": "EMP001"
            }
        }

class TaskSubmission(BaseModel):
    """
    Model for employee task submissions
    Used when employee submits GitHub link
    """
    github_link: HttpUrl = Field(..., description="GitHub pull request link")
    
    @field_validator('github_link')
    @classmethod
    def validate_github_pr_url(cls, v):
        """
        Validate that the GitHub URL is a pull request URL
        Format: https://github.com/owner/repo/pull/number
        """
        import re
        
        url_str = str(v)
        github_pr_pattern = r'^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+/pull/\d+$'
        
        if not re.match(github_pr_pattern, url_str):
            raise ValueError(
                'GitHub link must be a pull request URL in the format: '
                'https://github.com/owner/repo/pull/number'
            )
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "github_link": "https://github.com/employee/project-repo/pull/123"
            }
        }

class AIEvaluationResult(BaseModel):
    """
    Model for AI evaluation results
    Used when AI teammate sends evaluation back to backend
    """
    task_id: str = Field(..., description="Task ID being evaluated")
    score: float = Field(..., ge=0, le=100, description="Evaluation score (0-100)")
    feedback: str = Field(..., min_length=10, max_length=2000, description="Detailed feedback")
    
    class Config:
        json_schema_extra = {
            "example": {
                "task_id": "TSK001",
                "score": 85.5,
                "feedback": "Good implementation with clean code structure. Consider adding more error handling and unit tests for better reliability."
            }
        }

class TaskListResponse(BaseModel):
    """
    Simplified model for task lists
    Used in project views and employee dashboards
    """
    id: str
    task_id: str
    title: str
    deadline: date
    status: TaskStatus
    assigned_to: Optional[str]
    score: Optional[float]
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "task_id": "TSK001",
                "title": "Implement User Authentication",
                "deadline": "2024-02-15",
                "status": "evaluated",
                "assigned_to": "EMP001",
                "score": 85.5
            }
        }

class EmployeeTaskView(BaseModel):
    """
    Task information from employee perspective
    Shows only relevant information for assigned employee
    """
    id: str
    task_id: str
    title: str
    description: str
    deadline: date
    status: TaskStatus
    project_id: Optional[str] = None
    department: Optional[str] = None
    github_link: Optional[str]
    submission_date: Optional[datetime]
    score: Optional[float]
    creativity_score: Optional[int] = None
    efficiency_score: Optional[int] = None
    edge_case_handling_score: Optional[int] = None
    feedback: Optional[str]
    review_comments: Optional[List[dict]] = None
    created_at: Optional[datetime] = None

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439014",
                "task_id": "TSK001",
                "title": "Implement User Authentication",
                "description": "Create JWT-based authentication system",
                "deadline": "2024-02-15",
                "status": "evaluated",
                "project_id": "PRJ001",
                "department": "Backend",
                "github_link": "https://github.com/employee/auth-system/pull/1",
                "submission_date": "2024-02-10T14:30:00Z",
                "score": 83.3,
                "creativity_score": 8,
                "efficiency_score": 9,
                "edge_case_handling_score": 8,
                "feedback": "Good implementation with clean code structure",
                "review_comments": [{"path": "src/auth.py", "line": 12, "body": "Consider adding input validation"}],
                "created_at": "2024-02-01T09:00:00Z"
            }
        }
