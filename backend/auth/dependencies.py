# auth/dependencies.py - FastAPI dependencies for route protection
# Provides dependency functions to protect API endpoints

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any
from auth.jwt_handler import verify_token

# HTTP Bearer token scheme
# This tells FastAPI to expect "Authorization: Bearer <token>" header
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token
    
    This function:
    1. Extracts token from Authorization header
    2. Verifies the token is valid
    3. Returns user information
    4. Raises HTTP 401 if token is invalid
    
    Usage in routes:
        @app.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            user_id = current_user["user_id"]
            role = current_user["role"]
    
    Args:
        credentials: Automatically injected by FastAPI from Authorization header
        
    Returns:
        dict: User information from token
        
    Raises:
        HTTPException: 401 Unauthorized if token is invalid
    """
    # Extract token from credentials
    token = credentials.credentials
    
    # Verify and decode token
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

async def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency to ensure current user is an admin
    
    This dependency:
    1. First calls get_current_user (ensures user is authenticated)
    2. Then checks if user role is 'admin'
    3. Raises HTTP 403 if user is not admin
    
    Usage in admin-only routes:
        @app.post("/admin/create-project")
        async def create_project(admin: dict = Depends(get_current_admin)):
            # Only admins can access this route
    
    Args:
        current_user: User info from get_current_user dependency
        
    Returns:
        dict: Admin user information
        
    Raises:
        HTTPException: 403 Forbidden if user is not admin
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

async def get_current_employee(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency to ensure current user is an employee
    
    Usage in employee-only routes:
        @app.get("/employee/my-tasks")
        async def get_my_tasks(employee: dict = Depends(get_current_employee)):
            # Only employees can access this route
    
    Args:
        current_user: User info from get_current_user dependency
        
    Returns:
        dict: Employee user information
        
    Raises:
        HTTPException: 403 Forbidden if user is not employee
    """
    if current_user.get("role") != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )
    
    return current_user

async def get_current_admin_or_employee(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency for routes accessible by both admins and employees
    
    Usage in shared routes:
        @app.get("/profile")
        async def get_profile(user: dict = Depends(get_current_admin_or_employee)):
            # Both admins and employees can access this route
    
    Args:
        current_user: User info from get_current_user dependency
        
    Returns:
        dict: User information (admin or employee)
    """
    # This dependency just ensures user is authenticated
    # Both admin and employee roles are allowed
    return current_user
