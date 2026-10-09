import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ user, onOpenAuth, onLogout }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const isLight = theme === 'light';

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/find-route', label: 'Find a Shared Route' },
    { to: '/offer-route', label: 'Offer Available Seats' },
    { to: '/smart-matches', label: 'Smart Matches', highlight: true },
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin', label: 'Analytics' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-xl transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-b border-gray-200/90 text-gray-900 shadow-xs'
          : 'bg-[#030712]/80 border-b border-slate-800/80 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1.5px] shadow-sm shadow-blue-600/30 group-hover:shadow-blue-600/50 transition">
              <div
                className={`w-full h-full rounded-[10px] flex items-center justify-center font-extrabold text-sm tracking-wider ${
                  isLight ? 'bg-white text-blue-600' : 'bg-[#090e1a] text-white'
                }`}
              >
                SR
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-extrabold tracking-tight transition-colors ${
                    isLight ? 'text-gray-900' : 'text-white'
                  }`}
                >
                  SmartRoute
                </span>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  PLATFORM
                </span>
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide uppercase ${
                  isLight ? 'text-gray-500' : 'text-slate-400'
                }`}
              >
                Smart Route & Cost Sharing
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;

              let linkClasses = '';
              if (isActive) {
                linkClasses = 'bg-blue-600 text-white shadow-sm';
              } else if (link.highlight) {
                linkClasses = isLight
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/80 font-bold'
                  : 'bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20';
              } else {
                linkClasses = isLight
                  ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60';
              }

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${linkClasses}`}
                >
                  {link.highlight && (
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        isLight ? 'bg-blue-600' : 'bg-blue-400'
                      }`}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Auth & Theme Switcher Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button (Light <-> Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? 'dark' : 'light'} theme`}
              title={`Switch to ${isLight ? 'dark' : 'light'} theme`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                isLight
                  ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <span className="text-sm leading-none">{isLight ? '🌙' : '☀️'}</span>
              <span className="hidden sm:inline">{isLight ? 'Dark' : 'Light'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition ${
                    isLight
                      ? 'bg-gray-50 border-gray-200 text-gray-900'
                      : 'bg-slate-900/90 border-slate-800 text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow-xs">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div
                      className={`text-xs font-bold flex items-center gap-1 ${
                        isLight ? 'text-gray-900' : 'text-white'
                      }`}
                    >
                      <span>{user.name}</span>
                      <span className="text-[10px] text-emerald-500 font-black" title="Verified Member">✓</span>
                    </div>
                    <div
                      className={`text-[10px] capitalize ${
                        isLight ? 'text-gray-500' : 'text-slate-400'
                      }`}
                    >
                      {user.userType || 'Student'} • {user.organization || 'Verified'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    isLight
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('login')}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    isLight
                      ? 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/80 border-transparent'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('register')}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl border transition cursor-pointer ${
                isLight
                  ? 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
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
        <div
          className={`lg:hidden px-4 pt-2 pb-4 border-b space-y-1 ${
            isLight ? 'bg-white border-gray-200' : 'bg-[#090e1a] border-slate-800'
          }`}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isLight
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default Navbar;
