const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, bookingController.requestRide);
router.get('/my', protect, bookingController.getMyBookings);
router.get('/my-bookings', protect, bookingController.getMyBookings);
router.get('/:id', protect, bookingController.getBookingById);
router.put('/:id/:action', protect, bookingController.updateBookingStatus);

module.exports = router;
