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
            {/* Value Proposition Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CORE VALUE PROPOSITION</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Share a seat on the journey <br />
              <span className="gradient-primary">you're already taking.</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-400 font-normal leading-relaxed">
              SmartRoute connects Route Hosts traveling on their routine commute with Co-Commuters headed in the same direction. Not a taxi. Zero driver dispatch. Just real people sharing empty vehicle seats and splitting fair fuel costs.
            </p>
          </div>

          {/* DUAL-TAB ROUTE SEARCH WIDGET */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-[#090e1a] border border-slate-800 shadow-2xl p-4 sm:p-6 mb-16">
            {/* Widget Mode Tabs */}
            <div className="flex gap-2 p-1 bg-slate-900/90 rounded-2xl w-fit mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('find')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'find'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔍</span> Find an Existing Route
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offer')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'offer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🚗</span> Offer Planned Commute
              </button>
            </div>

            {/* Input Fields */}
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Routine Pickup Point
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm text-blue-400">🟢</span>
                  <input
                    type="text"
                    placeholder="Enter pickup stop (e.g. Guntur)..."
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-5 relative">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Commute Destination
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm text-rose-400">🔴</span>
                  <input
                    type="text"
                    placeholder="Enter destination stop (e.g. Vijayawada)..."
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-5">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{activeTab === 'find' ? 'Match Route' : 'Publish'}</span>
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
                  <span>CORE TECHNICAL ENGINE • TRAJECTORY COMPATIBILITY</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Geometric Route Trajectory Matching
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Matches commuters based on routine route overlap, departure windows, and verified trust.
                </p>
              </div>

              <Link
                to="/smart-matches"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-2 whitespace-nowrap cursor-pointer"
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
                <span className="text-[11px] font-medium text-slate-400 block">EXISTING ROUTE OVERLAP</span>
                <span className="text-xl font-black text-emerald-400 mt-0.5 block">94% Trajectory Overlap</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">FAIR FUEL CONTRIBUTION</span>
                <span className="text-xl font-black text-blue-400 mt-0.5 block">Exact Fuel Split (0% Surge)</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">PEER TRUST VERIFICATION</span>
                <span className="text-xl font-black text-amber-400 mt-0.5 block">Verified Campus & Work ID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE CORE DIFFERENTIATION MATRIX (SmartRoute vs. Taxis) */}
      <section className="py-20 border-b border-slate-800 bg-[#090e1a]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
              FUNDAMENTAL DIFFERENTIATION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why SmartRoute is NOT a Taxi Service
            </h2>
            <p className="text-slate-400 text-sm">
              We connect everyday commuters sharing routine trips—not commercial drivers seeking on-demand fares.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Commercial Taxis Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-rose-900/30 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl font-bold">
                  ✕
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Commercial Taxis & Cabs</h3>
                  <p className="text-xs text-rose-400">Uber / Ola / Rapido Model</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <div>
                    <strong className="text-white block">Commercial Driver Fares:</strong>
                    <span className="text-slate-400">Drivers travel solely for commercial payment; trips are created on demand.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <div>
                    <strong className="text-white block">Surge & Commission Pricing:</strong>
                    <span className="text-slate-400">Prices fluctuate unpredictably with rain and peak demand, taking 25-35% platform fees.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <div>
                    <strong className="text-white block">Driver Dispatch System:</strong>
                    <span className="text-slate-400">An artificial dispatch engine assigns nearby drivers to arbitrary pickup spots.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SmartRoute Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950 border border-emerald-500/40 space-y-6 shadow-xl shadow-emerald-950/20">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">SmartRoute Commute Sharing</h3>
                  <p className="text-xs text-emerald-400">Peer-to-Peer Mobility Model</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <strong className="text-white block">Already-Planned Routine Journeys:</strong>
                    <span className="text-slate-400">Route Hosts are real commuters already traveling to work or university on that route.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <strong className="text-white block">Pure Non-Commercial Fuel Cost Sharing:</strong>
                    <span className="text-slate-400">Transparent mathematical fuel split (Distance ÷ Mileage × Fuel Price ÷ Commuters). 0% surge.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <div>
                    <strong className="text-white block">Trajectory Compatibility Matching:</strong>
                    <span className="text-slate-400">Co-commuters join existing vehicle seats along overlapping routine trajectories.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATS KPI BAR */}
      <section className="py-12 border-b border-slate-800 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white">1,245+</div>
              <div className="text-xs text-slate-400 font-medium">Verified Peer Commuters</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">3,820</div>
              <div className="text-xs text-slate-400 font-medium">Shared Commutes Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-blue-400">₹2,84,000+</div>
              <div className="text-xs text-slate-400 font-medium">Fuel Expenses Saved</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">128,450 km</div>
              <div className="text-xs text-slate-400 font-medium">Clean Shared Trajectory Distance</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE FUEL SHARING CALCULATOR */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            TRANSPARENT FUEL ECONOMICS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
            Calculate Your Routine Commute Fuel Split
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            See how much you save by sharing an existing journey compared to commercial taxi fares.
          </p>
        </div>

        <div className="max-w-3xl mx-auto rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-300">Routine One-Way Commute Distance</label>
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
              <span className="text-[11px] text-slate-400 block font-medium">Commercial Taxi / Auto Fare</span>
              <span className="text-2xl font-bold text-rose-400 mt-1 block">₹{commercialTaxi}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Commercial meter & surge</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Solo Commute Petrol</span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">₹{singleFuelCost}</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Borne 100% by one vehicle owner</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/40">
              <span className="text-[11px] text-blue-300 block font-medium">SmartRoute Shared Fuel Split</span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">₹{sharedCost}</span>
              <span className="text-[10px] text-emerald-300/80 mt-1 block">Fair peer split saves ₹{totalSaved}!</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THREE STEP COMMUTE SHARING WORKFLOW */}
      <section className="py-20 border-t border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">How Co-Commuting Works</h2>
            <p className="text-slate-400 text-sm mt-2">
              Designed for daily college schedules, tech parks, and corporate corridors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WorkflowCard
              step="01"
              icon="🚗"
              title="Host Offers Existing Routine Route"
              description="A commuter already traveling from Origin to Destination publishes their routine schedule and available vehicle seats."
            />
            <WorkflowCard
              step="02"
              icon="📐"
              title="Co-Commuters Match Trajectory"
              description="Our geometric matching engine identifies commuters whose routine path overlaps with the Host's existing commute."
            />
            <WorkflowCard
              step="03"
              icon="🤝"
              title="Request Seat & Share Fuel"
              description="The co-commuter requests an empty seat, the host confirms, and both travel together splitting actual fuel expenses."
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
