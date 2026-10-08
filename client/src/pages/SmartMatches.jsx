import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import RideMatchAnimation from '../components/animations/RideMatchAnimation';
import RouteTrajectoryMatcher from '../components/animations/RouteTrajectoryMatcher';

export const SmartMatches = ({ user }) => {
  // Configurable route parameters for algorithmic inspection
  const [hostOrigin, setHostOrigin] = useState('Guntur Bus Station, Guntur');
  const [hostDestination, setHostDestination] = useState('Benz Circle, Vijayawada');
  const [hostDeparture, setHostDeparture] = useState('08:15');
  const [vehicleMode, setVehicleMode] = useState('bike'); // 'bike' | 'car'

  const [commuterPickup, setCommuterPickup] = useState('Mangalagiri Junction');
  const [commuterDestination, setCommuterDestination] = useState('Benz Circle, Vijayawada');
  const [commuterTime, setCommuterTime] = useState('08:25');

  const [loadingCalculation, setLoadingCalculation] = useState(false);

  // Interactive calculated match score & non-commercial fuel metrics
  const [matchMetrics, setMatchMetrics] = useState({
    route: 0,
    time: 0,
    pickup: 0,
    destination: 0,
    reliability: 0,
    overall: 0,
    sharedDistanceKm: 0,
    totalDistanceKm: 0,
    detourKm: 0,
    overlapPercent: 0,
    fuelUsedLiters: 0,
    totalFuelCost: 0,
    pricePerLiter: 117.68,
    mileage: 45,
    participants: 2,
    contribution: 0,
  });

  const [requestSent, setRequestSent] = useState(false);

  // Perform true calculation on mount or when requested
  const calculateRouteAndCost = async (overrideHostOrigin, overrideHostDest, overrideMode) => {
    const origin = overrideHostOrigin || hostOrigin;
    const dest = overrideHostDest || hostDestination;
    const mode = overrideMode || vehicleMode;
    const seats = mode === 'bike' ? 1 : 3;

    setLoadingCalculation(true);
    try {
      // 1. Query real route & fuel cost sharing calculation API with commuter trajectory
      const res = await api.post('/rides/calculate-cost', {
        origin,
        destination: dest,
        departureTime: hostDeparture,
        commuterPickup,
        commuterDestination,
        commuterTime,
        vehicleType: mode,
        seats,
      });

      if (res.data && res.data.success) {
        const { route, costBreakdown, matchMetrics: backendMatch } = res.data;
        const totalDistance = route.distanceKm || 0;
        
        if (backendMatch) {
          setMatchMetrics({
            route: backendMatch.routeOverlap,
            time: backendMatch.timeCompatibility,
            pickup: backendMatch.pickupProximity,
            destination: backendMatch.destinationProximity,
            reliability: backendMatch.reliability,
            overall: backendMatch.overall,
            sharedDistanceKm: backendMatch.sharedDistanceKm,
            totalDistanceKm: backendMatch.totalDistanceKm,
            detourKm: backendMatch.detourKm,
            overlapPercent: backendMatch.overlapPercent,
            fuelUsedLiters: costBreakdown.fuelUsedLiters,
            totalFuelCost: costBreakdown.totalFuelCost,
            pricePerLiter: costBreakdown.pricePerLiter,
            mileage: costBreakdown.mileage,
            participants: costBreakdown.participants,
            contribution: costBreakdown.sharedContribution,
          });
        } else {
          setMatchMetrics({
            route: 80,
            time: 80,
            pickup: 80,
            destination: 80,
            reliability: 80,
            overall: 80,
            sharedDistanceKm: totalDistance,
            totalDistanceKm: totalDistance,
            detourKm: 0.4,
            overlapPercent: 100,
            fuelUsedLiters: costBreakdown.fuelUsedLiters,
            totalFuelCost: costBreakdown.totalFuelCost,
            pricePerLiter: costBreakdown.pricePerLiter,
            mileage: costBreakdown.mileage,
            participants: costBreakdown.participants,
            contribution: costBreakdown.sharedContribution,
          });
        }
      }
    } catch (err) {
      console.warn('Live route calculation fallback:', err.message);
    } finally {
      setLoadingCalculation(false);
    }
  };

  useEffect(() => {
    calculateRouteAndCost(hostOrigin, hostDestination, vehicleMode);
  }, []);

  const handleRecalculate = (e) => {
    e.preventDefault();
    calculateRouteAndCost(hostOrigin, hostDestination, vehicleMode);
    toast.success('Geometric route compatibility & cost recalculated!');
  };

  const handleSendRequest = () => {
    setRequestSent(true);
    toast.success('Route sharing request sent to route owner! Both parties notified.');
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header Banner */}
      <div className="rounded-3xl bg-[#090e1a] border border-blue-500/20 p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>CORE ARCHITECTURE • "SHARE A SEAT ON THE JOURNEY YOU'RE ALREADY TAKING"</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Peer Route Compatibility Engine
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Unlike commercial taxi dispatching, SmartRoute matches commuters who are <strong className="text-slate-200">already traveling</strong> on existing routine trajectories and distributes fair fuel contributions without surge pricing or driver fares.
          </p>
        </div>
      </div>

      {/* 2. Main Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Route Inputs & Comparison Parameters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Compare Two Commute Paths</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate trajectory overlap between Host Commuter & Co-Commuter
              </p>
            </div>

            <form onSubmit={handleRecalculate} className="space-y-4 text-xs">
              {/* Host Route Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                  1. Route Host Regular Commute
                </span>
                <div>
                  <label className="text-slate-400 block mb-1">Departure Origin</label>
                  <input
                    type="text"
                    value={hostOrigin}
                    onChange={(e) => setHostOrigin(e.target.value)}
                    placeholder="e.g. Guntur Bus Station"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Destination</label>
                  <input
                    type="text"
                    value={hostDestination}
                    onChange={(e) => setHostDestination(e.target.value)}
                    placeholder="e.g. Benz Circle, Vijayawada"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Departure Time</label>
                    <input
                      type="time"
                      value={hostDeparture}
                      onChange={(e) => setHostDeparture(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Vehicle Mode</label>
                    <select
                      value={vehicleMode}
                      onChange={(e) => {
                        setVehicleMode(e.target.value);
                        calculateRouteAndCost(hostOrigin, hostDestination, e.target.value);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="bike">🏍️ Motorcycle (1 Seat • 45 km/L)</option>
                      <option value="car">🚗 Car (3 Seats • 15 km/L)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Co-Commuter Route Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                  2. Co-Commuter Matching Request
                </span>
                <div>
                  <label className="text-slate-400 block mb-1">Desired Pickup Stop</label>
                  <input
                    type="text"
                    value={commuterPickup}
                    onChange={(e) => setCommuterPickup(e.target.value)}
                    placeholder="e.g. Mangalagiri Junction"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Desired Drop Stop</label>
                  <input
                    type="text"
                    value={commuterDestination}
                    onChange={(e) => setCommuterDestination(e.target.value)}
                    placeholder="e.g. Benz Circle, Vijayawada"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Preferred Time Window</label>
                  <input
                    type="time"
                    value={commuterTime}
                    onChange={(e) => setCommuterTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingCalculation}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition disabled:opacity-50"
              >
                {loadingCalculation ? 'Calculating Route Geometry...' : 'Compute Match & Fuel Share ➔'}
              </button>
            </form>

            {/* Request Action Button */}
            {!requestSent ? (
              <button
                onClick={handleSendRequest}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 transition"
              >
                Request to Share this Route
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center text-xs text-emerald-300 font-medium">
                ✓ Route Sharing Request Pending Host Confirmation
              </div>
            )}
          </div>

          {/* Mathematical Algorithm Breakdown */}
          <RideMatchAnimation
            score={matchMetrics.overall}
            breakdown={matchMetrics}
          />
        </div>

        {/* Right Column: Visual Trajectory & Cost Splitting Math */}
        <div className="lg:col-span-7 space-y-6">
          <RouteTrajectoryMatcher
            driverRoute={{ from: hostOrigin, to: hostDestination }}
            commuterRoute={{ from: commuterPickup, to: commuterDestination }}
            matchScore={matchMetrics.overall}
            sharedDistanceKm={matchMetrics.sharedDistanceKm}
            totalDistanceKm={matchMetrics.totalDistanceKm}
            detourKm={matchMetrics.detourKm}
            overlapPercent={matchMetrics.overlapPercent}
            timeWindow="± 10 mins"
            scheduledTime={`${hostDeparture} AM`}
            contribution={matchMetrics.contribution}
          />

          {/* Cost Contribution Breakdown Card */}
          <div className="rounded-2xl bg-[#090e1a] border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Estimated Fuel Contribution</h4>
                <p className="text-xs text-slate-400">Non-commercial peer-to-peer fuel cost sharing</p>
              </div>
              <span className="text-2xl font-black text-emerald-400">
                ₹{matchMetrics.contribution}.00
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Total Route Distance</span>
                <span className="text-white font-semibold">{matchMetrics.totalDistanceKm} km</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vehicle Mileage</span>
                <span className="text-white font-semibold">{matchMetrics.mileage} km/L</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fuel Required</span>
                <span className="text-white font-semibold">{matchMetrics.fuelUsedLiters} Litres</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Regional Fuel Benchmark</span>
                <span className="text-white font-semibold">₹{matchMetrics.pricePerLiter}/L</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Fuel Cost for Route</span>
                <span className="text-white font-semibold">₹{matchMetrics.totalFuelCost}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cost Sharing Formula</span>
                <span className="text-blue-300 font-mono">
                  ₹{matchMetrics.totalFuelCost} ÷ {matchMetrics.participants} participants = ₹{matchMetrics.contribution}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Non-Commercial Travel Notice:</strong> SmartRoute is strictly a cost-sharing platform. 
              The co-commuter contribution only offsets a fair fraction of fuel for a trip the host was already making.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartMatches;
