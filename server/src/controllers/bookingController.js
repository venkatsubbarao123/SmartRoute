const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const User = require('../models/User');
const mongoose = require('mongoose');
const store = require('../services/dataStore');
const { calculateMatchScore } = require('../services/routeMatching');

exports.requestRide = async (req, res, next) => {
  try {
    const { rideId, pickupLocation, dropLocation, pickupCoords, dropCoords } = req.body;

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required to request a seat.' });
    }

    const isMockRideId = !mongoose.isValidObjectId(rideId) || String(rideId).startsWith('ride-');

    // 1. If database offline OR non-ObjectId string (like 'ride-6') OR starts with 'ride-'
    if (mongoose.connection.readyState !== 1 || isMockRideId) {
      try {
        const memRide = (store.rides || []).find((r) => String(r._id) === String(rideId));
        if (memRide) {
          const driverId = String(memRide.driver?._id || memRide.driver?.id || '');
          const currentUserId = String(req.user?._id || req.user?.id || '');
          if (driverId === currentUserId || (req.user?.name && memRide.driver?.name === req.user?.name)) {
            return res.status(400).json({
              success: false,
              message: 'You are the host of this route. You cannot book your own commute. Please search routes offered by other commuters or sign in with another account.',
            });
          }
          if ((memRide.availableSeats || 0) <= 0) {
            return res.status(400).json({ success: false, message: 'No seats available on this route.' });
          }
        }
        const booking = store.createBooking({
          rideId,
          pickup: pickupLocation,
          destination: dropLocation,
          pickupCoords,
          dropCoords,
        }, req.user);
        return res.status(201).json({ success: true, message: 'Seat requested successfully! Host notified.', booking, data: booking });
      } catch (storeErr) {
        return res.status(400).json({ success: false, message: storeErr.message });
      }
    }

    let ride = null;
    if (mongoose.isValidObjectId(rideId)) {
      ride = await Ride.findById(rideId).populate('driver');
    }

    if (!ride) {
      // Check in-memory store as fallback
      const memRide = (store.rides || []).find((r) => String(r._id) === String(rideId));
      if (memRide) {
        try {
          const booking = store.createBooking({
            rideId,
            pickup: pickupLocation,
            destination: dropLocation,
            pickupCoords,
            dropCoords,
          }, req.user);
          return res.status(201).json({ success: true, message: 'Seat requested successfully! Host notified.', booking, data: booking });
        } catch (storeErr) {
          return res.status(400).json({ success: false, message: storeErr.message });
        }
      }
      return res.status(404).json({ success: false, message: 'Commute route not found.' });
    }

    const driverId = ride.driver?._id ? ride.driver._id.toString() : ride.driver?.toString();
    if (driverId === req.user.id || driverId === req.user._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are the host of this route. You cannot book your own commute. Please search routes offered by other commuters or sign in with another account.',
      });
    }

    // Rule 1: Host must have an active, planned commute
    if (ride.status === 'cancelled' || ride.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This planned commute is no longer active. In SmartRoute, commuters can only join active, existing routes.',
      });
    }

    // Rule 13: Passenger cannot request an unrelated route merely because a vehicle exists
    if (pickupCoords && dropCoords && calculateMatchScore) {
      const compatibility = calculateMatchScore(ride, pickupCoords, dropCoords);
      if (compatibility.overall < 30) {
        return res.status(400).json({
          success: false,
          message: 'Route incompatibility: Your requested trajectory does not overlap with the Host\'s planned commute. SmartRoute is a shared commute platform where co-commuters join existing routes, not an on-demand taxi dispatch service.',
        });
      }
    }

    // Existing active request check
    const existing = await Booking.findOne({
      ride: rideId,
      passenger: req.user.id || req.user._id,
      status: { $in: ['requested', 'accepted'] },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already requested this ride' });
    }

    // Atomic seat decrement to prevent race-condition overbooking
    const updatedRide = await Ride.findOneAndUpdate(
      { _id: rideId, availableSeats: { $gte: 1 } },
      { $inc: { availableSeats: -1 } },
      { new: true }
    );
    if (!updatedRide) {
      return res.status(400).json({ success: false, message: 'No seats available on this ride' });
    }
    if (updatedRide.availableSeats === 0) {
      updatedRide.status = 'full';
      await updatedRide.save();
    }

    let booking;
    try {
      // Calculate match score
      const matchScore = calculateMatchScore
        ? calculateMatchScore(ride, pickupCoords || [80.43, 16.30], dropCoords || [80.53, 16.23])
        : { overall: 90, route: 90, time: 90, pickup: 90, destination: 90, reliability: 90 };

      booking = await Booking.create({
        passenger: req.user.id || req.user._id,
        driver: ride.driver?._id || ride.driver,
        ride: rideId,
        status: 'requested',
        pickupLocation: {
          address: pickupLocation || 'Pickup Point',
          location: { type: 'Point', coordinates: pickupCoords || [80.43, 16.30] },
        },
        dropLocation: {
          address: dropLocation || 'Destination Point',
          location: { type: 'Point', coordinates: dropCoords || [80.53, 16.23] },
        },
        matchScore,
        costContribution: updatedRide.costPerSeat || 45,
      });
    } catch (bookingErr) {
      // Rollback seat decrement on booking creation failure
      await Ride.findByIdAndUpdate(rideId, { $inc: { availableSeats: 1 }, status: 'active' });
      throw bookingErr;
    }

    res.status(201).json({ success: true, message: 'Seat requested successfully! Host notified.', booking, data: booking });
  } catch (error) {
    next(error);
  }
};

// Get current user's bookings (as passenger or driver)
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = String(req.user._id || req.user.id || '');

    let asPassenger = [];
    let asDriver = [];

    if (mongoose.connection.readyState === 1) {
      try {
        asPassenger = await Booking.find({ passenger: req.user._id || req.user.id })
          .populate('driver', 'name phone rating userType organization')
          .populate('ride')
          .sort('-createdAt');

        asDriver = await Booking.find({ driver: req.user._id || req.user.id })
          .populate('passenger', 'name phone rating userType organization')
          .populate('ride')
          .sort('-createdAt');
      } catch (e) {
        // Fallback gracefully
      }
    }

    // Merge in-memory bookings for this user as well (seamless hybrid fallback)
    const memBookings = (store.bookings || []).filter((b) => {
      const passId = String(b.passenger?._id || b.passenger?.id || b.passenger || '');
      const driverId = String(b.driver?._id || b.driver?.id || b.driver || '');
      return (
        passId === userId ||
        driverId === userId ||
        b.passenger?.name === req.user.name ||
        b.driver?.name === req.user.name
      );
    });

    const memAsPassenger = memBookings.filter(
      (b) => String(b.passenger?._id || b.passenger?.id || b.passenger || '') === userId || b.passenger?.name === req.user.name
    );
    const memAsDriver = memBookings.filter(
      (b) => String(b.driver?._id || b.driver?.id || b.driver || '') === userId || b.driver?.name === req.user.name
    );

    const mergedAsPassenger = [
      ...asPassenger,
      ...memAsPassenger.filter((mb) => !asPassenger.some((p) => String(p._id) === String(mb._id))),
    ];
    const mergedAsDriver = [
      ...asDriver,
      ...memAsDriver.filter((md) => !asDriver.some((d) => String(d._id) === String(md._id))),
    ];
    const allBookings = [...mergedAsPassenger, ...mergedAsDriver];

    res.json({
      success: true,
      count: allBookings.length,
      bookings: allBookings,
      data: {
        asPassenger: mergedAsPassenger,
        asDriver: mergedAsDriver,
      },
    });
  } catch (error) {
    const allBookings = (store.bookings || []).filter((b) => {
      const passId = String(b.passenger?._id || b.passenger?.id || b.passenger || '');
      const driverId = String(b.driver?._id || b.driver?.id || b.driver || '');
      const userId = String(req.user?._id || req.user?.id || '');
      return passId === userId || driverId === userId;
    });

    res.json({
      success: true,
      count: allBookings.length,
      bookings: allBookings,
      data: {
        asPassenger: allBookings,
        asDriver: [],
      },
    });
  }
};

// Update booking status (accept, reject, start, complete, cancel)
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id, action } = req.params;
    const userId = String(req.user?._id || req.user?.id || '');

    const isMockBookingId = !mongoose.isValidObjectId(id) || String(id).startsWith('bk-');

    // Check in-memory store if offline or booking ID is from store or not a valid ObjectId
    if (mongoose.connection.readyState !== 1 || isMockBookingId) {
      const memBooking = (store.bookings || []).find((b) => String(b._id || b.id) === String(id));
      if (memBooking) {
        if (action === 'start') {
          if (['rejected', 'cancelled'].includes(memBooking.status)) {
            return res.status(400).json({ success: false, message: 'Cannot start a rejected or cancelled booking.' });
          }
          memBooking.status = 'started';
          memBooking.startedAt = new Date();
        } else if (action === 'complete') {
          if (memBooking.status !== 'started') {
            return res.status(400).json({ success: false, message: 'Booking must be started before completing.' });
          }
          memBooking.status = 'completed';
          memBooking.completedAt = new Date();
        } else if (action === 'accept') {
          if (['cancelled', 'rejected', 'completed'].includes(memBooking.status)) {
            return res.status(400).json({ success: false, message: 'Cannot accept a cancelled or closed booking.' });
          }
          memBooking.status = 'accepted';
          memBooking.acceptedAt = new Date();
        } else if (action === 'reject') {
          if (['completed', 'started'].includes(memBooking.status)) {
            return res.status(400).json({ success: false, message: 'Cannot reject an active or completed commute.' });
          }
          memBooking.status = 'rejected';
          memBooking.rejectedAt = new Date();
          const targetRideId = String(memBooking.ride?._id || memBooking.rideId || memBooking.ride || '');
          const ride = (store.rides || []).find((r) => String(r._id) === targetRideId);
          if (ride) {
            ride.availableSeats = Math.min((ride.totalSeats || 4), (ride.availableSeats || 0) + 1);
            if (ride.status === 'full') ride.status = 'active';
          }
        } else if (action === 'cancel') {
          if (memBooking.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot cancel a completed commute.' });
          }
          memBooking.status = 'cancelled';
          memBooking.cancelledAt = new Date();
          const targetRideId = String(memBooking.ride?._id || memBooking.rideId || memBooking.ride || '');
          const ride = (store.rides || []).find((r) => String(r._id) === targetRideId);
          if (ride) {
            ride.availableSeats = Math.min((ride.totalSeats || 4), (ride.availableSeats || 0) + 1);
            if (ride.status === 'full') ride.status = 'active';
          }
        } else {
          return res.status(400).json({ success: false, message: 'Invalid action' });
        }
        return res.json({ success: true, message: `Booking status updated to ${memBooking.status}`, data: memBooking });
      }
    }

    // Try MongoDB
    let booking = null;
    try {
      booking = await Booking.findById(id).populate('ride');
    } catch (e) {
      // ignore
    }

    if (!booking) {
      const memBooking = (store.bookings || []).find((b) => String(b._id || b.id) === String(id));
      if (memBooking) {
        if (action === 'start') {
          memBooking.status = 'started';
          memBooking.startedAt = new Date();
        } else if (action === 'complete') {
          memBooking.status = 'completed';
          memBooking.completedAt = new Date();
        } else if (action === 'accept') {
          memBooking.status = 'accepted';
          memBooking.acceptedAt = new Date();
        } else if (action === 'reject') {
          memBooking.status = 'rejected';
          memBooking.rejectedAt = new Date();
        } else if (action === 'cancel') {
          memBooking.status = 'cancelled';
          memBooking.cancelledAt = new Date();
          const targetRideId = String(memBooking.ride?._id || memBooking.rideId || memBooking.ride || '');
          const ride = (store.rides || []).find((r) => String(r._id) === targetRideId);
          if (ride) {
            ride.availableSeats = Math.min((ride.totalSeats || 4), (ride.availableSeats || 0) + 1);
            if (ride.status === 'full') ride.status = 'active';
          }
        }
        return res.json({ success: true, message: `Booking status updated to ${memBooking.status}`, data: memBooking });
      }
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isDriver = String(booking.driver) === userId || String(booking.driver?._id) === userId;
    const isPassenger = String(booking.passenger) === userId || String(booking.passenger?._id) === userId;

    if (!isDriver && !isPassenger && !req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    if (action === 'accept') {
      if (!isDriver && !req.user?.isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the route host can accept a seat request.' });
      }
      if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: 'Cannot accept a cancelled or finished booking.' });
      }
      booking.status = 'accepted';
      booking.acceptedAt = new Date();
    } else if (action === 'reject') {
      if (!isDriver && !req.user?.isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the route host can reject a seat request.' });
      }
      if (['completed', 'started'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: 'Cannot reject an ongoing or completed commute.' });
      }
      booking.status = 'rejected';
      booking.rejectedAt = new Date();
      if (booking.ride) {
        booking.ride.availableSeats = Math.min(booking.ride.totalSeats || 4, (booking.ride.availableSeats || 0) + 1);
        if (booking.ride.status === 'full') booking.ride.status = 'active';
        await booking.ride.save();
      }
    } else if (action === 'start') {
      if (['rejected', 'cancelled'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: 'Cannot start a rejected or cancelled booking.' });
      }
      booking.status = 'started';
      booking.startedAt = new Date();
    } else if (action === 'complete') {
      if (booking.status !== 'started') {
        return res.status(400).json({ success: false, message: 'Commute must be started before completing.' });
      }
      booking.status = 'completed';
      booking.completedAt = new Date();
      await User.updateMany({ _id: { $in: [booking.passenger, booking.driver] } }, { $inc: { completedRides: 1 } });
    } else if (action === 'cancel') {
      if (booking.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a completed commute.' });
      }
      if (booking.ride) {
        booking.ride.availableSeats = Math.min(booking.ride.totalSeats || 4, (booking.ride.availableSeats || 0) + 1);
        if (booking.ride.status === 'full') booking.ride.status = 'active';
        await booking.ride.save();
      }
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await booking.save();
    res.json({ success: true, message: `Booking status updated to ${booking.status}`, data: booking });
  } catch (error) {
    next(error);
  }
};

// Get booking details by ID
exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = String(req.user?._id || req.user?.id || '');

    const isMockBookingId = !mongoose.isValidObjectId(id) || String(id).startsWith('bk-');

    if (mongoose.connection.readyState !== 1 || isMockBookingId) {
      const memBooking = (store.bookings || []).find((b) => String(b._id || b.id) === String(id));
      if (!memBooking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      return res.json({ success: true, booking: memBooking });
    }

    let booking = null;
    try {
      booking = await Booking.findById(id)
        .populate('driver', 'name phone rating userType organization profilePhoto')
        .populate('passenger', 'name phone rating userType organization profilePhoto')
        .populate('ride');
    } catch {
      // ignore
    }

    if (!booking) {
      const memBooking = (store.bookings || []).find((b) => String(b._id || b.id) === String(id));
      if (memBooking) return res.json({ success: true, booking: memBooking });
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isDriver = String(booking.driver?._id || booking.driver) === userId;
    const isPassenger = String(booking.passenger?._id || booking.passenger) === userId;
    if (!isDriver && !isPassenger && !req.user?.isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};
