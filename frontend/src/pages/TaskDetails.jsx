import React, { useState, useEffect } from 'react';

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null); // State for the clicked row

  // --- API FETCHING ---
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Replace with your actual API endpoint: const response = await fetch('/api/tasks');
        // Simulated API call:
        setTimeout(() => {
          const mockData = [
            { id: 101, title: "Refactor API Logic", project: "Inventory System", deadline: "2026-01-20", status: "Assigned", priority: "High", owner: "John Doe", description: "Optimize controllers and service layers for X-EPAS scoring." },
            { id: 102, title: "Design Landing Page", project: "Marketing Web", deadline: "2026-01-30", status: "Assigned", priority: "Medium", owner: "John Doe", description: "Implement responsive hero section using Tailwind CSS." },
            { id: 103, title: "Database Schema", project: "Inventory System", deadline: "2026-01-15", status: "Completed", priority: "High", owner: "John Doe", description: "Normalized tables and added indexing for search optimization." },
          ];
          setTasks(mockData);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return (
    <div className="flex h-96 items-center justify-center font-black text-slate-400 animate-pulse">
      SYNCING DATABASE...
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Header */}
      <div className="border-b border-slate-200 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Task Directory</h1>
          <p className="text-slate-500 font-medium">Click any row to view full specifications.</p>
        </div>
      </div>

      {/* 2. Task Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ref ID</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Task Title</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Project</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tasks.map((task) => (
              <tr 
                key={task.id} 
                onClick={() => setSelectedTask(task)} // Click triggers detail view
                className="group cursor-pointer hover:bg-blue-50/50 transition-all active:bg-blue-100"
              >
                <td className="p-6 font-mono text-xs font-bold text-slate-400">#TK-{task.id}</td>
                <td className="p-6 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</td>
                <td className="p-6 text-sm font-bold text-slate-500">{task.project}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="p-6 text-sm font-medium text-slate-500">{task.deadline}</td>
                <td className="p-6">
                  <div className={`w-2.5 h-2.5 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Detail Slide-over / Modal */}
      {selectedTask && (
        <TaskDetailPanel 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}

// --- TASK DETAIL PANEL COMPONENT ---
function TaskDetailPanel({ task, onClose }) {
  const [repoLink, setRepoLink] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Task Specifications</span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">✕</button>
        </div>

        {/* Body */}
        <div className="p-8 flex-1 overflow-y-auto space-y-8">
          {/* Status Indicator Explanation */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
             <div className={`w-3 h-3 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
             <p className="text-xs font-bold text-blue-800">
               Current Status: {task.status === 'Completed' ? 'Work Verified' : 'Submission Pending'}
             </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Technical Brief</h4>
            <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-6 rounded-[2rem] border border-slate-100 italic">
              "{task.description}"
            </p>
          </div>

          {/* Integrated Submission - No need to redirect elsewhere */}
          {task.status !== 'Completed' && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submit GitHub Link</h4>
              <input 
                type="text" 
                placeholder="https://github.com/your-repo"
                className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
              />
              <button 
                onClick={() => alert("Submitting...")}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all"
              >
                Confirm Submission
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="p-5 border border-slate-100 rounded-3xl">
      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">{label}</h5>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}