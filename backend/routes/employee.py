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
from database import get_tasks_collection, get_employees_collection, get_projects_collection

# Import GitHub service for PR evaluation
from services.github_service import GitHubService

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
                description=task_doc["description"],
                deadline=task_doc["deadline"],
                status=task_doc["status"],
                project_id=task_doc.get("project_id"),
                department=task_doc.get("department"),
                github_link=task_doc.get("github_link"),
                submission_date=task_doc.get("submission_date"),
                score=task_doc.get("score"),
                creativity_score=task_doc.get("creativity_score"),
                efficiency_score=task_doc.get("efficiency_score"),
                edge_case_handling_score=task_doc.get("edge_case_handling_score"),
                feedback=task_doc.get("feedback"),
                review_comments=task_doc.get("review_comments"),
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
            description=task["description"],
            deadline=task["deadline"],
            status=task["status"],
            project_id=task.get("project_id"),
            department=task.get("department"),
            github_link=task.get("github_link"),
            submission_date=task.get("submission_date"),
            score=task.get("score"),
            creativity_score=task.get("creativity_score"),
            efficiency_score=task.get("efficiency_score"),
            edge_case_handling_score=task.get("edge_case_handling_score"),
            feedback=task.get("feedback"),
            review_comments=task.get("review_comments"),
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
    Submit GitHub PR URL for task evaluation.
    Automatically evaluates the PR using Claude AI and returns scores.
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

        # Step 2: Prevent resubmission
        if task["status"] in [
            TaskStatus.SUBMITTED,
            TaskStatus.EVALUATED,
            TaskStatus.COMPLETED
        ]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Task already submitted. Status: {task['status']}"
            )

        # Step 3: Record submission timestamp
        submission_timestamp = datetime.utcnow()
        github_url = str(submission_data.github_link)

        # Step 4: Evaluate PR using GitHub + Claude service
        github_service = GitHubService()
        try:
            pr_review, pr_files = await github_service.evaluate_and_review_pr(
                github_url
            )

            # Calculate overall score (average of 3 scores, scaled to 0-100)
            overall_score = round(
                (
                    pr_review.creativity_score +
                    pr_review.efficiency_score +
                    pr_review.edge_case_handling_score
                ) / 3 * 10,
                1
            )

            # Convert review comments to dict format for storage
            review_comments_dict = [
                {"path": c.path, "line": c.line, "body": c.body}
                for c in pr_review.review_comments
            ]

            # Step 5: Update task with evaluation results
            update_result = await tasks_collection.update_one(
                {"task_id": task_id},
                {
                    "$set": {
                        "github_link": github_url,
                        "submission_date": submission_timestamp,
                        "status": TaskStatus.EVALUATED,
                        "score": overall_score,
                        "creativity_score": pr_review.creativity_score,
                        "efficiency_score": pr_review.efficiency_score,
                        "edge_case_handling_score": pr_review.edge_case_handling_score,
                        "feedback": pr_review.summary,
                        "review_comments": review_comments_dict,
                        "evaluated_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )

            if update_result.modified_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save evaluation results."
                )

            return {
                "message": "Task submitted and evaluated successfully!",
                "task_id": task_id,
                "github_link": github_url,
                "submission_date": submission_timestamp,
                "status": TaskStatus.EVALUATED,
                "evaluation": {
                    "overall_score": overall_score,
                    "creativity_score": pr_review.creativity_score,
                    "efficiency_score": pr_review.efficiency_score,
                    "edge_case_handling_score": pr_review.edge_case_handling_score,
                    "summary": pr_review.summary,
                    "review_comments": review_comments_dict
                }
            }

        except HTTPException:
            raise
        except Exception as eval_error:
            # If evaluation fails, still record submission
            print(f"PR evaluation failed: {str(eval_error)}")
            await tasks_collection.update_one(
                {"task_id": task_id},
                {
                    "$set": {
                        "github_link": github_url,
                        "submission_date": submission_timestamp,
                        "status": TaskStatus.SUBMITTED,
                        "updated_at": submission_timestamp
                    }
                }
            )
            return {
                "message": "Task submitted. Evaluation pending.",
                "task_id": task_id,
                "github_link": github_url,
                "submission_date": submission_timestamp,
                "status": TaskStatus.SUBMITTED,
                "evaluation_error": str(eval_error)
            }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Task submission error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit task. Please try again."
        )


# =============================================================================
# DEPARTMENT PERFORMANCE (Employee-accessible)
# =============================================================================

@router.get("/department/performance")
async def get_my_department_performance(
    current_employee: Dict[str, Any] = Depends(get_current_employee)
):
    """
    Get performance analytics for the employee's own department.

    Employees can view their department's leaderboard and performance metrics.
    This endpoint only returns data for the employee's own department.
    """
    employees_collection = get_employees_collection()
    tasks_collection = get_tasks_collection()
    projects_collection = get_projects_collection()

    try:
        # Get the current employee's department
        current_emp = await employees_collection.find_one({"emp_id": current_employee["user_id"]})
        if not current_emp:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )

        department = current_emp["department"]

        # Get all employees in the same department
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
                "department": emp["department"],
                "performance_score": avg_score,
                "tasks_completed": len(completed_tasks),
                "total_tasks": len(emp_tasks),
                "projects_contributed": projects_count,
                "creativity_score": avg_creativity,
                "efficiency_score": avg_efficiency,
                "edge_case_handling_score": avg_edge_case
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

    except HTTPException:
        raise
    except Exception as e:
        print(f"Department performance error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch department performance data"
        )
