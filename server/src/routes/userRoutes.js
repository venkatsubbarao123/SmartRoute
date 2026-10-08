const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.post('/verify', optionalAuth, userController.submitVerification);

// Vehicle Management
router.post('/vehicles', protect, userController.addVehicle);
router.get('/vehicles', protect, userController.getMyVehicles);
router.put('/vehicles/:id', protect, userController.updateVehicle);
router.delete('/vehicles/:id', protect, userController.deleteVehicle);

// Notifications
router.get('/notifications', protect, userController.getNotifications);
router.put('/notifications/:id/read', protect, userController.markNotificationRead);
router.put('/notifications/read-all', protect, (req, res, next) => {
  req.params.id = 'all';
  userController.markNotificationRead(req, res, next);
});

module.exports = router;
