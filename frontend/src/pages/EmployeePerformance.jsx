import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function EmployeePerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('Current Quarter');

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Mock employees for the same department
  const getMockDepartmentEmployees = () => {
    const departmentEmployees = {
      'Frontend': [
        { emp_id: 'EMP101', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Frontend', is_active: true },
        { emp_id: 'EMP102', name: 'Michael Chen', email: 'michael.chen@company.com', department: 'Frontend', is_active: true },
        { emp_id: 'EMP103', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', department: 'Frontend', is_active: true },
        { emp_id: 'EMP104', name: 'David Kim', email: 'david.kim@company.com', department: 'Frontend', is_active: true }
      ],
      'Backend': [
        { emp_id: 'EMP201', name: 'Alex Thompson', email: 'alex.thompson@company.com', department: 'Backend', is_active: true },
        { emp_id: 'EMP202', name: 'Maria Garcia', email: 'maria.garcia@company.com', department: 'Backend', is_active: true },
        { emp_id: 'EMP203', name: 'James Wilson', email: 'james.wilson@company.com', department: 'Backend', is_active: true },
        { emp_id: 'EMP204', name: 'Lisa Anderson', email: 'lisa.anderson@company.com', department: 'Backend', is_active: true }
      ],
      'AI': [
        { emp_id: 'EMP301', name: 'Dr. Robert Lee', email: 'robert.lee@company.com', department: 'AI', is_active: true },
        { emp_id: 'EMP302', name: 'Priya Patel', email: 'priya.patel@company.com', department: 'AI', is_active: true },
        { emp_id: 'EMP303', name: 'Kevin Zhang', email: 'kevin.zhang@company.com', department: 'AI', is_active: true },
        { emp_id: 'EMP304', name: 'Sophie Martin', email: 'sophie.martin@company.com', department: 'AI', is_active: true }
      ]
    };

    return departmentEmployees[user?.department] || departmentEmployees['Frontend'];
  };

  // Mock performance data generator
  const generateMockPerformanceData = (employees) => {
    const achievements = [
      'Completed project ahead of schedule',
      'Mentored junior team members',
      'Implemented new framework',
      'Reduced bug count significantly',
      'Led successful feature launch',
      'Improved code review process',
      'Optimized application performance',
      'Created comprehensive documentation',
      'Resolved critical issues quickly',
      'Delivered high-quality features'
    ];

    return employees.map((employee, index) => ({
      ...employee,
      performanceScore: Math.floor(Math.random() * 30) + 70, // 70-100 range
      departmentRank: (index % Math.min(employees.length, 5)) + 1, // Rank within department
      keyAchievements: achievements.slice(index % 3, (index % 3) + 2),
      tasksCompleted: Math.floor(Math.random() * 15) + 5,
      avgTaskScore: Math.floor(Math.random() * 20) + 80,
      monthlyGrowth: Math.floor(Math.random() * 20) - 5, // -5 to +15
      projectsContributed: Math.floor(Math.random() * 5) + 2
    }));
  };

  // Get mock department employees
  const departmentEmployees = getMockDepartmentEmployees();
  const performanceData = generateMockPerformanceData(departmentEmployees);
  
  // Sort by performance score (highest first)
  const sortedData = performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

  const periods = ['Current Quarter', 'Last Quarter', 'Last 6 Months', 'Year to Date'];

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRankBadge = (rank) => {
    const badges = {
      1: '🥇 #1',
      2: '🥈 #2', 
      3: '🥉 #3'
    };
    return badges[rank] || `#${rank}`;
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
            <p className="mt-4 text-gray-600">Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.department} Team Performance
        </h1>
        <p className="text-gray-600">
          Top performers and rankings within your department
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Showing {sortedData.length} team members</span>
          </div>
        </div>
      </div>

      {/* Department Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">{sortedData.length + 1}</p>
              <p className="text-xs text-gray-500">Including you</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {sortedData.length > 0 ? Math.round(sortedData.reduce((sum, emp) => sum + emp.performanceScore, 0) / sortedData.length) : 0}
              </p>
              <p className="text-xs text-gray-500">Department average</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Performers</p>
              <p className="text-2xl font-bold text-gray-900">
                {sortedData.filter(emp => emp.performanceScore >= 90).length}
              </p>
              <p className="text-xs text-gray-500">90+ score</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {sortedData.reduce((sum, emp) => sum + emp.tasksCompleted, 0)}
              </p>
              <p className="text-xs text-gray-500">Team total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user?.department} Department Leaderboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Performance rankings for {selectedPeriod.toLowerCase()} • Sorted by performance score
          </p>
        </div>

        {sortedData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Growth
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Achievements
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((employee, index) => (
                  <tr key={employee.emp_id} className="hover:bg-gray-50 transition-colors">
                    {/* Rank */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index + 1}
                      </div>
                    </td>

                    {/* Employee Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                          <span className="text-blue-600 font-medium text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.emp_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Performance Score */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getScoreColor(employee.performanceScore)}`}>
                        {employee.performanceScore}/100
                      </span>
                    </td>

                    {/* Tasks Completed */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-semibold text-gray-900">{employee.tasksCompleted}</div>
                      <div className="text-xs text-gray-500">tasks</div>
                    </td>

                    {/* Monthly Growth */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`text-sm font-semibold ${getGrowthColor(employee.monthlyGrowth)}`}>
                        {getGrowthIcon(employee.monthlyGrowth)} {employee.monthlyGrowth > 0 ? '+' : ''}{employee.monthlyGrowth}%
                      </div>
                      <div className="text-xs text-gray-500">this month</div>
                    </td>

                    {/* Projects */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-semibold text-gray-900">{employee.projectsContributed}</div>
                      <div className="text-xs text-gray-500">projects</div>
                    </td>

                    {/* Key Achievements */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {employee.keyAchievements.map((achievement, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="text-gray-700 truncate">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <p className="text-gray-500">No other team members in your department</p>
          </div>
        )}
      </div>

      {/* Note about mock data */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Department Performance Preview</h3>
            <p className="text-sm text-blue-700 mt-1">
              This shows simulated performance data for your {user?.department} department colleagues. 
              Real performance metrics will be available once the AI evaluation system is implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}