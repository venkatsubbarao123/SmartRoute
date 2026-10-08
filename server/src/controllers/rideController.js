const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { calculateMatchScore } = require('../services/routeMatching');
const { estimateTripCost, calculateSharedFuelCost } = require('../services/costCalculator');
const routingService = require('../services/routingService');
const { notify, templates } = require('../services/notificationService');

const mongoose = require('mongoose');
const store = require('../services/dataStore');

// ─── CREATE RIDE ─────────────────────────────────────────────────────────────

/**
 * @route   POST /api/rides
 * @desc    Driver creates a new ride offer
 * @access  Public / Private
 */
const createRide = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required to offer a route.' });
  }

  if (mongoose.connection.readyState !== 1) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'Database service is temporarily unavailable. Please try again shortly.',
      });
    }
    const newRide = await store.createRide(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: '✅ Ride created successfully!',
      ride: newRide,
    });
  }

  const {
    vehicleId,
    origin,
    destination,
    waypoints,
    routeCoordinates,
    departureTime,
    availableSeats,
    totalSeats,
    seats,
    recurring,
    preferences,
    notes,
    distance,
    duration,
  } = req.body;

  const originStr = typeof origin === 'string'
    ? origin
    : (origin?.address || origin?.name || 'Guntur');
  const destStr = typeof destination === 'string'
    ? destination
    : (destination?.address || destination?.name || 'Vijayawada');

  const rideSeats = Number(availableSeats || totalSeats || seats || 1);

  try {
    // Resolve Vehicle
    let activeVehicleId = vehicleId;
    if (!activeVehicleId) {
      let userVehicle = await Vehicle.findOne({ owner: req.user._id });
      if (!userVehicle) {
        userVehicle = await Vehicle.create({
          owner: req.user._id,
          type: req.body.vehicleType || 'bike',
          make: req.body.vehicleName || 'Standard Commuter',
          model: req.body.vehicleType === 'bike' ? 'Motorcycle' : 'Sedan',
          registrationNumber: req.body.vehicleReg || `AP-${Date.now().toString().slice(-4)}`,
          seats: rideSeats + 1,
          fuelType: req.body.fuelType || 'petrol',
        });
      }
      activeVehicleId = userVehicle._id;
    }

    // Resolve Origin Coordinates
    let originData = typeof origin === 'object' && origin.location ? origin : null;
    if (!originData) {
      const geo = await routingService.geocode(originStr);
      originData = {
        address: originStr,
        location: {
          type: 'Point',
          coordinates: geo?.coordinates || [80.4365, 16.3067],
        },
      };
    }

    // Resolve Destination Coordinates
    let destData = typeof destination === 'object' && destination.location ? destination : null;
    if (!destData) {
      const geo = await routingService.geocode(destStr);
      destData = {
        address: destStr,
        location: {
          type: 'Point',
          coordinates: geo?.coordinates || [80.6480, 16.5062],
        },
      };
    }

    // Calculate routing distance if missing
    let rideDistance = distance;
    let rideDuration = duration;
    if (!rideDistance) {
      const route = await routingService.getRoute(
        originData.location.coordinates,
        destData.location.coordinates,
        originStr,
        destStr
      );
      rideDistance = route?.distanceKm || 35;
      rideDuration = route?.durationMins || 45;
    }

    // Cost per seat
    let costPerSeat = req.body.costPerSeat;
    if (!costPerSeat) {
      const costInfo = estimateTripCost(
        originData.location.coordinates,
        destData.location.coordinates,
        req.body.vehicleType || 'bike',
        rideSeats
      );
      costPerSeat = costInfo?.costPerSeat || 45;
    }

    const ride = await Ride.create({
      driver: req.user._id,
      vehicle: activeVehicleId,
      origin: originData,
      destination: destData,
      waypoints: waypoints || [],
      routeCoordinates: routeCoordinates || [],
      departureTime: departureTime ? new Date(departureTime) : new Date(Date.now() + 3600000),
      availableSeats: rideSeats,
      totalSeats: rideSeats,
      recurring: typeof recurring === 'object' ? recurring : { isRecurring: Boolean(recurring), days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      costPerSeat: Number(costPerSeat),
      distance: rideDistance,
      duration: rideDuration,
      preferences: preferences || {},
      notes: notes || '',
    });

    const populatedRide = await Ride.findById(ride._id)
      .populate('driver', 'name rating profilePhoto verification')
      .populate('vehicle');

    return res.status(201).json({
      success: true,
      message: '✅ Ride created successfully!',
      ride: populatedRide,
    });
  } catch (err) {
    console.warn('MongoDB ride creation note:', err.message, 'falling back to store');
    const newRide = await store.createRide(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: '✅ Ride created successfully!',
      ride: newRide,
    });
  }
});

// ─── GET ALL RIDES ───────────────────────────────────────────────────────────

/**
 * @route   GET /api/rides
 * @desc    Get all active rides with optional filters
 * @access  Public
 */
const getRides = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const rides = await store.searchRides(req.query);
    return res.json({
      success: true,
      count: rides.length,
      total: rides.length,
      page: 1,
      pages: 1,
      rides,
    });
  }

  const {
    status = 'active',
    vehicleType,
    page = 1,
    limit = 20,
    sortBy = 'departureTime',
    sortOrder = 'asc',
  } = req.query;

  const filter = { status };
  if (vehicleType) filter['vehicle.vehicleType'] = vehicleType;

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate('driver', 'name rating profilePhoto verification')
        .populate('vehicle')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Ride.countDocuments(filter),
    ]);

    if (!rides || rides.length === 0) {
      const fallbackRides = await store.searchRides(req.query);
      return res.json({
        success: true,
        count: fallbackRides.length,
        total: fallbackRides.length,
        page: 1,
        pages: 1,
        rides: fallbackRides,
      });
    }

    res.json({
      success: true,
      count: rides.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      rides,
    });
  } catch (err) {
    const fallbackRides = await store.searchRides(req.query);
    return res.json({
      success: true,
      count: fallbackRides.length,
      total: fallbackRides.length,
      page: 1,
      pages: 1,
      rides: fallbackRides,
    });
  }
});

// ─── SMART SEARCH RIDES ──────────────────────────────────────────────────────

/**
 * @route   POST /api/rides/search
 * @desc    Smart search: find rides near pickup/drop, score by match, return sorted
 * @access  Public
 */
const searchRides = asyncHandler(async (req, res) => {
  const queryParams = { ...req.query, ...req.body };

  if (mongoose.connection.readyState !== 1 || !queryParams.pickupCoords) {
    const rides = await store.searchRides(queryParams);
    return res.json({
      success: true,
      count: rides.length,
      rides,
    });
  }

  const {
    pickupCoords,
    dropCoords,
    requestedTime,
    radiusKm = 10,
    seats = 1,
    maxResults = 20,
  } = queryParams;

  try {
    const rides = await Ride.find({
      status: 'active',
      availableSeats: { $gte: parseInt(seats) },
      departureTime: { $gte: new Date() },
      'origin.location': {
        $near: {
          $geometry: { type: 'Point', coordinates: pickupCoords },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .populate('driver', 'name rating profilePhoto verification phone')
      .populate('vehicle')
      .limit(100);

    const scoredRides = rides.map((ride) => {
      const matchScore = calculateMatchScore(
        ride.toObject(),
        pickupCoords,
        dropCoords,
        requestedTime ? new Date(requestedTime) : null
      );
      return { ride, matchScore };
    });

    scoredRides.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
    const results = scoredRides.slice(0, parseInt(maxResults));

    res.json({
      success: true,
      count: results.length,
      rides: results.map(({ ride, matchScore }) => ({
        ...ride.toObject(),
        matchScore,
      })),
    });
  } catch (err) {
    const fallbackRides = await store.searchRides(queryParams);
    res.json({
      success: true,
      count: fallbackRides.length,
      rides: fallbackRides,
    });
  }
});

// ─── GET RIDE BY ID ──────────────────────────────────────────────────────────

/**
 * @route   GET /api/rides/:id
 * @desc    Get detailed ride info including bookings
 * @access  Private
 */
const getRideById = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id)
    .populate('driver', 'name rating profilePhoto verification phone')
    .populate('vehicle');

  if (!ride) throw new AppError('Ride not found.', 404);

  // Get accepted bookings for this ride
  const bookings = await Booking.find({ ride: ride._id, status: { $in: ['accepted', 'started'] } })
    .populate('passenger', 'name rating profilePhoto');

  res.json({ success: true, ride, bookings });
});

// ─── UPDATE RIDE ─────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/rides/:id
 * @desc    Update ride details (only by driver, only when active)
 * @access  Private
 */
const updateRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw new AppError('Ride not found.', 404);
  if (ride.driver.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this ride.', 403);
  }
  if (!['active'].includes(ride.status)) {
    throw new AppError('Cannot update a ride that is not active.', 400);
  }

  const allowedUpdates = ['departureTime', 'preferences', 'notes', 'costPerSeat', 'waypoints'];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const updatedRide = await Ride.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('driver', 'name rating profilePhoto')
    .populate('vehicle');

  res.json({ success: true, message: 'Ride updated.', ride: updatedRide });
});

// ─── CANCEL RIDE ─────────────────────────────────────────────────────────────

/**
 * @route   DELETE /api/rides/:id
 * @desc    Cancel a ride (driver only). Notifies all accepted passengers.
 * @access  Private
 */
const cancelRide = asyncHandler(async (req, res) => {
  const ride = await Ride.findById(req.params.id);
  if (!ride) throw new AppError('Ride not found.', 404);
  if (ride.driver.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    throw new AppError('Not authorized to cancel this ride.', 403);
  }
  if (['cancelled', 'completed'].includes(ride.status)) {
    throw new AppError('Ride is already cancelled or completed.', 400);
  }

  ride.status = 'cancelled';
  ride.cancelReason = req.body.reason || 'Driver cancelled the ride.';
  await ride.save();

  // Notify all accepted passengers
  const bookings = await Booking.find({
    ride: ride._id,
    status: { $in: ['requested', 'accepted'] },
  });

  const io = req.app.get('io');
  const driverName = req.user.name;

  for (const booking of bookings) {
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    const tmpl = templates.ride_cancelled(driverName);
    await notify(io, booking.passenger, 'ride_cancelled', tmpl.title, tmpl.message, {
      rideId: ride._id,
      bookingId: booking._id,
    });
  }

  res.json({ success: true, message: 'Ride cancelled. All passengers have been notified.' });
});

// ─── START RIDE ──────────────────────────────────────────────────────────────

/**
 * @route   PUT /api/rides/:id/start
 * @desc    Driver starts the ride
 * @access  Private
 */
const startRide = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  if (mongoose.connection.readyState !== 1 || String(req.params.id).startsWith('ride-')) {
    const memRide = (store.rides || []).find((r) => String(r._id) === String(req.params.id));
    if (memRide) {
      memRide.status = 'started';
      memRide.actualStartTime = new Date();
      (store.bookings || []).forEach((b) => {
        if (String(b.ride) === String(memRide._id) || String(b.ride?._id) === String(memRide._id)) {
          b.status = 'started';
          b.startedAt = new Date();
        }
      });
      if (io) io.to(`ride:${memRide._id}`).emit('ride:started', { rideId: memRide._id, startTime: memRide.actualStartTime });
      return res.json({ success: true, message: 'Ride started! Passengers have been notified.', ride: memRide });
    }
  }

  const ride = await Ride.findById(req.params.id);
  if (!ride) {
    const memRide = (store.rides || []).find((r) => String(r._id) === String(req.params.id));
    if (memRide) {
      memRide.status = 'started';
      return res.json({ success: true, message: 'Ride started! Passengers have been notified.', ride: memRide });
    }
    throw new AppError('Ride not found.', 404);
  }
  if (ride.driver.toString() !== req.user._id.toString() && !req.user?.isAdmin) {
    throw new AppError('Only the driver can start this ride.', 403);
  }
  if (ride.status !== 'active' && ride.status !== 'full') {
    throw new AppError(`Cannot start a ride with status: ${ride.status}`, 400);
  }

  ride.status = 'started';
  ride.actualStartTime = new Date();
  await ride.save();

  // Update all accepted bookings to started + notify passengers
  const bookings = await Booking.find({ ride: ride._id, status: 'accepted' });

  for (const booking of bookings) {
    booking.status = 'started';
    booking.startedAt = new Date();
    await booking.save();

    const tmpl = templates.ride_started(req.user.name);
    await notify(io, booking.passenger, 'ride_started', tmpl.title, tmpl.message, {
      rideId: ride._id,
      bookingId: booking._id,
    });
  }

  // Emit real-time ride:started event to ride room
  if (io) {
    io.to(`ride:${ride._id}`).emit('ride:started', { rideId: ride._id, startTime: ride.actualStartTime });
  }

  res.json({ success: true, message: 'Ride started! Passengers have been notified.', ride });
});

// ─── COMPLETE RIDE ───────────────────────────────────────────────────────────

/**
 * @route   PUT /api/rides/:id/complete
 * @desc    Driver completes the ride
 * @access  Private
 */
const completeRide = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  if (mongoose.connection.readyState !== 1 || String(req.params.id).startsWith('ride-')) {
    const memRide = (store.rides || []).find((r) => String(r._id) === String(req.params.id));
    if (memRide) {
      memRide.status = 'completed';
      memRide.actualEndTime = new Date();
      (store.bookings || []).forEach((b) => {
        if (String(b.ride) === String(memRide._id) || String(b.ride?._id) === String(memRide._id)) {
          b.status = 'completed';
          b.completedAt = new Date();
        }
      });
      if (io) io.to(`ride:${memRide._id}`).emit('ride:completed', { rideId: memRide._id });
      return res.json({ success: true, message: 'Ride completed! Please rate your passengers.', ride: memRide });
    }
  }

  const ride = await Ride.findById(req.params.id);
  if (!ride) {
    const memRide = (store.rides || []).find((r) => String(r._id) === String(req.params.id));
    if (memRide) {
      memRide.status = 'completed';
      return res.json({ success: true, message: 'Ride completed! Please rate your passengers.', ride: memRide });
    }
    throw new AppError('Ride not found.', 404);
  }
  if (ride.driver.toString() !== req.user._id.toString() && !req.user?.isAdmin) {
    throw new AppError('Only the driver can complete this ride.', 403);
  }
  if (ride.status !== 'started') {
    throw new AppError('Ride must be started before completing.', 400);
  }

  ride.status = 'completed';
  ride.actualEndTime = new Date();
  await ride.save();

  // Complete all started bookings + prompt ratings
  const bookings = await Booking.find({ ride: ride._id, status: 'started' });

  for (const booking of bookings) {
    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    const tmpl = templates.ride_completed();
    await notify(io, booking.passenger, 'ride_completed', tmpl.title, tmpl.message, {
      rideId: ride._id,
      bookingId: booking._id,
      promptRating: true,
    });
  }

  // Notify driver too
  const tmpl = templates.ride_completed();
  await notify(io, req.user._id, 'ride_completed', tmpl.title, 'Your ride is completed. Rate your passengers!', {
    rideId: ride._id,
    promptRating: true,
  });

  if (io) {
    io.to(`ride:${ride._id}`).emit('ride:completed', { rideId: ride._id });
  }

  res.json({ success: true, message: 'Ride completed! Please rate your passengers.', ride });
});

// ─── GET MY RIDES ────────────────────────────────────────────────────────────

/**
 * @route   GET /api/rides/my-rides
 * @desc    Get all rides created by the logged-in driver
 * @access  Private
 */
const getMyRides = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const userId = String(req.user?._id || req.user?.id || '');

  if (mongoose.connection.readyState !== 1) {
    const myRides = (store.rides || []).filter((r) => {
      const driverId = String(r.driver?._id || r.driver?.id || r.driver || '');
      return driverId === userId || r.driver?.name === req.user?.name;
    });
    return res.json({
      success: true,
      count: myRides.length,
      total: myRides.length,
      page: 1,
      pages: 1,
      rides: myRides,
    });
  }

  const filter = { driver: req.user._id };
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  try {
    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .populate('vehicle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Ride.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: rides.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      rides,
    });
  } catch (err) {
    const myRides = (store.rides || []).filter((r) => {
      const driverId = String(r.driver?._id || r.driver?.id || r.driver || '');
      return driverId === userId || r.driver?.name === req.user?.name;
    });
    return res.json({
      success: true,
      count: myRides.length,
      total: myRides.length,
      page: 1,
      pages: 1,
      rides: myRides,
    });
  }
});

// ─── GET NEARBY RIDES ────────────────────────────────────────────────────────

/**
 * @route   GET /api/rides/nearby
 * @desc    Get rides near a given location using geospatial query
 * @access  Private
 */
const getNearbyRides = asyncHandler(async (req, res) => {
  const { lon, lat, radiusKm = 5 } = req.query;

  if (!lon || !lat) throw new AppError('Longitude and latitude are required.', 400);

  const rides = await Ride.find({
    status: 'active',
    departureTime: { $gte: new Date() },
    'origin.location': {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lon), parseFloat(lat)] },
        $maxDistance: parseFloat(radiusKm) * 1000,
      },
    },
  })
    .populate('driver', 'name rating profilePhoto')
    .populate('vehicle')
    .limit(30);

  res.json({ success: true, count: rides.length, rides });
});

// ─── CALCULATE SHARED FUEL COST ──────────────────────────────────────────────
/**
 * @route   POST /api/rides/calculate-cost
 * @desc    Calculate realistic route distance, duration, and fair non-commercial fuel cost sharing
 * @access  Public
 */
const calculateCost = asyncHandler(async (req, res) => {
  const {
    origin,
    destination,
    originCoords,
    destCoords,
    commuterPickup,
    commuterDestination,
    commuterCoords,
    commuterDropCoords,
    departureTime,
    commuterTime,
    vehicleType = 'bike',
    fuelType = 'petrol',
    seats = 1,
    participants,
    customMileage,
    customPricePerLiter,
    location = 'Andhra Pradesh',
  } = req.body;

  let startCoords = originCoords;
  let endCoords = destCoords;

  if (!startCoords && origin) {
    const geo = await routingService.geocode(origin);
    if (geo) startCoords = geo.coordinates;
  }
  if (!endCoords && destination) {
    const geo = await routingService.geocode(destination);
    if (geo) endCoords = geo.coordinates;
  }

  if (!startCoords || !endCoords) {
    return res.status(400).json({
      success: false,
      message: 'Both origin and destination locations or coordinates are required.',
    });
  }

  const route = await routingService.getRoute(startCoords, endCoords, origin, destination);
  const totalParticipants = participants || (Number(seats) + 1) || 2;

  const costBreakdown = await calculateSharedFuelCost({
    distanceKm: route.distanceKm,
    vehicleType,
    fuelType,
    participants: totalParticipants,
    customMileage,
    customPricePerLiter,
    location,
  });

  // Calculate genuine 5-factor algorithmic match score if commuter stops are provided
  let matchMetrics = null;
  let cStartCoords = commuterCoords;
  let cEndCoords = commuterDropCoords;

  if (!cStartCoords && commuterPickup) {
    const geo = await routingService.geocode(commuterPickup);
    if (geo) cStartCoords = geo.coordinates;
  }
  if (!cEndCoords && commuterDestination) {
    const geo = await routingService.geocode(commuterDestination);
    if (geo) cEndCoords = geo.coordinates;
  }

  if (cStartCoords && cEndCoords) {
    const mockRide = {
      origin: { location: { coordinates: startCoords } },
      destination: { location: { coordinates: endCoords } },
      routeCoordinates: route.coordinates,
      departureTime: departureTime || '08:15 AM',
      driver: { rating: { average: 4.9, count: 50 } },
    };
    const score = calculateMatchScore(mockRide, cStartCoords, cEndCoords, commuterTime || departureTime);
    const trajectory = routingService.calculateSharedTrajectory(route.coordinates, cStartCoords, cEndCoords);
    matchMetrics = {
      ...score,
      sharedDistanceKm: trajectory?.sharedDistanceKm || Math.min(route.distanceKm, Math.round(route.distanceKm * (score.routeOverlap / 100) * 10) / 10),
      totalDistanceKm: route.distanceKm,
      detourKm: trajectory?.detourKm || 0.4,
      overlapPercent: score.routeOverlap,
    };
  }

  res.json({
    success: true,
    route: {
      distanceKm: route.distanceKm,
      durationMins: route.durationMins,
      coordinates: route.coordinates,
      source: route.source,
    },
    costBreakdown,
    ...(matchMetrics && { matchMetrics }),
  });
});

// ─── GEOCODE LOCATION ────────────────────────────────────────────────────────
/**
 * @route   GET /api/rides/geocode
 * @desc    Geocode place query into verified geographic coordinates
 * @access  Public
 */
const geocodeLocation = asyncHandler(async (req, res) => {
  const search = req.query.query || req.query.q;
  if (!search) {
    return res.status(400).json({ success: false, message: 'Search query is required.' });
  }

  const result = await routingService.geocode(search);
  res.json({
    success: true,
    location: result,
  });
});

module.exports = {
  createRide,
  getRides,
  searchRides,
  getRideById,
  updateRide,
  cancelRide,
  startRide,
  completeRide,
  getMyRides,
  getNearbyRides,
  calculateCost,
  geocodeLocation,
};
