import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock Data for a single project
  const [project] = useState({
    id: id,
    name: "Inventory System",
    description: "A full-stack application to manage warehouse stock levels and automated reordering.",
    status: "Active",
    startDate: "2026-01-01",
    deadline: "2026-03-15",
    progress: 45,
    tasks: [
      { id: 101, title: "Database Schema Design", assignee: "John Doe", status: "Completed", priority: "High" },
      { id: 102, title: "API Authentication", assignee: "Jane Smith", status: "In Progress", priority: "High" },
      { id: 103, title: "UI Components", assignee: "John Doe", status: "Assigned", priority: "Medium" },
    ]
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <button 
            onClick={() => navigate('/projects')}
            className="text-blue-600 font-bold text-sm mb-2 flex items-center gap-1 hover:underline"
          >
            ← Back to Projects
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-slate-500 font-medium mt-1">{project.description}</p>
        </div>
        
        <div className="flex gap-3">
            <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100 font-black uppercase text-xs flex items-center">
                {project.status}
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overall Progress</p>
            <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-black text-slate-900">{project.progress}%</span>
                <span className="text-xs font-bold text-slate-400">Target: March 15</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Timeline</p>
            <p className="text-lg font-bold text-slate-800">{project.startDate}</p>
            <p className="text-xs font-medium text-slate-400">Start Date</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-red-600">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Final Deadline</p>
            <p className="text-lg font-bold">{project.deadline}</p>
            <p className="text-xs font-medium text-slate-400 uppercase">Countdown: 48 Days left</p>
        </div>
      </div>

      {/* Task Table for this Project */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900">Assigned Project Tasks</h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                {project.tasks.length} Total Tasks
            </span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Task Title</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {project.tasks.map((task) => (
              <tr key={task.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="p-6">
                  <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">{task.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">ID: #{task.id}</span>
                </td>
                <td className="p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600">
                            {task.assignee.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-600">{task.assignee}</span>
                    </div>
                </td>
                <td className="p-6">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase ${
                        task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                        {task.priority}
                    </span>
                </td>
                <td className="p-6 text-right">
                  <span className={`text-xs font-black uppercase ${
                    task.status === 'Completed' ? 'text-green-500' : 'text-blue-500'
                  }`}>
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}