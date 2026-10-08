import React from 'react';
import { motion } from 'framer-motion';

export const RideMatchAnimation = ({
  score = 94,
  breakdown = { route: 95, time: 90, pickup: 92, destination: 96, reliability: 98 },
}) => {
  const getBadgeColor = (s) => {
    if (s >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (s >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getTier = (s) => {
    if (s >= 90) return '🟢 Excellent Route Match';
    if (s >= 75) return '🟡 Good Route Match';
    return '🟠 Moderate Match';
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-gray-900/90 border border-blue-500/20 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full border ${getBadgeColor(score)}`}>
            {getTier(score)}
          </span>
          <h4 className="text-white font-bold text-lg mt-1">Smart Route Compatibility</h4>
          <p className="text-gray-400 text-xs">Weighted multi-point geometric algorithm</p>
        </div>

        {/* Circular Radial Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#1e293b"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Animated progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              stroke={score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-white">{score}%</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Match</span>
          </div>
        </div>
      </div>

      {/* 5-Factor Score Breakdown */}
      <div className="mt-4 space-y-2.5">
        <MetricBar label="Route Overlap (40%)" value={breakdown.route} color="bg-blue-500" />
        <MetricBar label="Time Compatibility (20%)" value={breakdown.time} color="bg-indigo-500" />
        <MetricBar label="Pickup Proximity (15%)" value={breakdown.pickup} color="bg-cyan-500" />
        <MetricBar label="Destination Proximity (15%)" value={breakdown.destination} color="bg-emerald-500" />
        <MetricBar label="User Trust & Reliability (10%)" value={breakdown.reliability} color="bg-amber-500" />
      </div>
    </div>
  );
};

const MetricBar = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-gray-300 font-medium">{label}</span>
      <span className="text-white font-bold">{value}%</span>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  </div>
);

export default RideMatchAnimation;
