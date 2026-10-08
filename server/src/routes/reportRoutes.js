const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.post('/', protect, reportController.submitReport);
router.get('/', protect, reportController.getReports);

module.exports = router;
