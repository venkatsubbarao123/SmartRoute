import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BikeAnimation from '../components/animations/BikeAnimation';

export const Landing = ({ onOpenAuth }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'offer'
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [calcDistance, setCalcDistance] = useState(18);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'find') {
      navigate(`/find-route?from=${encodeURIComponent(pickup)}&to=${encodeURIComponent(drop)}`);
    } else {
      navigate(`/offer-route?from=${encodeURIComponent(pickup)}&to=${encodeURIComponent(drop)}`);
    }
  };

  // Non-commercial fuel cost sharing math: Distance ÷ Mileage × Fuel Price ÷ Participants
  const singleFuelCost = Math.round((calcDistance / 45) * 117.68);
  const sharedCost = Math.max(10, Math.round(singleFuelCost / 2));
  const commercialTaxi = Math.round(calcDistance * 16 + 50);
  const totalSaved = commercialTaxi - sharedCost;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-slate-800/60">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Smart Route & Cost Sharing Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Share Everyday Commutes. <br />
              <span className="gradient-primary">Split Travel Fuel Expenses.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
              Connect with verified students and professionals traveling on your exact daily route.
              Zero surge fares, verified institutional identities, and transparent cost contribution.
            </p>
          </div>

          {/* DUAL-TAB ROUTE SEARCH WIDGET */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#090e1a] border border-slate-800 shadow-2xl p-4 sm:p-6 mb-16">
            {/* Widget Mode Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900/90 rounded-2xl w-fit mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('find')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'find'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔍</span> Find a Shared Route
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offer')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'offer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🚗</span> Offer Available Seats
              </button>
            </div>

            {/* Input Fields */}
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Pickup Location
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm text-blue-400">🟢</span>
                  <input
                    type="text"
                    placeholder="Enter your pickup location..."
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Destination
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm text-rose-400">🔴</span>
                  <input
                    type="text"
                    placeholder="Enter your destination..."
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>{activeTab === 'find' ? 'Search' : 'Publish'}</span>
                  <span>➔</span>
                </button>
              </div>
            </form>
          </div>

          {/* THE CORE TECHNICAL HIGHLIGHT: SMART ROUTE MATCHING ENGINE */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#090e1a]/80 border border-blue-500/25 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>CORE TECHNICAL HIGHLIGHT • 5-FACTOR MATCHING ENGINE</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Geometric Route Trajectory Compatibility
                </h3>
              </div>

              <Link
                to="/smart-matches"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-2"
              >
                <span>Launch Matching Engine</span>
                <span>➔</span>
              </Link>
            </div>

            {/* Embedded Bike Animation Frame */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80">
              <BikeAnimation size="lg" isMoving={true} showRoad={true} speed={46} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">ROUTE COMPATIBILITY</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">94% Geometric Overlap</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">ESTIMATED CONTRIBUTION</span>
                <span className="text-xl font-black text-blue-400 mt-0.5 block">Shared Fuel Split</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">TRUST VERIFICATION</span>
                <span className="text-xl font-black text-amber-400 mt-0.5 block">Campus & Corp ID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS KPI BAR */}
      <section className="py-12 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">1,245+</div>
              <div className="text-xs text-slate-400 font-medium">Verified Commuters</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">3,820</div>
              <div className="text-xs text-slate-400 font-medium">Shared Trips Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">₹2,84,000+</div>
              <div className="text-xs text-slate-400 font-medium">Estimated Fuel Expenses Saved</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">128,450 km</div>
              <div className="text-xs text-slate-400 font-medium">Clean Shared Commute Distance</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE COST SAVING CALCULATOR */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            TRANSPARENT ECONOMICS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
            Calculate Your Commute Savings
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            See how much you save on fuel each day compared to commercial taxis and solo vehicle usage.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Daily One-Way Commute Distance</label>
              <span className="text-sm font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/20">
                {calcDistance} km
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="50"
              value={calcDistance}
              onChange={(e) => setCalcDistance(Number(e.target.value))}
              className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800 text-center">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Commercial Taxi / Auto</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">₹{commercialTaxi}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Includes high meter & surge</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Solo Commute Petrol</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">₹{singleFuelCost}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">100% borne by one driver</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/40">
              <span className="text-[11px] text-blue-300 block font-medium">SmartRoute Shared Split</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">₹{sharedCost}</span>
              <span className="text-[10px] text-emerald-300/80 mt-1 block">You save ₹{totalSaved} per ride!</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. THREE STEP WORKFLOW */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">How SmartRoute Works</h2>
            <p className="text-slate-400 text-sm mt-2">
              Designed for daily college schedules, corporate corridors, and intercity trips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WorkflowCard
              step="01"
              icon="📍"
              title="Enter Routine Route"
              description="Input your routine pickup point and daily destination. Our routing engine calculates waypoints and direct paths."
            />
            <WorkflowCard
              step="02"
              icon="🧠"
              title="Intelligent Route Matching"
              description="Our 5-factor geometric engine compares route trajectory, timing, and rider trust to deliver a verified 90%+ match score."
            />
            <WorkflowCard
              step="03"
              icon="🤝"
              title="Meet at Pickup & Share Fuel"
              description="Confirm mutual route departure with verified student/employee credentials and contribute transparently toward the journey fuel."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const WorkflowCard = ({ step, icon, title, description }) => (
  <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 relative hover:border-blue-500/40 transition">
    <div className="flex justify-between items-start mb-4">
      <span className="text-3xl">{icon}</span>
      <span className="text-2xl font-black text-slate-800">{step}</span>
    </div>
    <h3 className="text-base font-bold text-white mb-2">{title}</h3>
    <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
  </div>
);

export default Landing;
