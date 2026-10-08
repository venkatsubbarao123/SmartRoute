const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.get('/:bookingId', protect, messageController.getMessages);
router.post('/:bookingId', protect, messageController.sendMessage);

module.exports = router;
