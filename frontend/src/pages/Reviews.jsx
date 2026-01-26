import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

export default function Reviews() {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Current Quarter');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchReviewsData();
  }, []);

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const [employeesResponse, projectsResponse] = await Promise.all([
        adminAPI.getEmployees(),
        adminAPI.getProjects()
      ]);
      
      setEmployees(employeesResponse.data);
      setProjects(projectsResponse.data);
    } catch (error) {
      console.error('Failed to fetch reviews data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock review data generator
  const generateReviewData = (employees) => {
    const reviewTypes = ['Quarterly Review', 'Project Review', 'Annual Review', 'Performance Check'];
    const statuses = ['Completed', 'Pending', 'In Progress', 'Scheduled'];
    const feedbackTemplates = [
      'Excellent technical skills and problem-solving abilities. Consistently delivers high-quality work.',
      'Strong team player with great communication skills. Shows initiative in taking on new challenges.',
      'Demonstrates leadership qualities and mentors junior team members effectively.',
      'Good performance overall with room for improvement in time management.',
      'Outstanding contribution to project success. Exceeded expectations in all areas.',
      'Reliable and consistent performer. Shows dedication to continuous learning.',
      'Creative problem solver with innovative approaches to complex challenges.',
      'Excellent collaboration skills and positive attitude towards feedback.'
    ];

    const strengths = [
      'Technical expertise', 'Problem solving', 'Team collaboration', 'Communication',
      'Leadership', 'Innovation', 'Time management', 'Adaptability', 'Mentoring',
      'Code quality', 'Project delivery', 'Client relations'
    ];

    const improvements = [
      'Time management', 'Documentation', 'Code reviews', 'Testing practices',
      'Communication', 'Leadership skills', 'Technical knowledge', 'Process adherence',
      'Collaboration', 'Initiative taking', 'Presentation skills', 'Planning'
    ];

    return employees.map((employee, index) => {
      const reviewCount = Math.floor(Math.random() * 3) + 2; // 2-4 reviews per employee
      const reviews = [];

      for (let i = 0; i < reviewCount; i++) {
        const reviewDate = new Date();
        reviewDate.setMonth(reviewDate.getMonth() - (i * 3)); // Reviews every 3 months

        reviews.push({
          id: `REV${String(index * 10 + i + 1).padStart(3, '0')}`,
          type: reviewTypes[Math.floor(Math.random() * reviewTypes.length)],
          status: i === 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'Completed',
          date: reviewDate,
          reviewer: 'Admin User',
          overallScore: Math.floor(Math.random() * 30) + 70, // 70-100
          feedback: feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)],
          strengths: strengths.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 3),
          improvements: improvements.slice(Math.floor(Math.random() * 2), Math.floor(Math.random() * 2) + 2),
          goals: [
            'Complete advanced training course',
            'Lead a major project initiative',
            'Mentor 2 junior developers',
            'Improve code review participation'
          ].slice(0, Math.floor(Math.random() * 2) + 2),
          nextReviewDate: new Date(reviewDate.getTime() + (90 * 24 * 60 * 60 * 1000)) // 90 days later
        });
      }

      return {
        ...employee,
        reviews: reviews.sort((a, b) => b.date - a.date), // Most recent first
        averageScore: Math.round(reviews.reduce((sum, review) => sum + review.overallScore, 0) / reviews.length),
        lastReviewDate: reviews[0].date,
        nextReviewDue: reviews[0].nextReviewDate
      };
    });
  };

  const reviewData = generateReviewData(employees);

  const periods = ['Current Quarter', 'Last Quarter', 'Last 6 Months', 'Year to Date', 'All Time'];
  const statuses = ['All', 'Completed', 'Pending', 'In Progress', 'Scheduled'];

  // Filter reviews based on selected criteria
  const filteredReviews = reviewData.filter(employee => {
    if (selectedEmployee && employee.emp_id !== selectedEmployee) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Scheduled': return 'bg-purple-50 text-purple-700 border-purple-200';
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Reviews</h1>
        <p className="text-gray-600">Manage performance reviews, feedback, and employee evaluations</p>
      </div>

      {/* Filters and Actions */}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
            >
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowReviewModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Schedule Review
          </button>
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
              <p className="text-2xl font-bold text-gray-900">
                {reviewData.reduce((sum, emp) => sum + emp.reviews.length, 0)}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {reviewData.reduce((sum, emp) => sum + emp.reviews.filter(r => r.status === 'Completed').length, 0)}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {reviewData.reduce((sum, emp) => sum + emp.reviews.filter(r => r.status === 'Pending').length, 0)}
              </p>
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
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(reviewData.reduce((sum, emp) => sum + emp.averageScore, 0) / reviewData.length)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((employee) => (
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
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(employee.averageScore)}`}>
                      {employee.averageScore}/100
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Reviews</p>
                    <p className="text-lg font-semibold text-gray-900">{employee.reviews.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Next Review</p>
                    <p className="text-sm font-medium text-gray-900">
                      {employee.nextReviewDue.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="divide-y divide-gray-200">
              {employee.reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{review.type}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(review.status)}`}>
                          {review.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {review.date.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{review.feedback}</p>
                      
                      <div className="flex flex-wrap gap-4 text-xs">
                        <div>
                          <span className="font-medium text-gray-700">Strengths: </span>
                          <span className="text-gray-600">{review.strengths.join(', ')}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Improvements: </span>
                          <span className="text-gray-600">{review.improvements.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6 text-right">
                      <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getScoreColor(review.overallScore)} mb-2`}>
                        {review.overallScore}/100
                      </div>
                      <p className="text-xs text-gray-500">{getScoreLabel(review.overallScore)}</p>
                      <button className="text-xs text-blue-600 hover:text-blue-800 mt-2">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
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

      {filteredReviews.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No reviews found for the selected criteria</p>
        </div>
      )}

      {/* Note about mock data */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-800">Review System Preview</h3>
            <p className="text-sm text-blue-700 mt-1">
              This reviews interface displays simulated review data for demonstration purposes. 
              Real performance reviews will be integrated with the AI evaluation system and actual task assessments once implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}