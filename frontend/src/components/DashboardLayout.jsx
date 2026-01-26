import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function DashboardLayout({ role }) { // No "children" prop needed here
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50">
        <div className="p-6 text-2xl font-bold border-b border-slate-800 tracking-tight">X-EPAS</div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {role === 'admin' ? (
            <>
              <Link to="/admin-dashboard" className={`block p-3 rounded-lg transition font-medium ${isActive('/admin-dashboard')}`}>Overview</Link>
              <Link to="/projects" className={`block p-3 rounded-lg transition font-medium ${isActive('/projects')}`}>Projects</Link>
              <Link to="/employees" className={`block p-3 rounded-lg transition font-medium ${isActive('/employees')}`}>Employees</Link>
            </>
          ) : (
            <>
              <Link to="/employee-dashboard" className={`block p-3 rounded-lg transition font-medium ${isActive('/employee-dashboard')}`}>Overview</Link>
              <Link to="/task-details" className={`block p-3 rounded-lg transition font-medium ${isActive('/task-details')}`}>Task Details</Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => navigate('/login')} className="w-full text-left p-3 text-red-400 hover:bg-slate-800 rounded-lg transition font-bold">Logout</button>
        </div>
      </aside>

      <div className="flex-1 ml-64 flex flex-col">
        <Navbar />
        <main className="p-8 min-h-screen">
          <Outlet /> {/* Child pages will inject their content here */}
        </main>
      </div>
    </div>
  );
}