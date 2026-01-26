import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const employee = {
    name: "Alice Johnson",
    role: "Frontend Developer",
    modelScore: 88,
    performanceLabel: "Excellent",
    tasks: [
      { id: 101, title: "Fix Header CSS", project: "Inventory System", status: "Completed" },
      { id: 102, title: "Auth Integration", project: "Customer Portal", status: "In Progress" },
    ]
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 border-green-200 bg-green-50";
    if (score >= 50) return "text-blue-600 border-blue-200 bg-blue-50";
    return "text-red-600 border-red-200 bg-red-50";
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => navigate('/employees')} 
        className="mb-8 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        ← Back to Team
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Evaluation Score Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-3xl font-black text-slate-300 mb-6 border border-slate-100">
              {employee.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{employee.name}</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-tighter mb-10">{employee.role}</p>

            {/* THE SCORE GAUGE */}
            <div className="relative flex items-center justify-center mb-8">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={439.8}
                  strokeDashoffset={439.8 - (439.8 * employee.modelScore) / 100}
                  className={employee.modelScore >= 80 ? "text-green-500" : "text-blue-500"}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">{employee.modelScore}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">Score Index</span>
              </div>
            </div>

            <div className={`w-full py-4 px-4 rounded-2xl border text-center font-black uppercase text-xs tracking-widest ${getScoreColor(employee.modelScore)}`}>
              Status: {employee.performanceLabel}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Task Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm min-h-full">
            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight px-2">Assigned Tasks & Progress</h3>
            <div className="space-y-4">
              {employee.tasks.map(task => (
                <div key={task.id} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                  <div>
                    <h4 className="font-black text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.project}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-4 py-2 rounded-xl border ${
                    task.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-[11px] text-slate-400 text-center font-bold leading-relaxed">
                <span className="text-blue-500 font-black">AI EVALUATION NOTE:</span> This score is calculated using the EPAS Model by cross-referencing task deadlines, code complexity, and instruction adherence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}