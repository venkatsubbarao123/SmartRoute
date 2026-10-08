const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, rideController.createRide);
router.get('/', rideController.getRides);
router.get('/search', rideController.searchRides);
router.post('/search', rideController.searchRides);
router.get('/geocode', rideController.geocodeLocation);
router.post('/calculate-cost', rideController.calculateCost);
router.get('/my-rides', protect, rideController.getMyRides);
router.get('/:id', rideController.getRideById);
router.put('/:id/start', protect, rideController.startRide);
router.put('/:id/complete', protect, rideController.completeRide);
router.put('/:id', protect, rideController.updateRide);
router.delete('/:id', protect, rideController.cancelRide);

module.exports = router;
