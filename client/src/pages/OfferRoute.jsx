import React, { useState } from 'react';
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
  const [departureTime, setDepartureTime] = useState('08:15');
  const [seats, setSeats] = useState(1);
  const [mileage, setMileage] = useState(45);
  const [recurring, setRecurring] = useState(true);
  const [costPerSeat, setCostPerSeat] = useState(45);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);

  const handleEstimateCost = async (overrideOrigin, overrideDest, overrideType, overrideSeats, overrideMileage) => {
    const from = overrideOrigin || origin;
    const to = overrideDest || destination;
    const vType = overrideType || vehicleType;
    const vSeats = overrideSeats !== undefined ? overrideSeats : seats;
    const vMileage = overrideMileage !== undefined ? overrideMileage : mileage;

    if (!from.trim() || !to.trim()) return;

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

    setIsSubmitting(true);
    try {
      await api.post('/rides', {
        vehicleType,
        vehicleName,
        vehicleReg,
        origin,
        destination,
        departureTime,
        seats,
        mileage,
        recurring,
        costPerSeat,
      });
      toast.success('Your shared commute route has been published! Compatible commuters will be matched.');
      navigate('/find-route');
    } catch (err) {
      console.warn('Ride creation note:', err.message);
      const msg = err.response?.data?.message || 'Failed to publish route. Please sign in and verify route details.';
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
            ROUTE HOST PORTAL
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Offer Available Seats on Your Routine Commute
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Publish your routine travel schedule to share empty seats and split fuel expenses with verified peers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`p-4 rounded-2xl border text-left transition-all ${
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
                className={`p-4 rounded-2xl border text-left transition-all ${
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
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
                <input
                  id="route-origin-input"
                  type="text"
                  placeholder="e.g. Guntur Bus Station, Guntur"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  onBlur={() => handleEstimateCost(origin, destination, vehicleType, seats)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="route-dest-input" className="text-xs font-medium text-slate-400 block mb-1">
                  Destination
                </label>
                <input
                  id="route-dest-input"
                  type="text"
                  placeholder="e.g. Benz Circle, Vijayawada"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onBlur={() => handleEstimateCost(origin, destination, vehicleType, seats)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Schedule & Contribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label htmlFor="departure-time-input" className="text-xs font-medium text-slate-400 block mb-1">
                Departure Time
              </label>
              <input
                id="departure-time-input"
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="mileage-input" className="text-xs font-medium text-slate-400 block mb-1">
                Expected Mileage (km/L)
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="cost-contribution-input" className="text-xs font-medium text-slate-400 block truncate">
                  Estimated Fuel Share (₹)
                </label>
                {calculatedDistance && (
                  <span className="text-[10px] text-blue-400 font-mono">
                    {calculatedDistance} km
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-blue-500"
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
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/25 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing Route...' : 'Publish Shared Route & Open Matching'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OfferRoute;
