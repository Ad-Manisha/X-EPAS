import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import AssignTask from './pages/AssignTask';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import TaskDetails from './pages/TaskDetails';
import SimpleTaskDetails from './pages/SimpleTaskDetails';
import Performance from './pages/Performance';
import Analytics from './pages/Analytics';
import Reviews from './pages/Reviews';
import EmployeePerformance from './pages/EmployeePerformance';
import DashboardLayout from './components/DashboardLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />

        {/* --- ADMIN ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          {/* The Layout wraps all Admin-specific sub-pages */}
          <Route element={<DashboardLayout role="admin" />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/assign-task" element={<AssignTask />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetails />} />
            <Route path="/task-details/:taskId" element={<TaskDetails />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reviews" element={<Reviews />} />
          </Route>
        </Route>

        {/* --- EMPLOYEE ONLY ROUTES --- */}
        <Route element={<ProtectedRoute allowedRole="employee" />}>
          {/* Wrap all employee pages in the SAME Layout instance */}
          <Route element={<DashboardLayout role="employee" />}>
            <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee-performance" element={<EmployeePerformance />} />
            <Route path="/employee/task-details/:taskId" element={<TaskDetails />} />
          </Route>
        </Route>

        {/* --- 404 & FALLBACK --- */}
        <Route path="*" element={
          <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="text-center">
              <h1 className="text-4xl font-black text-slate-900">404</h1>
              <p className="text-slate-500">Page Not Found</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Return to Login
              </button>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
