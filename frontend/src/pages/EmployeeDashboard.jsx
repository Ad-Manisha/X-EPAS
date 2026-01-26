import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, employeeAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [githubError, setGithubError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // GitHub Pull Request URL validation
  const validateGitHubPullRequestURL = (url) => {
    const githubPRRegex = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/pull\/\d+$/;
    return githubPRRegex.test(url);
  };

  const handleGitHubLinkChange = (e) => {
    const value = e.target.value;
    setGithubLink(value);
    
    if (value.trim() === '') {
      setGithubError('');
      return;
    }

    if (!validateGitHubPullRequestURL(value.trim())) {
      setGithubError('Please provide a valid GitHub pull request URL in the format: https://github.com/owner/repo/pull/number');
    } else {
      setGithubError('');
    }
  };

  // Fetch profile and tasks data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch both profile and tasks in parallel
        const [profileResponse, tasksResponse] = await Promise.all([
          authAPI.getCurrentUser(),
          employeeAPI.getTasks()
        ]);
        
        setProfileData(profileResponse.data);
        setTasks(tasksResponse.data);
        setFilteredTasks(tasksResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!selectedTask || !githubLink.trim()) return;

    // Validate GitHub URL format
    if (!validateGitHubPullRequestURL(githubLink.trim())) {
      setGithubError('Please provide a valid GitHub pull request URL in the format: https://github.com/owner/repo/pull/number');
      return;
    }

    try {
      setSubmitLoading(true);
      setGithubError('');
      await employeeAPI.submitTask(selectedTask.task_id, githubLink.trim());
      
      // Reset form and close modal
      setGithubLink('');
      setGithubError('');
      setShowSubmitModal(false);
      setSelectedTask(null);
      
      // Refresh tasks list
      const tasksResponse = await employeeAPI.getTasks();
      setTasks(tasksResponse.data);
      setFilteredTasks(tasksResponse.data);
      
    } catch (err) {
      setError('Failed to submit task: ' + (err.response?.data?.detail || err.message));
      console.error('Submit task error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const openSubmitModal = (task) => {
    setSelectedTask(task);
    setGithubLink('');
    setGithubError('');
    setShowSubmitModal(true);
  };

  const filterTasks = (status) => {
    setActiveFilter(status);
    if (status === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.status === status));
    }
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDeadlineUrgency = (deadline) => {
    const now = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Overdue' };
    if (diffDays === 0) return { color: 'text-red-600', bg: 'bg-red-50', label: 'Due Today' };
    if (diffDays === 1) return { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Due Tomorrow' };
    if (diffDays <= 3) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: `${diffDays} days left` };
    if (diffDays <= 7) return { color: 'text-blue-600', bg: 'bg-blue-50', label: `${diffDays} days left` };
    return { color: 'text-gray-600', bg: 'bg-gray-50', label: `${diffDays} days left` };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profileData?.name || user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here are your assigned tasks and performance overview.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'assigned').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'submitted').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {tasks.filter(task => task.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            
            {/* Task Filters */}
            <div className="flex space-x-2">
              <button
                onClick={() => filterTasks('all')}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                  activeFilter === 'all' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => filterTasks('assigned')}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                  activeFilter === 'assigned' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending ({tasks.filter(task => task.status === 'assigned').length})
              </button>
              <button
                onClick={() => filterTasks('submitted')}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                  activeFilter === 'submitted' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Submitted ({tasks.filter(task => task.status === 'submitted').length})
              </button>
              <button
                onClick={() => filterTasks('completed')}
                className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                  activeFilter === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Completed ({tasks.filter(task => task.status === 'completed').length})
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <div key={task.task_id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mt-1">{task.description}</p>
                  
                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Project: {task.project_id || 'Not assigned'}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Department: {task.department || 'Not specified'}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="mr-2">Due: {formatDate(task.deadline)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${getDeadlineUrgency(task.deadline).bg} ${getDeadlineUrgency(task.deadline).color}`}>
                        {getDeadlineUrgency(task.deadline).label}
                      </span>
                    </div>
                  </div>

                  {/* Task Progress Indicator */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {task.status === 'assigned' && '0%'}
                        {task.status === 'in_progress' && '50%'}
                        {task.status === 'submitted' && '75%'}
                        {task.status === 'completed' && '100%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          task.status === 'assigned' ? 'bg-blue-500 w-0' :
                          task.status === 'in_progress' ? 'bg-yellow-500 w-1/2' :
                          task.status === 'submitted' ? 'bg-purple-500 w-3/4' :
                          'bg-green-500 w-full'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {task.github_link && (
                    <div className="mt-3">
                      <a 
                        href={task.github_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Submission →
                      </a>
                    </div>
                  )}

                  {task.score && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">Score: {task.score}/100</span>
                        {task.feedback && (
                          <span className="text-xs text-green-600">Feedback available</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-6 flex space-x-3">
                  <button
                    onClick={() => navigate(`/employee/task-details/${task.task_id}`)}
                    className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                  >
                    View Details
                  </button>
                  
                  {task.status === 'assigned' && (
                    <>
                      <button
                        onClick={() => openSubmitModal(task)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                      >
                        Submit Work
                      </button>
                    </>
                  )}
                  {task.status === 'submitted' && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
                      Under Review
                    </span>
                  )}
                  {task.status === 'completed' && (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && tasks.length > 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No tasks found for "{activeFilter}" filter</p>
            <button 
              onClick={() => filterTasks('all')}
              className="text-blue-600 hover:text-blue-700 text-sm mt-2 font-medium"
            >
              Show all tasks
            </button>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">No tasks assigned yet</p>
            <p className="text-gray-400 text-sm mt-1">Check back later for new assignments</p>
          </div>
        )}
      </div>

      {/* Submit Task Modal */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 border border-gray-100 transform animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Submit Task</h2>
                  <p className="text-indigo-100 text-sm mt-1">{selectedTask.title}</p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="text-white hover:text-indigo-200 transition-colors p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmitTask} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  GitHub Repository Link *
                </label>
                <input
                  type="url"
                  value={githubLink}
                  onChange={handleGitHubLinkChange}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all ${
                    githubError ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}
                  required
                />
                {githubError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {githubError}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Must be a GitHub pull request URL: https://github.com/owner/repo/pull/number
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-indigo-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-900 mb-1">Task Requirements</h4>
                    <p className="text-sm text-indigo-800 leading-relaxed">{selectedTask.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 font-medium transition-all disabled:opacity-50 shadow-lg"
                  disabled={submitLoading || !githubLink.trim() || githubError}
                >
                  {submitLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Submit Task
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}