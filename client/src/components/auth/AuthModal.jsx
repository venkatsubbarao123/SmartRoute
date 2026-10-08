import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [userType, setUserType] = useState('student'); // 'student' | 'employee' | 'general'
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    organization: '',
    department: '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        if (!formData.email || !formData.password) {
          toast.error('Please enter both email and password');
          setSubmitting(false);
          return;
        }

        try {
          const res = await api.post('/auth/login', {
            email: formData.email,
            password: formData.password,
          });
          const { token, user } = res.data;
          if (token) localStorage.setItem('smartroute_token', token);
          if (user) {
            localStorage.setItem('smartroute_user', JSON.stringify(user));
            localStorage.setItem('smartroute_active_user', JSON.stringify(user));
            onAuthSuccess?.(user);
            toast.success(`Welcome back, ${user.name}! 🎉`);
            onClose();
          }
        } catch (apiErr) {
          const msg = apiErr.response?.data?.message || 'Unable to connect to authentication server. Please check your credentials.';
          toast.error(msg);
        }
      } else {
        if (!formData.name || !formData.email || !formData.password || !formData.phone) {
          toast.error('Please fill in all fields (Name, Email, Phone, Password)');
          setSubmitting(false);
          return;
        }

        const cleanPhone = formData.phone.replace(/[\s\-()]/g, '');
        if (cleanPhone.length < 10) {
          toast.error('Please enter a valid 10-digit phone number');
          setSubmitting(false);
          return;
        }

        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters long');
          setSubmitting(false);
          return;
        }

        try {
          const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: cleanPhone,
            password: formData.password,
            userType,
            organization: formData.organization,
            department: formData.department,
          };
          const res = await api.post('/auth/register', payload);
          const { token, user } = res.data || {};
          if (token) localStorage.setItem('smartroute_token', token);
          if (user) {
            localStorage.setItem('smartroute_user', JSON.stringify(user));
            localStorage.setItem('smartroute_active_user', JSON.stringify(user));
            onAuthSuccess?.(user);
            toast.success(`Account created! Welcome to SmartRoute, ${user.name}! 🚀`);
            onClose();
          } else {
            toast.success('Registration successful! Please sign in.');
            setMode('login');
          }
        } catch (apiErr) {
          const msg = apiErr.response?.data?.message || apiErr.message || 'Registration failed. Please check details and try again.';
          toast.error(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg rounded-2xl bg-[#090e1a] border border-slate-800 shadow-2xl p-6 sm:p-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-3">
            <span className="text-lg font-black tracking-wider">SR</span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Sign in to SmartRoute' : 'Create your Account'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Smart Route & Cost Sharing Platform for Daily Commuters
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
              mode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            New Registration
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              {/* Persona Selector */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">I am registering as</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'student', label: 'Student', icon: '🎓' },
                    { id: 'employee', label: 'Employee', icon: '👨‍💼' },
                    { id: 'general', label: 'General', icon: '👤' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setUserType(p.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        userType === p.id
                          ? 'border-blue-500 bg-blue-600/15 text-blue-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    {userType === 'student' ? 'College / University' : userType === 'employee' ? 'Company Name' : 'City / Location'}
                  </label>
                  <input
                    type="text"
                    name="organization"
                    placeholder={userType === 'student' ? 'e.g. University / College' : 'e.g. Enterprise / Company'}
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 00000"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition mt-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default AuthModal;
