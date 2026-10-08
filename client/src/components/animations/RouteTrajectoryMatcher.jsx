import React from 'react';
import { motion } from 'framer-motion';

export const RouteTrajectoryMatcher = ({
  driverRoute = { from: 'Origin Stop', to: 'Destination Stop' },
  commuterRoute = { from: 'Pickup Stop', to: 'Dropoff Stop' },
  matchScore = 0,
  sharedDistanceKm = 0,
  totalDistanceKm = 0,
  detourKm = 0,
  overlapPercent = 0,
  timeWindow = '± 10 mins',
  scheduledTime = '--:--',
  contribution = 0,
}) => {
  // Calculate relative progress width for visual animation
  const overlapRatio = totalDistanceKm > 0 
    ? Math.min(100, Math.max(15, Math.round((sharedDistanceKm / totalDistanceKm) * 100))) 
    : 80;

  return (
    <div className="relative w-full rounded-2xl bg-[#090e1a] border border-slate-800 p-6 shadow-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Route Trajectory Analysis
          </h4>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          {matchScore}% Compatible
        </span>
      </div>

      {/* Trajectory Comparison Visualizer */}
      <div className="relative p-5 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden">
        {/* Subtle coordinate grid lines */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 space-y-4">
          {/* Driver Route Trajectory */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Host Commute Path (Full Routine Route)
              </span>
              <span className="text-blue-400 font-mono text-[11px] font-semibold">
                {totalDistanceKm} km total
              </span>
            </div>
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span className="truncate max-w-[45%]">{driverRoute.from}</span>
              <span className="truncate max-w-[45%] text-right">{driverRoute.to}</span>
            </div>
          </div>

          {/* Commuter Route Trajectory */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Your Desired Commute (Overlap Segment)
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                {sharedDistanceKm} km shared
              </span>
            </div>
            <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                className="h-full bg-emerald-500 rounded-full"
                style={{ marginLeft: `${Math.max(0, 100 - overlapRatio)}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${overlapRatio}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span className="truncate max-w-[45%]" style={{ marginLeft: `${Math.max(0, 100 - overlapRatio)}%` }}>
                {commuterRoute.from}
              </span>
              <span className="truncate max-w-[45%] text-right">{commuterRoute.to}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlap Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Route Alignment</span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">
            {overlapPercent}% Along Path
          </span>
          <span className="text-[10px] text-slate-500">
            {detourKm > 0 ? `Only ${detourKm} km detour` : 'Direct corridor alignment'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Departure Window</span>
          <span className="text-base font-bold text-blue-400 mt-0.5 block">{timeWindow}</span>
          <span className="text-[10px] text-slate-500">Scheduled {scheduledTime}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fair Fuel Share</span>
          <span className="text-base font-bold text-amber-400 mt-0.5 block">
            ₹{contribution} Contribution
          </span>
          <span className="text-[10px] text-slate-500">Non-commercial split</span>
        </div>
      </div>
    </div>
  );
};

export default RouteTrajectoryMatcher;
