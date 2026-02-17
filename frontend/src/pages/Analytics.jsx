import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAnalytics();
      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getMetricStatus = (value, threshold) => {
    if (value >= threshold) {
      return { color: 'text-green-600', bg: 'bg-green-100', icon: '↗' };
    }
    return { color: 'text-red-600', bg: 'bg-red-100', icon: '↘' };
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-medium mb-2">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const {
    keyMetrics,
    workloadDistribution,
    deadlineCompliance,
    topPerformers,
    skillMetrics,
    scoreDistribution,
    departmentAnalytics,
    projectAnalytics,
    atRiskTasks,
    insights,
    recommendations,
    summary
  } = analyticsData || {};

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workforce', label: 'Workforce' },
    { id: 'projects', label: 'Projects' },
    { id: 'quality', label: 'Quality & Skills' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into team performance, productivity, and resource utilization</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary?.totalEmployees || 0}</p>
          <p className="text-xs text-gray-500">Employees</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary?.totalProjects || 0}</p>
          <p className="text-xs text-gray-500">Projects</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-900">{summary?.totalTasks || 0}</p>
          <p className="text-xs text-gray-500">Total Tasks</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-green-600">{summary?.completedTasks || 0}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary?.evaluatedTasks || 0}</p>
          <p className="text-xs text-gray-500">Evaluated</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary?.pendingTasks || 0}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-orange-600">{summary?.submittedTasks || 0}</p>
          <p className="text-xs text-gray-500">Submitted</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-red-600">{summary?.overdueTasks || 0}</p>
          <p className="text-xs text-gray-500">Overdue</p>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Velocity</p>
                  <p className="text-2xl font-bold text-gray-900">{keyMetrics?.teamVelocity || 0}%</p>
                  <p className={`text-xs mt-1 ${getMetricStatus(keyMetrics?.teamVelocity || 0, 70).color}`}>
                    Task completion rate
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getMetricStatus(keyMetrics?.teamVelocity || 0, 70).bg}`}>
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900">{keyMetrics?.qualityScore || 0}%</p>
                  <p className={`text-xs mt-1 ${getMetricStatus(keyMetrics?.qualityScore || 0, 80).color}`}>
                    Avg evaluation score
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getMetricStatus(keyMetrics?.qualityScore || 0, 80).bg}`}>
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900">{keyMetrics?.onTimeDeliveryRate || 0}%</p>
                  <p className={`text-xs mt-1 ${getMetricStatus(keyMetrics?.onTimeDeliveryRate || 0, 75).color}`}>
                    Deadline compliance
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getMetricStatus(keyMetrics?.onTimeDeliveryRate || 0, 75).bg}`}>
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Turnaround</p>
                  <p className="text-2xl font-bold text-gray-900">{keyMetrics?.avgTurnaroundDays || 0} days</p>
                  <p className="text-xs mt-1 text-gray-500">
                    Task completion time
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Department Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
              {departmentAnalytics && departmentAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {departmentAnalytics.map((dept, index) => (
                    <div key={dept.department} className="border border-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-600' :
                            index === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {index + 1}
                          </span>
                          <h4 className="font-medium text-gray-900">{dept.department}</h4>
                        </div>
                        <span className={`text-lg font-bold ${getScoreColor(dept.avgPerformance)}`}>
                          {dept.avgPerformance}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${dept.avgPerformance}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">Team</p>
                          <p className="font-semibold">{dept.employeeCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tasks</p>
                          <p className="font-semibold">{dept.tasksCompleted}/{dept.totalTasks}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">On-Time</p>
                          <p className="font-semibold">{dept.onTimeDeliveryRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Overdue</p>
                          <p className={`font-semibold ${dept.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {dept.overdueTasks}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No department data available</p>
              )}
            </div>

            {/* Insights & Recommendations */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                {insights && insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.slice(0, 4).map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 ${getInsightColor(insight.type)} rounded-full mt-2`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                          <p className="text-xs text-gray-600">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No insights yet</p>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                {recommendations && recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          rec.priority === 1 ? 'bg-red-100 text-red-600' :
                          rec.priority === 2 ? 'bg-yellow-100 text-yellow-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                          <p className="text-xs text-gray-600">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recommendations</p>
                )}
              </div>
            </div>
          </div>

          {/* At-Risk Tasks */}
          {atRiskTasks && atRiskTasks.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">At-Risk Tasks</h3>
                <span className="text-sm text-red-600 font-medium">{atRiskTasks.length} tasks need attention</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {atRiskTasks.slice(0, 5).map((task) => (
                      <tr key={task.task_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{task.title}</div>
                          <div className="text-xs text-gray-500">{task.task_id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.assigned_to || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{task.project_id}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.isOverdue ? 'Overdue' : 'Due Soon'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${task.isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                            {task.isOverdue ? `${Math.abs(task.daysUntilDeadline)} days late` : `${task.daysUntilDeadline} days left`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* WORKFORCE TAB */}
      {activeTab === 'workforce' && (
        <>
          {/* Workforce Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Employee Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics?.employeeUtilization || 0}%</p>
              <p className="text-xs text-gray-500">With assigned tasks</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Avg Tasks/Employee</p>
              <p className="text-2xl font-bold text-gray-900">{workloadDistribution?.avgTasksPerEmployee || 0}</p>
              <p className="text-xs text-gray-500">Current workload</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Overloaded</p>
              <p className="text-2xl font-bold text-red-600">{workloadDistribution?.overloadedCount || 0}</p>
              <p className="text-xs text-gray-500">Above avg workload</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Underutilized</p>
              <p className="text-2xl font-bold text-yellow-600">{workloadDistribution?.underutilizedCount || 0}</p>
              <p className="text-xs text-gray-500">No tasks assigned</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
              {topPerformers && topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.emp_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-orange-300 text-orange-800' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                          <p className="text-xs text-gray-500">{performer.department} • {performer.tasksCompleted} tasks</p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${getScoreColor(performer.avgScore)}`}>
                        {performer.avgScore}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No performance data yet</p>
              )}
            </div>

            {/* Workload Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workload Distribution</h3>
              {workloadDistribution?.topOverloaded && workloadDistribution.topOverloaded.length > 0 ? (
                <div className="space-y-3">
                  {workloadDistribution.topOverloaded.map((emp) => (
                    <div key={emp.emp_id} className="p-3 border border-gray-100 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.department}</p>
                        </div>
                        <span className={`text-sm font-semibold ${emp.pendingTasks > workloadDistribution.avgTasksPerEmployee ? 'text-red-600' : 'text-green-600'}`}>
                          {emp.pendingTasks} pending
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${emp.completionRate >= 70 ? 'bg-green-500' : emp.completionRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${emp.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">{emp.completionRate}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No workload data</p>
              )}
            </div>
          </div>

          {/* Deadline Compliance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deadline Compliance</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{deadlineCompliance?.onTimeRate || 0}%</p>
                <p className="text-sm text-gray-600">On-Time Rate</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{keyMetrics?.avgTurnaroundDays || 0}</p>
                <p className="text-sm text-gray-600">Avg Days to Complete</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600">{deadlineCompliance?.dueSoonCount || 0}</p>
                <p className="text-sm text-gray-600">Due Within 3 Days</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">{deadlineCompliance?.lateCount || 0}</p>
                <p className="text-sm text-gray-600">Delivered Late</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-3xl font-bold text-red-600">{deadlineCompliance?.overdueCount || 0}</p>
                <p className="text-sm text-gray-600">Currently Overdue</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* PROJECTS TAB */}
      {activeTab === 'projects' && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Project Analytics</h2>
              <p className="text-sm text-gray-600 mt-1">Performance, velocity, and health metrics for all projects</p>
            </div>

            {projectAnalytics && projectAnalytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Velocity</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Health</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Risk</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasks</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overdue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectAnalytics.map((project) => (
                      <tr key={project.project_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-xs text-gray-500">{project.project_id} • {project.employeeCount} members</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.status === 'completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-12 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.velocity}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{project.velocity}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${getScoreColor(project.qualityScore)}`}>
                            {project.qualityScore > 0 ? `${project.qualityScore}%` : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${getScoreColor(project.healthScore)}`}>
                            {project.healthScore}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(project.riskLevel)}`}>
                            {project.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          <span className="text-green-600 font-medium">{project.tasksCompleted}</span>
                          <span className="text-gray-400"> / {project.tasksTotal}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-sm font-medium ${project.tasksOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {project.tasksOverdue}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No projects available</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* QUALITY & SKILLS TAB */}
      {activeTab === 'quality' && (
        <>
          {/* Score Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics?.efficiencyRate || 0}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${keyMetrics?.efficiencyRate || 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Creativity Score</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics?.creativityScore || 0}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${keyMetrics?.creativityScore || 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Edge Case Handling</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics?.edgeCaseScore || 0}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${keyMetrics?.edgeCaseScore || 0}%` }}></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600">Overall Quality</p>
              <p className="text-2xl font-bold text-gray-900">{keyMetrics?.qualityScore || 0}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${keyMetrics?.qualityScore || 0}%` }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Score Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Excellent (90-100)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${summary?.evaluatedTasks ? (scoreDistribution?.excellent / summary.evaluatedTasks * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{scoreDistribution?.excellent || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Good (80-89)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${summary?.evaluatedTasks ? (scoreDistribution?.good / summary.evaluatedTasks * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{scoreDistribution?.good || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Satisfactory (70-79)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${summary?.evaluatedTasks ? (scoreDistribution?.satisfactory / summary.evaluatedTasks * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{scoreDistribution?.satisfactory || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-600">Needs Work (&lt;70)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${summary?.evaluatedTasks ? (scoreDistribution?.needsWork / summary.evaluatedTasks * 100) : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{scoreDistribution?.needsWork || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skill Gap Analysis</h3>
              {skillMetrics ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    skillMetrics.creativity?.status === 'strong' ? 'bg-green-50 border-green-200' :
                    skillMetrics.creativity?.status === 'needs_improvement' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Creativity</span>
                      <span className={`font-bold ${getScoreColor(skillMetrics.creativity?.avgScore || 0)}`}>
                        {skillMetrics.creativity?.avgScore || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {skillMetrics.creativity?.status === 'strong' ? 'Team excels in creative solutions' :
                       skillMetrics.creativity?.status === 'needs_improvement' ? 'Consider creativity workshops' :
                       'Not enough data'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    skillMetrics.efficiency?.status === 'strong' ? 'bg-green-50 border-green-200' :
                    skillMetrics.efficiency?.status === 'needs_improvement' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Efficiency</span>
                      <span className={`font-bold ${getScoreColor(skillMetrics.efficiency?.avgScore || 0)}`}>
                        {skillMetrics.efficiency?.avgScore || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {skillMetrics.efficiency?.status === 'strong' ? 'Code is well-optimized' :
                       skillMetrics.efficiency?.status === 'needs_improvement' ? 'Focus on code optimization' :
                       'Not enough data'}
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg border ${
                    skillMetrics.edgeCaseHandling?.status === 'strong' ? 'bg-green-50 border-green-200' :
                    skillMetrics.edgeCaseHandling?.status === 'needs_improvement' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Edge Case Handling</span>
                      <span className={`font-bold ${getScoreColor(skillMetrics.edgeCaseHandling?.avgScore || 0)}`}>
                        {skillMetrics.edgeCaseHandling?.avgScore || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {skillMetrics.edgeCaseHandling?.status === 'strong' ? 'Excellent error handling' :
                       skillMetrics.edgeCaseHandling?.status === 'needs_improvement' ? 'Improve edge case coverage' :
                       'Not enough data'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No skill data available</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
