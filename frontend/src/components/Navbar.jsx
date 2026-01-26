import React from 'react';

export default function Navbar() {
  // Mock Admin Data
  const adminName = "Admin User";

  return (
    <nav className="bg-white border-b border-slate-200 h-16 flex items-center justify-end px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Admin Name - Professional and simple */}
        <span className="text-sm font-bold text-slate-600">
          Hello, <span className="text-blue-600">{adminName}</span>
        </span>

        {/* Admin Avatar Circle only - No extra icons */}
        <div className="pl-4 border-l border-slate-200">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black shadow-sm border-2 border-white ring-1 ring-slate-200">
            AD
          </div>
        </div>
      </div>
    </nav>
  );
}