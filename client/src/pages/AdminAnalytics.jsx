import React from 'react';

export const AdminAnalytics = () => {
  const stats = {
    totalUsers: 1245,
    students: 840,
    employees: 320,
    general: 85,
    totalRides: 3820,
    completedRides: 3420,
    costShared: 284000,
    distanceKm: 128450,
  };

  const topCorridors = [
    { corridor: 'Campus North Gate ➔ Tech Science Corridor', volume: 1420, costPerSeat: 25, matchRate: '96%' },
    { corridor: 'City Transit Terminal ➔ Financial IT Hub', volume: 980, costPerSeat: 45, matchRate: '92%' },
    { corridor: 'University Main Avenue ➔ Corporate Outer Ring', volume: 840, costPerSeat: 35, matchRate: '89%' },
    { corridor: 'Residential Colony ➔ Medical & Biotech Center', volume: 580, costPerSeat: 30, matchRate: '94%' },
  ];

  const recentVerifications = [
    { name: 'Commuter #891', category: 'Student', institution: 'University Scholar Network', status: 'ID Verified ✓', time: '12m ago' },
    { name: 'Commuter #890', category: 'Employee', institution: 'Enterprise Corporate Domain', status: 'Email Verified ✓', time: '28m ago' },
    { name: 'Commuter #889', category: 'Student', institution: 'Polytechnic Institute', status: 'ID Verified ✓', time: '1h ago' },
  ];

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
            ANALYTICS & AUDIT
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">SmartRoute Mobility Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform route telemetry, commute density, collective savings, and institutional trust audit.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Real-time Telemetry: Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Registered Commuters</div>
          <div className="text-2xl font-black text-white">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">840 Students • 320 Corporate</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Shared Trips Completed</div>
          <div className="text-2xl font-black text-emerald-400">{stats.completedRides.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400/70">89.5% completion rate</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1a] border border-blue-500/30 space-y-1">
          <div className="text-xs text-blue-300 font-medium">Estimated Fuel Saved</div>
          <div className="text-2xl font-black text-blue-400">₹{stats.costShared.toLocaleString()}</div>
          <div className="text-[10px] text-blue-300/80">Direct user savings</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090e1a] border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 font-medium">Clean Commute Mileage</div>
          <div className="text-2xl font-black text-indigo-400">{stats.distanceKm.toLocaleString()} km</div>
          <div className="text-[10px] text-slate-500">Shared trajectory tracking</div>
        </div>
      </div>

      {/* User Category Breakdown */}
      <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          User Distribution by Institution & Category
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-blue-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-blue-400">🎓 University & College</span>
              <span className="text-slate-400 font-bold">67%</span>
            </div>
            <div className="text-2xl font-black text-white">840 Users</div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '67%' }} />
            </div>
            <p className="text-[10px] text-slate-500">Institutional ID card & campus email verification</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-indigo-400">👨‍💼 Corporate & Tech Parks</span>
              <span className="text-slate-400 font-bold">26%</span>
            </div>
            <div className="text-2xl font-black text-white">320 Users</div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '26%' }} />
            </div>
            <p className="text-[10px] text-slate-500">Workplace email & corporate badge validation</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-300">👤 General Verified</span>
              <span className="text-slate-400 font-bold">7%</span>
            </div>
            <div className="text-2xl font-black text-white">85 Users</div>
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div className="bg-slate-500 h-full rounded-full" style={{ width: '7%' }} />
            </div>
            <p className="text-[10px] text-slate-500">Mobile OTP & identity verified commuters</p>
          </div>
        </div>
      </div>

      {/* Corridors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Top Commute Travel Corridors
          </h4>
          <div className="space-y-3">
            {topCorridors.map((c, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white">{c.corridor}</h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {c.volume} trips shared • Average: ₹{c.costPerSeat} / seat
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400">{c.matchRate}</span>
                  <span className="text-[9px] text-slate-500 block">Match Rate</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Recent Verification Audit Log
          </h4>
          <div className="space-y-3">
            {recentVerifications.map((v, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">{v.name}</span>
                  <span className="text-[10px] text-slate-500">{v.time}</span>
                </div>
                <p className="text-[11px] text-blue-300">{v.institution}</p>
                <span className="text-[10px] text-emerald-400 font-medium block">{v.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
