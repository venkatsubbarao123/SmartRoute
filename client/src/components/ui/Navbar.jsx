import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar = ({ user, onOpenAuth, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/find-route', label: 'Find a Shared Route' },
    { to: '/offer-route', label: 'Offer Available Seats' },
    { to: '/smart-matches', label: 'Smart Matches', highlight: true },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin', label: 'Analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030712]/80 backdrop-blur-xl border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-[1.5px] shadow-lg shadow-blue-600/20 group-hover:shadow-blue-500/40 transition">
              <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
                <span className="text-base font-extrabold text-white tracking-wider">SR</span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">SmartRoute</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PLATFORM
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-wide uppercase">
                Smart Route & Cost Sharing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                      : link.highlight
                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {link.highlight && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{user.name}</span>
                      <span className="text-[10px] text-emerald-400" title="Verified Member">✓</span>
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">
                      {user.userType || 'Student'} • {user.organization || 'Verified'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/60 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth?.('login')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth?.('register')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 bg-[#090e1a] border-b border-slate-800 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl text-xs font-semibold ${
                location.pathname === link.to ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
