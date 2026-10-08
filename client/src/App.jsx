import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import Navbar from './components/ui/Navbar';
import AuthModal from './components/auth/AuthModal';
import Landing from './pages/Landing';
import FindRoute from './pages/FindRoute';
import OfferRoute from './pages/OfferRoute';
import SmartMatches from './pages/SmartMatches';
import Dashboard from './pages/Dashboard';
import AdminAnalytics from './pages/AdminAnalytics';

function App() {
  // Real user state initialized from localStorage if available
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartroute_active_user') || localStorage.getItem('smartroute_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    localStorage.setItem('smartroute_active_user', JSON.stringify(authenticatedUser));
    localStorage.setItem('smartroute_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('smartroute_active_user');
    localStorage.removeItem('smartroute_user');
    localStorage.removeItem('smartroute_token');
    toast.success('Logged out successfully');
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#090e1a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '14px',
              fontSize: '13px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            },
          }}
        />

        {/* Global Navigation Header */}
        <Navbar
          user={user}
          onOpenAuth={handleOpenAuth}
          onLogout={handleLogout}
        />

        {/* Clean Unified Canonical Routes */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing onOpenAuth={handleOpenAuth} />} />
            <Route path="/find-route" element={<FindRoute />} />
            <Route path="/offer-route" element={<OfferRoute />} />
            <Route path="/smart-matches" element={<SmartMatches user={user} />} />
            <Route path="/dashboard" element={<Dashboard user={user} onOpenAuth={handleOpenAuth} />} />
            <Route path="/admin" element={<AdminAnalytics />} />

            {/* Seamless Redirects for legacy aliases */}
            <Route path="/find-ride" element={<Navigate replace to="/find-route" />} />
            <Route path="/offer-ride" element={<Navigate replace to="/offer-route" />} />
            <Route path="/smart-match" element={<Navigate replace to="/smart-matches" />} />
            <Route path="/live-experience" element={<Navigate replace to="/smart-matches" />} />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </main>

        {/* Global Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* Global Footer */}
        <footer className="border-t border-slate-800/80 bg-[#02050e] py-12 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Brand Details */}
              <div className="flex flex-col items-center md:items-start space-y-1 text-center md:text-left">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                    SR
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tight">SmartRoute</span>
                </div>
                <p className="text-slate-400 text-xs font-medium">
                  "Share a seat on the journey you're already taking."
                </p>
                <p className="text-slate-500 text-[11px]">
                  Peer-to-peer shared commute & fuel cost sharing platform.
                </p>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 font-medium">
                <Link to="/" className="hover:text-blue-400 transition">Overview</Link>
                <Link to="/find-route" className="hover:text-blue-400 transition">Find a Route</Link>
                <Link to="/offer-route" className="hover:text-blue-400 transition">Offer Seats</Link>
                <Link to="/smart-matches" className="hover:text-blue-400 transition">Smart Matches</Link>
                <Link to="/admin" className="hover:text-blue-400 transition">Analytics</Link>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
              <p>© 2026 SmartRoute Mobility Network. Non-commercial peer cost contribution model • "Share a seat on the journey you're already taking."</p>
              <div className="flex gap-4">
                <span>Enterprise Grade Architecture</span>
                <span>•</span>
                <span>Verified Trust Verification</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
