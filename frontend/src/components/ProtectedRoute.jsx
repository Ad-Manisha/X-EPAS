import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // If no token, send to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role doesn't match, send back to their respective dashboard
  if (userRole !== allowedRole) {
    const fallback = userRole === 'admin' ? '/admin-dashboard' : '/employee-dashboard';
    return <Navigate to={fallback} replace />;
  }

  // SUCCESS: Show the children (the Dashboard and its Sidebar)
  return <Outlet />;
};

export default ProtectedRoute;