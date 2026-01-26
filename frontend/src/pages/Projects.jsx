import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Form state for creating new project
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning'
  });

  // Assignment form state
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsResponse, employeesResponse] = await Promise.all([
        adminAPI.getProjects(),
        adminAPI.getEmployees()
      ]);
      
      setProjects(projectsResponse.data);
      setEmployees(employeesResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      await adminAPI.createProject(formData);
      
      // Reset form and close modal
      setFormData({ name: '', description: '', status: 'active' });
      setShowCreateForm(false);
      
      // Refresh projects list
      await fetchData();
      
    } catch (err) {
      setError('Failed to create project: ' + (err.response?.data?.detail || err.message));
      console.error('Create project error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignEmployees = async (e) => {
    e.preventDefault();
    if (!selectedProject || selectedEmployees.length === 0) return;

    try {
      setCreateLoading(true);
      await adminAPI.assignEmployeesToProject(selectedProject.project_id, selectedEmployees);
      
      // Reset and close modal
      setSelectedEmployees([]);
      setShowAssignForm(false);
      setSelectedProject(null);
      
      // Refresh projects list
      await fetchData();
      
    } catch (err) {
      setError('Failed to assign employees: ' + (err.response?.data?.detail || err.message));
      console.error('Assign employees error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmployeeSelection = (empId) => {
    setSelectedEmployees(prev => 
      prev.includes(empId) 
        ? prev.filter(id => id !== empId)
        : [...prev, empId]
    );
  };

  const openAssignModal = (project) => {
    setSelectedProject(project);
    setSelectedEmployees(project.employees || []);
    setShowAssignForm(true);
  };

  const handleViewTasks = (project) => {
    navigate(`/projects/${project.project_id}`);
  };

  // Enhanced status styling - simplified for clean look
  const getStatusStyle = (status) => {
    switch (status) {
      case 'in_progress':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: '🟢'
        };
      case 'completed':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '✅'
        };
      case 'planning':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: '📋'
        };
      case 'on_hold':
        return {
          badge: 'bg-red-100 text-red-800 border-red-200',
          icon: '⏸️'
        };
      case 'cancelled':
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❌'
        };
      default:
        return {
          badge: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Clean Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Projects</h1>
            <p className="text-gray-600">Manage your projects and teams</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Project</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-red-600 hover:text-red-800 text-lg font-bold"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const statusStyle = getStatusStyle(project.status);
            
            return (
              <div 
                key={project.id} 
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">{project.project_id}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${statusStyle.badge} ml-3 flex-shrink-0`}>
                    <span className="mr-1">{statusStyle.icon}</span>
                    {project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1)}
                  </span>
                </div>

                {/* Project Description */}
                <div className="mb-6">
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                </div>

                {/* Project Stats - Simplified */}
                <div className="flex items-center justify-between mb-4 py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {project.employees?.length || 0} members
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                      {project.completion_percentage}% complete
                    </span>
                  </div>
                </div>

                {/* Progress Bar - Refined */}
                <div className="mb-6">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${project.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Buttons - Simplified */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => openAssignModal(project)}
                    className="flex-1 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span>Team</span>
                  </button>
                  <button 
                    onClick={() => handleViewTasks(project)}
                    className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Tasks</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State - Enhanced */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">Get started by creating your first project to organize your team's work.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            >
              Create your first project
            </button>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
              {/* Modal Header */}
              <div className="bg-blue-600 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Create New Project</h2>
                    <p className="text-blue-100 text-sm mt-1">Set up a new project for your team</p>
                  </div>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-white hover:text-blue-200 transition-colors p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Marketing Website Redesign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Describe the project goals and objectives..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
                  >
                    <option value="planning">📋 Planning</option>
                    <option value="in_progress">🟢 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="on_hold">⏸️ On Hold</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    disabled={createLoading}
                  >
                    {createLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Project'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Employees Modal */}
        {showAssignForm && selectedProject && (
          <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
              {/* Modal Header */}
              <div className="bg-blue-600 px-6 py-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Assign Team</h2>
                    <p className="text-blue-100 text-sm mt-1">Add team members to {selectedProject.name}</p>
                  </div>
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="text-white hover:text-blue-200 transition-colors p-1"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleAssignEmployees} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Team Members
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                    {employees.map((employee) => (
                      <label key={employee.emp_id} className="flex items-center space-x-3 p-3 hover:bg-white rounded-lg transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.emp_id)}
                          onChange={() => handleEmployeeSelection(employee.emp_id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.department} • {employee.emp_id}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      {selectedEmployees.length} member{selectedEmployees.length !== 1 ? 's' : ''} selected
                    </p>
                    {selectedEmployees.length > 0 && (
                      <div className="flex items-center text-blue-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">Ready to assign</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
                    disabled={createLoading || selectedEmployees.length === 0}
                  >
                    {createLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Assigning...
                      </div>
                    ) : (
                      'Assign Team'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}