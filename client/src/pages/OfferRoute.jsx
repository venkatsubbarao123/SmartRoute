import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

export const OfferRoute = () => {
  const routerLocation = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(routerLocation.search);
  const initialFrom = searchParams.get('from') || '';
  const initialTo = searchParams.get('to') || '';

  const [vehicleType, setVehicleType] = useState('bike');
  const [vehicleName, setVehicleName] = useState('Motorcycle / Scooter');
  const [vehicleReg, setVehicleReg] = useState('');
  const [origin, setOrigin] = useState(initialFrom);
  const [destination, setDestination] = useState(initialTo);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState('08:15');
  const [seats, setSeats] = useState(1);
  const [mileage, setMileage] = useState(45);
  const [recurring, setRecurring] = useState(true);
  const [costPerSeat, setCostPerSeat] = useState(45);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedSavedVehicle, setSelectedSavedVehicle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  // Fetch user vehicles if logged in
  useEffect(() => {
    const fetchVehicles = async () => {
      const token = localStorage.getItem('smartroute_token');
      if (!token) return;
      try {
        const res = await api.get('/users/vehicles').catch(() => null);
        if (res?.data?.vehicles && res.data.vehicles.length > 0) {
          setUserVehicles(res.data.vehicles);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchVehicles();
  }, []);

  const handleSavedVehicleChange = (vId) => {
    setSelectedSavedVehicle(vId);
    if (!vId) return;
    const v = userVehicles.find((x) => String(x._id || x.id) === String(vId));
    if (v) {
      setVehicleType(v.vehicleType || 'bike');
      setVehicleName(`${v.brand} ${v.model}`);
      setVehicleReg(v.registrationNumber || '');
      setMileage(v.mileage || (v.vehicleType === 'bike' ? 45 : 15));
      setSeats(v.seats || (v.vehicleType === 'bike' ? 1 : 3));
      handleEstimateCost(origin, destination, v.vehicleType, v.seats, v.mileage);
    }
  };

  const handleEstimateCost = async (overrideOrigin, overrideDest, overrideType, overrideSeats, overrideMileage) => {
    const from = overrideOrigin || origin;
    const to = overrideDest || destination;
    const vType = overrideType || vehicleType;
    const vSeats = overrideSeats !== undefined ? overrideSeats : seats;
    const vMileage = overrideMileage !== undefined ? overrideMileage : mileage;

    if (!from.trim() || !to.trim()) return;
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return;

    try {
      setIsEstimating(true);
      const res = await api.post('/rides/calculate-cost', {
        origin: from,
        destination: to,
        vehicleType: vType,
        seats: vSeats,
        customMileage: vMileage,
      });

      if (res.data?.success && res.data.costBreakdown) {
        setCostPerSeat(res.data.costBreakdown.sharedContribution);
        setCalculatedDistance(res.data.route.distanceKm);
        toast.success(`Estimated fuel contribution: ₹${res.data.costBreakdown.sharedContribution} (${res.data.route.distanceKm} km route @ ${vMileage} km/L)`);
      }
    } catch (e) {
      console.warn('Cost estimation note:', e.message);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      toast.error('Please enter both departure origin and destination stops');
      return;
    }

    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      toast.error('Origin and Destination cannot be the same location.');
      return;
    }

    const token = localStorage.getItem('smartroute_token');
    if (!token) {
      toast.error('Please sign in or create an account to offer a route.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/rides', {
        vehicleType,
        vehicleName,
        vehicleReg,
        origin,
        destination,
        departureTime,
        departureDate,
        seats,
        mileage,
        recurring,
        costPerSeat,
      });
      toast.success(res.data?.message || '✅ Ride created successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.warn('Ride creation note:', err.message);
      const msg = err.response?.data?.message || 'Failed to publish route. Please verify route details.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div className="rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="border-b border-slate-800 pb-4 mb-6">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
            ROUTE HOST PORTAL • "SHARE A SEAT ON THE JOURNEY YOU'RE ALREADY TAKING"
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Offer Available Seats on Your Routine Commute
          </h2>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            SmartRoute is strictly for commuters who are <strong className="text-slate-200">already traveling</strong> on this route for their own daily commute (work, college, routine travel). You are not providing a taxi service—you are publishing your planned journey to share empty vehicle seats and split direct fuel costs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Saved Vehicles Selection if any */}
          {userVehicles.length > 0 && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/20 space-y-2">
              <label htmlFor="saved-vehicle-select" className="text-xs font-bold text-blue-300 block">
                Quick Select from Your Registered Vehicles
              </label>
              <select
                id="saved-vehicle-select"
                value={selectedSavedVehicle}
                onChange={(e) => handleSavedVehicleChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose registered vehicle or fill below --</option>
                {userVehicles.map((v) => (
                  <option key={v._id || v.id} value={v._id || v.id}>
                    {v.brand} {v.model} ({v.registrationNumber}) • {v.vehicleType === 'bike' ? '🏍️ Motorcycle' : '🚗 Car'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Section 1: Vehicle Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">
              1. Select Vehicle Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setVehicleType('bike');
                  setVehicleName('Motorcycle / Scooter');
                  setSeats(1);
                  setMileage(45);
                  handleEstimateCost(origin, destination, 'bike', 1, 45);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  vehicleType === 'bike'
                    ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🏍️</div>
                <div className="font-bold text-sm">Motorcycle / Scooter</div>
                <div className="text-xs text-blue-300 mt-1">1 Seat Capacity • ~45 km/L • Direct fuel split</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVehicleType('car');
                  setVehicleName('Four-Wheeler / Car');
                  setSeats(3);
                  setMileage(15);
                  handleEstimateCost(origin, destination, 'car', 3, 15);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  vehicleType === 'car'
                    ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-3xl mb-2">🚗</div>
                <div className="font-bold text-sm">Four-Wheeler / Car</div>
                <div className="text-xs text-indigo-300 mt-1">2 to 4 Seats • ~15 km/L • Proportional fuel sharing</div>
              </button>
            </div>
          </div>

          {/* Section 2: Vehicle Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicle-model-input" className="text-xs font-medium text-slate-400 block mb-1">
                Vehicle Make & Model
              </label>
              <input
                id="vehicle-model-input"
                type="text"
                placeholder="e.g. Honda Activa / Hyundai i20"
                value={vehicleName}
                onChange={(e) => setVehicleName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="vehicle-reg-input" className="text-xs font-medium text-slate-400 block mb-1">
                Registration Plate (Optional)
              </label>
              <input
                id="vehicle-reg-input"
                type="text"
                placeholder="e.g. AP-07-CK-1020"
                value={vehicleReg}
                onChange={(e) => setVehicleReg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>
          </div>

          {/* Section 3: Routine Route Stops */}
          <div className="space-y-4 pt-2">
            <span className="text-xs font-bold text-slate-300 block">
              2. Routine Commute Route
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="route-origin-input" className="text-xs font-medium text-slate-400 block mb-1">
                  Starting Point (Origin)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-blue-400">🟢</span>
                  <input
                    id="route-origin-input"
                    type="text"
                    placeholder="e.g. Guntur Bus Station, Guntur"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    onBlur={() => handleEstimateCost(origin, destination, vehicleType, seats)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="route-dest-input" className="text-xs font-medium text-slate-400 block mb-1">
                  Destination
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-rose-400">🔴</span>
                  <input
                    id="route-dest-input"
                    type="text"
                    placeholder="e.g. Benz Circle, Vijayawada"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    onBlur={() => handleEstimateCost(origin, destination, vehicleType, seats)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Schedule & Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 pt-2">
            <div>
              <label htmlFor="departure-date-input" className="text-xs font-medium text-slate-400 block mb-1">
                Commute Date
              </label>
              <input
                id="departure-date-input"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="departure-time-input" className="text-xs font-medium text-slate-400 block mb-1">
                Departure Time
              </label>
              <input
                id="departure-time-input"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="seats-count-input" className="text-xs font-medium text-slate-400 block mb-1">
                Available Seats
              </label>
              <input
                id="seats-count-input"
                type="number"
                min="1"
                max={vehicleType === 'bike' ? 1 : 4}
                value={seats}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setSeats(s);
                  handleEstimateCost(origin, destination, vehicleType, s, mileage);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="mileage-input" className="text-xs font-medium text-slate-400 block mb-1">
                Mileage (km/L)
              </label>
              <input
                id="mileage-input"
                type="number"
                min="5"
                max="100"
                value={mileage}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  setMileage(m);
                  handleEstimateCost(origin, destination, vehicleType, seats, m);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="cost-contribution-input" className="text-xs font-medium text-slate-400 block truncate">
                  Fuel Share (₹)
                </label>
                {calculatedDistance && (
                  <span className="text-[10px] text-blue-400 font-mono">
                    {calculatedDistance}km
                  </span>
                )}
              </div>
              <input
                id="cost-contribution-input"
                type="number"
                min="10"
                max="2000"
                value={costPerSeat}
                onChange={(e) => setCostPerSeat(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Section 5: Recurring Commute Checkbox */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <input
              type="checkbox"
              id="recurring-commute-toggle"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="rounded text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="recurring-commute-toggle" className="text-slate-300 cursor-pointer">
              Recurring daily commute route (Monday to Friday routine schedule)
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>{isSubmitting ? 'Publishing Route...' : 'Publish Shared Route & Open Matching'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default OfferRoute;
