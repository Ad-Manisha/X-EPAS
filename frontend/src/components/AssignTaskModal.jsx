// src/components/AssignTaskModal.jsx
export default function AssignTaskModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-xl font-bold text-slate-800">Assign New Task</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form className="p-6 space-y-4">
          {/* 1. Description Space */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Task Description</label>
            <textarea 
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-32"
              placeholder="Explain the technical requirements and objectives..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 2. Employee Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Assign to Employee</label>
              <select className="w-full p-3 border border-slate-300 rounded-xl bg-white outline-none">
                <option>Select Employee...</option>
                <optgroup label="Frontend">
                  <option>Alice (React Developer)</option>
                </optgroup>
                <optgroup label="AI/ML">
                  <option>Bob (Data Scientist)</option>
                </optgroup>
              </select>
            </div>

            {/* 3. Deadline Setting */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Deadline</label>
              <input 
                type="date" 
                className="w-full p-3 border border-slate-300 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200"
            >
              Confirm Assignment
            </button>
            <button 
              onClick={onClose}
              type="button"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}