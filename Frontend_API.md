# Frontend API Endpoints

**Base URL:** `http://localhost:8000`

---

## Authentication Endpoints

### Admin Login
**POST** `/auth/admin/login`

**Request:**
```json
{
  "identifier": "admin",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "ADM001",
    "role": "admin",
    "user_type": "admin",
    "email": "admin@company.com",
    "name": "admin",
    "permissions": ["read:all_users", "write:all_users"]
  }
}
```

---

### Employee Login
**POST** `/auth/employee/login`

**Request:**
```json
{
  "identifier": "john@company.com",
  "password": "EmployeePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": "EMP001",
    "role": "employee",
    "user_type": "employee",
    "email": "john@company.com",
    "name": "John Doe",
    "permissions": ["read:own_profile", "write:task_submissions"]
  }
}
```

---

### Admin Registration (Initial Setup)
**POST** `/auth/admin/register`

**Request:**
```json
{
  "username": "admin",
  "email": "admin@company.com",
  "password": "AdminPass123!"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "admin_id": "ADM001",
  "username": "admin",
  "email": "admin@company.com",
  "created_at": "2024-01-24T10:30:00Z",
  "is_active": true
}
```

---

### Employee Registration (Admin Only)
**POST** `/auth/employee/register`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "department": "Engineering",
  "password": "EmployeePass123!"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "emp_id": "EMP001",
  "name": "John Doe",
  "email": "john@company.com",
  "department": "Engineering",
  "created_at": "2024-01-24T10:35:00Z",
  "is_active": true
}
```

---

### Get Current User
**GET** `/auth/me`  
**Authorization:** `Bearer <token>`

**Response:**
```json
{
  "user_id": "EMP001",
  "role": "employee",
  "user_type": "employee",
  "email": "john@company.com",
  "name": "John Doe",
  "is_active": true,
  "permissions": ["read:own_profile", "write:task_submissions"]
}
```

---

### Refresh Token
**POST** `/auth/refresh`  
**Authorization:** `Bearer <token>`

**Response:** Same as login response with new token

---

### Logout
**POST** `/auth/logout`

**Response:**
```json
{
  "message": "Successfully logged out"
}
```

---

## System Endpoints

### Setup Status
**GET** `/auth/setup/check`

**Response:**
```json
{
  "needs_initial_setup": false,
  "admin_count": 1,
  "employee_count": 2,
  "setup_complete": true
}
```

---

### Health Check
**GET** `/health`

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "database_name": "xepas_db"
}
```

---

## Error Responses

**Format:**
```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Unprocessable Entity (Invalid data format)
- `500` - Server Error

---

## Admin Management Endpoints

### Create Employee
**POST** `/admin/employees`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "department": "frontend",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439013",
  "emp_id": "EMP002",
  "name": "Jane Smith",
  "email": "jane@company.com",
  "department": "frontend",
  "created_at": "2024-01-24T11:00:00Z",
  "is_active": true
}
```

---

### Get All Employees
**GET** `/admin/employees`  
**Authorization:** `Bearer <admin_token>`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439012",
    "emp_id": "EMP001",
    "name": "John Doe",
    "email": "john@company.com",
    "department": "backend",
    "is_active": true
  },
  {
    "id": "507f1f77bcf86cd799439013",
    "emp_id": "EMP002",
    "name": "Jane Smith",
    "email": "jane@company.com",
    "department": "frontend",
    "is_active": true
  }
]
```

---

### Create Project
**POST** `/admin/projects`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "name": "E-Commerce Platform",
  "description": "Build a full-stack e-commerce platform with React frontend and FastAPI backend",
  "status": "active"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "project_id": "PRJ001",
  "name": "E-Commerce Platform",
  "description": "Build a full-stack e-commerce platform with React frontend and FastAPI backend",
  "status": "active",
  "employees": [],
  "completion_percentage": 0.0,
  "created_at": "2024-01-24T11:15:00Z",
  "created_by": "ADM001"
}
```

---

### Assign Employees to Project
**POST** `/admin/projects/{project_id}/assign-employees`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "employee_ids": ["EMP001", "EMP002"]
}
```

**Response:**
```json
{
  "message": "Employees assigned successfully",
  "project_id": "PRJ001",
  "assigned_employees": ["EMP001", "EMP002"],
  "employee_count": 2
}
```

---

### Get All Projects
**GET** `/admin/projects`  
**Authorization:** `Bearer <admin_token>`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439014",
    "project_id": "PRJ001",
    "name": "E-Commerce Platform",
    "description": "Build a full-stack e-commerce platform",
    "status": "active",
    "employees": ["EMP001", "EMP002"],
    "completion_percentage": 25.0,
    "created_at": "2024-01-24T11:15:00Z",
    "created_by": "ADM001"
  }
]
```

---

## Task Management Endpoints

### Create Task in Project
**POST** `/admin/projects/{project_id}/tasks`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "title": "Implement User Authentication API",
  "description": "Create JWT-based authentication system with login, logout, and token refresh functionality. Include password hashing, input validation, and proper error handling. The API should follow REST conventions and return appropriate HTTP status codes. This description will be used by AI for evaluation context.",
  "deadline": "2024-02-15",
  "department": "backend"
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "task_id": "TSK001",
  "title": "Implement User Authentication API",
  "description": "Create JWT-based authentication system with login, logout, and token refresh functionality...",
  "deadline": "2024-02-15T00:00:00Z",
  "department": "backend",
  "project_id": "PRJ001",
  "assigned_to": null,
  "status": "assigned",
  "github_link": null,
  "submission_date": null,
  "score": null,
  "feedback": null,
  "evaluated_at": null,
  "created_at": "2024-01-24T11:30:00Z",
  "created_by": "ADM001"
}
```

---

### Assign Task to Employee
**POST** `/admin/tasks/{task_id}/assign`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "employee_id": "EMP001"
}
```

**Response:**
```json
{
  "message": "Task assigned successfully",
  "task_id": "TSK001",
  "assigned_to": "EMP001",
  "employee_name": "John Doe",
  "employee_department": "backend",
  "task_department": "backend"
}
```

**Response (with department mismatch warning):**
```json
{
  "message": "Task assigned successfully",
  "task_id": "TSK001",
  "assigned_to": "EMP002",
  "employee_name": "Jane Smith",
  "employee_department": "frontend",
  "task_department": "backend",
  "warning": "Department mismatch: Employee is in frontend, task is for backend"
}
```

---

### Get Project Tasks
**GET** `/admin/projects/{project_id}/tasks`  
**Authorization:** `Bearer <admin_token>`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439015",
    "task_id": "TSK001",
    "title": "Implement User Authentication API",
    "deadline": "2024-02-15",
    "status": "assigned",
    "assigned_to": "EMP001",
    "score": null
  },
  {
    "id": "507f1f77bcf86cd799439016",
    "task_id": "TSK002",
    "title": "Create React Login Component",
    "deadline": "2024-02-18",
    "status": "submitted",
    "assigned_to": "EMP002",
    "score": 87.5
  }
]
```

---

### Get Task Details
**GET** `/admin/tasks/{task_id}`  
**Authorization:** `Bearer <admin_token>`

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "task_id": "TSK001",
  "title": "Implement User Authentication API",
  "description": "Create JWT-based authentication system with login, logout, and token refresh functionality...",
  "deadline": "2024-02-15T00:00:00Z",
  "department": "backend",
  "project_id": "PRJ001",
  "assigned_to": "EMP001",
  "status": "submitted",
  "github_link": "https://github.com/johndoe/auth-api",
  "submission_date": "2024-02-10T14:30:00Z",
  "score": 92.0,
  "feedback": "Excellent implementation with comprehensive error handling and security best practices. Consider adding rate limiting for production use.",
  "evaluated_at": "2024-02-10T16:45:00Z",
  "created_at": "2024-01-24T11:30:00Z",
  "created_by": "ADM001"
}
```

---

### Update Task
**PUT** `/admin/tasks/{task_id}`  
**Authorization:** `Bearer <admin_token>`

**Request:**
```json
{
  "title": "Updated Task Title",
  "description": "Updated task description with more specific requirements for AI evaluation",
  "deadline": "2024-02-20",
  "department": "backend"
}
```

**Response:** Same as Get Task Details with updated information

---

## Employee Endpoints

### Get Employee Profile
**GET** `/auth/me`

**Authorization:** `Bearer <employee_token>`

**Response:**
```json
{
  "user_id": "EMP001",
  "role": "employee",
  "user_type": "employee",
  "email": "john@company.com",
  "name": "John Doe",
  "is_active": true,
  "permissions": ["read:own_profile", "write:task_submissions"]
}
```

---

### Get Assigned Tasks
**GET** `/employee/tasks`

**Authorization:** `Bearer <employee_token>`

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439015",
    "task_id": "TSK001",
    "title": "Implement User Authentication API",
    "description": "Create JWT-based authentication system with login, logout, and token refresh functionality. Include password hashing, input validation, and proper error handling.",
    "deadline": "2024-02-15T00:00:00Z",
    "status": "assigned",
    "github_link": null,
    "submission_date": null,
    "score": null,
    "feedback": null
  },
  {
    "id": "507f1f77bcf86cd799439016",
    "task_id": "TSK002",
    "title": "Create React Login Component",
    "description": "Build a responsive login form component with validation and error handling.",
    "deadline": "2024-02-18T00:00:00Z",
    "status": "submitted",
    "github_link": "https://github.com/employee/login-component",
    "submission_date": "2024-02-10T14:30:00Z",
    "score": 87.5,
    "feedback": "Good implementation with clean code structure. Consider adding more error handling."
  }
]
```

---

### Get Task Details
**GET** `/employee/tasks/{task_id}`

**Authorization:** `Bearer <employee_token>`

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439015",
  "task_id": "TSK001",
  "title": "Implement User Authentication API",
  "description": "Create JWT-based authentication system with login, logout, and token refresh functionality. Include password hashing, input validation, and proper error handling. The API should follow REST conventions and return appropriate HTTP status codes.",
  "deadline": "2024-02-15T00:00:00Z",
  "status": "assigned",
  "github_link": null,
  "submission_date": null,
  "score": null,
  "feedback": null
}
```

---

### Submit Task
**POST** `/employee/tasks/{task_id}/submit`

**Authorization:** `Bearer <employee_token>`

**Request:**
```json
{
  "github_link": "https://github.com/employee/auth-api-project"
}
```

**Response:**
```json
{
  "message": "Task submitted successfully!",
  "task_id": "TSK001",
  "github_link": "https://github.com/employee/auth-api-project",
  "submission_date": "2024-01-25T10:30:00Z",
  "status": "submitted",
  "next_steps": [
    "Your submission has been recorded",
    "AI system will evaluate your GitHub repository",
    "You will receive feedback and score once evaluation is complete",
    "Check back later for evaluation results"
  ]
}
```

**Error Response (Resubmission Attempt):**
```json
{
  "detail": "Task TSK001 is already submitted. Current status: submitted. Resubmission not allowed."
}
```

---
## Important Notes for Frontend Team

### Authentication Flow
1. **Admin Login** → Get admin token → Access all admin endpoints
2. **Employee Login** → Get employee token → Access employee-specific endpoints
3. **Token Expiry** → Use refresh endpoint or re-login

### Task Workflow
1. Admin creates project → Assigns employees to project
2. Admin creates tasks in project → Assigns tasks to employees
3. Employee views assigned tasks → Submits GitHub URL ✅ **IMPLEMENTED**
4. AI evaluates submission → Results stored in backend
5. Admin/Employee views evaluation results

### Employee Frontend Integration Example
```javascript
// 1. Employee Login
const loginResponse = await fetch('/auth/employee/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        identifier: 'john@company.com',
        password: 'password123'
    })
});
const { access_token } = await loginResponse.json();

// 2. Get Employee Profile
const profileResponse = await fetch('/auth/me', {
    headers: { 'Authorization': `Bearer ${access_token}` }
});
const profile = await profileResponse.json();

// 3. Get Assigned Tasks
const tasksResponse = await fetch('/employee/tasks', {
    headers: { 'Authorization': `Bearer ${access_token}` }
});
const tasks = await tasksResponse.json();

// 4. Submit Task
const submitResponse = await fetch(`/employee/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        github_link: 'https://github.com/employee/project-repo'
    })
});
const result = await submitResponse.json();
```

### Key Fields for AI Context
- **Task Description**: Critical for AI evaluation - should be detailed and specific
- **Department**: Helps AI understand the context (frontend/backend/AI)
- **GitHub Link**: Employee submission for AI evaluation

### Department Values
- `"frontend"` - React/UI development tasks
- `"backend"` - API/server development tasks
- `"AI"` - Machine learning/AI development tasks

---


**Interactive Documentation:** http://localhost:8000/docs