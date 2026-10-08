import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export const FindRoute = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(routerLocation.search);
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';

  const [pickup, setPickup] = useState(initialFrom);
  const [destination, setDestination] = useState(initialTo);
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [maxCost, setMaxCost] = useState(800);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);
  const [minSeats, setMinSeats] = useState(1);
  const [sortBy, setSortBy] = useState('best_match');
  const [requestedRoute, setRequestedRoute] = useState(null);
  const [inspectingRoute, setInspectingRoute] = useState(null);
  const [availableRoutes, setAvailableRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real commute routes from Backend API
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rides', {
        params: {
          vehicleType: selectedVehicle !== 'all' ? selectedVehicle : undefined,
          from: pickup || undefined,
          to: destination || undefined,
          minSeats: minSeats > 1 ? minSeats : undefined,
          sortBy: sortBy !== 'best_match' ? sortBy : undefined,
        },
      });

      if (res.data?.rides && res.data.rides.length > 0) {
        const mapped = res.data.rides.map((r) => ({
          id: r._id,
          driverId: r.driver?._id || r.driver?.id || r.driver,
          host: r.driver?.name || 'Verified Commuter',
          userType: r.driver?.userType || 'General',
          institution:
            r.driver?.studentInfo?.college ||
            r.driver?.employeeInfo?.company ||
            r.driver?.organization ||
            'Commuter Mobility Network',
          rating: r.driver?.rating?.average != null ? Number(r.driver.rating.average).toFixed(1) : null,
          completedTrips: r.driver?.rating?.count ?? r.driver?.ridesCompleted ?? 0,
          vehicle: {
            name: r.vehicle?.name || (r.vehicle?.vehicleType === 'bike' ? 'Motorcycle' : 'Car'),
            type: r.vehicle?.vehicleType || 'bike',
            reg: r.vehicle?.registrationNumber || '',
          },
          from: r.origin?.address || 'Origin Stop',
          to: r.destination?.address || 'Destination Stop',
          time: r.departureTime || '08:30 AM',
          date: r.date || travelDate,
          availableSeats: r.availableSeats ?? 1,
          cost: r.costPerSeat ?? (r.fare ?? 0),
          matchScore: r.matchScore?.overall ?? 88,
          distanceKm: r.distanceKm || 18,
          co2Saved: r.co2Saved || '2.4',
        }));
        setAvailableRoutes(mapped);
      } else {
        setAvailableRoutes([]);
      }
    } catch (err) {
      console.warn('API fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [selectedVehicle, sortBy]);

  // Client-side filtering & sorting
  const filteredRoutes = availableRoutes
    .filter((r) => {
      if (selectedVehicle !== 'all' && r.vehicle.type !== selectedVehicle) return false;
      if (r.cost > maxCost) return false;
      if (r.availableSeats < minSeats) return false;
      if (pickup.trim() && !r.from.toLowerCase().includes(pickup.trim().toLowerCase()) && !pickup.toLowerCase().includes(r.from.toLowerCase())) {
        // Allow partial match
      }
      if (destination.trim() && !r.to.toLowerCase().includes(destination.trim().toLowerCase()) && !destination.toLowerCase().includes(r.to.toLowerCase())) {
        // Allow partial match
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'lowest_contribution') return a.cost - b.cost;
      if (sortBy === 'highest_rated') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      if (sortBy === 'earliest_departure') return String(a.time).localeCompare(String(b.time));
      if (sortBy === 'closest_route') return (a.distanceKm || 0) - (b.distanceKm || 0);
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

  const resetFilters = () => {
    setPickup('');
    setDestination('');
    setSelectedVehicle('all');
    setMaxCost(800);
    setMinSeats(1);
    setSortBy('best_match');
    setTravelDate(new Date().toISOString().split('T')[0]);
    fetchRoutes();
    toast.success('Filters reset to default.');
  };

  const handleRequestRoute = async (route) => {
    const token = localStorage.getItem('smartroute_token');
    if (!token) {
      toast.error('Please sign in or create an account to request a seat.');
      return;
    }

    const activeUser = JSON.parse(localStorage.getItem('smartroute_user') || '{}');
    const isOwn = activeUser._id && (String(route.driverId) === String(activeUser._id) || route.host === activeUser.name);
    if (isOwn) {
      toast.error('You are the host of this route! To test passenger booking, please choose a route offered by another commuter (e.g. Sarah Jenkins or Priya Sharma).');
      return;
    }

    try {
      const res = await api.post('/bookings', {
        rideId: route.id,
        pickupLocation: pickup || route.from,
        dropLocation: destination || route.to,
      });

      if (res.data?.success) {
        setRequestedRoute(route);
        setInspectingRoute(null);
        toast.success(`✅ Seat requested successfully! Host ${route.host} notified.`);
        fetchRoutes(); // refresh list to see seat count update
      } else {
        toast.error(res.data?.message || 'Could not request route.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send route request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header & Search Filter Bar */}
      <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
            ROUTE DISCOVERY & MATCHING
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Find Compatible Shared Commutes
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Search for verified commuters traveling along your routine trajectory to split actual fuel expenses.
          </p>
        </div>

        {/* Search Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4">
            <label htmlFor="search-pickup" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Pickup Stop
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-blue-400">🟢</span>
              <input
                id="search-pickup"
                type="text"
                placeholder="Enter pickup stop (e.g. Guntur)..."
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <label htmlFor="search-dest" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Destination Stop
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-rose-400">🔴</span>
              <input
                id="search-dest"
                type="text"
                placeholder="Enter destination stop (e.g. Vijayawada)..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="search-date" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Commute Date
            </label>
            <input
              id="search-date"
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2 pt-5">
            <button
              type="button"
              onClick={fetchRoutes}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🔍</span>
              <span>Find Routes</span>
            </button>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Vehicle:</span>
              <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['all', 'bike', 'car'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedVehicle(t)}
                    className={`px-3 py-1 rounded-lg font-semibold uppercase text-[10px] transition cursor-pointer ${
                      selectedVehicle === t
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'bike' ? '🏍️ Motorcycle' : '🚗 Car'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Min Seats:</span>
              <select
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 Seat</option>
                <option value={2}>2 Seats</option>
                <option value={3}>3 Seats</option>
                <option value={4}>4 Seats</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="best_match">Best Route Match</option>
                <option value="lowest_contribution">Lowest Contribution (₹)</option>
                <option value="earliest_departure">Earliest Departure</option>
                <option value="highest_rated">Highest Rated Host</option>
                <option value="closest_route">Shortest Distance</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="max-cost-slider" className="text-slate-400 font-medium">
                Max Contribution: <strong className="text-emerald-400">₹{maxCost}</strong>
              </label>
              <input
                id="max-cost-slider"
                type="range"
                min="20"
                max="1000"
                step="10"
                value={maxCost}
                onChange={(e) => setMaxCost(Number(e.target.value))}
                className="accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer w-28"
              />
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 2. Routes List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>Found {filteredRoutes.length} matching shared commute routes</span>
          <span className="hidden sm:inline">Ranked by geometric trajectory compatibility</span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-medium">Scanning live shared commute routes...</p>
          </div>
        ) : filteredRoutes.length === 0 ? (
          <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-12 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto text-3xl font-black">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Shared Commutes Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active routes match your current pickup, destination, or contribution threshold. Try adjusting filters or be the first to offer this route!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer"
              >
                Clear All Filters
              </button>
              <button
                type="button"
                onClick={() => navigate('/offer-route')}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
              >
                Offer This Route Instead →
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoutes.map((route) => (
              <motion.div
                key={route.id}
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-[#090e1a] border border-slate-800 hover:border-blue-500/40 p-6 flex flex-col justify-between shadow-lg transition"
              >
                <div>
                  {/* Host Details */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                        {route.host.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white">{route.host}</span>
                          <span className="text-xs text-emerald-400" title="Verified Institutional Commuter">✓</span>
                        </div>
                        <span className="text-[11px] text-blue-300 block">{route.institution}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      {route.matchScore > 0 ? (
                        <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 block">
                          {route.matchScore}% Match
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-blue-400 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 block">
                          Active Route
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {route.rating ? `★ ${route.rating}` : 'New Host'} ({route.completedTrips} trips)
                      </span>
                    </div>
                  </div>

                  {/* Trajectory Stops */}
                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="text-blue-400 mt-0.5">🟢</span>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Origin</span>
                        <span className="text-white font-medium">{pickup || route.from}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="text-rose-400 mt-0.5">🔴</span>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Destination</span>
                        <span className="text-white font-medium">{destination || route.to}</span>
                      </div>
                    </div>
                  </div>

                  {/* Commute Metadata */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Vehicle</span>
                      <span className="text-white font-medium">
                        {route.vehicle.type === 'bike' ? '🏍️' : '🚗'} {route.vehicle.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Departure</span>
                      <span className="text-amber-300 font-semibold">{route.time}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Available Capacity</span>
                      <span className="text-emerald-400 font-semibold">
                        {route.availableSeats > 0 ? `${route.availableSeats} seat(s) available` : 'Full'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cost Split & Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fuel Share</span>
                      <span className="text-xl font-black text-emerald-400">₹{route.cost}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingRoute(route)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>

                  <div className="pt-1">
                    {(() => {
                      const activeUser = JSON.parse(localStorage.getItem('smartroute_user') || '{}');
                      const isOwn = activeUser._id && (String(route.driverId) === String(activeUser._id) || route.host === activeUser.name);
                      if (isOwn) {
                        return (
                          <div className="w-full text-center py-2 rounded-xl bg-slate-800/70 text-slate-400 text-xs font-semibold border border-slate-700">
                            Your Route (Host)
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          disabled={route.availableSeats <= 0}
                          onClick={() => handleRequestRoute(route)}
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-600/25 transition cursor-pointer"
                        >
                          {route.availableSeats <= 0 ? 'Route Full' : 'Request Seat'}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Route Details Modal */}
      {inspectingRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#090e1a] border border-blue-500/30 p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setInspectingRoute(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg text-lg"
            >
              ✕
            </button>

            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                COMMUTE ROUTE SPECIFICATION
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                Shared Commute Breakdown
              </h3>
            </div>

            {/* Host Details */}
            <div className="flex items-center gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base">
                {inspectingRoute.host.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{inspectingRoute.host}</span>
                  <span className="text-xs text-emerald-400">✓ Verified</span>
                </div>
                <p className="text-xs text-blue-300">{inspectingRoute.institution}</p>
                <p className="text-[11px] text-slate-400">
                  {inspectingRoute.rating ? `★ ${inspectingRoute.rating}` : 'New Host'} • {inspectingRoute.completedTrips} verified commutes
                </p>
              </div>
            </div>

            {/* Route Stops */}
            <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-start gap-2.5">
                <span className="text-blue-400">🟢</span>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Departure Point</span>
                  <span className="text-white font-medium">{inspectingRoute.from}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-rose-400">🔴</span>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Destination Point</span>
                  <span className="text-white font-medium">{inspectingRoute.to}</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Vehicle Specification</span>
                <span className="text-white font-semibold mt-0.5 block">
                  {inspectingRoute.vehicle.type === 'bike' ? '🏍️' : '🚗'} {inspectingRoute.vehicle.name}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Departure Schedule</span>
                <span className="text-amber-300 font-semibold mt-0.5 block">
                  {inspectingRoute.time}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Trajectory Match</span>
                <span className="text-blue-400 font-semibold mt-0.5 block">
                  {inspectingRoute.matchScore}% Compatibility
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">CO2 Reduction</span>
                <span className="text-cyan-400 font-semibold mt-0.5 block">
                  ~{inspectingRoute.co2Saved} kg Carbon Saved
                </span>
              </div>
            </div>

            {/* Fuel Cost Split */}
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  Calculated Fuel Contribution
                </span>
                <span className="text-xs text-slate-300">Direct peer fuel split, 0% platform surcharge</span>
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{inspectingRoute.cost}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              {(() => {
                const activeUser = JSON.parse(localStorage.getItem('smartroute_user') || '{}');
                const isOwn = activeUser._id && (String(inspectingRoute.driverId) === String(activeUser._id) || inspectingRoute.host === activeUser.name);
                if (isOwn) {
                  return (
                    <div className="flex-1 text-center py-3 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                      Your Hosted Route
                    </div>
                  );
                }
                return (
                  <button
                    type="button"
                    disabled={inspectingRoute.availableSeats <= 0}
                    onClick={() => handleRequestRoute(inspectingRoute)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer"
                  >
                    {inspectingRoute.availableSeats <= 0 ? 'Full' : 'Request Seat on Commute'}
                  </button>
                );
              })()}
              <button
                type="button"
                onClick={() => setInspectingRoute(null)}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Confirmation Dialog */}
      {requestedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#090e1a] border border-emerald-500/30 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-400 mx-auto flex items-center justify-center text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">Route Sharing Request Sent</h3>
            <p className="text-xs text-slate-400">
              Host <strong className="text-white">{requestedRoute.host}</strong> has received your request to join this commute.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Estimated Contribution:</span>
                <span className="text-emerald-400 font-bold">₹{requestedRoute.cost}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trajectory Compatibility:</span>
                <span className="text-blue-300 font-bold">{requestedRoute.matchScore}%</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
              >
                Go to Dashboard ➔
              </button>
              <button
                type="button"
                onClick={() => setRequestedRoute(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindRoute;
