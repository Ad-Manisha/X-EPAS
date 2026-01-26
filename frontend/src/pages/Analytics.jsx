import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Analytics() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last 30 Days');
  const [selectedMetric, setSelectedMetric] = useState('Performance');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsResponse, employeesResponse, projectsResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getEmployees(),
        adminAPI.getProjects()
      ]);
      
      setDashboardStats(statsResponse.data);
      setEmployees(employeesResponse.data);
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock analytics data generators
  const generateTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      performance: Math.floor(Math.random() * 20) + 75,
      productivity: Math.floor(Math.random() * 25) + 70,
      satisfaction: Math.floor(Math.random() * 15) + 80,
      tasks: Math.floor(Math.random() * 50) + 100
    }));
  };

  const generateDepartmentAnalytics = () => {
    const departments = ['Frontend', 'Backend', 'AI'];
    return departments.map(dept => {
      const deptEmployees = employees.filter(emp => emp.department === dept);
      return {
        department: dept,
        employeeCount: deptEmployees.length,
        avgPerformance: Math.floor(Math.random() * 20) + 75,
        tasksCompleted: Math.floor(Math.random() * 100) + 150,
        efficiency: Math.floor(Math.random() * 15) + 80,
        growth: Math.floor(Math.random() * 20) - 10 // -10 to +10
      };
    });
  };

  const generateProjectAnalytics = () => {
    return projects.map(project => ({
      ...project,
      velocity: Math.floor(Math.random() * 30) + 70,
      qualityScore: Math.floor(Math.random() * 20) + 80,
      riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
      estimatedCompletion: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000)
    }));
  };

  const trendData = generateTrendData();
  const departmentAnalytics = generateDepartmentAnalytics();
  const projectAnalytics = generateProjectAnalytics();

  const timeframes = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months', 'Last 6 Months', 'Year to Date'];
  const metrics = ['Performance', 'Productivity', 'Quality', 'Efficiency'];

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'High': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive insights into team performance and productivity</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              {timeframes.map(timeframe => (
                <option key={timeframe} value={timeframe}>{timeframe}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              {metrics.map(metric => (
                <option key={metric} value={metric}>{metric}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Velocity</p>
              <p className="text-2xl font-bold text-gray-900">87.5%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="mr-1">↗️</span>
                +12% from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Quality Score</p>
              <p className="text-2xl font-bold text-gray-900">92.3%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="mr-1">↗️</span>
                +5% from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Efficiency Rate</p>
              <p className="text-2xl font-bold text-gray-900">84.7%</p>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <span className="mr-1">↘️</span>
                -3% from last month
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">89.2%</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <span className="mr-1">↗️</span>
                +8% from last month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
            <span className="text-sm text-gray-500">{selectedTimeframe}</span>
          </div>
          
          <div className="space-y-4">
            {trendData.map((data, index) => (
              <div key={data.month} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-600 w-8">{data.month}</span>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${data.performance}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 ml-4">{data.performance}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Comparison */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Department Performance</h3>
            <span className="text-sm text-gray-500">Current Period</span>
          </div>
          
          <div className="space-y-4">
            {departmentAnalytics.map((dept) => (
              <div key={dept.department} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{dept.department}</h4>
                  <span className={`text-sm font-medium ${getGrowthColor(dept.growth)}`}>
                    {getGrowthIcon(dept.growth)} {dept.growth > 0 ? '+' : ''}{dept.growth}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Team Size</p>
                    <p className="font-semibold">{dept.employeeCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Avg Score</p>
                    <p className="font-semibold">{dept.avgPerformance}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tasks Done</p>
                    <p className="font-semibold">{dept.tasksCompleted}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Analytics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Project Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">Performance metrics and risk assessment for active projects</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Velocity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Est. Completion
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectAnalytics.slice(0, 5).map((project) => (
                <tr key={project.project_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-sm text-gray-500">{project.project_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {project.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${project.velocity}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{project.velocity}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{project.qualityScore}/100</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(project.riskLevel)}`}>
                      {project.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {project.estimatedCompletion.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Performance Improvement</p>
                <p className="text-sm text-gray-600">Team performance has increased by 12% this month, with Frontend leading the growth.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Efficiency Concern</p>
                <p className="text-sm text-gray-600">Backend team efficiency dropped by 3%. Consider workload redistribution.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Quality Metrics</p>
                <p className="text-sm text-gray-600">Overall quality score improved to 92.3%, exceeding the target of 90%.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Optimize Backend Workflow</p>
                <p className="text-sm text-gray-600">Review current processes and consider automation tools to improve efficiency.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Scale Frontend Success</p>
                <p className="text-sm text-gray-600">Apply Frontend team's best practices to other departments.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Maintain Quality Standards</p>
                <p className="text-sm text-gray-600">Continue current quality assurance processes to sustain high scores.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note about mock data */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Analytics Preview</h3>
            <p className="text-sm text-blue-700 mt-1">
              This analytics dashboard displays simulated data for demonstration purposes. 
              Real analytics will be generated from actual task evaluations and performance metrics once the AI evaluation system is implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}