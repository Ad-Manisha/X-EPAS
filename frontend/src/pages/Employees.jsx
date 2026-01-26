import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Employees() {
  const navigate = useNavigate();

  const employees = [
    { id: 1, name: "Alice Johnson", role: "Frontend Dev", projects: 3, completion: 92, status: "Evaluated", label: "Excellent" },
    { id: 2, name: "Bob Smith", role: "Backend Dev", projects: 2, completion: 45, status: "Pending", label: "N/A" },
    { id: 3, name: "Charlie Davis", role: "AI Engineer", projects: 4, completion: 78, status: "Evaluated", label: "Satisfactory" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Team Performance</h1>
          <p className="text-slate-500 font-medium">Model-generated evaluations and productivity metrics.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Projects</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Completion</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-lg">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{emp.role}</div>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center text-slate-600 font-bold">{emp.projects}</td>
                <td className="p-6 text-center text-slate-600 font-black">{emp.completion}%</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                    emp.status === "Evaluated" ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}