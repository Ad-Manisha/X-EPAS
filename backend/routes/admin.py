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

@router.get("/projects", response_model=List[ProjectResponse])
async def get_all_projects(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """
    Get all projects
    
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
            project = ProjectResponse(
                id=str(project_doc["_id"]),
                project_id=project_doc["project_id"],
                name=project_doc["name"],
                description=project_doc["description"],
                status=project_doc["status"],
                employees=project_doc["employees"],
                completion_percentage=project_doc["completion_percentage"],
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