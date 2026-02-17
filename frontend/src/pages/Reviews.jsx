import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Reviews() {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getEmployeeReviews();
      setReviewsData(response.data);
    } catch (err) {
      console.error('Failed to fetch reviews data:', err);
      setError('Failed to load reviews data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const departments = ['All', ...new Set((reviewsData?.employees || []).map(emp => emp.department))];

  // Filter employees based on selected criteria
  const filteredEmployees = (reviewsData?.employees || []).filter(employee => {
    if (selectedEmployee && employee.emp_id !== selectedEmployee) return false;
    if (selectedDepartment !== 'All' && employee.department !== selectedDepartment) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    return 'Needs Improvement';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews data...</p>
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
            onClick={fetchReviewsData}
            className="text-red-600 hover:text-red-800 underline text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const statistics = reviewsData?.statistics || {};
  const employees = reviewsData?.employees || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Reviews</h1>
        <p className="text-gray-600">AI-powered task evaluations and performance feedback</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value || null)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.emp_id} value={emp.emp_id}>{emp.name} ({emp.emp_id})</option>
              ))}
            </select>
          </div>

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

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Showing {filteredEmployees.length} employees</span>
          </div>
        </div>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total_reviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.completed_reviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.pending_reviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.average_score || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Reviews List */}
      <div className="space-y-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.emp_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Employee Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.department} • {employee.emp_id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Avg Score</p>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(employee.average_score)}`}>
                      {employee.average_score || 0}/100
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Reviews</p>
                    <p className="text-lg font-semibold text-gray-900">{employee.review_count}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Last Review</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(employee.last_review_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            {employee.review_count > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Creativity</p>
                    <p className="text-lg font-semibold text-purple-600">{employee.avg_creativity || '-'}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Efficiency</p>
                    <p className="text-lg font-semibold text-blue-600">{employee.avg_efficiency || '-'}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Edge Cases</p>
                    <p className="text-lg font-semibold text-green-600">{employee.avg_edge_case || '-'}/10</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Pending</p>
                    <p className="text-lg font-semibold text-yellow-600">{employee.pending_reviews}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths and Improvements */}
            {employee.review_count > 0 && (
              <div className="px-6 py-3 border-b border-gray-200 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Strengths: </span>
                  <span className="text-green-600">{employee.strengths.join(', ')}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Areas for Improvement: </span>
                  <span className="text-orange-600">{employee.improvements.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="divide-y divide-gray-200">
              {employee.reviews.slice(0, 3).map((review) => (
                <div key={review.review_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{review.task_title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.date)}
                        </span>
                      </div>

                      {review.feedback && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{review.feedback}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs">
                        {review.project_id && (
                          <div>
                            <span className="font-medium text-gray-700">Project: </span>
                            <span className="text-gray-600">{review.project_id}</span>
                          </div>
                        )}
                        {review.department && (
                          <div>
                            <span className="font-medium text-gray-700">Department: </span>
                            <span className="text-gray-600">{review.department}</span>
                          </div>
                        )}
                        {review.creativity_score && (
                          <div>
                            <span className="font-medium text-gray-700">Creativity: </span>
                            <span className="text-purple-600">{review.creativity_score}/10</span>
                          </div>
                        )}
                        {review.efficiency_score && (
                          <div>
                            <span className="font-medium text-gray-700">Efficiency: </span>
                            <span className="text-blue-600">{review.efficiency_score}/10</span>
                          </div>
                        )}
                        {review.edge_case_handling_score && (
                          <div>
                            <span className="font-medium text-gray-700">Edge Cases: </span>
                            <span className="text-green-600">{review.edge_case_handling_score}/10</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 text-right">
                      <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(review.overall_score)} mb-2`}>
                        {review.overall_score}/100
                      </div>
                      <p className="text-xs text-gray-500">{getScoreLabel(review.overall_score)}</p>
                      {review.github_link && (
                        <a
                          href={review.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 mt-2 block"
                        >
                          View PR
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {employee.reviews.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">No evaluated tasks yet</p>
                  <p className="text-xs text-gray-400">Reviews will appear after task submissions are evaluated</p>
                </div>
              )}

              {employee.reviews.length > 3 && (
                <div className="px-6 py-3 bg-gray-50 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All {employee.reviews.length} Reviews
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No employees found for the selected criteria</p>
        </div>
      )}
    </div>
  );
}
