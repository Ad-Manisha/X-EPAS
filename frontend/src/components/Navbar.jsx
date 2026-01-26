import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'AD';
    return user.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      try {
        let searchResults = [];

        // Only search if user is admin (employees don't have access to these endpoints)
        if (user?.role === 'admin') {
          const [employeesResponse, projectsResponse] = await Promise.all([
            adminAPI.getEmployees(),
            adminAPI.getProjects()
          ]);

          const employees = employeesResponse.data;
          const projects = projectsResponse.data;

          // Filter employees
          const matchingEmployees = employees
            .filter(emp => 
              emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
              emp.emp_id.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(emp => ({
              type: 'employee',
              id: emp.emp_id,
              title: emp.name,
              subtitle: `${emp.department} • ${emp.emp_id}`,
              action: () => navigate(`/employees`)
            }));

          // Filter projects
          const matchingProjects = projects
            .filter(proj => 
              proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              proj.project_id.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(proj => ({
              type: 'project',
              id: proj.project_id,
              title: proj.name,
              subtitle: `Project • ${proj.project_id}`,
              action: () => navigate(`/projects/${proj.project_id}`)
            }));

          searchResults = [...matchingEmployees, ...matchingProjects].slice(0, 8);
        } else {
          // For employees, show a message that search is admin-only
          searchResults = [{
            type: 'info',
            id: 'search-info',
            title: 'Search not available',
            subtitle: 'Search functionality is available for administrators only',
            action: () => {}
          }];
        }

        setSearchResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        // Show error message in search results
        setSearchResults([{
          type: 'error',
          id: 'search-error',
          title: 'Search unavailable',
          subtitle: 'Unable to perform search at this time',
          action: () => {}
        }]);
        setShowResults(true);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, navigate, user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getTypeIcon = (type) => {
    if (type === 'employee') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    } else if (type === 'project') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    } else if (type === 'info') {
      return (
        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type === 'error') {
      return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left side - Search */}
      <div className="flex items-center flex-1 max-w-lg relative">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search employees, reviews, goals, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent bg-gray-50 text-sm"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={result.action}
                disabled={result.type === 'info' || result.type === 'error'}
                className={`w-full px-4 py-3 text-left flex items-center space-x-3 border-b border-gray-100 last:border-b-0 ${
                  result.type === 'info' || result.type === 'error' 
                    ? 'cursor-default bg-gray-50' 
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                {getTypeIcon(result.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{result.title}</p>
                  <p className="text-xs text-gray-500">{result.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right side - User info */}
      <div className="flex items-center space-x-4">
        {/* User Profile - Clickable */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 pl-4 border-l border-gray-200 hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
            
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm ring-2 ring-white">
                {getUserInitials()}
              </div>
              {/* Online status dot */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}