import React from 'react';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Create Account</h2>
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input type="text" className="w-full mt-1 p-2 border border-slate-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input type="email" className="w-full mt-1 p-2 border border-slate-300 rounded-md" required />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Department</label>
              <select className="w-full mt-1 p-2 border border-slate-300 rounded-md bg-white">
                <option value="frontend">Frontend</option>
                <option value="backend">Backend</option>
                <option value="ai_ml">AI/ML</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input type="password" className="w-full mt-1 p-2 border border-slate-300 rounded-md" required />
          </div>

          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-md transition duration-200 mt-4">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}