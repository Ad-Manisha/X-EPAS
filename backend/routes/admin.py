# routes/admin.py - Admin-only API endpoints
# Core APIs for employee, project and task management

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from datetime import datetime

# Import models
from models.employee import EmployeeCreate, EmployeeResponse, EmployeeListResponse
from models.project import ProjectCreate, ProjectResponse, ProjectEmployeeAssignment
from models.task import TaskCreate, TaskResponse, TaskAssignment, TaskListResponse, TaskUpdate, TaskStatus

# Import auth dependencies
from auth.dependencies import get_current_admin
from auth.password import hash_password, validate_password_strength

# Import database functions
from database import get_employees_collection, get_projects_collection, get_tasks_collection

# Create router for admin endpoints
router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    dependencies=[Depends(get_current_admin)],  # All routes require admin auth
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

async def calculate_project_completion(project_id: str, auto_update_status: bool = True) -> tuple[float, str]:
    """
    Calculate project completion percentage based on evaluated tasks.
    Automatically updates project status to 'completed' when 100% done.

    Formula: (evaluated_tasks / total_tasks) * 100

    Returns tuple of (completion_percentage, status)
    """
    tasks_collection = get_tasks_collection()
    projects_collection = get_projects_collection()

    # Count total tasks for this project
    total_tasks = await tasks_collection.count_documents({"project_id": project_id})

    # Get current project status
    project = await projects_collection.find_one({"project_id": project_id})
    current_status = project["status"] if project else "planning"

    if total_tasks == 0:
        return 0.0, current_status

    # Count evaluated tasks (status = 'evaluated' or 'completed')
    evaluated_tasks = await tasks_collection.count_documents({
        "project_id": project_id,
        "status": {"$in": [TaskStatus.EVALUATED, TaskStatus.COMPLETED]}
    })

    completion = round((evaluated_tasks / total_tasks) * 100, 1)

    # Auto-update project status based on completion
    if auto_update_status and project:
        new_status = current_status

        if completion >= 100:
            new_status = "completed"
        elif completion > 0 and current_status == "planning":
            new_status = "in_progress"

        # Update status in database if changed
        if new_status != current_status:
            await projects_collection.update_one(
                {"project_id": project_id},
                {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
            )
            current_status = new_status

    return completion, current_status

# =============================================================================
# DASHBOARD STATISTICS
# =============================================================================

@router.get("/dashboard/stats")
async def get_dashboard_statistics(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get comprehensive dashboard statistics for admin overview
    
    Frontend Usage:
    - Admin dashboard cards and charts
    - Performance overview
    - Quick statistics display
    """
    employees_collection = get_employees_collection()
    projects_collection = get_projects_collection()
    tasks_collection = get_tasks_collection()
    
    try:
        # Employee statistics
        total_employees = await employees_collection.count_documents({"is_active": True})
        
        # Project statistics
        total_projects = await projects_collection.count_documents({})
        active_projects = await projects_collection.count_documents({"status": "in_progress"})
        
        # Task statistics
        total_tasks = await tasks_collection.count_documents({})
        completed_tasks = await tasks_collection.count_documents({"status": "completed"})
        evaluated_tasks = await tasks_collection.count_documents({"status": "evaluated"})
        submitted_tasks = await tasks_collection.count_documents({"status": "submitted"})
        assigned_tasks = await tasks_collection.count_documents({"status": "assigned"})

        # Calculate completion percentage based on evaluated + completed tasks
        done_tasks = evaluated_tasks + completed_tasks
        completion_percentage = (done_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Get recent activity (last 10 activities)
        recent_tasks = []
        async for task in tasks_collection.find({}).sort("created_at", -1).limit(5):
            recent_tasks.append({
                "task_id": task["task_id"],
                "title": task["title"],
                "status": task["status"],
                "created_at": task["created_at"],
                "assigned_to": task.get("assigned_to"),
                "project_id": task["project_id"]
            })
        
        # Get upcoming deadlines (next 7 days)
        from datetime import timedelta
        upcoming_deadline = datetime.utcnow() + timedelta(days=7)
        upcoming_tasks = []
        async for task in tasks_collection.find({
            "deadline": {"$lte": upcoming_deadline, "$gte": datetime.utcnow()},
            "status": {"$in": ["assigned", "in_progress"]}
        }).sort("deadline", 1).limit(5):
            upcoming_tasks.append({
                "task_id": task["task_id"],
                "title": task["title"],
                "deadline": task["deadline"],
                "assigned_to": task.get("assigned_to"),
                "project_id": task["project_id"],
                "status": task["status"]
            })
        
        # Department-wise task distribution
        department_stats = {}
        async for task in tasks_collection.find({}):
            dept = task.get("department", "Unknown")
            if dept not in department_stats:
                department_stats[dept] = {"total": 0, "completed": 0}
            department_stats[dept]["total"] += 1
            if task["status"] == "completed":
                department_stats[dept]["completed"] += 1
        
        return {
            "employees": {
                "total": total_employees,
                "active": total_employees  # All fetched employees are active
            },
            "projects": {
                "total": total_projects,
                "active": active_projects,
                "completion_rate": (active_projects / total_projects * 100) if total_projects > 0 else 0
            },
            "tasks": {
                "total": total_tasks,
                "completed": completed_tasks,
                "evaluated": evaluated_tasks,
                "submitted": submitted_tasks,
                "assigned": assigned_tasks,
                "completion_percentage": round(completion_percentage, 1)
            },
            "recent_activity": recent_tasks,
            "upcoming_deadlines": upcoming_tasks,
            "department_stats": department_stats,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard statistics"
        )

# =============================================================================
# EMPLOYEE MANAGEMENT
# =============================================================================

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Create a new employee account
    
    Frontend Usage:
    - Admin dashboard "Add Employee" form
    - Employee onboarding workflow
    - Bulk employee import
    
    AI Team Usage:
    - Employee data available for task evaluation context
    """
    employees_collection = get_employees_collection()
    
    try:
        # Check if employee already exists
        existing_employee = await employees_collection.find_one({
            "email": employee_data.email
        })
        
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee with this email already exists"
            )
        
        # Validate password strength
        is_strong, message = validate_password_strength(employee_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password validation failed: {message}"
            )
        
        # Generate employee ID
        employee_count = await employees_collection.count_documents({})
        emp_id = f"EMP{str(employee_count + 1).zfill(3)}"
        
        # Hash password for secure storage
        hashed_password = hash_password(employee_data.password)
        
        # Create employee document
        employee_doc = {
            "emp_id": emp_id,
            "name": employee_data.name,
            "email": employee_data.email,
            "department": employee_data.department,  # Important for AI context
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into database
        result = await employees_collection.insert_one(employee_doc)
        created_employee = await employees_collection.find_one({"_id": result.inserted_id})
        
        # Return employee data (password excluded)
        return EmployeeResponse(
            id=str(created_employee["_id"]),
            emp_id=created_employee["emp_id"],
            name=created_employee["name"],
            email=created_employee["email"],
            department=created_employee["department"],
            created_at=created_employee["created_at"],
            is_active=created_employee["is_active"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create employee account"
        )

@router.get("/employees/{emp_id}", response_model=EmployeeResponse)
async def get_employee_details(
    emp_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get detailed information about a specific employee

    Frontend Usage:
    - Employee detail page
    - Employee profile view
    - Task assignment context
    """
    employees_collection = get_employees_collection()

    try:
        employee = await employees_collection.find_one({"emp_id": emp_id})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee {emp_id} not found"
            )

        return EmployeeResponse(
            id=str(employee["_id"]),
            emp_id=employee["emp_id"],
            name=employee["name"],
            email=employee["email"],
            department=employee["department"],
            created_at=employee["created_at"],
            is_active=employee["is_active"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employee details"
        )

@router.get("/employees", response_model=List[EmployeeListResponse])
async def get_all_employees(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get all employees in the organization
    
    Frontend Usage:
    - Employee management dashboard
    - Employee selection for project assignment
    - Department-wise employee listing
    - Employee directory
    
    AI Team Usage:
    - Employee context for evaluation (department, role)
    - Task assignment validation
    """
    employees_collection = get_employees_collection()
    
    try:
        employees = []
        
        # Fetch all employees
        async for employee_doc in employees_collection.find({}):
            employee = EmployeeListResponse(
                id=str(employee_doc["_id"]),
                emp_id=employee_doc["emp_id"],
                name=employee_doc["name"],
                email=employee_doc["email"],
                department=employee_doc["department"],
                is_active=employee_doc["is_active"]
            )
            employees.append(employee)
        
        # Sort by employee ID for consistent ordering
        employees.sort(key=lambda x: x.emp_id)
        
        return employees
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employees"
        )

# =============================================================================
# PROJECT MANAGEMENT
# =============================================================================

@router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Create a new project
    
    Frontend Usage:
    - Project management dashboard
    - "Create New Project" form
    - Project planning workflow
    
    AI Team Usage:
    - Project context for task evaluation
    - Project-level performance analytics
    """
    projects_collection = get_projects_collection()
    
    try:
        # Check if project already exists
        existing_project = await projects_collection.find_one({
            "name": project_data.name
        })
        
        if existing_project:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project with this name already exists"
            )
        
        # Generate project ID
        project_count = await projects_collection.count_documents({})
        project_id = f"PRJ{str(project_count + 1).zfill(3)}"
        
        # Create project document
        project_doc = {
            "project_id": project_id,
            "name": project_data.name,
            "description": project_data.description,
            "status": project_data.status,
            "employees": [],  # Will be populated via assignment endpoint
            "completion_percentage": 0.0,  # Calculated from task completion
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_admin["user_id"]
        }
        
        # Insert into database
        result = await projects_collection.insert_one(project_doc)
        created_project = await projects_collection.find_one({"_id": result.inserted_id})
        
        # Return project data
        return ProjectResponse(
            id=str(created_project["_id"]),
            project_id=created_project["project_id"],
            name=created_project["name"],
            description=created_project["description"],
            status=created_project["status"],
            employees=created_project["employees"],
            completion_percentage=created_project["completion_percentage"],
            created_at=created_project["created_at"],
            created_by=created_project["created_by"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )

@router.post("/projects/{project_id}/assign-employees")
async def assign_employees_to_project(
    project_id: str,
    assignment_data: ProjectEmployeeAssignment,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Assign employees to a project
    
    Frontend Usage:
    - Project management interface
    - Employee assignment modal
    - Drag-and-drop assignment
    - Bulk employee assignment
    
    AI Team Usage:
    - Employee-project relationship for evaluation context
    - Team composition analysis
    """
    projects_collection = get_projects_collection()
    employees_collection = get_employees_collection()
    
    try:
        # Find the project
        project = await projects_collection.find_one({"project_id": project_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )
        
        # Validate all employee IDs exist and are active
        valid_employees = []
        for emp_id in assignment_data.employee_ids:
            employee = await employees_collection.find_one({"emp_id": emp_id})
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee {emp_id} not found"
                )
            if not employee["is_active"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee {emp_id} is not active"
                )
            valid_employees.append(emp_id)
        
        # Update project with assigned employees
        update_result = await projects_collection.update_one(
            {"project_id": project_id},
            {
                "$set": {
                    "employees": valid_employees,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign employees to project"
            )
        
        return {
            "message": "Employees assigned successfully",
            "project_id": project_id,
            "assigned_employees": valid_employees,
            "employee_count": len(valid_employees)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign employees to project"
        )

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_details(
    project_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get detailed information about a specific project

    Frontend Usage:
    - Project detail page
    - Project editing forms
    - Project overview
    """
    projects_collection = get_projects_collection()

    try:
        project = await projects_collection.find_one({"project_id": project_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )

        # Calculate completion percentage and auto-update status if 100%
        completion, updated_status = await calculate_project_completion(project_id)

        return ProjectResponse(
            id=str(project["_id"]),
            project_id=project["project_id"],
            name=project["name"],
            description=project["description"],
            status=updated_status,
            employees=project["employees"],
            completion_percentage=completion,
            created_at=project["created_at"],
            created_by=project["created_by"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch project details"
        )

@router.get("/projects", response_model=List[ProjectResponse])
async def get_all_projects(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get all projects with dynamically calculated completion percentage.

    Completion is calculated as: (evaluated_tasks / total_tasks) * 100

    Frontend Usage:
    - Project dashboard
    - Project selection dropdowns
    - Project overview cards

    AI Team Usage:
    - Project context for evaluations
    - Project-level analytics
    """
    projects_collection = get_projects_collection()

    try:
        projects = []

        # Fetch all projects
        async for project_doc in projects_collection.find({}):
            # Calculate completion percentage and auto-update status if 100%
            completion, updated_status = await calculate_project_completion(project_doc["project_id"])

            project = ProjectResponse(
                id=str(project_doc["_id"]),
                project_id=project_doc["project_id"],
                name=project_doc["name"],
                description=project_doc["description"],
                status=updated_status,
                employees=project_doc["employees"],
                completion_percentage=completion,
                created_at=project_doc["created_at"],
                created_by=project_doc["created_by"]
            )
            projects.append(project)

        # Sort by project ID
        projects.sort(key=lambda x: x.project_id)

        return projects

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch projects"
        )

# =============================================================================
# TASK MANAGEMENT
# =============================================================================

@router.post("/projects/{project_id}/tasks", response_model=TaskResponse)
async def create_task_in_project(
    project_id: str,
    task_data: TaskCreate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Create a new task within a project
    
    CRITICAL: Task description is used as AI evaluation context
    
    Frontend Usage:
    - Project management dashboard
    - Task creation forms
    - Project planning workflow
    
    AI Team Usage:
    - Task description provides evaluation context
    - Department helps match evaluation criteria
    - Requirements guide evaluation focus
    """
    projects_collection = get_projects_collection()
    tasks_collection = get_tasks_collection()
    
    try:
        # Verify project exists
        project = await projects_collection.find_one({"project_id": project_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )
        
        # Generate task ID
        task_count = await tasks_collection.count_documents({})
        task_id = f"TSK{str(task_count + 1).zfill(3)}"
        
        # Create task document
        task_doc = {
            "task_id": task_id,
            "project_id": project_id,
            "title": task_data.title,
            "description": task_data.description,  # CRITICAL for AI context
            "deadline": datetime.combine(task_data.deadline, datetime.min.time()),
            "department": task_data.department,
            "status": TaskStatus.ASSIGNED,  # Not assigned yet
            "assigned_to": None,  # Will be set via assignment endpoint
            
            # Submission fields (null until submitted)
            "github_link": None,
            "submission_date": None,
            
            # AI evaluation fields (null until evaluated)
            "score": None,
            "feedback": None,
            "evaluated_at": None,
            
            # Metadata
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_admin["user_id"]
        }
        
        # Insert into database
        result = await tasks_collection.insert_one(task_doc)
        created_task = await tasks_collection.find_one({"_id": result.inserted_id})
        
        # Return task data
        return TaskResponse(
            id=str(created_task["_id"]),
            task_id=created_task["task_id"],
            title=created_task["title"],
            description=created_task["description"],
            deadline=created_task["deadline"],
            department=created_task["department"],
            project_id=created_task["project_id"],
            assigned_to=created_task["assigned_to"],
            status=created_task["status"],
            github_link=created_task["github_link"],
            submission_date=created_task["submission_date"],
            score=created_task["score"],
            feedback=created_task["feedback"],
            evaluated_at=created_task["evaluated_at"],
            created_at=created_task["created_at"],
            created_by=created_task["created_by"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Task creation error: {str(e)}")  # Temporary debugging
        print(f"Error type: {type(e)}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create task"
        )

@router.post("/tasks/{task_id}/assign")
async def assign_task_to_employee(
    task_id: str,
    assignment_data: TaskAssignment,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Assign a task to an employee
    
    VALIDATION LOGIC:
    - Employee must exist and be active
    - Employee must be assigned to the project
    - Employee department should match task department (warning, not error)
    
    Frontend Usage:
    - Task assignment interface
    - Employee workload management
    - Project task distribution
    """
    tasks_collection = get_tasks_collection()
    employees_collection = get_employees_collection()
    projects_collection = get_projects_collection()
    
    try:
        # Find the task
        task = await tasks_collection.find_one({"task_id": task_id})
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        
        # Find the employee
        employee = await employees_collection.find_one({"emp_id": assignment_data.employee_id})
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee {assignment_data.employee_id} not found"
            )
        
        if not employee["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee {assignment_data.employee_id} is not active"
            )
        
        # Verify employee is assigned to the project
        project = await projects_collection.find_one({"project_id": task["project_id"]})
        if assignment_data.employee_id not in project["employees"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee {assignment_data.employee_id} is not assigned to project {task['project_id']}"
            )
        
        # Check department match (warning, not blocking)
        department_mismatch = employee["department"].lower() != task["department"].lower()
        
        # Update task with assignment
        update_result = await tasks_collection.update_one(
            {"task_id": task_id},
            {
                "$set": {
                    "assigned_to": assignment_data.employee_id,
                    "status": TaskStatus.ASSIGNED,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to assign task to employee"
            )
        
        response = {
            "message": "Task assigned successfully",
            "task_id": task_id,
            "assigned_to": assignment_data.employee_id,
            "employee_name": employee["name"],
            "employee_department": employee["department"],
            "task_department": task["department"]
        }
        
        # Add warning if departments don't match
        if department_mismatch:
            response["warning"] = f"Department mismatch: Employee is in {employee['department']}, task is for {task['department']}"
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign task to employee"
        )

@router.get("/projects/{project_id}/tasks", response_model=List[TaskListResponse])
async def get_project_tasks(
    project_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get all tasks in a project
    
    Frontend Usage:
    - Project dashboard task list
    - Task management interface
    - Project progress tracking
    
    AI Team Usage:
    - Project task context for evaluation
    - Task completion analytics
    """
    projects_collection = get_projects_collection()
    tasks_collection = get_tasks_collection()
    
    try:
        # Verify project exists
        project = await projects_collection.find_one({"project_id": project_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {project_id} not found"
            )
        
        tasks = []
        
        # Fetch all tasks for this project
        async for task_doc in tasks_collection.find({"project_id": project_id}):
            task = TaskListResponse(
                id=str(task_doc["_id"]),
                task_id=task_doc["task_id"],
                title=task_doc["title"],
                deadline=task_doc["deadline"],
                status=task_doc["status"],
                assigned_to=task_doc["assigned_to"],
                score=task_doc["score"]
            )
            tasks.append(task)
        
        # Sort by task ID
        tasks.sort(key=lambda x: x.task_id)
        
        return tasks
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch project tasks"
        )

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_details(
    task_id: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get detailed information about a specific task
    
    Frontend Usage:
    - Task detail modal
    - Task editing forms
    - Task progress tracking
    
    AI Team Usage:
    - Complete task context for evaluation
    - Task submission details
    """
    tasks_collection = get_tasks_collection()
    
    try:
        task = await tasks_collection.find_one({"task_id": task_id})
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        
        return TaskResponse(
            id=str(task["_id"]),
            task_id=task["task_id"],
            title=task["title"],
            description=task["description"],
            deadline=task["deadline"],
            department=task["department"],
            project_id=task["project_id"],
            assigned_to=task["assigned_to"],
            status=task["status"],
            github_link=task["github_link"],
            submission_date=task["submission_date"],
            score=task["score"],
            feedback=task["feedback"],
            evaluated_at=task["evaluated_at"],
            created_at=task["created_at"],
            created_by=task["created_by"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch task details"
        )

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Update task information (admin only)
    
    IMPORTANT: Task description updates affect AI evaluation context
    
    Frontend Usage:
    - Task editing forms
    - Task requirement updates
    - Deadline adjustments
    """
    tasks_collection = get_tasks_collection()
    
    try:
        # Find the task
        task = await tasks_collection.find_one({"task_id": task_id})
        if not task:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Task {task_id} not found"
            )
        
        # Build update document (only include non-None fields)
        update_data = {"updated_at": datetime.utcnow()}
        
        if task_update.title is not None:
            update_data["title"] = task_update.title
        if task_update.description is not None:
            update_data["description"] = task_update.description  # Critical for AI
        if task_update.deadline is not None:
            update_data["deadline"] = datetime.combine(task_update.deadline, datetime.min.time())
        if task_update.department is not None:
            update_data["department"] = task_update.department
        
        # Update task
        update_result = await tasks_collection.update_one(
            {"task_id": task_id},
            {"$set": update_data}
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update task"
            )
        
        # Return updated task
        updated_task = await tasks_collection.find_one({"task_id": task_id})
        
        return TaskResponse(
            id=str(updated_task["_id"]),
            task_id=updated_task["task_id"],
            title=updated_task["title"],
            description=updated_task["description"],
            deadline=updated_task["deadline"],
            department=updated_task["department"],
            project_id=updated_task["project_id"],
            assigned_to=updated_task["assigned_to"],
            status=updated_task["status"],
            github_link=updated_task["github_link"],
            submission_date=updated_task["submission_date"],
            score=updated_task["score"],
            feedback=updated_task["feedback"],
            evaluated_at=updated_task["evaluated_at"],
            created_at=updated_task["created_at"],
            created_by=updated_task["created_by"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Task update error: {str(e)}")  # Temporary debugging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update task"
        )


# =============================================================================
# DEPARTMENT PERFORMANCE ANALYTICS
# =============================================================================

@router.get("/departments/{department}/performance")
async def get_department_performance(
    department: str,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get performance analytics for all employees in a specific department.

    Calculates real metrics based on actual task data:
    - Performance score based on average task scores
    - Tasks completed count
    - Projects contributed
    - Monthly growth trends
    """
    employees_collection = get_employees_collection()
    tasks_collection = get_tasks_collection()
    projects_collection = get_projects_collection()

    try:
        # Get all employees in the department
        department_employees = []
        async for emp in employees_collection.find({"department": department, "is_active": True}):
            department_employees.append(emp)

        if not department_employees:
            return {
                "department": department,
                "team_size": 0,
                "avg_performance": 0,
                "top_performers": 0,
                "total_tasks_completed": 0,
                "employees": []
            }

        # Get all projects
        all_projects = []
        async for project in projects_collection.find():
            all_projects.append(project)

        # Calculate performance metrics for each employee
        employee_performance = []
        total_scores = []
        total_tasks_completed = 0

        for emp in department_employees:
            emp_id = emp["emp_id"]

            # Get all tasks assigned to this employee
            emp_tasks = []
            async for task in tasks_collection.find({"assigned_to": emp_id}):
                emp_tasks.append(task)

            # Calculate metrics
            completed_tasks = [t for t in emp_tasks if t["status"] in ["completed", "evaluated"]]
            tasks_with_scores = [t for t in emp_tasks if t.get("score") is not None]

            # Average task score (performance score)
            avg_score = 0
            if tasks_with_scores:
                avg_score = round(sum(t["score"] for t in tasks_with_scores) / len(tasks_with_scores), 1)

            # Count projects this employee is part of
            projects_count = sum(1 for p in all_projects if emp_id in (p.get("employees") or []))

            # Calculate scores breakdown
            creativity_scores = [t.get("creativity_score", 0) for t in tasks_with_scores if t.get("creativity_score")]
            efficiency_scores = [t.get("efficiency_score", 0) for t in tasks_with_scores if t.get("efficiency_score")]
            edge_case_scores = [t.get("edge_case_handling_score", 0) for t in tasks_with_scores if t.get("edge_case_handling_score")]

            avg_creativity = round(sum(creativity_scores) / len(creativity_scores), 1) if creativity_scores else 0
            avg_efficiency = round(sum(efficiency_scores) / len(efficiency_scores), 1) if efficiency_scores else 0
            avg_edge_case = round(sum(edge_case_scores) / len(edge_case_scores), 1) if edge_case_scores else 0

            employee_data = {
                "emp_id": emp_id,
                "name": emp["name"],
                "email": emp["email"],
                "department": emp["department"],
                "is_active": emp["is_active"],
                "performance_score": avg_score,
                "tasks_completed": len(completed_tasks),
                "total_tasks": len(emp_tasks),
                "avg_task_score": avg_score,
                "projects_contributed": projects_count,
                "creativity_score": avg_creativity,
                "efficiency_score": avg_efficiency,
                "edge_case_handling_score": avg_edge_case,
                "pending_tasks": len([t for t in emp_tasks if t["status"] == "assigned"]),
                "submitted_tasks": len([t for t in emp_tasks if t["status"] == "submitted"])
            }

            employee_performance.append(employee_data)
            if avg_score > 0:
                total_scores.append(avg_score)
            total_tasks_completed += len(completed_tasks)

        # Sort by performance score (highest first)
        employee_performance.sort(key=lambda x: x["performance_score"], reverse=True)

        # Calculate department-wide metrics
        avg_performance = round(sum(total_scores) / len(total_scores), 1) if total_scores else 0
        top_performers = len([e for e in employee_performance if e["performance_score"] >= 90])

        return {
            "department": department,
            "team_size": len(department_employees),
            "avg_performance": avg_performance,
            "top_performers": top_performers,
            "total_tasks_completed": total_tasks_completed,
            "employees": employee_performance
        }

    except Exception as e:
        print(f"Department performance error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch department performance data"
        )


# =============================================================================
# EMPLOYEE REVIEWS (Based on Task Evaluations)
# =============================================================================

@router.get("/reviews")
async def get_employee_reviews(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get all employee reviews based on actual task evaluations.

    Each evaluated task serves as a "review" with AI-generated feedback.
    Returns employees with their evaluation history and statistics.
    """
    employees_collection = get_employees_collection()
    tasks_collection = get_tasks_collection()

    try:
        reviews_data = []

        # Get all active employees
        async for emp in employees_collection.find({"is_active": True}):
            emp_id = emp["emp_id"]

            # Get all evaluated tasks for this employee
            evaluated_tasks = []
            async for task in tasks_collection.find({
                "assigned_to": emp_id,
                "status": {"$in": ["evaluated", "completed"]},
                "score": {"$ne": None}
            }).sort("evaluated_at", -1):
                evaluated_tasks.append({
                    "review_id": task["task_id"],
                    "type": "Task Evaluation",
                    "task_title": task["title"],
                    "project_id": task.get("project_id"),
                    "department": task.get("department"),
                    "status": "Completed",
                    "date": task.get("evaluated_at") or task.get("submission_date"),
                    "overall_score": task.get("score", 0),
                    "creativity_score": task.get("creativity_score"),
                    "efficiency_score": task.get("efficiency_score"),
                    "edge_case_handling_score": task.get("edge_case_handling_score"),
                    "feedback": task.get("feedback", ""),
                    "review_comments": task.get("review_comments", []),
                    "github_link": task.get("github_link")
                })

            # Calculate average scores
            total_score = 0
            total_creativity = 0
            total_efficiency = 0
            total_edge_case = 0
            count = len(evaluated_tasks)

            for task in evaluated_tasks:
                total_score += task["overall_score"] or 0
                total_creativity += task["creativity_score"] or 0
                total_efficiency += task["efficiency_score"] or 0
                total_edge_case += task["edge_case_handling_score"] or 0

            avg_score = round(total_score / count, 1) if count > 0 else 0
            avg_creativity = round(total_creativity / count, 1) if count > 0 else 0
            avg_efficiency = round(total_efficiency / count, 1) if count > 0 else 0
            avg_edge_case = round(total_edge_case / count, 1) if count > 0 else 0

            # Determine strengths and areas for improvement based on scores
            strengths = []
            improvements = []

            if avg_creativity >= 7:
                strengths.append("Creativity")
            elif avg_creativity > 0 and avg_creativity < 5:
                improvements.append("Creativity")

            if avg_efficiency >= 7:
                strengths.append("Code Efficiency")
            elif avg_efficiency > 0 and avg_efficiency < 5:
                improvements.append("Code Efficiency")

            if avg_edge_case >= 7:
                strengths.append("Edge Case Handling")
            elif avg_edge_case > 0 and avg_edge_case < 5:
                improvements.append("Edge Case Handling")

            if avg_score >= 85:
                strengths.append("Overall Performance")
            elif avg_score > 0 and avg_score < 70:
                improvements.append("Overall Performance")

            # Get pending tasks count
            pending_tasks = await tasks_collection.count_documents({
                "assigned_to": emp_id,
                "status": "assigned"
            })

            reviews_data.append({
                "emp_id": emp_id,
                "name": emp["name"],
                "email": emp["email"],
                "department": emp["department"],
                "reviews": evaluated_tasks,
                "review_count": count,
                "average_score": avg_score,
                "avg_creativity": avg_creativity,
                "avg_efficiency": avg_efficiency,
                "avg_edge_case": avg_edge_case,
                "strengths": strengths if strengths else ["No data yet"],
                "improvements": improvements if improvements else ["No data yet"],
                "pending_reviews": pending_tasks,
                "last_review_date": evaluated_tasks[0]["date"] if evaluated_tasks else None
            })

        # Calculate overall statistics
        total_reviews = sum(emp["review_count"] for emp in reviews_data)
        completed_reviews = total_reviews  # All evaluated tasks are "completed" reviews
        pending_reviews = sum(emp["pending_reviews"] for emp in reviews_data)
        avg_score_all = round(
            sum(emp["average_score"] for emp in reviews_data if emp["review_count"] > 0) /
            len([emp for emp in reviews_data if emp["review_count"] > 0]), 1
        ) if any(emp["review_count"] > 0 for emp in reviews_data) else 0

        return {
            "statistics": {
                "total_reviews": total_reviews,
                "completed_reviews": completed_reviews,
                "pending_reviews": pending_reviews,
                "average_score": avg_score_all
            },
            "employees": reviews_data
        }

    except Exception as e:
        print(f"Reviews fetch error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch employee reviews"
        )


# =============================================================================
# OVERALL PERFORMANCE ANALYTICS
# =============================================================================

@router.get("/performance")
async def get_all_performance(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get performance analytics for all employees across all departments.

    Calculates real metrics based on actual task evaluations:
    - Performance score based on average task scores
    - Tasks completed count
    - Department ranking
    - Key achievements from recent high-scoring tasks
    """
    employees_collection = get_employees_collection()
    tasks_collection = get_tasks_collection()
    projects_collection = get_projects_collection()

    try:
        # Get all projects for reference
        all_projects = []
        async for project in projects_collection.find():
            all_projects.append(project)

        # Calculate performance metrics for each employee
        employee_performance = []

        async for emp in employees_collection.find({"is_active": True}):
            emp_id = emp["emp_id"]

            # Get all tasks assigned to this employee
            emp_tasks = []
            async for task in tasks_collection.find({"assigned_to": emp_id}):
                emp_tasks.append(task)

            # Calculate metrics
            completed_tasks = [t for t in emp_tasks if t["status"] in ["completed", "evaluated"]]
            tasks_with_scores = [t for t in emp_tasks if t.get("score") is not None]

            # Average task score (performance score)
            avg_score = 0
            if tasks_with_scores:
                avg_score = round(sum(t["score"] for t in tasks_with_scores) / len(tasks_with_scores), 1)

            # Count projects this employee is part of
            projects_count = sum(1 for p in all_projects if emp_id in (p.get("employees") or []))

            # Calculate scores breakdown
            creativity_scores = [t.get("creativity_score", 0) for t in tasks_with_scores if t.get("creativity_score")]
            efficiency_scores = [t.get("efficiency_score", 0) for t in tasks_with_scores if t.get("efficiency_score")]
            edge_case_scores = [t.get("edge_case_handling_score", 0) for t in tasks_with_scores if t.get("edge_case_handling_score")]

            avg_creativity = round(sum(creativity_scores) / len(creativity_scores), 1) if creativity_scores else 0
            avg_efficiency = round(sum(efficiency_scores) / len(efficiency_scores), 1) if efficiency_scores else 0
            avg_edge_case = round(sum(edge_case_scores) / len(edge_case_scores), 1) if edge_case_scores else 0

            # Get key achievements (top scoring tasks with feedback)
            key_achievements = []
            high_scoring_tasks = sorted(
                [t for t in tasks_with_scores if t.get("score", 0) >= 80],
                key=lambda x: x.get("score", 0),
                reverse=True
            )[:3]

            for task in high_scoring_tasks:
                achievement = f"Scored {task.get('score')}/100 on {task.get('title', 'Task')}"
                key_achievements.append(achievement)

            if not key_achievements and completed_tasks:
                key_achievements.append(f"Completed {len(completed_tasks)} task(s)")

            employee_data = {
                "emp_id": emp_id,
                "name": emp["name"],
                "email": emp["email"],
                "department": emp["department"],
                "performance_score": avg_score,
                "tasks_completed": len(completed_tasks),
                "total_tasks": len(emp_tasks),
                "avg_task_score": avg_score,
                "projects_contributed": projects_count,
                "creativity_score": avg_creativity,
                "efficiency_score": avg_efficiency,
                "edge_case_handling_score": avg_edge_case,
                "key_achievements": key_achievements if key_achievements else ["No achievements yet"],
                "pending_tasks": len([t for t in emp_tasks if t["status"] == "assigned"]),
                "submitted_tasks": len([t for t in emp_tasks if t["status"] == "submitted"])
            }

            employee_performance.append(employee_data)

        # Sort by performance score (highest first)
        employee_performance.sort(key=lambda x: x["performance_score"], reverse=True)

        # Calculate department rankings
        dept_employees = {}
        for emp in employee_performance:
            dept = emp["department"]
            if dept not in dept_employees:
                dept_employees[dept] = []
            dept_employees[dept].append(emp)

        # Assign department rank
        for dept, emps in dept_employees.items():
            emps.sort(key=lambda x: x["performance_score"], reverse=True)
            for rank, emp in enumerate(emps, 1):
                # Find and update the employee in the main list
                for e in employee_performance:
                    if e["emp_id"] == emp["emp_id"]:
                        e["department_rank"] = rank
                        break

        # Calculate overall statistics
        total_employees = len(employee_performance)
        scores_with_data = [e["performance_score"] for e in employee_performance if e["performance_score"] > 0]
        avg_performance = round(sum(scores_with_data) / len(scores_with_data), 1) if scores_with_data else 0
        top_performers = len([e for e in employee_performance if e["performance_score"] >= 90])
        total_tasks_completed = sum(e["tasks_completed"] for e in employee_performance)

        return {
            "statistics": {
                "total_employees": total_employees,
                "avg_performance": avg_performance,
                "top_performers": top_performers,
                "total_tasks_completed": total_tasks_completed
            },
            "employees": employee_performance
        }

    except Exception as e:
        print(f"Performance fetch error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch performance data"
        )


# =============================================================================
# ANALYTICS DASHBOARD
# =============================================================================

@router.get("/analytics")
async def get_analytics_dashboard(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get comprehensive analytics data for the analytics dashboard.

    Calculates real metrics based on actual task evaluations including:
    - Core performance metrics (velocity, quality, efficiency, creativity)
    - Workload distribution and resource utilization
    - On-time delivery and deadline compliance
    - Top performers and skill gap analysis
    - At-risk tasks and bottleneck detection
    - Score distribution and trends
    """
    from datetime import timedelta

    employees_collection = get_employees_collection()
    tasks_collection = get_tasks_collection()
    projects_collection = get_projects_collection()

    try:
        # Get all data
        all_tasks = []
        async for task in tasks_collection.find():
            all_tasks.append(task)

        all_employees = []
        async for emp in employees_collection.find({"is_active": True}):
            all_employees.append(emp)

        all_projects = []
        async for project in projects_collection.find():
            all_projects.append(project)

        now = datetime.utcnow()

        # ========== CORE METRICS ==========
        total_tasks = len(all_tasks)
        completed_tasks = [t for t in all_tasks if t["status"] in ["completed", "evaluated"]]
        evaluated_tasks = [t for t in all_tasks if t.get("score") is not None]
        assigned_tasks = [t for t in all_tasks if t["status"] == "assigned"]
        submitted_tasks = [t for t in all_tasks if t["status"] == "submitted"]

        # Team Velocity: percentage of tasks completed
        team_velocity = round((len(completed_tasks) / total_tasks * 100), 1) if total_tasks > 0 else 0

        # Quality Score: average of all task evaluation scores
        quality_scores_list = [t["score"] for t in evaluated_tasks if t.get("score")]
        quality_score = round(sum(quality_scores_list) / len(quality_scores_list), 1) if quality_scores_list else 0

        # Efficiency Rate: average efficiency score from evaluations
        efficiency_scores_list = [t["efficiency_score"] for t in evaluated_tasks if t.get("efficiency_score")]
        efficiency_rate = round((sum(efficiency_scores_list) / len(efficiency_scores_list)) * 10, 1) if efficiency_scores_list else 0

        # Creativity Score: average creativity score from evaluations
        creativity_scores_list = [t["creativity_score"] for t in evaluated_tasks if t.get("creativity_score")]
        avg_creativity = round((sum(creativity_scores_list) / len(creativity_scores_list)) * 10, 1) if creativity_scores_list else 0

        # Edge Case Handling: average edge case score
        edge_case_scores_list = [t["edge_case_handling_score"] for t in evaluated_tasks if t.get("edge_case_handling_score")]
        avg_edge_case = round((sum(edge_case_scores_list) / len(edge_case_scores_list)) * 10, 1) if edge_case_scores_list else 0

        # ========== WORKLOAD DISTRIBUTION ==========
        employee_workload = []
        employees_with_tasks = set()

        for emp in all_employees:
            emp_id = emp["emp_id"]
            emp_tasks = [t for t in all_tasks if t.get("assigned_to") == emp_id]
            emp_pending = [t for t in emp_tasks if t["status"] == "assigned"]
            emp_completed = [t for t in emp_tasks if t["status"] in ["completed", "evaluated"]]

            if emp_tasks:
                employees_with_tasks.add(emp_id)

            employee_workload.append({
                "emp_id": emp_id,
                "name": emp["name"],
                "department": emp["department"],
                "totalTasks": len(emp_tasks),
                "pendingTasks": len(emp_pending),
                "completedTasks": len(emp_completed),
                "completionRate": round((len(emp_completed) / len(emp_tasks) * 100), 1) if emp_tasks else 0
            })

        # Sort by pending tasks (most overloaded first)
        employee_workload.sort(key=lambda x: x["pendingTasks"], reverse=True)

        # Calculate workload metrics
        avg_tasks_per_employee = round(total_tasks / len(all_employees), 1) if all_employees else 0
        overloaded_employees = [e for e in employee_workload if e["pendingTasks"] > avg_tasks_per_employee * 1.5]
        underutilized_employees = [e for e in employee_workload if e["totalTasks"] == 0]
        employee_utilization = round((len(employees_with_tasks) / len(all_employees) * 100), 1) if all_employees else 0

        # ========== ON-TIME DELIVERY & DEADLINE COMPLIANCE ==========
        tasks_with_deadlines = [t for t in completed_tasks if t.get("deadline") and t.get("submission_date")]

        on_time_tasks = []
        late_tasks = []
        for task in tasks_with_deadlines:
            if task["submission_date"] <= task["deadline"]:
                on_time_tasks.append(task)
            else:
                late_tasks.append(task)

        on_time_delivery_rate = round((len(on_time_tasks) / len(tasks_with_deadlines) * 100), 1) if tasks_with_deadlines else 0

        # Overdue tasks (assigned but past deadline)
        overdue_tasks = [t for t in assigned_tasks if t.get("deadline") and t["deadline"] < now]

        # Tasks due soon (within 3 days)
        three_days_from_now = now + timedelta(days=3)
        tasks_due_soon = [t for t in assigned_tasks if t.get("deadline") and now <= t["deadline"] <= three_days_from_now]

        # ========== TASK TURNAROUND TIME ==========
        turnaround_times = []
        for task in completed_tasks:
            if task.get("created_at") and task.get("submission_date"):
                turnaround = (task["submission_date"] - task["created_at"]).days
                if turnaround >= 0:
                    turnaround_times.append(turnaround)

        avg_turnaround_days = round(sum(turnaround_times) / len(turnaround_times), 1) if turnaround_times else 0

        # ========== TOP PERFORMERS ==========
        performer_scores = []
        for emp in all_employees:
            emp_id = emp["emp_id"]
            emp_evaluated = [t for t in evaluated_tasks if t.get("assigned_to") == emp_id]

            if emp_evaluated:
                emp_scores = [t["score"] for t in emp_evaluated if t.get("score")]
                avg_score = round(sum(emp_scores) / len(emp_scores), 1) if emp_scores else 0

                performer_scores.append({
                    "emp_id": emp_id,
                    "name": emp["name"],
                    "department": emp["department"],
                    "avgScore": avg_score,
                    "tasksEvaluated": len(emp_evaluated),
                    "tasksCompleted": len([t for t in all_tasks if t.get("assigned_to") == emp_id and t["status"] in ["completed", "evaluated"]])
                })

        # Sort by average score
        performer_scores.sort(key=lambda x: x["avgScore"], reverse=True)
        top_performers = performer_scores[:5]
        low_performers = [p for p in performer_scores if p["avgScore"] < 70 and p["avgScore"] > 0]

        # ========== SKILL GAP ANALYSIS ==========
        skill_metrics = {
            "creativity": {
                "avgScore": avg_creativity,
                "status": "strong" if avg_creativity >= 70 else "needs_improvement" if avg_creativity > 0 else "no_data"
            },
            "efficiency": {
                "avgScore": efficiency_rate,
                "status": "strong" if efficiency_rate >= 70 else "needs_improvement" if efficiency_rate > 0 else "no_data"
            },
            "edgeCaseHandling": {
                "avgScore": avg_edge_case,
                "status": "strong" if avg_edge_case >= 70 else "needs_improvement" if avg_edge_case > 0 else "no_data"
            }
        }

        # Identify weakest skill
        skill_values = [(k, v["avgScore"]) for k, v in skill_metrics.items() if v["avgScore"] > 0]
        weakest_skill = min(skill_values, key=lambda x: x[1])[0] if skill_values else None
        strongest_skill = max(skill_values, key=lambda x: x[1])[0] if skill_values else None

        # ========== SCORE DISTRIBUTION ==========
        score_distribution = {
            "excellent": len([t for t in evaluated_tasks if t.get("score", 0) >= 90]),  # 90-100
            "good": len([t for t in evaluated_tasks if 80 <= t.get("score", 0) < 90]),  # 80-89
            "satisfactory": len([t for t in evaluated_tasks if 70 <= t.get("score", 0) < 80]),  # 70-79
            "needsWork": len([t for t in evaluated_tasks if t.get("score", 0) < 70 and t.get("score") is not None])  # <70
        }

        # ========== DEPARTMENT ANALYTICS (Enhanced) ==========
        department_analytics = []
        departments = set(emp["department"] for emp in all_employees)

        for dept in departments:
            dept_employees = [e for e in all_employees if e["department"] == dept]
            dept_emp_ids = [e["emp_id"] for e in dept_employees]

            dept_tasks = [t for t in all_tasks if t.get("assigned_to") in dept_emp_ids]
            dept_completed = [t for t in dept_tasks if t["status"] in ["completed", "evaluated"]]
            dept_evaluated = [t for t in dept_tasks if t.get("score") is not None]
            dept_pending = [t for t in dept_tasks if t["status"] == "assigned"]
            dept_overdue = [t for t in dept_pending if t.get("deadline") and t["deadline"] < now]

            dept_scores = [t["score"] for t in dept_evaluated if t.get("score")]
            avg_performance = round(sum(dept_scores) / len(dept_scores), 1) if dept_scores else 0

            dept_efficiency = [t["efficiency_score"] for t in dept_evaluated if t.get("efficiency_score")]
            dept_efficiency_avg = round((sum(dept_efficiency) / len(dept_efficiency)) * 10, 1) if dept_efficiency else 0

            dept_creativity = [t["creativity_score"] for t in dept_evaluated if t.get("creativity_score")]
            dept_creativity_avg = round((sum(dept_creativity) / len(dept_creativity)) * 10, 1) if dept_creativity else 0

            # On-time delivery for department
            dept_with_deadlines = [t for t in dept_completed if t.get("deadline") and t.get("submission_date")]
            dept_on_time = len([t for t in dept_with_deadlines if t["submission_date"] <= t["deadline"]])
            dept_on_time_rate = round((dept_on_time / len(dept_with_deadlines) * 100), 1) if dept_with_deadlines else 0

            department_analytics.append({
                "department": dept,
                "employeeCount": len(dept_employees),
                "avgPerformance": avg_performance,
                "tasksCompleted": len(dept_completed),
                "totalTasks": len(dept_tasks),
                "pendingTasks": len(dept_pending),
                "overdueTasks": len(dept_overdue),
                "efficiency": dept_efficiency_avg,
                "creativity": dept_creativity_avg,
                "completionRate": round((len(dept_completed) / len(dept_tasks) * 100), 1) if dept_tasks else 0,
                "onTimeDeliveryRate": dept_on_time_rate
            })

        department_analytics.sort(key=lambda x: x["avgPerformance"], reverse=True)

        # ========== PROJECT ANALYTICS (Enhanced) ==========
        project_analytics = []

        for project in all_projects:
            project_id = project["project_id"]

            project_tasks = [t for t in all_tasks if t.get("project_id") == project_id]
            project_completed = [t for t in project_tasks if t["status"] in ["completed", "evaluated"]]
            project_evaluated = [t for t in project_tasks if t.get("score") is not None]
            project_pending = [t for t in project_tasks if t["status"] == "assigned"]

            velocity = round((len(project_completed) / len(project_tasks) * 100), 1) if project_tasks else 0

            project_scores = [t["score"] for t in project_evaluated if t.get("score")]
            project_quality = round(sum(project_scores) / len(project_scores), 1) if project_scores else 0

            # Calculate project health score (composite)
            overdue_count = len([t for t in project_pending if t.get("deadline") and t["deadline"] < now])

            # Health factors: completion rate, quality, overdue ratio
            health_score = velocity * 0.4  # 40% weight on completion
            health_score += (project_quality * 0.4) if project_quality > 0 else 0  # 40% weight on quality
            overdue_penalty = (overdue_count / len(project_tasks) * 100) if project_tasks else 0
            health_score -= overdue_penalty * 0.2  # 20% penalty for overdue
            health_score = max(0, min(100, round(health_score, 1)))

            # Risk level
            if overdue_count > 2 or (len(project_pending) > 0 and velocity < 30):
                risk_level = "High"
            elif overdue_count > 0 or velocity < 60:
                risk_level = "Medium"
            else:
                risk_level = "Low"

            project_analytics.append({
                "project_id": project_id,
                "name": project["name"],
                "status": project["status"],
                "velocity": velocity,
                "qualityScore": project_quality,
                "healthScore": health_score,
                "riskLevel": risk_level,
                "tasksTotal": len(project_tasks),
                "tasksCompleted": len(project_completed),
                "tasksPending": len(project_pending),
                "tasksOverdue": overdue_count,
                "employeeCount": len(project.get("employees", []))
            })

        project_analytics.sort(key=lambda x: x["velocity"], reverse=True)

        # ========== AT-RISK TASKS ==========
        at_risk_tasks = []
        for task in assigned_tasks:
            deadline = task.get("deadline")
            if deadline:
                days_until_deadline = (deadline - now).days
                is_overdue = deadline < now

                if is_overdue or days_until_deadline <= 3:
                    at_risk_tasks.append({
                        "task_id": task["task_id"],
                        "title": task["title"],
                        "project_id": task.get("project_id"),
                        "assigned_to": task.get("assigned_to"),
                        "deadline": deadline,
                        "daysUntilDeadline": days_until_deadline,
                        "isOverdue": is_overdue,
                        "status": "overdue" if is_overdue else "due_soon"
                    })

        at_risk_tasks.sort(key=lambda x: x["daysUntilDeadline"])

        # ========== INSIGHTS (Enhanced) ==========
        insights = []

        if quality_score >= 80:
            insights.append({
                "type": "success",
                "title": "Strong Performance",
                "description": f"Team maintains a quality score of {quality_score}%, indicating excellent work quality."
            })
        elif quality_score > 0 and quality_score < 70:
            insights.append({
                "type": "warning",
                "title": "Quality Improvement Needed",
                "description": f"Current quality score is {quality_score}%. Consider additional code reviews and training."
            })

        if efficiency_rate >= 80:
            insights.append({
                "type": "success",
                "title": "High Efficiency",
                "description": f"Team efficiency rate of {efficiency_rate}% shows effective resource utilization."
            })
        elif efficiency_rate > 0 and efficiency_rate < 60:
            insights.append({
                "type": "warning",
                "title": "Efficiency Concern",
                "description": f"Efficiency rate at {efficiency_rate}%. Review workload distribution and processes."
            })

        if on_time_delivery_rate >= 80:
            insights.append({
                "type": "success",
                "title": "Excellent Deadline Compliance",
                "description": f"{on_time_delivery_rate}% of tasks delivered on time, showing strong project management."
            })
        elif on_time_delivery_rate > 0 and on_time_delivery_rate < 60:
            insights.append({
                "type": "warning",
                "title": "Deadline Compliance Issue",
                "description": f"Only {on_time_delivery_rate}% on-time delivery. Review deadline setting and workload."
            })

        if overloaded_employees:
            insights.append({
                "type": "warning",
                "title": "Workload Imbalance",
                "description": f"{len(overloaded_employees)} employee(s) have significantly more tasks than average."
            })

        if len(overdue_tasks) > 0:
            insights.append({
                "type": "warning",
                "title": "Overdue Tasks",
                "description": f"{len(overdue_tasks)} task(s) are past their deadline and need immediate attention."
            })

        if department_analytics:
            top_dept = department_analytics[0]
            if top_dept["avgPerformance"] > 0:
                insights.append({
                    "type": "info",
                    "title": "Top Performing Department",
                    "description": f"{top_dept['department']} leads with {top_dept['avgPerformance']}% average score."
                })

        if weakest_skill:
            skill_names = {"creativity": "Creativity", "efficiency": "Efficiency", "edgeCaseHandling": "Edge Case Handling"}
            insights.append({
                "type": "info",
                "title": "Skill Development Opportunity",
                "description": f"{skill_names.get(weakest_skill, weakest_skill)} is the area with most room for improvement."
            })

        # ========== RECOMMENDATIONS (Enhanced) ==========
        recommendations = []

        if department_analytics:
            lowest_dept = min(department_analytics, key=lambda x: x["avgPerformance"]) if department_analytics else None
            if lowest_dept and lowest_dept["avgPerformance"] > 0 and lowest_dept["avgPerformance"] < 70:
                recommendations.append({
                    "priority": 1,
                    "title": f"Support {lowest_dept['department']} Team",
                    "description": f"Consider additional resources or training for the {lowest_dept['department']} department."
                })

        high_risk_projects = [p for p in project_analytics if p["riskLevel"] == "High"]
        if high_risk_projects:
            recommendations.append({
                "priority": 1,
                "title": "Address High-Risk Projects",
                "description": f"{len(high_risk_projects)} project(s) at high risk. Review deadlines and resource allocation."
            })

        if len(overdue_tasks) > 3:
            recommendations.append({
                "priority": 1,
                "title": "Clear Overdue Backlog",
                "description": f"{len(overdue_tasks)} overdue tasks. Prioritize clearing these or reassigning to available team members."
            })

        if overloaded_employees:
            recommendations.append({
                "priority": 2,
                "title": "Redistribute Workload",
                "description": f"Reassign tasks from overloaded employees to {len(underutilized_employees)} underutilized team members."
            })

        if quality_score > 0 and quality_score < 75:
            recommendations.append({
                "priority": 2,
                "title": "Implement Code Quality Standards",
                "description": "Establish stricter code review processes to improve overall quality scores."
            })

        if efficiency_rate > 0 and efficiency_rate < 70:
            recommendations.append({
                "priority": 2,
                "title": "Optimize Development Workflow",
                "description": "Review current processes and consider automation to improve efficiency."
            })

        if weakest_skill and skill_metrics[weakest_skill]["avgScore"] < 60:
            skill_names = {"creativity": "Creativity", "efficiency": "Efficiency", "edgeCaseHandling": "Edge Case Handling"}
            recommendations.append({
                "priority": 2,
                "title": f"Focus on {skill_names.get(weakest_skill, weakest_skill)}",
                "description": f"Organize training sessions to improve team's {skill_names.get(weakest_skill, weakest_skill).lower()} scores."
            })

        if quality_score >= 80 and efficiency_rate >= 80:
            recommendations.append({
                "priority": 3,
                "title": "Maintain Current Standards",
                "description": "Team performance is excellent. Document and share best practices across departments."
            })

        return {
            "keyMetrics": {
                "teamVelocity": team_velocity,
                "qualityScore": quality_score,
                "efficiencyRate": efficiency_rate,
                "creativityScore": avg_creativity,
                "edgeCaseScore": avg_edge_case,
                "onTimeDeliveryRate": on_time_delivery_rate,
                "employeeUtilization": employee_utilization,
                "avgTurnaroundDays": avg_turnaround_days
            },
            "workloadDistribution": {
                "avgTasksPerEmployee": avg_tasks_per_employee,
                "overloadedCount": len(overloaded_employees),
                "underutilizedCount": len(underutilized_employees),
                "topOverloaded": employee_workload[:5],
                "utilizationRate": employee_utilization
            },
            "deadlineCompliance": {
                "onTimeRate": on_time_delivery_rate,
                "lateCount": len(late_tasks),
                "overdueCount": len(overdue_tasks),
                "dueSoonCount": len(tasks_due_soon),
                "avgTurnaroundDays": avg_turnaround_days
            },
            "topPerformers": top_performers,
            "lowPerformers": low_performers[:5],
            "skillMetrics": skill_metrics,
            "weakestSkill": weakest_skill,
            "strongestSkill": strongest_skill,
            "scoreDistribution": score_distribution,
            "departmentAnalytics": department_analytics,
            "projectAnalytics": project_analytics,
            "atRiskTasks": at_risk_tasks[:10],
            "insights": insights,
            "recommendations": recommendations,
            "summary": {
                "totalEmployees": len(all_employees),
                "totalProjects": len(all_projects),
                "totalTasks": total_tasks,
                "completedTasks": len(completed_tasks),
                "evaluatedTasks": len(evaluated_tasks),
                "pendingTasks": len(assigned_tasks),
                "submittedTasks": len(submitted_tasks),
                "overdueTasks": len(overdue_tasks)
            },
            "generated_at": datetime.utcnow()
        }

    except Exception as e:
        print(f"Analytics fetch error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch analytics data"
        )