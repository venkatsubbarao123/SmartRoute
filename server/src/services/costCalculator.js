/**
 * Cost Calculator Service
 * Implements non-commercial peer-to-peer fuel cost sharing based on:
 *   Fuel Used = Distance / Mileage
 *   Fuel Cost = Fuel Used * Fuel Price
 *   Shared Fuel Contribution = Fuel Cost / Participants
 */

const fuelPriceService = require('./fuelPriceService');

// Realistic vehicle mileage benchmarks (km per liter / km per kWh)
const DEFAULT_MILEAGE = {
  bike: 45,       // 45 km/L (Commuter bike/scooter)
  car: 15,        // 15 km/L (Standard 4-wheeler)
  auto: 25,       // 25 km/L
  electric: 12,   // 12 km/kWh equivalent
};

/**
 * Calculate Haversine distance in km between two [lon, lat] points
 */
function haversineKm(coord1, coord2) {
  if (!coord1 || !coord2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1[1] * Math.PI) / 180) *
      Math.cos((coord2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate accurate fuel consumption and cost share
 * @param {Object} options
 * @param {number} options.distanceKm - Trip distance in km
 * @param {string} [options.vehicleType='bike'] - 'bike' | 'car' | 'auto' | 'electric'
 * @param {string} [options.fuelType='petrol'] - 'petrol' | 'diesel' | 'cng' | 'electric'
 * @param {number} [options.participants=2] - Total travellers sharing the vehicle (Host + co-commuters)
 * @param {number} [options.customMileage=null] - Optional override for vehicle mileage
 * @param {number} [options.customPricePerLiter=null] - Optional override for fuel price
 * @param {string} [options.location='Andhra Pradesh'] - Region for fuel pricing
 * @returns {Promise<Object>} Cost breakdown
 */
async function calculateSharedFuelCost({
  distanceKm = 0,
  vehicleType = 'bike',
  fuelType = 'petrol',
  participants = 2,
  customMileage = null,
  customPricePerLiter = null,
  location = 'Andhra Pradesh',
}) {
  const safeDistance = Math.max(0, Number(distanceKm) || 0);
  const vType = (vehicleType || 'bike').toLowerCase();
  const fType = (fuelType || 'petrol').toLowerCase();

  const mileage = customMileage && customMileage > 0 
    ? Number(customMileage) 
    : (DEFAULT_MILEAGE[vType] || DEFAULT_MILEAGE.bike);

  const pricePerLiter = customPricePerLiter && customPricePerLiter > 0 
    ? Number(customPricePerLiter) 
    : await fuelPriceService.getPrice(fType, location);

  // Core formula:
  // Fuel Used = Distance / Mileage
  // Fuel Cost = Fuel Used * Petrol Price
  // Shared Fuel Contribution = Fuel Cost / Participants
  const fuelUsedLiters = safeDistance > 0 && mileage > 0 ? safeDistance / mileage : 0;
  const totalFuelCost = fuelUsedLiters * pricePerLiter;
  const safeParticipants = Math.max(1, Number(participants) || 2);
  const sharedContribution = totalFuelCost / safeParticipants;

  return {
    distanceKm: Math.round(safeDistance * 10) / 10,
    vehicleType: vType,
    fuelType: fType,
    mileage: Math.round(mileage * 10) / 10,
    pricePerLiter: Math.round(pricePerLiter * 100) / 100,
    fuelUsedLiters: Math.round(fuelUsedLiters * 100) / 100,
    totalFuelCost: Math.round(totalFuelCost),
    participants: safeParticipants,
    sharedContribution: Math.round(sharedContribution),
    currency: 'INR',
    formula: 'Distance ÷ Mileage × Fuel Price ÷ Participants',
    explanation: 'Estimated fuel contribution based on actual route distance and vehicle mileage.',
  };
}

/**
 * Synchronous trip cost estimation for fallback and quick evaluations
 */
function estimateTripCost(originCoords, destCoords, vehicleType = 'car', seats = 3) {
  const distanceKm = haversineKm(originCoords, destCoords) * 1.25; // Apply road curvature factor
  const vType = (vehicleType || 'car').toLowerCase();
  const mileage = DEFAULT_MILEAGE[vType] || DEFAULT_MILEAGE.car;
  const pricePerLiter = 117.68; // Regional standard benchmark

  const fuelUsedLiters = mileage > 0 ? distanceKm / mileage : 0;
  const totalFuelCost = Math.round(fuelUsedLiters * pricePerLiter);
  const participants = (seats > 0 ? seats : 1) + 1; // driver + passengers
  const costPerSeat = Math.max(10, Math.round(totalFuelCost / participants));

  return {
    estimatedDistanceKm: Math.round(distanceKm * 10) / 10,
    totalFuelCost,
    costPerSeat,
    vehicleType: vType,
    seats,
    breakdown: {
      mileage,
      fuelPricePerLitre: pricePerLiter,
      fuelUsedLiters: Math.round(fuelUsedLiters * 100) / 100,
      participants,
    },
  };
}

/**
 * Prorated passenger cost for partial overlapping segments
 */
function proratedPassengerCost(totalRideDistance, sharedDistance, totalSeatCost) {
  if (totalRideDistance <= 0 || sharedDistance <= 0) return totalSeatCost;
  const ratio = Math.min(sharedDistance / totalRideDistance, 1);
  return Math.round(totalSeatCost * ratio);
}

/**
 * Legacy wrapper for backward compatibility
 */
function calculateFuelCost(distanceKm, vehicleType = 'car') {
  const mileage = DEFAULT_MILEAGE[vehicleType] || DEFAULT_MILEAGE.car;
  const price = 117.68;
  return Math.round((distanceKm / mileage) * price);
}

/**
 * Distribute cost among participants
 */
function distributeCost(totalCost, passengerCount, includeDriver = true) {
  if (totalCost <= 0 || passengerCount <= 0) {
    return { perPersonCost: 0, driverContribution: 0, passengerCost: 0, totalParticipants: passengerCount, totalCost: 0, savings: 0 };
  }
  const totalParticipants = includeDriver ? passengerCount + 1 : passengerCount;
  const perPersonCost = Math.round(totalCost / totalParticipants);
  return {
    perPersonCost,
    driverContribution: perPersonCost,
    passengerCost: perPersonCost,
    totalParticipants,
    totalCost,
    savings: Math.round(totalCost - perPersonCost),
  };
}

module.exports = {
  calculateSharedFuelCost,
  estimateTripCost,
  proratedPassengerCost,
  calculateFuelCost,
  distributeCost,
  haversineKm,
  DEFAULT_MILEAGE,
};
