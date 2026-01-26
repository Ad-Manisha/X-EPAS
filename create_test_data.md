# Create Test Data for Employee Dashboard

## Step 1: Login as Admin
1. Go to `http://localhost:5173/login`
2. Select "Admin" 
3. Login with admin credentials

## Step 2: Create a Project
1. Go to "Projects" page
2. Click "Create Project"
3. Fill in:
   - **Name**: "Employee Test Project"
   - **Description**: "Test project for employee dashboard"
   - **Department**: "Backend" (or whatever department your employee is in)
4. Click "Create Project"

## Step 3: Assign Employee to Project
1. In the project you just created, click "Assign Team"
2. Select your employee (EMP003)
3. Click "Assign Selected"

## Step 4: Create Tasks
1. In the same project, click "Create & Assign Task"
2. Create a task:
   - **Title**: "Setup Database Connection"
   - **Description**: "Create a MongoDB connection for the application"
   - **Department**: "Backend"
   - **Deadline**: Pick a future date
3. **Assign to Employee**: Select your employee (EMP003)
4. Click "Create & Assign Task"

## Step 5: Create More Tasks (Optional)
Repeat Step 4 to create more tasks like:
- "Implement User Authentication"
- "Create API Endpoints"
- "Write Unit Tests"

## Step 6: Test Employee Dashboard
1. Logout from admin
2. Login as employee (EMP003)
3. Go to employee dashboard
4. You should now see:
   - Tasks with proper Project and Department values
   - "View Details" should work
   - "Submit Work" should be available for assigned tasks

## Expected Result
After following these steps, your employee dashboard should show:
- Project: "Employee Test Project" 
- Department: "Backend"
- Due dates with proper urgency indicators
- Working "View Details" buttons