import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Performance() {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('Current Quarter');

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAllPerformance();
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('Failed to load performance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const employees = performanceData?.employees || [];

  // Get unique departments from employees
  const departments = ['All', ...new Set(employees.map(emp => emp.department))];
  const periods = ['Current Quarter', 'Last Quarter', 'Last 6 Months', 'Year to Date'];

  // Filter by department
  const filteredData = selectedDepartment === 'All'
    ? employees
    : employees.filter(emp => emp.department === selectedDepartment);

  // Sort by performance score
  const sortedData = [...filteredData].sort((a, b) => b.performance_score - a.performance_score);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRankBadge = (rank) => {
    const badges = {
      1: '1',
      2: '2',
      3: '3'
    };
    return badges[rank] || `${rank}`;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-700';
    if (rank === 3) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800 font-medium mb-2">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Calculate filtered statistics
  const filteredStats = {
    total: filteredData.length,
    avgPerformance: filteredData.length > 0
      ? Math.round(filteredData.reduce((sum, emp) => sum + (emp.performance_score || 0), 0) / filteredData.length)
      : 0,
    topPerformers: filteredData.filter(emp => emp.performance_score >= 90).length,
    tasksCompleted: filteredData.reduce((sum, emp) => sum + (emp.tasks_completed || 0), 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Performance</h1>
        <p className="text-gray-600">Track and analyze employee performance across departments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

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
            <span>Showing {filteredData.length} employees</span>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{filteredStats.total}</p>
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
              <p className="text-2xl font-bold text-gray-900">{filteredStats.avgPerformance}</p>
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
              <p className="text-2xl font-bold text-gray-900">{filteredStats.topPerformers}</p>
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
              <p className="text-2xl font-bold text-gray-900">{filteredStats.tasksCompleted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedDepartment === 'All' ? 'All Departments' : selectedDepartment} Performance Rankings
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Performance data for {selectedPeriod.toLowerCase()} • Sorted by performance score
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dept. Rank
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Achievements
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((employee, index) => (
                  <tr key={employee.emp_id} className="hover:bg-gray-50 transition-colors">
                    {/* Overall Rank */}
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
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.emp_id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {employee.department}
                      </span>
                    </td>

                    {/* Performance Score */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getScoreColor(employee.performance_score)}`}>
                        {employee.performance_score || 0}/100
                      </span>
                    </td>

                    {/* Department Rank */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex w-8 h-8 items-center justify-center text-sm font-bold rounded-full ${getRankStyle(employee.department_rank)}`}>
                        {getRankBadge(employee.department_rank || '-')}
                      </span>
                    </td>

                    {/* Tasks Completed */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">{employee.tasks_completed || 0}</div>
                      <div className="text-xs text-gray-500">of {employee.total_tasks || 0} total</div>
                    </td>

                    {/* Key Achievements */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {(employee.key_achievements || []).slice(0, 2).map((achievement, idx) => (
                          <div key={idx} className="flex items-center mb-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 shrink-0"></span>
                            <span className="truncate">{achievement}</span>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500">No performance data available for the selected filters</p>
            <p className="text-sm text-gray-400 mt-1">Performance data will appear once tasks are evaluated</p>
          </div>
        )}
      </div>
    </div>
  );
}
