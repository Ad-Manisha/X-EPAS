import React from 'react';

export default function AdminDashboard() {
  const stats = {
    totalProjects: 5,
    activeProjects: 3,
    totalTasks: 24,
    completedTasks: 18,
    overallProgress: 75
  };

  const recentActivity = [
    { id: 1, action: "Task Added", detail: "Fix Login Bug", project: "Inventory System", time: "2 hours ago" },
    { id: 2, action: "Project Created", detail: "Marketing Site", project: "N/A", time: "5 hours ago" },
    { id: 3, action: "Task Completed", detail: "Database Schema", project: "Inventory System", time: "Yesterday" },
  ];

  const upcomingDeadlines = [
    { id: 1, task: "API Integration", project: "Inventory System", deadline: "Jan 26", status: "In Progress" },
    { id: 2, task: "UI Design", project: "Marketing Site", deadline: "Jan 28", status: "Pending" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-1">Real-time summary of projects and task distribution.</p>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.totalProjects} color="bg-blue-600" />
        <StatCard title="Active Projects" value={stats.activeProjects} color="bg-indigo-600" />
        <StatCard title="Total Tasks" value={stats.totalTasks} color="bg-slate-800" />
        <StatCard title="Completed Tasks" value={stats.completedTasks} color="bg-green-600" />
      </div>

      {/* 3. Overall Progress & Deadlines Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Overall Task Completion</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-4xl font-black text-slate-900">{stats.overallProgress}%</span>
              <span className="text-sm font-medium text-slate-500">{stats.completedTasks} of {stats.totalTasks} Tasks Finished</span>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${stats.overallProgress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Deadlines (Next 7 Days)</h2>
          <div className="space-y-4">
            {upcomingDeadlines.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.task}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{item.project}</p>
                </div>
                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                  {item.deadline}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Recent Activity Log</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivity.map(log => (
            <div key={log.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${log.action.includes('Completed') ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold">{log.action}:</span> {log.detail}
                  </p>
                  <p className="text-xs text-slate-400">{log.project}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
      <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-slate-900">{value}</span>
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
      </div>
    </div>
  );
}