import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function AssignTask() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State management using your structure
  const [formData, setFormData] = useState({
    description: "",
    employeeId: "",
    department: "",
    deadline: "",
    priority: "medium",
    projectId: searchParams.get('projectId') || "" // Captures project context
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Task has been successfully assigned.");
    navigate('/admin-dashboard');
  };

  return (
    // Removed DashboardLayout - App.jsx now handles the frame
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create & Assign Task</h1>
          <p className="text-slate-500 mt-1 font-medium">
            The ML model will evaluate the submission based on these details.
          </p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold transition-all"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Sub-header inside the card */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Specifications</span>
        </div>

        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* 1. Description Space */}
          <div className="space-y-2">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">
              Task Instructions & Requirements
            </label>
            <textarea
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all h-48 resize-none font-medium"
              placeholder="Describe the technical task. Mention specific libraries or patterns if the ML model needs to check for them..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 2. Department & Employee Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">Department</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Department</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="ai-ml">AI/ML</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">Assign to Employee</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              >
                <option value="">Choose an employee...</option>
                <option value="1">John Doe (Senior Dev)</option>
                <option value="2">Jane Smith (Junior Designer)</option>
              </select>
            </div>

            {/* 3. Deadlines & Priorities */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">Completion Deadline</label>
              <input
                required
                type="date"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-wider">Task Priority Level</label>
              <div className="flex gap-2 h-[58px]">
                {['Low', 'Medium', 'High'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p.toLowerCase()})}
                    className={`flex-1 rounded-xl border text-xs font-black uppercase transition-all ${
                      formData.priority === p.toLowerCase() 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-slate-600 font-bold px-4 py-2 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-100 transition-all transform active:scale-95"
            >
              Deploy Task
            </button>
          </div>
        </form>
      </div>

      {/* Logic Reminder */}
      <div className="mt-8 p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-4 items-center">
        <div className="text-2xl">🤖</div>
        <p className="text-sm text-blue-700 font-medium leading-relaxed">
          <strong>Pro-tip:</strong> Be specific in the instructions. The evaluation model compares the employee's code submission against these requirements to calculate the final <strong>Performance Score</strong>.
        </p>
      </div>
    </div>
  );
} 