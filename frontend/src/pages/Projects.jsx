  import React, { useState } from 'react';
  import { useNavigate } from 'react-router-dom';

  export default function Projects() {
    const navigate = useNavigate();
    
    // Modal States
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    // Selected Data for Assignment
    const [selectedProject, setSelectedProject] = useState(null);

    const [projects] = useState([
      { project_id: 1, name: "Inventory System", status: "Active", progress: 45 },
      { project_id: 2, name: "Customer Portal", status: "Completed", progress: 100 },
    ]);

    const openAssignModal = (proj) => {
      setSelectedProject(proj);
      setIsAssignModalOpen(true);
    };

    return (
      <div className="animate-in fade-in duration-500">
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Projects</h1>
            <p className="text-slate-500 font-medium">Manage initiatives and delegate tasks.</p>
          </div>
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            + Create New Project
          </button>
        </div>

        {/* --- PROJECTS TABLE --- */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Name</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Completion</th>
                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((proj) => (
                <tr key={proj.project_id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-slate-800 text-lg">{proj.name}</div>
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">ID: #PROJ-{proj.project_id}</div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border ${
                      proj.status === "Active" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-green-50 text-green-700 border-green-100"
                    }`}>
                      {proj.status}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{ width: `${proj.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 block">{proj.progress}% Complete</span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openAssignModal(proj)} 
                        className="bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Add Task
                      </button>
                      <button 
    onClick={() => navigate(`/projects/${proj.project_id}`)} 
    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all"
  >
    Details
  </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- MODAL 1: CREATE PROJECT --- */}
        {isProjectModalOpen && (
          <ProjectFormModal onClose={() => setIsProjectModalOpen(false)} />
        )}

        {/* --- MODAL 2: ASSIGN TASK --- */}
        {isAssignModalOpen && (
          <AssignTaskModal 
            project={selectedProject} 
            onClose={() => setIsAssignModalOpen(false)} 
          />
        )}
      </div>
    );
  }

  /* --- INTERNAL MODAL COMPONENTS --- */

  function AssignTaskModal({ project, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employeeId: "",
    department: "",
    startDate: "",
    deadline: "",
    priority: "medium"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Deploying Task:", formData);
    alert(`Task "${formData.title}" deployed to ${project.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Glassmorphism Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Premium Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create & Assign Task</h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
              Project Context: {project?.name}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-sm">✕</button>
        </div>

        {/* Scrollable Form Body */}
        <form className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          
          {/* 1. Title Input */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
            <input 
              required
              type="text"
              placeholder="e.g., Implement OAuth2 Provider"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* 2. Instructions (The ML Evaluation Context) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructions (ML Evaluation Context)</label>
            <textarea 
               required
               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none font-medium leading-relaxed"
               placeholder="Be specific. The ML model evaluates based on these technical requirements..."
               onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* 3. Dropdown Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none appearance-none cursor-pointer"
                onChange={(e) => setFormData({...formData, department: e.target.value})}
              >
                <option value="">Select Dept</option>
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="ai-ml">AI/ML</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assignee</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none appearance-none cursor-pointer"
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              >
                <option value="">Choose Employee</option>
                <option value="1">Alice Johnson</option>
                <option value="2">Bob Smith</option>
              </select>
            </div>
          </div>

          {/* 4. Dates Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none"
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
              <input 
                required
                type="date" 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none border-blue-100"
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
          </div>

          {/* 5. Priority Toggles */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Task Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFormData({...formData, priority: p})}
                  className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                    formData.priority === p 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.02]' 
                    : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100 mt-4 active:scale-95">
            Deploy Task to Workspace
          </button>
        </form>
      </div>
    </div>
  );
}

  function ProjectFormModal({ onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("New Project Data:", formData);
    // Add logic to save the project to your state or database here
    alert(`Project "${formData.title}" has been initialized.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Project</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Initialize a new initiative
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-all shadow-sm"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form className="p-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Project Title */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Project Title
            </label>
            <input 
              required
              type="text"
              placeholder="e.g., Q3 Cloud Migration"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Description
            </label>
            <textarea 
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none font-medium leading-relaxed"
              placeholder="Outline the goals and scope of this project..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Final Deadline
            </label>
            <input 
              required
              type="date" 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none border-blue-50 focus:border-blue-500 transition-colors"
              value={formData.deadline}
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
            />
          </div>

          {/* Action Button */}
          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl hover:bg-black transition-all shadow-xl mt-4 active:scale-95"
          >
            Create Project
          </button>
        </form>
      </div>
    </div>
  );
}