import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, adminAPI } from '../services/api';
import { showInfoToast } from '../utils/toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats with real data
        const statsResponse = await adminAPI.getDashboardStats();
        
        setDashboardStats(statsResponse.data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your organization overview.</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => showInfoToast('Monthly reports feature coming soon!')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
            >
              This Month
            </button>
            <button 
              onClick={() => showInfoToast('Report generation feature coming soon!')}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-red-800 font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-red-600 underline text-sm mt-1 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {dashboardStats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Employees" 
              value={dashboardStats.employees.total}
              change={`${dashboardStats.employees.active} active`}
              changeType="neutral"
              icon="👥"
            />
            <StatCard 
              title="In Progress Projects" 
              value={dashboardStats.projects.active}
              change={`${dashboardStats.projects.total} total projects`}
              changeType="neutral"
              icon="📊"
            />
            <StatCard 
              title="Task Completion" 
              value={`${dashboardStats.tasks.completion_percentage}%`}
              change={`${dashboardStats.tasks.completed}/${dashboardStats.tasks.total} completed`}
              changeType="positive"
              icon="✅"
            />
            <StatCard 
              title="Pending Reviews" 
              value={dashboardStats.tasks.submitted}
              change={`${dashboardStats.tasks.assigned} assigned`}
              changeType="neutral"
              icon="⏳"
            />
          </div>

          {/* Project Overview - Full Width */}
          <div className="mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Project Overview</h3>
                  <p className="text-sm text-gray-600">Current project status and task distribution</p>
                </div>
                <span className="text-sm font-medium text-green-600">
                  {dashboardStats.projects.completion_rate.toFixed(1)}% In Progress
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.projects.total}</div>
                  <div className="text-sm text-blue-700 font-medium">Total Projects</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.projects.active}</div>
                  <div className="text-sm text-green-700 font-medium">In Progress Projects</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dashboardStats.tasks.total}</div>
                  <div className="text-sm text-purple-700 font-medium">Total Tasks</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{dashboardStats.tasks.assigned}</div>
                  <div className="text-sm text-orange-700 font-medium">Assigned Tasks</div>
                </div>
              </div>
              
              {/* Task Status Chart */}
              <div className="border-t pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Task Status Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Enhanced Donut Chart */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 42 42">
                        {/* Background circle */}
                        <circle
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke="#f3f4f6"
                          strokeWidth="3"
                        />
                        
                        {/* Completed tasks segment */}
                        {dashboardStats.tasks.completed > 0 && (
                          <circle
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray={`${(dashboardStats.tasks.completed / dashboardStats.tasks.total) * 100} 100`}
                            strokeDashoffset="0"
                          />
                        )}
                        
                        {/* Submitted tasks segment */}
                        {dashboardStats.tasks.submitted > 0 && (
                          <circle
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            strokeDasharray={`${(dashboardStats.tasks.submitted / dashboardStats.tasks.total) * 100} 100`}
                            strokeDashoffset={`-${(dashboardStats.tasks.completed / dashboardStats.tasks.total) * 100}`}
                          />
                        )}
                        
                        {/* Assigned tasks segment */}
                        {dashboardStats.tasks.assigned > 0 && (
                          <circle
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke="#f59e0b"
                            strokeWidth="3"
                            strokeDasharray={`${(dashboardStats.tasks.assigned / dashboardStats.tasks.total) * 100} 100`}
                            strokeDashoffset={`-${((dashboardStats.tasks.completed + dashboardStats.tasks.submitted) / dashboardStats.tasks.total) * 100}`}
                          />
                        )}
                      </svg>
                      
                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {dashboardStats.tasks.total}
                        </span>
                        <span className="text-xs text-gray-500">Total Tasks</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend and Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Completed</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">{dashboardStats.tasks.completed}</span>
                        <div className="text-xs text-green-500">
                          {dashboardStats.tasks.total > 0 ? ((dashboardStats.tasks.completed / dashboardStats.tasks.total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Submitted</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-blue-600">{dashboardStats.tasks.submitted}</span>
                        <div className="text-xs text-blue-500">
                          {dashboardStats.tasks.total > 0 ? ((dashboardStats.tasks.submitted / dashboardStats.tasks.total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Assigned</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-yellow-600">{dashboardStats.tasks.assigned}</span>
                        <div className="text-xs text-yellow-500">
                          {dashboardStats.tasks.total > 0 ? ((dashboardStats.tasks.assigned / dashboardStats.tasks.total) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Overall completion rate */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-700">{dashboardStats.tasks.completion_percentage}%</span>
                        <div className="text-xs text-gray-500">Overall Progress</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Log - Replacing Top Performers */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Latest task activities and updates</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {dashboardStats.recent_activity.length > 0 ? (
                  dashboardStats.recent_activity.map((activity, index) => (
                    <div key={activity.task_id} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">
                          {activity.task_id.slice(-2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          Project: {activity.project_id} • Assigned to: {activity.assigned_to || 'Unassigned'}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                            activity.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            activity.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
                  <p className="text-sm text-gray-600">Tasks due in the next 7 days</p>
                </div>
                <span className="text-sm font-medium text-red-600">
                  {dashboardStats.upcoming_deadlines.length} urgent
                </span>
              </div>
              <div className="space-y-4">
                {dashboardStats.upcoming_deadlines.length > 0 ? (
                  dashboardStats.upcoming_deadlines.map((task, index) => {
                    const daysUntilDeadline = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={task.task_id} className="flex items-center space-x-4 p-3 border border-red-100 bg-red-50 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{daysUntilDeadline}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-600">
                            {task.assigned_to} • {task.project_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium text-red-600">
                            {daysUntilDeadline === 0 ? 'Due Today' : 
                             daysUntilDeadline === 1 ? 'Due Tomorrow' : 
                             `${daysUntilDeadline} days`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">No upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <QuickActionButton 
                  icon="👥" 
                  label="Add Employee" 
                  description="Create new employee account"
                  onClick={() => window.location.href = '/employees'}
                />
                <QuickActionButton 
                  icon="📊" 
                  label="New Project" 
                  description="Start a new project"
                  onClick={() => window.location.href = '/projects'}
                />
                <QuickActionButton 
                  icon="📝" 
                  label="Assign Task" 
                  description="Create and assign tasks"
                  onClick={() => window.location.href = '/assign-task'}
                />
                <QuickActionButton 
                  icon="📈" 
                  label="View Reports" 
                  description="Performance analytics"
                  onClick={() => showInfoToast('Reports feature coming soon!')}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, change, changeType, icon, bgColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`w-14 h-14 ${bgColor || 'bg-gray-50'} rounded-xl flex items-center justify-center ${bgColor ? 'shadow-lg' : ''}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <span className={`text-sm font-medium ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, label, description, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="p-4 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 transition-all group shadow-sm hover:shadow-md"
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
