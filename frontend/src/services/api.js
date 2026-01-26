import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  // Login endpoints
  adminLogin: (identifier, password) =>
    api.post('/auth/admin/login', { identifier, password }),
  
  employeeLogin: (identifier, password) =>
    api.post('/auth/employee/login', { identifier, password }),
  
  // User management
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  
  // Registration (admin only for employee registration)
  registerAdmin: (data) => api.post('/auth/admin/register', data),
  registerEmployee: (data) => api.post('/auth/employee/register', data),
  
  // System setup
  checkSetupStatus: () => api.get('/auth/setup/check'),
};

// Admin Management APIs
export const adminAPI = {
  // Dashboard Statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Employee Management
  getEmployees: () => api.get('/admin/employees'),
  createEmployee: (data) => api.post('/admin/employees', data),
  
  // Project Management
  getProjects: () => api.get('/admin/projects'),
  createProject: (data) => api.post('/admin/projects', data),
  assignEmployeesToProject: (projectId, employeeIds) =>
    api.post(`/admin/projects/${projectId}/assign-employees`, { employee_ids: employeeIds }),
  
  // Task Management
  createTask: (projectId, taskData) =>
    api.post(`/admin/projects/${projectId}/tasks`, taskData),
  assignTask: (taskId, employeeId) =>
    api.post(`/admin/tasks/${taskId}/assign`, { employee_id: employeeId }),
  getProjectTasks: (projectId) =>
    api.get(`/admin/projects/${projectId}/tasks`),
  getTaskDetails: (taskId) =>
    api.get(`/admin/tasks/${taskId}`),
  updateTask: (taskId, data) =>
    api.put(`/admin/tasks/${taskId}`, data),
};

// Employee APIs
export const employeeAPI = {
  // Task Management
  getTasks: () => api.get('/employee/tasks'),
  getTaskDetails: (taskId) => api.get(`/employee/tasks/${taskId}`),
  submitTask: (taskId, githubLink) =>
    api.post(`/employee/tasks/${taskId}/submit`, { github_link: githubLink }),
};

// System APIs
export const systemAPI = {
  healthCheck: () => api.get('/health'),
  getApiInfo: () => api.get('/api/v1/info'),
  getRoot: () => api.get('/'),
};

export default api;
