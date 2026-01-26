# routes/auth.py - Authentication endpoints (improved version)
# Provides login functionality with better structure and scalability

from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from datetime import datetime

# Import our models
from models.admin import AdminLogin, AdminInDB
from models.employee import EmployeeLogin, EmployeeInDB

# Import our auth utilities
from auth.password import verify_password
from auth.jwt_handler import create_token_response
from auth.dependencies import get_current_user
from auth.dependencies import get_current_user, get_current_admin


# Import database functions
from database import get_admins_collection, get_employees_collection

# Pydantic models for better response structure
from pydantic import BaseModel

from models.admin import AdminCreate, AdminResponse
from models.employee import EmployeeCreate, EmployeeResponse
from auth.password import hash_password, validate_password_strength

class LoginResponse(BaseModel):
    """
    Standardized login response model
    
    WHY: Consistent response structure across all login endpoints
    BENEFIT: Frontend knows exactly what to expect, easier to maintain
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]  # User information without sensitive data
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 86400,
                "user": {
                    "id": "ADM001",
                    "role": "admin",
                    "user_type": "admin",
                    "email": "admin@company.com",
                    "name": "Admin User"
                }
            }
        }

class UserInfoResponse(BaseModel):
    """
    User information response model
    
    WHY: Clean, consistent user info structure
    BENEFIT: Type safety and clear API documentation
    """
    user_id: str
    role: str
    user_type: str
    email: str
    name: str
    is_active: bool
    permissions: list[str]  # Future-ready for permission system
    
class ErrorResponse(BaseModel):
    """
    Standardized error response
    
    WHY: Consistent error format across all endpoints
    BENEFIT: Frontend can handle errors uniformly
    """
    detail: str
    error_code: Optional[str] = None

# Create router
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"model": ErrorResponse, "description": "Authentication failed"},
        403: {"model": ErrorResponse, "description": "Access forbidden"}
    }
)

# Helper function to reduce code duplication
async def authenticate_user(collection, identifier: str, password: str, user_model) -> Optional[Dict[str, Any]]:
    """
    Generic user authentication function
    
    WHY: Eliminates code duplication between admin and employee login
    BENEFIT: Single place to maintain authentication logic, easier to debug
    
    Args:
        collection: MongoDB collection (admins or employees)
        identifier: Username/email/emp_id
        password: Plain text password
        user_model: Pydantic model class (AdminInDB or EmployeeInDB)
        
    Returns:
        dict: User data if authentication successful, None otherwise
    """
    print(f"🔍 DEBUG: Looking for user with identifier: {identifier}")
    
    # Find user by identifier (flexible search)
    user_doc = await collection.find_one({
        "$or": [
            {"username": identifier},  # For admins
            {"email": identifier},     # For both
            {"emp_id": identifier}     # For employees
        ]
    })
    
    if not user_doc:
        print(f"❌ DEBUG: No user found with identifier: {identifier}")
        return None
    
    print(f"✅ DEBUG: User found - ID: {user_doc.get('emp_id') or user_doc.get('admin_id')}")
    
    # Convert to Pydantic model for validation
    try:
        user = user_model(**user_doc)
        print(f"✅ DEBUG: Pydantic model conversion successful")
    except Exception as e:
        print(f"❌ DEBUG: Pydantic model conversion failed: {e}")
        return None
    
    # Check if account is active
    if not user.is_active:
        print(f"❌ DEBUG: Account is deactivated")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"✅ DEBUG: Account is active")
    
    # Verify password
    stored_hash = user.hashed_password
    print(f"🔐 DEBUG: Verifying password against hash: {stored_hash[:20]}...")
    
    password_valid = verify_password(password, stored_hash)
    print(f"🔐 DEBUG: Password verification result: {password_valid}")
    
    if not password_valid:
        print(f"❌ DEBUG: Password verification failed")
        return None
    
    print(f"✅ DEBUG: Authentication successful!")
    return user

def create_user_permissions(role: str, user_type: str) -> list[str]:
    """
    Generate user permissions based on role
    
    WHY: Centralized permission logic, easy to extend
    BENEFIT: Future-ready for complex permission systems
    
    Args:
        role: User role (admin, employee)
        user_type: User type (admin, employee)
        
    Returns:
        list: User permissions
    """
    if role == "admin":
        return [
            "read:all_users",
            "write:all_users", 
            "read:all_projects",
            "write:all_projects",
            "read:all_tasks",
            "write:all_tasks",
            "read:attendance",
            "write:attendance"
        ]
    elif role == "employee":
        return [
            "read:own_profile",
            "write:own_profile",
            "read:assigned_projects",
            "read:assigned_tasks",
            "write:task_submissions"
        ]
    else:
        return []

def create_enhanced_token_response(user, role: str, user_type: str) -> LoginResponse:
    """
    Create enhanced login response with user info
    
    WHY: Separates token creation from response formatting
    BENEFIT: Cleaner code, easier to modify response structure
    """
    # Get user permissions
    permissions = create_user_permissions(role, user_type)
    
    # Create token data with enhanced information
    token_data = {
        "user_id": user.admin_id if hasattr(user, 'admin_id') else user.emp_id,
        "role": role,
        "user_type": user_type,
        "permissions": permissions,  # Include permissions in token
        "email": user.email
    }
    
    # Create JWT token
    token_response = create_token_response(
        user_id=token_data["user_id"],
        role=role,
        user_type=user_type
    )
    
    # Enhanced response with user information
    return LoginResponse(
        access_token=token_response["access_token"],
        expires_in=token_response["expires_in"],
        user={
            "id": token_data["user_id"],
            "role": role,
            "user_type": user_type,
            "email": user.email,
            "name": user.username if hasattr(user, 'username') else user.name,
            "permissions": permissions
        }
    )

@router.post("/admin/login", response_model=LoginResponse)
async def admin_login(login_data: AdminLogin):
    """
    Admin login endpoint - simplified and cleaner
    
    IMPROVEMENTS:
    - Uses helper function to reduce code duplication
    - Better error handling with consistent messages
    - Enhanced response with user information
    """
    admins_collection = get_admins_collection()
    
    try:
        # Authenticate using helper function
        admin = await authenticate_user(
            collection=admins_collection,
            identifier=login_data.identifier,
            password=login_data.password,
            user_model=AdminInDB
        )
        
        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create enhanced response
        return create_enhanced_token_response(admin, "admin", "admin")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

@router.post("/employee/login", response_model=LoginResponse)
async def employee_login(login_data: EmployeeLogin):
    """
    Employee login endpoint - simplified and cleaner
    
    IMPROVEMENTS:
    - Consistent with admin login structure
    - Same error handling patterns
    - Enhanced response format
    """
    employees_collection = get_employees_collection()
    
    try:
        print(f"🔍 DEBUG: Employee login attempt for identifier: {login_data.identifier}")
        
        # Authenticate using helper function
        employee = await authenticate_user(
            collection=employees_collection,
            identifier=login_data.identifier,
            password=login_data.password,
            user_model=EmployeeInDB
        )
        
        if not employee:
            print(f"❌ DEBUG: Authentication failed for identifier: {login_data.identifier}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"✅ DEBUG: Authentication successful for employee: {employee.emp_id}")
        
        # Create enhanced response
        return create_enhanced_token_response(employee, "employee", "employee")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 DEBUG: Exception during employee login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service error"
        )

@router.get("/me", response_model=UserInfoResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current user information - enhanced with complete user details from database
    
    IMPROVEMENTS:
    - Fetches complete user info from database (not just from token)
    - Shows actual email and name
    - Better user experience
    """
    user_id = current_user.get("user_id")
    user_type = current_user.get("user_type")
    
    # Fetch complete user details from database
    if user_type == "admin":
        admins_collection = get_admins_collection()
        user_doc = await admins_collection.find_one({"admin_id": user_id})
        if user_doc:
            email = user_doc.get("email", "")
            name = user_doc.get("username", "")
        else:
            email = ""
            name = ""
    elif user_type == "employee":
        employees_collection = get_employees_collection()
        user_doc = await employees_collection.find_one({"emp_id": user_id})
        if user_doc:
            email = user_doc.get("email", "")
            name = user_doc.get("name", "")
        else:
            email = ""
            name = ""
    else:
        email = ""
        name = ""
    
    # Generate permissions
    permissions = create_user_permissions(
        current_user.get("role", ""),
        current_user.get("user_type", "")
    )
    
    return UserInfoResponse(
        user_id=current_user.get("user_id"),
        role=current_user.get("role"),
        user_type=current_user.get("user_type"),
        email=email,
        name=name,
        is_active=True,  # If token is valid, user is active
        permissions=permissions
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint with clear instructions
    
    IMPROVEMENT: Better documentation for frontend developers
    """
    return {
        "message": "Successfully logged out",
        "instructions": [
            "Delete token from localStorage/sessionStorage",
            "Clear any cached user data",
            "Redirect to login page"
        ]
    }

@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Refresh JWT token - enhanced response
    
    IMPROVEMENT: Consistent response format with user info
    """
    # Create new token with updated permissions
    permissions = create_user_permissions(
        current_user.get("role"),
        current_user.get("user_type")
    )
    
    token_response = create_token_response(
        user_id=current_user.get("user_id"),
        role=current_user.get("role"),
        user_type=current_user.get("user_type")
    )
    
    return LoginResponse(
        access_token=token_response["access_token"],
        expires_in=token_response["expires_in"],
        user={
            "id": current_user.get("user_id"),
            "role": current_user.get("role"),
            "user_type": current_user.get("user_type"),
            "email": current_user.get("email", ""),
            "name": current_user.get("name", ""),
            "permissions": permissions
        }
    )

@router.post("/admin/register", response_model=AdminResponse)
async def register_admin(admin_data: AdminCreate):
    """
    Admin registration endpoint
    
    NOTE: In production, this should be protected or disabled after initial setup
    For now, it's open to create the first admin user
    
    Args:
        admin_data: AdminCreate model with admin information
        
    Returns:
        AdminResponse: Created admin information (no password)
        
    Raises:
        HTTPException: 400 if admin already exists or validation fails
    """
    admins_collection = get_admins_collection()
    
    try:
        # Check if admin with same username or email already exists
        existing_admin = await admins_collection.find_one({
            "$or": [
                {"username": admin_data.username},
                {"email": admin_data.email}
            ]
        })
        
        if existing_admin:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin with this username or email already exists"
            )
        
        # Validate password strength
        is_strong, message = validate_password_strength(admin_data.password)
        if not is_strong:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password validation failed: {message}"
            )
        
        # Generate admin_id (simple counter-based approach)
        admin_count = await admins_collection.count_documents({})
        admin_id = f"ADM{str(admin_count + 1).zfill(3)}"  # ADM001, ADM002, etc.
        
        # Hash the password
        hashed_password = hash_password(admin_data.password)
        
        # Create admin document for database
        admin_doc = {
            "admin_id": admin_id,
            "username": admin_data.username,
            "email": admin_data.email,
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into database
        result = await admins_collection.insert_one(admin_doc)
        
        # Fetch the created admin (to get the _id)
        created_admin = await admins_collection.find_one({"_id": result.inserted_id})
        
        # Convert to response model (excludes password)
        return AdminResponse(
            id=str(created_admin["_id"]),
            admin_id=created_admin["admin_id"],
            username=created_admin["username"],
            email=created_admin["email"],
            created_at=created_admin["created_at"],
            is_active=created_admin["is_active"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create admin account"
        )

@router.post("/employee/register", response_model=EmployeeResponse)
async def register_employee(employee_data: EmployeeCreate):
    """
    Employee self-registration endpoint
    
    Allows employees to register themselves with their credentials
    They can then login using their email and password
    
    Args:
        employee_data: EmployeeCreate model with employee information
        
    Returns:
        EmployeeResponse: Created employee information (no password)
        
    Raises:
        HTTPException: 400 if employee already exists or validation fails
    """
    employees_collection = get_employees_collection()
    
    try:
        print(f"🔍 DEBUG: Registration attempt for email: {employee_data.email}")
        
        # Check if employee with same email already exists
        existing_employee = await employees_collection.find_one({
            "email": employee_data.email
        })
        
        if existing_employee:
            print(f"❌ DEBUG: Employee already exists with email: {employee_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee with this email already exists"
            )
        
        # Validate password strength
        is_strong, message = validate_password_strength(employee_data.password)
        if not is_strong:
            print(f"❌ DEBUG: Password validation failed: {message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Password validation failed: {message}"
            )
        
        print(f"✅ DEBUG: Password validation passed")
        
        # Generate emp_id (simple counter-based approach)
        employee_count = await employees_collection.count_documents({})
        emp_id = f"EMP{str(employee_count + 1).zfill(3)}"  # EMP001, EMP002, etc.
        
        print(f"✅ DEBUG: Generated employee ID: {emp_id}")
        
        # Hash the password
        hashed_password = hash_password(employee_data.password)
        print(f"✅ DEBUG: Password hashed: {hashed_password[:20]}...")
        
        # Create employee document for database
        employee_doc = {
            "emp_id": emp_id,
            "name": employee_data.name,
            "email": employee_data.email,
            "department": employee_data.department,
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert into database
        result = await employees_collection.insert_one(employee_doc)
        print(f"✅ DEBUG: Employee inserted with ID: {result.inserted_id}")
        
        # Fetch the created employee (to get the _id)
        created_employee = await employees_collection.find_one({"_id": result.inserted_id})
        
        print(f"✅ DEBUG: Employee registration successful - ID: {emp_id}, Email: {employee_data.email}")
        
        # Convert to response model (excludes password)
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

@router.get("/setup/check")
async def check_setup_status():
    """
    Check if initial setup is needed
    
    Returns information about whether any admin accounts exist
    Useful for frontend to know if initial admin registration is needed
    
    Returns:
        dict: Setup status information
    """
    admins_collection = get_admins_collection()
    employees_collection = get_employees_collection()
    
    admin_count = await admins_collection.count_documents({})
    employee_count = await employees_collection.count_documents({})
    
    return {
        "needs_initial_setup": admin_count == 0,
        "admin_count": admin_count,
        "employee_count": employee_count,
        "setup_complete": admin_count > 0
    }