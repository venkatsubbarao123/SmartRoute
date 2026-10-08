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

    if (mongoose.connection.readyState !== 1) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({
          success: false,
          message: 'Database service is temporarily unavailable. Please try again shortly.',
        });
      }
      try {
        const booking = store.createBooking({
          rideId,
          pickup: pickupLocation,
          destination: dropLocation,
        }, req.user);
        return res.status(201).json({ success: true, message: 'Seat requested successfully!', booking, data: booking });
      } catch (storeErr) {
        return res.status(400).json({ success: false, message: storeErr.message });
      }
    }

    const ride = await Ride.findById(rideId).populate('driver');
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const driverId = ride.driver?._id ? ride.driver._id.toString() : ride.driver?.toString();
    if (driverId === req.user.id || driverId === req.user._id?.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You are the host of this route. You cannot book your own commute. Please search routes offered by other commuters or sign in with another account.',
      });
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

    res.status(201).json({ success: true, message: 'Seat requested successfully!', booking, data: booking });
  } catch (error) {
    next(error);
  }
};

// Get current user's bookings (as passenger or driver)
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = String(req.user._id || req.user.id || '');

    if (mongoose.connection.readyState !== 1) {
      const allBookings = store.bookings || [];
      const userBookings = allBookings.filter((b) => {
        const passId = String(b.passenger?._id || b.passenger?.id || b.passenger || '');
        const driverId = String(b.driver?._id || b.driver?.id || b.driver || '');
        return (
          passId === userId ||
          driverId === userId ||
          b.passenger?.name === req.user.name ||
          b.driver?.name === req.user.name
        );
      });

      const asPassenger = userBookings.filter(
        (b) => String(b.passenger?._id || b.passenger?.id || b.passenger || '') === userId || b.passenger?.name === req.user.name
      );
      const asDriver = userBookings.filter(
        (b) => String(b.driver?._id || b.driver?.id || b.driver || '') === userId || b.driver?.name === req.user.name
      );

      return res.json({
        success: true,
        count: userBookings.length,
        bookings: userBookings,
        data: {
          asPassenger,
          asDriver,
        },
      });
    }

    const asPassenger = await Booking.find({ passenger: req.user._id || req.user.id })
      .populate('driver', 'name phone rating userType organization')
      .populate('ride')
      .sort('-createdAt');

    const asDriver = await Booking.find({ driver: req.user._id || req.user.id })
      .populate('passenger', 'name phone rating userType organization')
      .populate('ride')
      .sort('-createdAt');

    const allBookings = [...asPassenger, ...asDriver];

    res.json({
      success: true,
      count: allBookings.length,
      bookings: allBookings,
      data: {
        asPassenger,
        asDriver,
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

    // Check in-memory store if offline or booking ID is from store
    if (mongoose.connection.readyState !== 1 || String(id).startsWith('bk-')) {
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
        } else if (action === 'reject') {
          memBooking.status = 'rejected';
        } else if (action === 'cancel') {
          memBooking.status = 'cancelled';
          const ride = (store.rides || []).find((r) => String(r._id) === String(memBooking.ride || memBooking.ride?._id));
          if (ride) {
            ride.availableSeats = (ride.availableSeats || 0) + 1;
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
      // Fallback search in store
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
        } else if (action === 'reject') {
          memBooking.status = 'rejected';
        } else if (action === 'cancel') {
          memBooking.status = 'cancelled';
          const ride = (store.rides || []).find((r) => String(r._id) === String(memBooking.ride || memBooking.ride?._id));
          if (ride) {
            ride.availableSeats = (ride.availableSeats || 0) + 1;
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
      booking.status = 'accepted';
      if (booking.ride && booking.ride.availableSeats > 0) {
        booking.ride.availableSeats -= 1;
        await booking.ride.save();
      }
    } else if (action === 'reject') {
      booking.status = 'rejected';
    } else if (action === 'start') {
      booking.status = 'started';
      booking.startedAt = new Date();
    } else if (action === 'complete') {
      booking.status = 'completed';
      booking.completedAt = new Date();
      await User.updateMany({ _id: { $in: [booking.passenger, booking.driver] } }, { $inc: { completedRides: 1 } });
    } else if (action === 'cancel') {
      if (booking.ride) {
        booking.ride.availableSeats = (booking.ride.availableSeats || 0) + 1;
        if (booking.ride.status === 'full') booking.ride.status = 'active';
        await booking.ride.save();
      }
      booking.status = 'cancelled';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await booking.save();
    res.json({ success: true, message: `Booking status updated to ${booking.status}`, data: booking });
  } catch (error) {
    next(error);
  }
};
