# routes/employee.py - Employee task management and submission APIs
# Core functionality: View assigned tasks and submit GitHub URLs for AI evaluation

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from datetime import datetime
from pydantic import HttpUrl

# Import models
from models.task import EmployeeTaskView, TaskSubmission, TaskStatus

# Import auth dependencies
from auth.dependencies import get_current_employee

# Import database functions
from database import get_tasks_collection

# Create router for employee endpoints
router = APIRouter(
    prefix="/employee",
    tags=["Employee Task Management"],
    dependencies=[Depends(get_current_employee)],  # All routes require employee authentication
)

# =============================================================================
# CORE EMPLOYEE FUNCTIONALITY
# =============================================================================

@router.get("/tasks", response_model=List[EmployeeTaskView])
async def get_my_assigned_tasks(
    current_employee: Dict[str, Any] = Depends(get_current_employee)
):
    """
    Get all tasks assigned to the current employee
    
    FRONTEND INTEGRATION:
    1. Employee logs in and gets JWT token
    2. Frontend calls: GET /employee/tasks
    3. Headers: Authorization: Bearer <employee_token>
    4. Display tasks in employee dashboard/task list
    
    FRONTEND USAGE:
    - Employee dashboard task cards
    - Task list page with filters (pending, submitted, evaluated)
    - Task progress tracking
    - Deadline notifications
    
    SECURITY:
    - Employee can only see their own assigned tasks
    - JWT token validates employee identity
    """
    tasks_collection = get_tasks_collection()
    
    try:
        tasks = []
        
        # Query: Find all tasks where assigned_to matches current employee's ID
        # This ensures employees only see their own tasks
        async for task_doc in tasks_collection.find({"assigned_to": current_employee["user_id"]}):
            task = EmployeeTaskView(
                id=str(task_doc["_id"]),
                task_id=task_doc["task_id"],
                title=task_doc["title"],
                description=task_doc["description"],  # Full task requirements for employee
                deadline=task_doc["deadline"],
                status=task_doc["status"],
                project_id=task_doc.get("project_id"),
                department=task_doc.get("department"),
                github_link=task_doc["github_link"],      # Shows submitted URL if exists
                submission_date=task_doc["submission_date"], # Shows when submitted
                score=task_doc["score"],                   # AI evaluation score (if available)
                feedback=task_doc["feedback"],              # AI evaluation feedback (if available)
                created_at=task_doc.get("created_at")
            )
            tasks.append(task)
        
        # Sort by deadline (most urgent first)
        # This helps employees prioritize their work
        tasks.sort(key=lambda x: x.deadline)
        
        return tasks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch your assigned tasks"
        )

@router.get("/tasks/{task_id}", response_model=EmployeeTaskView)
async def get_task_details(
    task_id: str,
    current_employee: Dict[str, Any] = Depends(get_current_employee)
):
    """
    Get detailed information about a specific task
    
    FRONTEND INTEGRATION:
    1. Employee clicks on a task from task list
    2. Frontend calls: GET /employee/tasks/{task_id}
    3. Headers: Authorization: Bearer <employee_token>
    4. Display full task details in modal/detail page
    
    FRONTEND USAGE:
    - Task detail modal with full description
    - Task work page with requirements
    - Submission form pre-population
    - Progress tracking
    
    SECURITY:
    - Employee can only view tasks assigned to them
    - Returns 404 if task not found or not assigned to employee
    """
    tasks_collection = get_tasks_collection()
    
    try:
        print(f"🔍 DEBUG: Employee {current_employee['user_id']} requesting task details for: {task_id}")
        
        # Security check: Find task AND verify it's assigned to current employee
        # This prevents employees from viewing other employees' tasks
        task = await tasks_collection.find_one({
            "task_id": task_id,
            "assigned_to": current_employee["user_id"]
        })
        
        if not task:
            print(f"❌ DEBUG: Task {task_id} not found or not assigned to employee {current_employee['user_id']}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found or not assigned to you"
            )
        
        print(f"✅ DEBUG: Task {task_id} found for employee {current_employee['user_id']}")
        
        return EmployeeTaskView(
            id=str(task["_id"]),
            task_id=task["task_id"],
            title=task["title"],
            description=task["description"],        # CRITICAL: Full requirements for employee
            deadline=task["deadline"],
            status=task["status"],
            project_id=task.get("project_id"),
            department=task.get("department"),
            github_link=task["github_link"],
            submission_date=task["submission_date"],
            score=task["score"],
            feedback=task["feedback"],
            created_at=task.get("created_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 DEBUG: Exception in get_task_details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch task details"
        )

@router.post("/tasks/{task_id}/submit")
async def submit_task_github_url(
    task_id: str,
    submission_data: TaskSubmission,
    current_employee: Dict[str, Any] = Depends(get_current_employee)
):
    """
    Submit GitHub repository URL for task evaluation
    
    CRITICAL ENDPOINT: This is where employees submit work for AI evaluation
    
    FRONTEND INTEGRATION:
    1. Employee completes work and pushes to GitHub
    2. Employee opens task submission form
    3. Employee enters GitHub repository URL
    4. Frontend calls: POST /employee/tasks/{task_id}/submit
    5. Headers: Authorization: Bearer <employee_token>
    6. Body: {"github_link": "https://github.com/employee/repo"}
    7. Frontend shows success message and updated task status
    
    FRONTEND FORM EXAMPLE:
    ```javascript
    const submitTask = async (taskId, githubUrl) => {
        const response = await fetch(`/employee/tasks/${taskId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${employeeToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                github_link: githubUrl
            })
        });
        
        if (response.ok) {
            // Show success message
            // Refresh task list
            // Update UI to show "submitted" status
        }
    };
    ```
    
    SUBMISSION WORKFLOW:
    1. Validate employee owns the task
    2. Check task isn't already submitted
    3. Update task with GitHub URL and submission timestamp
    4. Change status to "submitted"
    5. Prevent resubmission
    6. AI team will pick up submitted tasks for evaluation
    """
    tasks_collection = get_tasks_collection()
    
    try:
        # Step 1: Security check - Find task and verify ownership
        task = await tasks_collection.find_one({
            "task_id": task_id,
            "assigned_to": current_employee["user_id"]
        })
        
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found or not assigned to you"
            )
        
        # Step 2: Prevent resubmission - Check current task status
        # Once submitted, task cannot be resubmitted
        if task["status"] in [TaskStatus.SUBMITTED, TaskStatus.EVALUATED, TaskStatus.COMPLETED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task {task_id} is already submitted. Current status: {task['status']}. Resubmission not allowed."
            )
        
        # Step 3: Record submission with timestamp
        submission_timestamp = datetime.utcnow()
        
        # Step 4: Update task in database
        update_result = await tasks_collection.update_one(
            {"task_id": task_id},
            {
                "$set": {
                    "github_link": str(submission_data.github_link),    # Store GitHub URL
                    "submission_date": submission_timestamp,            # Record when submitted
                    "status": TaskStatus.SUBMITTED,                     # Change status to submitted
                    "updated_at": submission_timestamp                  # Update modification time
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit task. Please try again."
            )
        
        # Step 5: Return success response with submission details
        return {
            "message": "Task submitted successfully!",
            "task_id": task_id,
            "github_link": str(submission_data.github_link),
            "submission_date": submission_timestamp,
            "status": TaskStatus.SUBMITTED,
            "next_steps": [
                "Your submission has been recorded",
                "AI system will evaluate your GitHub repository",
                "You will receive feedback and score once evaluation is complete",
                "Check back later for evaluation results"
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Task submission error: {str(e)}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit task. Please try again."
        )
