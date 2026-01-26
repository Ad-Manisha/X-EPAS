import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRole }) => {
  const { user, loading, token } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no token or user, send to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // If role doesn't match, send back to their respective dashboard
  if (user.role !== allowedRole) {
    const fallback = user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
    return <Navigate to={fallback} replace />;
  }

  // SUCCESS: Show the children (the Dashboard and its content)
  return <Outlet />;
};

export default ProtectedRoute;
