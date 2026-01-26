import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  // 1. Logic: State for inputs and feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // 2. Logic: API Request Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post('', {
        email,
        password
      });

      if (response.data.token) {
        localStorage.setItem("userToken", response.data.token);
        // Navigate to dashboard on success
        navigate(
          '/dashboard');
      }
    } catch (err) {
      // Show backend error message or fallback
      setError(err.response?.data?.message || "Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">[X-EPAS] Login</h2>
        
        {/* Logic: Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
            {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="name@company.com" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200 disabled:bg-blue-400"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-4">
          Don't have an account? <a href="/register" className="text-blue-600 hover:underline">Register</a>
        </p>
      </div>
    </div>
  );
}