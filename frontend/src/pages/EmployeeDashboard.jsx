import React, { useState, useEffect } from 'react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); 

  // --- MOCK DATA FETCHING ---
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        // Simulating API call delay
        setTimeout(() => {
          const mockResult = {
            stats: { activeProjects: 2, totalTasks: 10, completedTasks: 6, assignedTasks: 4 },
            myTasks: [
              { id: 101, title: "Refactor API Logic", project: "Inventory System", deadline: "2026-01-20", status: "Assigned" }, 
              { id: 102, title: "Design Landing Page", project: "Marketing Web", deadline: "2026-01-30", status: "Assigned" }, 
              { id: 103, title: "Database Schema", project: "Inventory System", deadline: "2026-01-15", status: "Completed" },
            ]
          };
          setData(mockResult);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      }
    };
    fetchEmployeeData();
  }, []);

  // --- SUBMISSION HANDLER ---
  const handleTaskSubmit = (taskId, repoLink) => {
    if (!repoLink || !repoLink.includes("github.com")) {
      alert("Please enter a valid GitHub repository link.");
      return;
    }

    // Update local state to reflect completion
    const updatedTasks = data.myTasks.map(task => 
      task.id === taskId ? { ...task, status: "Completed" } : task
    );
    setData({ ...data, myTasks: updatedTasks });

    // Trigger Centered Accomplishment Toast
    setToast(`Task #${taskId} successfully deployed for AI evaluation!`);
    
    // Auto-hide toast after 3 seconds
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Syncing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700 relative">
      
      {/* --- CENTERED ACCOMPLISHMENT OVERLAY --- */}
      {toast && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none px-4 bg-slate-900/10 backdrop-blur-[2px]">
          <div className="bg-slate-900 text-white px-10 py-8 rounded-[3.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] flex flex-col items-center gap-5 animate-in zoom-in spin-in-1 duration-500 border border-slate-700 pointer-events-auto">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl shadow-2xl shadow-green-500/40 animate-bounce">
              🚀
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black tracking-tighter mb-1">Accomplished!</h2>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-[250px]">
                {toast}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">My Workspace</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your GitHub submissions and track performance scores.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session</p>
          <p className="text-sm font-bold text-blue-600">Employee ID: #EP-992</p>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Projects" value={data.stats.activeProjects} icon="📁" color="blue" />
        <StatCard title="Tasks Completed" value={data.myTasks.filter(t => t.status === "Completed").length} icon="✅" color="green" />
        <StatCard title="Performance Rate" value="94%" icon="🎯" color="amber" />
        <StatCard title="Global Rank" value="#12" icon="🏆" color="slate" />
      </div>

      {/* 3. Task Assignments List */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Live Assignments</h2>
          <div className="h-px flex-1 bg-slate-100"></div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {data.myTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onSubmit={handleTaskSubmit} 
            />
          ))}
        </div>
      </div>

      {/* 4. Pro-tip Section */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 text-9xl font-black -mr-10 -mt-10 tracking-tighter italic">AI</div>
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🤖</div>
        <div>
          <h4 className="text-lg font-bold">ML Evaluation Tip</h4>
          <p className="text-slate-400 text-sm max-w-xl">
            Our X-EPAS model evaluates your GitHub code against task instructions. Ensure your commit messages are clear and your repository is public for the best score.
          </p>
        </div>
      </div>

    </div>
  );
}

// --- TASK CARD COMPONENT ---
function TaskCard({ task, onSubmit }) {
  const [repoLink, setRepoLink] = useState("");
  const isCompleted = task.status === "Completed";

  return (
    <div className={`group bg-white p-7 rounded-[3rem] border transition-all duration-700 ${
      isCompleted 
      ? 'border-green-200 bg-green-50/20' 
      : 'border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Task Info */}
        <div className="flex items-start gap-6">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl transition-all duration-500 ${
            isCompleted 
            ? 'bg-green-500 text-white scale-90 shadow-lg shadow-green-200' 
            : 'bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
          }`}>
            {isCompleted ? "✓" : "💻"}
          </div>
          <div>
            <h3 className={`text-xl font-black tracking-tight transition-all ${
              isCompleted ? 'text-green-900/30 line-through' : 'text-slate-800'
            }`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                {task.project}
              </span>
              {!isCompleted && (
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
                  Deadline: {task.deadline}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Input/Status Logic */}
        {!isCompleted ? (
          <div className="flex flex-1 max-w-2xl items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
            <input 
              type="text" 
              placeholder="Enter GitHub Repository URL (e.g. github.com/user/repo)..."
              className="flex-1 bg-slate-50 border border-slate-200 px-6 py-4 rounded-[1.8rem] text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-300"
              value={repoLink}
              onChange={(e) => setRepoLink(e.target.value)}
            />
            <button 
              onClick={() => onSubmit(task.id, repoLink)}
              className="bg-slate-900 text-white px-10 py-4 rounded-[1.8rem] text-[11px] font-black tracking-widest hover:bg-blue-600 transition-all active:scale-90 shadow-xl shadow-slate-200"
            >
              DEPLOY
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-green-600 font-black text-xs uppercase bg-white px-8 py-4 rounded-[2rem] border-2 border-green-200 shadow-sm animate-in zoom-in duration-500">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="leading-none">Verified</p>
              <p className="text-[9px] opacity-60">Waiting for Score</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- STAT CARD COMPONENT ---
function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between h-44 hover:shadow-lg transition-all group">
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      </div>
    </div>
  );
} 