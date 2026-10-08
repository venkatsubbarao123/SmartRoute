const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/verify', optionalAuth, userController.submitVerification);
router.post('/vehicles', protect, userController.addVehicle);
router.get('/vehicles', protect, userController.getMyVehicles);

module.exports = router;
