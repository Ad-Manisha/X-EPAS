# AI Integration Guide for X-EPAS

**Performance Management System - AI Evaluation Module**

---

## **Overview**

This guide provides complete technical documentation for integrating AI evaluation capabilities into the X-EPAS system. The frontend and backend are fully implemented up to the point where employees submit GitHub pull request URLs. Your AI module will handle evaluation and scoring from this point forward.

---

## **System Architecture**

```
Employee Submits GitHub PR URL → Backend Stores Submission → AI Evaluates → AI Updates Database → Frontend Shows Results
```

### **Current Implementation Status**

- ✅ **Frontend**: Complete (React + Tailwind CSS)
- ✅ **Backend**: Complete (FastAPI + MongoDB)
- ✅ **Authentication**: JWT-based role system
- ✅ **Task Submission**: GitHub PR URL validation & storage
- 🔄 **AI Evaluation**: **YOUR INTEGRATION POINT**
- 🔄 **Score Display**: Ready for your data

---

## **Backend Integration Points**

### **1. Database Schema**

#### **Tasks Collection Structure**

```javascript
{
  "_id": ObjectId("..."),
  "task_id": "TSK001",
  "title": "Implement user authentication",
  "description": "Build JWT-based auth system...",
  "project_id": "PRJ001",
  "assigned_to": "EMP001",
  "department": "Backend",
  "status": "submitted",  // ← AI should update this
  "deadline": "2024-02-15",
  "created_at": "2024-01-15T10:00:00Z",
  "github_link": "https://github.com/user/repo/pull/123",  // ← AI input
  "submitted_at": "2024-01-20T14:30:00Z",

  // ← AI should populate these fields:
  "ai_evaluation": {
    "score": 85,  // 0-100
    "feedback": "Excellent implementation with proper error handling...",
    "strengths": ["Clean code", "Good documentation", "Proper testing"],
    "improvements": ["Add more edge case handling"],
    "evaluated_at": "2024-01-20T15:00:00Z",
    "evaluation_criteria": {
      "code_quality": 90,
      "functionality": 85,
      "documentation": 80,
      "testing": 75,
      "best_practices": 88
    }
  }
}
```

### **2. Task Status Flow**

```
"assigned" → "in_progress" → "submitted" → "evaluated" → "completed"
                                    ↑           ↑
                              Employee    AI Updates
```

### **3. API Endpoints for AI Integration**

#### **Get Submitted Tasks (for AI processing)**

```http
GET /admin/tasks?status=submitted
Authorization: Bearer <admin_jwt_token>
```

**Response:**

```json
{
  "data": [
    {
      "task_id": "TSK001",
      "github_link": "https://github.com/user/repo/pull/123",
      "title": "Task title",
      "description": "Task description",
      "department": "Backend",
      "assigned_to": "EMP001",
      "submitted_at": "2024-01-20T14:30:00Z"
    }
  ]
}
```

#### **Submit AI Evaluation Results**

```http
POST /admin/tasks/{task_id}/evaluate
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "score": 85,
  "feedback": "Excellent implementation with proper error handling and clean code structure. The authentication system is well-designed and follows security best practices.",
  "strengths": [
    "Clean and readable code",
    "Comprehensive error handling",
    "Good documentation",
    "Proper security implementation"
  ],
  "improvements": [
    "Add more unit tests for edge cases",
    "Consider implementing rate limiting"
  ],
  "evaluation_criteria": {
    "code_quality": 90,
    "functionality": 85,
    "documentation": 80,
    "testing": 75,
    "best_practices": 88
  }
}
```

### **4. Database Connection Details**

#### **MongoDB Connection**

```python
# Database configuration (backend/database.py)
MONGODB_URL = "mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER_URL>/<DB_NAME>"
DATABASE_NAME = "xepas"
TASKS_COLLECTION = "tasks"
```

#### **Required Collections**

- `tasks` - Main task data with submissions and evaluations
- `employees` - Employee information
- `projects` - Project details
- `admins` - Admin user accounts

---

## 🎨 **Frontend Integration Points**

### **1. Task Status Display**

The frontend automatically updates based on task status:

- **"submitted"** → Shows "Pending AI Evaluation"
- **"evaluated"** → Shows AI scores and feedback
- **"completed"** → Shows final completion status

### **2. Score Display Components**

#### **Employee Dashboard** (`frontend/src/pages/EmployeeDashboard.jsx`)

```jsx
// Displays AI evaluation results
{
  task.ai_evaluation && (
    <div className="mt-3 p-3 bg-green-50 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-green-800">
          Score: {task.ai_evaluation.score}/100
        </span>
        <span className="text-xs text-green-600">
          Evaluated{" "}
          {new Date(task.ai_evaluation.evaluated_at).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-green-700 mt-1">
        {task.ai_evaluation.feedback}
      </p>
    </div>
  );
}
```

#### **Admin Task Details** (`frontend/src/pages/TaskDetails.jsx`)

```jsx
// Shows detailed evaluation breakdown
{
  task.ai_evaluation && (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">AI Evaluation Results</h3>

      {/* Overall Score */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Overall Score</span>
          <span className="text-2xl font-bold text-blue-600">
            {task.ai_evaluation.score}/100
          </span>
        </div>
      </div>

      {/* Detailed Criteria Scores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {Object.entries(task.ai_evaluation.evaluation_criteria).map(
          ([key, value]) => (
            <div key={key} className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium capitalize">
                {key.replace("_", " ")}
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {value}/100
              </div>
            </div>
          )
        )}
      </div>

      {/* Feedback */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Feedback</h4>
        <p className="text-gray-700">{task.ai_evaluation.feedback}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 text-green-600">Strengths</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {task.ai_evaluation.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2 text-orange-600">
            Areas for Improvement
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {task.ai_evaluation.improvements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔐 **Authentication for AI Module**

### **Admin JWT Token**

Your AI module needs admin-level access to read submitted tasks and update evaluations.

#### **Get Admin Token**

```http
POST /auth/admin/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "admin123"
}
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

#### **Use Token in Requests**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 **AI Integration Workflow**

### **Step-by-Step Process**

1. **Monitor for New Submissions**

   ```python
   # Poll for tasks with status "submitted"
   submitted_tasks = get_submitted_tasks()
   ```

2. **Extract GitHub PR Information**

   ```python
   github_url = task["github_link"]
   # Parse: https://github.com/owner/repo/pull/123
   owner, repo, pr_number = parse_github_url(github_url)
   ```

3. **Fetch PR Content**

   ```python
   # Use GitHub API to get PR details, files, commits
   pr_data = github_api.get_pull_request(owner, repo, pr_number)
   files_changed = github_api.get_pr_files(owner, repo, pr_number)
   ```

4. **Evaluate Code**

   ```python
   # Your AI evaluation logic here
   evaluation_result = ai_evaluate_code(
       task_description=task["description"],
       pr_data=pr_data,
       files_changed=files_changed
   )
   ```

5. **Submit Results**
   ```python
   # Update task with evaluation results
   submit_evaluation(task["task_id"], evaluation_result)
   ```

### **Sample AI Integration Script**

```python
import requests
import time
from datetime import datetime

class AIEvaluator:
    def __init__(self, backend_url, admin_token):
        self.backend_url = backend_url
        self.headers = {"Authorization": f"Bearer {admin_token}"}

    def get_submitted_tasks(self):
        response = requests.get(
            f"{self.backend_url}/admin/tasks?status=submitted",
            headers=self.headers
        )
        return response.json()["data"]

    def submit_evaluation(self, task_id, evaluation):
        response = requests.post(
            f"{self.backend_url}/admin/tasks/{task_id}/evaluate",
            headers=self.headers,
            json=evaluation
        )
        return response.json()

    def evaluate_task(self, task):
        # Your AI evaluation logic here
        github_url = task["github_link"]

        # Analyze the GitHub PR
        evaluation = {
            "score": 85,  # Your calculated score
            "feedback": "Your AI-generated feedback",
            "strengths": ["List of strengths"],
            "improvements": ["List of improvements"],
            "evaluation_criteria": {
                "code_quality": 90,
                "functionality": 85,
                "documentation": 80,
                "testing": 75,
                "best_practices": 88
            }
        }

        return evaluation

    def run_evaluation_loop(self):
        while True:
            try:
                tasks = self.get_submitted_tasks()
                for task in tasks:
                    evaluation = self.evaluate_task(task)
                    self.submit_evaluation(task["task_id"], evaluation)
                    print(f"Evaluated task {task['task_id']}")

                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(60)

# Usage
evaluator = AIEvaluator("http://localhost:8000", "your_admin_token")
evaluator.run_evaluation_loop()
```

---

## 📊 **Data Models Reference**

### **TaskSubmission Model** (Input)

```python
class TaskSubmission(BaseModel):
    github_link: HttpUrl  # Validated GitHub PR URL
```

### **AIEvaluationResult Model** (Output)

```python
class AIEvaluationResult(BaseModel):
    score: int = Field(..., ge=0, le=100)
    feedback: str = Field(..., min_length=10)
    strengths: List[str] = Field(..., min_items=1)
    improvements: List[str] = Field(..., min_items=1)
    evaluation_criteria: Dict[str, int] = Field(...)

    class Config:
        json_schema_extra = {
            "example": {
                "score": 85,
                "feedback": "Excellent implementation...",
                "strengths": ["Clean code", "Good documentation"],
                "improvements": ["Add more tests"],
                "evaluation_criteria": {
                    "code_quality": 90,
                    "functionality": 85,
                    "documentation": 80,
                    "testing": 75,
                    "best_practices": 88
                }
            }
        }
```

---

## 🔍 **Testing & Debugging**

### **Test Data Creation**

1. Login as admin: `admin` / `admin123`
2. Create a test employee
3. Create a test project
4. Assign a task to the employee
5. Login as employee and submit a GitHub PR URL
6. Task will be in "submitted" status, ready for AI evaluation

### **API Testing**

```bash
# Get submitted tasks
curl -X GET "http://localhost:8000/admin/tasks?status=submitted" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit evaluation
curl -X POST "http://localhost:8000/admin/tasks/TSK001/evaluate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 85,
    "feedback": "Great work!",
    "strengths": ["Clean code"],
    "improvements": ["Add tests"],
    "evaluation_criteria": {
      "code_quality": 90,
      "functionality": 85,
      "documentation": 80,
      "testing": 75,
      "best_practices": 88
    }
  }'
```

---

## 🚨 **Important Notes**

### **GitHub PR URL Format**

- **Required Format**: `https://github.com/owner/repo/pull/number`
- **Validation**: Both frontend and backend validate this format
- **Examples**:
  - ✅ `https://github.com/john/my-project/pull/123`
  - ❌ `https://github.com/john/my-project` (missing /pull/number)

### **Task Status Management**

- Only update tasks with status "submitted"
- Change status to "evaluated" after AI processing
- Frontend automatically reflects status changes

### **Error Handling**

- Handle GitHub API rate limits
- Gracefully handle invalid/deleted PRs
- Log all evaluation attempts for debugging

### **Performance Considerations**

- Implement queuing for multiple simultaneous evaluations
- Cache GitHub API responses when possible
- Use async processing for large PRs

---

## 📞 **Support & Contact**

If you need clarification on any integration points or encounter issues:

1. **Database Schema**: Check `backend/models/task.py`
2. **API Endpoints**: Check `backend/routes/admin.py` and `backend/routes/employee.py`
3. **Frontend Components**: Check `frontend/src/pages/` for UI integration points
4. **Authentication**: Check `backend/auth/` for JWT implementation

---

## 🎯 **Success Criteria**

Your AI integration is successful when:

- ✅ AI can fetch submitted tasks from the API
- ✅ AI can analyze GitHub PR content
- ✅ AI can submit evaluation results back to the system
- ✅ Frontend displays AI scores and feedback correctly
- ✅ Task status updates from "submitted" to "evaluated"
- ✅ Employees can see their evaluation results

---
