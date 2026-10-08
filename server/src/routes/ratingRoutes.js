const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { protect } = require('../middleware/auth');

router.post('/', protect, ratingController.submitRating);
router.get('/user/:userId', ratingController.getUserRatings);
router.get('/check/:bookingId', protect, ratingController.checkIfRated);

module.exports = router;
