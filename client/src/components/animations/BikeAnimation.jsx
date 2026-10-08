import React from 'react';
import { motion } from 'framer-motion';

export const BikeAnimation = ({ size = 'md', isMoving = true, showRoad = true, speed = 45 }) => {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.3 : 1;

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden py-4">
      {/* Moving bike container */}
      <motion.div
        className="relative z-10"
        style={{ transform: `scale(${scale})` }}
        animate={isMoving ? { y: [-2, 2, -2], rotate: [-0.8, 1, -0.8] } : {}}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="240" height="150" viewBox="0 0 240 150" fill="none" className="drop-shadow-2xl">
          <defs>
            {/* Glow filters */}
            <filter id="headlight-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="bike-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="helmet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="beam-grad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Headlight beam */}
          {isMoving && (
            <polygon
              points="185,82 240,65 240,115 185,90"
              fill="url(#beam-grad)"
              className="opacity-75"
            />
          )}

          {/* Exhaust smoke particles */}
          {isMoving && (
            <g className="opacity-70">
              <circle cx="35" cy="108" r="4" fill="#94a3b8" className="animate-ping" style={{ animationDuration: '0.8s' }} />
              <circle cx="22" cy="112" r="6" fill="#64748b" className="animate-ping" style={{ animationDuration: '1.2s' }} />
            </g>
          )}

          {/* REAR WHEEL */}
          <g transform="translate(55, 110)">
            <circle cx="0" cy="0" r="28" stroke="#1e293b" strokeWidth="8" fill="#0f172a" />
            <circle cx="0" cy="0" r="24" stroke="#475569" strokeWidth="2" fill="none" />
            <circle cx="0" cy="0" r="10" fill="#334155" />
            {/* Spinning spokes */}
            <g className={isMoving ? 'spin-wheel' : ''}>
              <line x1="0" y1="-24" x2="0" y2="24" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-24" y1="0" x2="24" y2="0" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-17" y1="-17" x2="17" y2="17" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-17" y1="17" x2="17" y2="-17" stroke="#94a3b8" strokeWidth="2" />
              {/* Disc brake */}
              <circle cx="0" cy="0" r="14" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            </g>
          </g>

          {/* FRONT WHEEL */}
          <g transform="translate(175, 110)">
            <circle cx="0" cy="0" r="28" stroke="#1e293b" strokeWidth="8" fill="#0f172a" />
            <circle cx="0" cy="0" r="24" stroke="#475569" strokeWidth="2" fill="none" />
            <circle cx="0" cy="0" r="10" fill="#334155" />
            {/* Spinning spokes */}
            <g className={isMoving ? 'spin-wheel' : ''}>
              <line x1="0" y1="-24" x2="0" y2="24" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-24" y1="0" x2="24" y2="0" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-17" y1="-17" x2="17" y2="17" stroke="#94a3b8" strokeWidth="2" />
              <line x1="-17" y1="17" x2="17" y2="-17" stroke="#94a3b8" strokeWidth="2" />
              {/* Disc brake */}
              <circle cx="0" cy="0" r="14" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            </g>
          </g>

          {/* BIKE FRAME & CHASSIS */}
          {/* Swingarm to rear wheel */}
          <path d="M 55 110 L 105 105 L 115 88" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
          {/* Main frame */}
          <path d="M 105 105 L 140 75 L 170 82" stroke="url(#bike-body-grad)" strokeWidth="8" strokeLinecap="round" />
          {/* Front fork & suspension */}
          <path d="M 160 68 L 175 110" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
          {/* Front fender / mudguard */}
          <path d="M 152 95 C 160 85 188 85 196 95" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" fill="none" />
          {/* Rear fender */}
          <path d="M 32 98 C 42 85 68 85 78 95" stroke="#1d4ed8" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Engine block & exhaust */}
          <rect x="95" y="92" width="28" height="22" rx="4" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <line x1="98" y1="98" x2="120" y2="98" stroke="#64748b" strokeWidth="2" />
          <line x1="98" y1="104" x2="120" y2="104" stroke="#64748b" strokeWidth="2" />
          {/* Chrome Exhaust pipe */}
          <path d="M 108 112 Q 90 120 45 112" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" fill="none" />

          {/* Fuel tank & Sports Fairing */}
          <path d="M 118 76 C 125 65 148 65 162 72 L 155 86 L 118 84 Z" fill="url(#bike-body-grad)" stroke="#1d4ed8" strokeWidth="2" />
          {/* Tank Decal stripe */}
          <path d="M 125 74 Q 140 72 155 78" stroke="#93c5fd" strokeWidth="2.5" fill="none" />

          {/* Seat */}
          <path d="M 85 78 Q 105 76 122 78 L 118 85 L 85 84 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />

          {/* Handlebar & mirror */}
          <path d="M 156 68 L 150 56 L 140 56" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" fill="none" />
          <circle cx="138" cy="53" r="3" fill="#38bdf8" />

          {/* LED Headlight assembly */}
          <ellipse cx="182" cy="85" rx="5" ry="8" fill="#e0f2fe" filter="url(#headlight-glow)" />

          {/* RIDER (COMMUTE RIDER) */}
          {/* Torso / Jacket */}
          <path d="M 98 62 L 126 50 L 142 66 L 115 76 Z" fill="#1e40af" stroke="#1d4ed8" strokeWidth="1.5" />
          {/* Arms reaching handlebar */}
          <path d="M 126 52 L 148 58" stroke="#1e3a8a" strokeWidth="6" strokeLinecap="round" />
          {/* Hands with gloves */}
          <circle cx="149" cy="58" r="4" fill="#0f172a" />

          {/* Legs & Shoes */}
          <path d="M 106 72 L 118 92 L 112 104" stroke="#1e293b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* Shoe */}
          <ellipse cx="114" cy="106" rx="7" ry="3.5" fill="#0284c7" />

          {/* Safety Helmet */}
          <g transform="translate(132, 30)">
            <ellipse cx="0" cy="0" rx="14" ry="13" fill="url(#helmet-grad)" />
            {/* Visor tint */}
            <path d="M 3 -3 Q 14 -1 12 7 Q 2 9 1 4 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            {/* Safety Helmet reflective badge */}
            <text x="-6" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif">SR</text>
          </g>

          {/* Tail light glow */}
          <ellipse cx="40" cy="94" rx="3" ry="5" fill="#ef4444" className="animate-pulse" />
        </svg>
      </motion.div>

      {/* Realistic Asphalt Road with Scrolling Dashes */}
      {showRoad && (
        <div className="w-full max-w-md h-8 relative mt-[-18px]">
          {/* Road body */}
          <div className="w-full h-5 bg-gradient-to-b from-gray-900 to-gray-950 rounded-lg border-t border-gray-700 shadow-inner overflow-hidden relative">
            {/* Animated center line stripes */}
            <div
              className="absolute inset-0 flex items-center"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #38bdf8 0, #38bdf8 24px, transparent 24px, transparent 54px)',
                backgroundSize: '108px 100%',
                animation: isMoving ? 'roadDash 0.6s linear infinite' : 'none',
              }}
            />
            {/* Road edge reflectors */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-blue-500/30" />
            <div className="absolute bottom-0 inset-x-0 h-[1px] bg-blue-500/30" />
          </div>

          {/* Ground reflection shadow */}
          <div className="w-48 h-2 bg-blue-500/20 blur-md rounded-full mx-auto mt-1" />
        </div>
      )}

      {/* Speedometer Badge */}
      {isMoving && (
        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-950/70 border border-blue-500/40 rounded-full text-xs font-semibold text-blue-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Cruising at {speed} km/h • Smooth Route</span>
        </div>
      )}
    </div>
  );
};

export default BikeAnimation;
