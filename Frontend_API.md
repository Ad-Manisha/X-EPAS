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
- `500` - Server Error

---

**Interactive Documentation:** http://localhost:8000/docs