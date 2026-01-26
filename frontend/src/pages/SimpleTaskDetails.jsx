import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SimpleTaskDetails() {
  const { taskId } = useParams();
  const { user, isAdmin } = useAuth();

  // Persistent logging that won't disappear
  console.log('🔍 SimpleTaskDetails: Component loaded at', new Date().toISOString());
  console.log('🔍 SimpleTaskDetails: taskId:', taskId);
  console.log('🔍 SimpleTaskDetails: user:', user);
  console.log('🔍 SimpleTaskDetails: isAdmin:', isAdmin);
  
  // Also log to localStorage for persistence
  localStorage.setItem('debug_taskdetails', JSON.stringify({
    timestamp: new Date().toISOString(),
    taskId,
    user: user?.name,
    role: user?.role,
    isAdmin
  }));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Task Details (Simple Test)</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p><strong>Task ID:</strong> {taskId}</p>
        <p><strong>User:</strong> {user?.name} ({user?.role})</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        <p className="mt-4 text-green-600">✅ Navigation is working!</p>
        <p className="text-blue-600">✅ Component is rendering!</p>
        <p className="text-purple-600">✅ Authentication is working!</p>
        
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            <strong>Debug Info:</strong><br/>
            Timestamp: {new Date().toISOString()}<br/>
            URL: {window.location.href}<br/>
            TaskId: {taskId}
          </p>
        </div>
      </div>
    </div>
  );
}