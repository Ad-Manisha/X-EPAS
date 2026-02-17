import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors (e.g., token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  adminLogin: (identifier, password) =>
    api.post('/auth/admin/login', { identifier, password }),

  employeeLogin: (identifier, password) =>
    api.post('/auth/employee/login', { identifier, password }),

  adminRegister: (data) =>
    api.post('/auth/admin/register', data),

  employeeRegister: (data) =>
    api.post('/auth/employee/register', data),

  logout: () =>
    api.post('/auth/logout'),

  getCurrentUser: () =>
    api.get('/auth/me'),

  refreshToken: () =>
    api.post('/auth/refresh'),

  checkSetup: () =>
    api.get('/auth/setup/check'),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () =>
    api.get('/admin/dashboard/stats'),

  // Employee management
  getEmployees: () =>
    api.get('/admin/employees'),

  // Project management
  getProjects: () =>
    api.get('/admin/projects'),

  createProject: (data) =>
    api.post('/admin/projects', data),

  assignEmployeesToProject: (projectId, employeeIds) =>
    api.post(`/admin/projects/${projectId}/assign-employees`, { employee_ids: employeeIds }),

  // Task management
  getProjectTasks: (projectId) =>
    api.get(`/admin/projects/${projectId}/tasks`),

  createTask: (projectId, data) =>
    api.post(`/admin/projects/${projectId}/tasks`, data),

  updateTask: (taskId, data) =>
    api.put(`/admin/tasks/${taskId}`, data),

  deleteTask: (taskId) =>
    api.delete(`/admin/tasks/${taskId}`),

  assignTask: (taskId, employeeId) =>
    api.post(`/admin/tasks/${taskId}/assign`, { employee_id: employeeId }),

  getTaskDetails: (taskId) =>
    api.get(`/admin/tasks/${taskId}`),

  getProjectDetails: (projectId) =>
    api.get(`/admin/projects/${projectId}`),

  getEmployeeDetails: (employeeId) =>
    api.get(`/admin/employees/${employeeId}`),

  // Department performance analytics
  getDepartmentPerformance: (department) =>
    api.get(`/admin/departments/${encodeURIComponent(department)}/performance`),

  // Employee reviews (based on task evaluations)
  getEmployeeReviews: () =>
    api.get('/admin/reviews'),

  // Overall performance analytics (all departments)
  getAllPerformance: () =>
    api.get('/admin/performance'),

  // Analytics dashboard
  getAnalytics: () =>
    api.get('/admin/analytics'),
};

// Employee API
export const employeeAPI = {
  getTasks: () =>
    api.get('/employee/tasks'),

  getTaskDetails: (taskId) =>
    api.get(`/employee/tasks/${taskId}`),

  submitTask: (taskId, githubLink) =>
    api.post(`/employee/tasks/${taskId}/submit`, { github_link: githubLink }),

  // Department performance (employee's own department)
  getDepartmentPerformance: () =>
    api.get('/employee/department/performance'),
};

// GitHub PR Review API
export const githubAPI = {
  getPRFiles: (githubLink) =>
    api.post('/github/pr/files', { github_link: githubLink }),

  evaluateAndComment: (githubLink) =>
    api.post('/github/pr/evaluate-and-comment', { github_link: githubLink }),
};

export default api;
