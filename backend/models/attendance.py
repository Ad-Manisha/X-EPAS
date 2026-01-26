# models/attendance.py - Attendance tracking data models
# Defines data structure for employee attendance records

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from bson import ObjectId
from enum import Enum

# Reuse PyObjectId
from models import PyObjectId

class AttendanceStatus(str, Enum):
    """
    Attendance status enumeration
    Defines possible attendance states
    """
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    SICK_LEAVE = "sick_leave"
    VACATION = "vacation"

class AttendanceBase(BaseModel):
    """
    Base attendance model with common fields
    """
    employee_id: str = Field(..., description="Employee ID")
    date: date = Field(..., description="Attendance date (YYYY-MM-DD)")
    status: AttendanceStatus = Field(..., description="Attendance status")
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "employee_id": "EMP001",
                "date": "2024-01-15",
                "status": "present"
            }
        }

class AttendanceCreate(AttendanceBase):
    """
    Model for creating attendance records
    
    BEST PRACTICES APPLIED:
    - Simple input model
    - No timestamps (server handles them)
    - Admin creates attendance records
    """
    notes: Optional[str] = Field(None, max_length=200, description="Optional notes about attendance")
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": "EMP001",
                "date": "2024-01-15",
                "status": "late",
                "notes": "Arrived 30 minutes late due to traffic"
            }
        }

class AttendanceInDB(AttendanceBase):
    """
    Model representing attendance as stored in MongoDB
    
    INCLUDES:
    - Server-generated ID
    - Additional tracking fields
    - Metadata for audit trail
    """
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    notes: Optional[str] = Field(None, max_length=200, description="Notes about attendance")
    recorded_by: str = Field(..., description="Admin ID who recorded this attendance")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AttendanceResponse(AttendanceBase):
    """
    Model for API responses containing attendance data
    """
    id: str = Field(..., description="Attendance record ID (converted from MongoDB _id)")
    notes: Optional[str] = Field(None, description="Notes about attendance")
    recorded_by: str = Field(..., description="Admin who recorded this attendance")
    created_at: datetime
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439015",
                "employee_id": "EMP001",
                "date": "2024-01-15",
                "status": "present",
                "notes": None,
                "recorded_by": "ADM001",
                "created_at": "2024-01-15T09:00:00Z"
            }
        }

class AttendanceUpdate(BaseModel):
    """
    Model for updating attendance records
    
    BEST PRACTICES:
    - Only updatable fields
    - All fields optional for partial updates
    """
    status: Optional[AttendanceStatus] = None
    notes: Optional[str] = Field(None, max_length=200)

class BulkAttendanceCreate(BaseModel):
    """
    Model for creating multiple attendance records at once
    Useful for daily attendance marking
    """
    date: date = Field(..., description="Date for all attendance records")
    records: list[dict] = Field(..., description="List of employee attendance records")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date": "2024-01-15",
                "records": [
                    {"employee_id": "EMP001", "status": "present"},
                    {"employee_id": "EMP002", "status": "late", "notes": "Traffic delay"},
                    {"employee_id": "EMP003", "status": "absent", "notes": "Sick leave"}
                ]
            }
        }

class AttendanceListResponse(BaseModel):
    """
    Simplified model for attendance lists
    Used in employee and admin dashboards
    """
    id: str
    employee_id: str
    date: date
    status: AttendanceStatus
    notes: Optional[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439015",
                "employee_id": "EMP001",
                "date": "2024-01-15",
                "status": "present",
                "notes": None
            }
        }

class EmployeeAttendanceSummary(BaseModel):
    """
    Attendance summary for an employee over a period
    Used for performance evaluation calculations
    """
    employee_id: str
    total_days: int = Field(..., description="Total working days in period")
    present_days: int = Field(..., description="Days marked present")
    absent_days: int = Field(..., description="Days marked absent")
    late_days: int = Field(..., description="Days marked late")
    attendance_percentage: float = Field(..., ge=0, le=100, description="Attendance percentage")
    punctuality_score: float = Field(..., ge=0, le=100, description="Punctuality score (considering late arrivals)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "employee_id": "EMP001",
                "total_days": 22,
                "present_days": 20,
                "absent_days": 1,
                "late_days": 1,
                "attendance_percentage": 95.45,
                "punctuality_score": 90.91
            }
        }

class AttendanceReport(BaseModel):
    """
    Comprehensive attendance report
    Used for admin reporting and performance reviews
    """
    start_date: date
    end_date: date
    employee_summaries: list[EmployeeAttendanceSummary]
    department_stats: dict = Field(..., description="Attendance statistics by department")
    
    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "2024-01-01",
                "end_date": "2024-01-31",
                "employee_summaries": [
                    {
                        "employee_id": "EMP001",
                        "total_days": 22,
                        "present_days": 20,
                        "absent_days": 1,
                        "late_days": 1,
                        "attendance_percentage": 95.45,
                        "punctuality_score": 90.91
                    }
                ],
                "department_stats": {
                    "Engineering": {"avg_attendance": 94.2, "avg_punctuality": 89.5},
                    "Design": {"avg_attendance": 96.8, "avg_punctuality": 92.1}
                }
            }
        }
