/**
 * Route Matching Engine
 * Calculates compatibility score between a ride offer and a passenger request
 * Uses Haversine formula for accurate geographic distance calculations
 */

const PICKUP_THRESHOLD_KM = 1.5;     // Max distance from driver's route to accept as nearby pickup
const DEST_THRESHOLD_KM = 2.0;       // Max distance from driver's route to accept as nearby destination
const ROUTE_SAMPLE_POINTS = 20;      // Number of points to sample along route for proximity checks

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Haversine distance formula
 * @param {[number, number]} coords1 - [longitude, latitude]
 * @param {[number, number]} coords2 - [longitude, latitude]
 * @returns {number} Distance in kilometres
 */
function haversineDistance(coords1, coords2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(coords2[1] - coords1[1]);
  const dLon = toRad(coords2[0] - coords1[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coords1[1])) *
      Math.cos(toRad(coords2[1])) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Linearly interpolate between two coordinate points
 * @param {[number,number]} p1 - start [lon, lat]
 * @param {[number,number]} p2 - end [lon, lat]
 * @param {number} t - interpolation factor 0..1
 * @returns {[number,number]} Interpolated point
 */
function interpolatePoint(p1, p2, t) {
  return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
}

/**
 * Sample points evenly along the route polyline
 * @param {Array<[number,number]>} routeCoords - Array of [lon,lat]
 * @param {number} numPoints - How many sample points to generate
 * @returns {Array<[number,number]>} Sampled points
 */
function sampleRoutePoints(routeCoords, numPoints) {
  if (!routeCoords || routeCoords.length === 0) return [];
  if (routeCoords.length === 1) return [routeCoords[0]];

  const samples = [];
  const totalSegments = routeCoords.length - 1;
  const step = totalSegments / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const pos = i * step;
    const segIndex = Math.min(Math.floor(pos), totalSegments - 1);
    const t = pos - segIndex;
    samples.push(interpolatePoint(routeCoords[segIndex], routeCoords[segIndex + 1], t));
  }

  return samples;
}

/**
 * Find the minimum distance from a point to any point on the route
 * @param {[number,number]} point - Target point [lon, lat]
 * @param {Array<[number,number]>} routePoints - Sampled route points
 * @returns {number} Minimum distance in km
 */
function minDistanceToRoute(point, routePoints) {
  if (!routePoints || routePoints.length === 0) return Infinity;
  let minDist = Infinity;
  for (const rp of routePoints) {
    const dist = haversineDistance(point, rp);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
}

/**
 * Calculate pickup proximity score
 * Returns 0-100: higher score means passenger pickup is closer to driver's route
 * @param {number} distKm - Distance in km from pickup to route
 * @param {number} thresholdKm - Max acceptable distance
 * @returns {number} Score 0-100
 */
function proximityScore(distKm, thresholdKm) {
  if (distKm <= 0) return 100;
  if (distKm >= thresholdKm) return 0;
  // Exponential decay: closer = much higher score
  return Math.max(0, 100 * (1 - distKm / thresholdKm));
}

/**
 * Calculate route overlap score
 * Checks how much of the passenger's route overlaps with the driver's route
 * Samples points between pickup and drop, checks how many are near driver's route
 * @param {Array<[number,number]>} driverRoutePoints - Sampled driver route
 * @param {[number,number]} pickupCoords - Passenger pickup [lon, lat]
 * @param {[number,number]} dropCoords - Passenger drop [lon, lat]
 * @returns {number} Overlap score 0-100
 */
function calculateRouteOverlap(driverRoutePoints, pickupCoords, dropCoords) {
  if (!driverRoutePoints || driverRoutePoints.length === 0) return 0;

  // Generate sample points along the passenger's path
  const passengerSamples = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    passengerSamples.push(interpolatePoint(pickupCoords, dropCoords, t));
  }

  // Count how many passenger path points are within threshold of driver's route
  let matchedPoints = 0;
  const overlapThreshold = 1.0; // km

  for (const pp of passengerSamples) {
    const minDist = minDistanceToRoute(pp, driverRoutePoints);
    if (minDist <= overlapThreshold) {
      matchedPoints++;
    }
  }

  return Math.round((matchedPoints / passengerSamples.length) * 100);
}

/**
 * Parse any time format (Date, ISO string, '08:15 AM', '14:30') into minutes of the day
 */
function parseMinutesOfDay(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date && !isNaN(timeVal.getTime())) {
    return timeVal.getHours() * 60 + timeVal.getMinutes();
  }
  if (typeof timeVal === 'string') {
    const d = new Date(timeVal);
    if (!isNaN(d.getTime())) {
      return d.getHours() * 60 + d.getMinutes();
    }
    const match = timeVal.match(/(\d+):(\d+)\s*(am|pm)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const meridiem = (match[3] || '').toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      return hours * 60 + mins;
    }
  }
  return null;
}

/**
 * Calculate time compatibility score
 * @param {string|Date} rideTime - Driver's departure time
 * @param {string|Date} requestedTime - Passenger's requested time
 * @returns {number} Score 0-100
 */
function calculateTimeScore(rideTime, requestedTime) {
  if (!requestedTime || !rideTime) return 80;

  const rideMins = parseMinutesOfDay(rideTime);
  const reqMins = parseMinutesOfDay(requestedTime);

  if (rideMins === null || reqMins === null) return 80;

  const diffMinutes = Math.abs(rideMins - reqMins);

  if (diffMinutes <= 5) return 100;
  if (diffMinutes >= 90) return 20;
  return Math.round(100 - ((diffMinutes - 5) / 85) * 80);
}

/**
 * Calculate reliability score based on driver's rating
 * @param {Object} rating - { average, count }
 * @returns {number} Score 0-100
 */
function calculateReliabilityScore(rating) {
  if (!rating || rating.count === 0) return 70; // New driver: neutral score

  // Scale: 1 star = 20, 5 stars = 100
  const baseScore = (rating.average / 5) * 100;

  // Confidence adjustment: more ratings = more reliable score
  const confidenceFactor = Math.min(rating.count / 20, 1); // Full confidence at 20+ ratings
  const neutralScore = 70;

  return Math.round(neutralScore + confidenceFactor * (baseScore - neutralScore));
}

/**
 * Main: Calculate match score between a ride and a passenger request
 *
 * @param {Object} ride - Ride document (with routeCoordinates, departureTime, driver.rating)
 * @param {[number,number]} pickupCoords - Passenger pickup [lon, lat]
 * @param {[number,number]} dropCoords - Passenger drop [lon, lat]
 * @param {Date|null} requestedTime - Passenger's preferred departure time
 * @returns {Object} matchScore { routeOverlap, timeCompatibility, pickupProximity, destinationProximity, reliability, overall }
 */
function calculateMatchScore(ride, pickupCoords, dropCoords, requestedTime = null) {
  try {
    // Build route points: combine routeCoordinates + origin + waypoints + destination
    let routePoints = [];

    // Add origin
    if (ride.origin && ride.origin.location && ride.origin.location.coordinates) {
      routePoints.push(ride.origin.location.coordinates);
    }

    // Add explicit routeCoordinates if available
    if (ride.routeCoordinates && ride.routeCoordinates.length > 0) {
      routePoints = [...routePoints, ...ride.routeCoordinates];
    } else {
      // Fallback: use waypoints
      if (ride.waypoints && ride.waypoints.length > 0) {
        for (const wp of ride.waypoints) {
          if (wp.location && wp.location.coordinates) {
            routePoints.push(wp.location.coordinates);
          }
        }
      }
    }

    // Add destination
    if (ride.destination && ride.destination.location && ride.destination.location.coordinates) {
      routePoints.push(ride.destination.location.coordinates);
    }

    // Sample route points for proximity calculations
    const sampledRoute =
      routePoints.length >= 2 ? sampleRoutePoints(routePoints, ROUTE_SAMPLE_POINTS) : routePoints;

    // 1. Route Overlap (0-100)
    const routeOverlap = calculateRouteOverlap(sampledRoute, pickupCoords, dropCoords);

    // 2. Time Compatibility (0-100)
    const timeCompatibility = calculateTimeScore(ride.departureTime, requestedTime);

    // 3. Pickup Proximity (0-100) - how close is the pickup to the driver's route
    const pickupDist = minDistanceToRoute(pickupCoords, sampledRoute);
    const pickupProximity = Math.round(proximityScore(pickupDist, PICKUP_THRESHOLD_KM));

    // 4. Destination Proximity (0-100) - how close is the drop to the driver's route
    const dropDist = minDistanceToRoute(dropCoords, sampledRoute);
    const destinationProximity = Math.round(proximityScore(dropDist, DEST_THRESHOLD_KM));

    // 5. Reliability score from driver rating
    const driverRating = ride.driver && ride.driver.rating ? ride.driver.rating : { average: 0, count: 0 };
    const reliability = calculateReliabilityScore(driverRating);

    // 6. Weighted overall score
    // Route overlap is most important (40%), then time (20%), pickup & dest (15% each), reliability (10%)
    const overall = Math.round(
      routeOverlap * 0.4 +
        timeCompatibility * 0.2 +
        pickupProximity * 0.15 +
        destinationProximity * 0.15 +
        reliability * 0.1
    );

    return {
      routeOverlap,
      timeCompatibility,
      pickupProximity,
      destinationProximity,
      reliability,
      overall: Math.min(100, Math.max(0, overall)), // Clamp to 0-100
    };
  } catch (error) {
    console.error('Error calculating match score:', error);
    // Return a minimal default score on error
    return {
      routeOverlap: 0,
      timeCompatibility: 0,
      pickupProximity: 0,
      destinationProximity: 0,
      reliability: 70,
      overall: 0,
    };
  }
}

/**
 * Filter rides that are geospatially relevant before scoring
 * Uses MongoDB-like bounding box check (for pre-filtering in memory)
 * @param {Object} ride
 * @param {[number,number]} pickupCoords
 * @param {number} radiusKm
 * @returns {boolean}
 */
function isRideWithinRadius(ride, pickupCoords, radiusKm = 5) {
  if (!ride.origin || !ride.origin.location || !ride.origin.location.coordinates) return false;
  const dist = haversineDistance(pickupCoords, ride.origin.location.coordinates);
  return dist <= radiusKm;
}

module.exports = {
  calculateMatchScore,
  haversineDistance,
  isRideWithinRadius,
  sampleRoutePoints,
  minDistanceToRoute,
};
