import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, employeeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function TaskDetails() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Edit form data
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    deadline: '',
    department: ''
  });

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, isAdmin]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      
      // Use appropriate API based on user role
      const response = isAdmin 
        ? await adminAPI.getTaskDetails(taskId)
        : await employeeAPI.getTaskDetails(taskId);
      
      setTask(response.data);
      
      // Set edit form data (only for admin)
      if (isAdmin) {
        setEditData({
          title: response.data.title,
          description: response.data.description,
          deadline: response.data.deadline ? response.data.deadline.split('T')[0] : '', // Format date for input
          department: response.data.department || ''
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch task details');
      console.error('Fetch task details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setUpdateLoading(true);
      await adminAPI.updateTask(taskId, editData);
      
      // Refresh task details
      await fetchTaskDetails();
      setShowEditForm(false);
      
    } catch (err) {
      setError('Failed to update task: ' + (err.response?.data?.detail || err.message));
      console.error('Update task error:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-2 text-red-600 underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
            <p className="text-gray-600">Task ID: {task?.task_id}</p>
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showEditForm ? 'Cancel Edit' : 'Edit Task'}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)} 
            className="text-red-600 underline text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Edit Form */}
      {showEditForm && isAdmin && (
        <div className="mb-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
          </div>
          
          <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={editData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={editData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department"
                  value={editData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                >
                  <option value="Frontend">Frontend</option>
                  <option value="Backend">Backend</option>
                  <option value="AI">AI</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={editData.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={updateLoading}
              >
                {updateLoading ? 'Updating...' : 'Update Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task Details */}
      {task && (
        <div className="space-y-6">
          {/* Main Task Info */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Project</h3>
                  <p className="text-lg text-gray-900">{task.project_id}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Department</h3>
                  <span className="inline-flex px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                    {task.department}
                  </span>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
                  <p className="text-lg text-gray-900">
                    {isAdmin 
                      ? (task.assigned_to || 'Unassigned')
                      : (user?.name || 'You')
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Deadline</h3>
                  <p className="text-lg text-gray-900">{formatDate(task.deadline)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{task.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Details */}
          {task.github_link && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Submission Details</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">GitHub Repository</h3>
                    <a 
                      href={task.github_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium break-all"
                    >
                      {task.github_link}
                    </a>
                  </div>
                  
                  {task.submission_date && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Submitted At</h3>
                      <p className="text-gray-900">{formatDate(task.submission_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Results */}
          {task.score !== null && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Evaluation Results</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Score</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl font-bold text-gray-900">{task.score}</span>
                      <span className="text-lg text-gray-500">/ 100</span>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        task.score >= 90 ? 'bg-green-100 text-green-800' :
                        task.score >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {task.score >= 90 ? 'Excellent' : task.score >= 70 ? 'Good' : 'Needs Improvement'}
                      </div>
                    </div>
                  </div>
                  
                  {task.evaluated_at && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Evaluated At</h3>
                      <p className="text-gray-900">{formatDate(task.evaluated_at)}</p>
                    </div>
                  )}
                </div>

                {task.feedback && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">AI Feedback</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{task.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Task Created</p>
                    <p className="text-sm text-gray-500">{formatDate(task.created_at)}</p>
                  </div>
                </div>
                
                {task.submission_date && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Work Submitted</p>
                      <p className="text-sm text-gray-500">{formatDate(task.submission_date)}</p>
                    </div>
                  </div>
                )}
                
                {task.evaluated_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Task Evaluated</p>
                      <p className="text-sm text-gray-500">{formatDate(task.evaluated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}