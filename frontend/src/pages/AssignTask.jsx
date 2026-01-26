import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function AssignTask() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedProjectId = searchParams.get('project'); // Get project from URL params
  
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedProject, setSelectedProject] = useState(preSelectedProjectId || '');
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Task form data
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    deadline: '',
    department: '',
    assigned_to: ''
  });

  // Fetch projects and employees on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Set the pre-selected project when data is loaded
  useEffect(() => {
    if (preSelectedProjectId && projects.length > 0) {
      const project = projects.find(p => p.project_id === preSelectedProjectId);
      if (project) {
        setSelectedProject(preSelectedProjectId);
      }
    }
  }, [preSelectedProjectId, projects]);

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

  const handleInputChange = (e) => {
    setTaskData({
      ...taskData,
      [e.target.name]: e.target.value
    });
  };

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
  };

  const handleCreateAndAssignTask = async (e) => {
    e.preventDefault();
    
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    try {
      setCreateLoading(true);
      setError(null);
      setSuccess(null);

      // Step 1: Create the task
      const createTaskResponse = await adminAPI.createTask(selectedProject, {
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline,
        department: taskData.department
      });

      const createdTask = createTaskResponse.data;

      // Step 2: Assign the task to employee (if selected)
      if (taskData.assigned_to) {
        await adminAPI.assignTask(createdTask.task_id, taskData.assigned_to);
      }

      // Reset form
      setTaskData({
        title: '',
        description: '',
        deadline: '',
        department: '',
        assigned_to: ''
      });
      setSelectedProject('');

      setSuccess(`Task "${createdTask.title}" created and assigned successfully!`);

    } catch (err) {
      setError('Failed to create task: ' + (err.response?.data?.detail || err.message));
      console.error('Create task error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Get the current project name for display
  const getCurrentProjectName = () => {
    if (!selectedProject || !projects.length) return null;
    const project = projects.find(p => p.project_id === selectedProject);
    return project ? project.name : null;
  };

  // Get employees assigned to selected project
  const getProjectEmployees = () => {
    if (!selectedProject) return [];
    
    const project = projects.find(p => p.project_id === selectedProject);
    if (!project || !project.employees) return [];
    
    return employees.filter(emp => project.employees.includes(emp.emp_id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-white/50 transition-all duration-200 shadow-sm"
            title="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {preSelectedProjectId ? `Add Task to ${getCurrentProjectName()}` : 'Create & Assign Task'}
            </h1>
            <p className="text-slate-600 mt-1">
              {preSelectedProjectId 
                ? `Create a new task for ${getCurrentProjectName()}` 
                : 'Create a new task and assign it to a team member'
              }
            </p>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{success}</span>
                <button 
                  onClick={() => setSuccess(null)} 
                  className="ml-auto text-green-600 hover:text-green-800 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{error}</span>
                <button 
                  onClick={() => setError(null)} 
                  className="ml-auto text-red-600 hover:text-red-800 text-lg font-bold"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold text-slate-800 mb-6">Task Details</h2>

          <form onSubmit={handleCreateAndAssignTask} className="space-y-6">
            {/* Project Selection - Only show if no pre-selected project */}
            {!preSelectedProjectId ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Select Project *
                </label>
                <select
                  value={selectedProject}
                  onChange={handleProjectChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white transition-all duration-200"
                  required
                >
                  <option value="">Choose a project...</option>
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name} ({project.project_id})
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-sm text-slate-500 mt-2">No projects available. Create a project first.</p>
                )}
              </div>
            ) : (
              /* Show selected project info when pre-selected */
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project
                </label>
                <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">{getCurrentProjectName()}</p>
                      <p className="text-sm text-blue-600">Project ID: {selectedProject}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={taskData.title}
                onChange={handleInputChange}
                placeholder="e.g., Implement user authentication"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all duration-200"
                required
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Description *
              </label>
              <textarea
                name="description"
                value={taskData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Detailed description of the task requirements, acceptance criteria, and any specific instructions..."
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all duration-200 resize-none"
                required
              />
              <div className="flex items-center mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-700">
                  This description will be used by AI for evaluation. Be specific about requirements and expectations.
                </p>
              </div>
            </div>

            {/* Department and Deadline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Department *
                </label>
                <select
                  name="department"
                  value={taskData.department}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white transition-all duration-200"
                  required
                >
                  <option value="">Select department...</option>
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="AI">AI</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={taskData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Employee Assignment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign to Employee (Optional)
              </label>
              <select
                name="assigned_to"
                value={taskData.assigned_to}
                onChange={handleInputChange}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-gray-300 focus:border-gray-300 outline-none bg-white transition-all duration-200"
              >
                <option value="">Leave unassigned for now</option>
                {getProjectEmployees().map((employee) => (
                  <option key={employee.emp_id} value={employee.emp_id}>
                    {employee.name} ({employee.emp_id}) - {employee.department}
                  </option>
                ))}
              </select>
              {selectedProject && getProjectEmployees().length === 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  No employees assigned to this project yet. Assign employees to the project first.
                </p>
              )}
              {!selectedProject && (
                <p className="text-sm text-slate-500 mt-2">
                  Select a project first to see available employees.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={createLoading || !selectedProject}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {createLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Creating Task...
                  </div>
                ) : (
                  'Create & Assign Task'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Projects</p>
                <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Employees</p>
                <p className="text-2xl font-bold text-slate-900">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Available for Assignment</p>
                <p className="text-2xl font-bold text-slate-900">{getProjectEmployees().length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}