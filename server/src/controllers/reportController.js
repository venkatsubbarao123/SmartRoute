const mongoose = require('mongoose');
const Report = require('../models/Report');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const store = require('../services/dataStore');

const submitReport = asyncHandler(async (req, res) => {
  const reported = req.body.reported || req.body.reportedUser;
  const rawReason = req.body.reason || req.body.category || 'other';
  const rawDesc = req.body.description || '';
  const ride = req.body.ride || req.body.rideId;
  const booking = req.body.booking || req.body.bookingId;
  const reporterId = req.user?._id || req.user?.id || 'u-reporter';

  if (!reported) throw new AppError('Reported user is required.', 400);

  // Normalize category/reason to schema enum
  const reasonMap = {
    reckless_driving: 'safety_concern',
    safety_concern: 'safety_concern',
    inappropriate_behaviour: 'inappropriate_behaviour',
    no_show: 'no_show',
    route_deviation: 'route_deviation',
    harassment: 'harassment',
    fraud: 'fraud',
    other: 'other',
  };
  const reason = reasonMap[rawReason] || 'other';

  const trimmedDesc = rawDesc.trim();
  if (trimmedDesc.length < 10) {
    throw new AppError('Description must be at least 10 characters explaining the issue.', 400);
  }
  // Schema requires 20 chars
  const validDesc = trimmedDesc.length >= 20 ? trimmedDesc : `${trimmedDesc} (Reported via SmartRoute Safety Portal)`;

  const isMock = mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(reported) || !mongoose.isValidObjectId(reporterId);

  if (isMock) {
    const report = store.createReport({
      reporter: reporterId,
      reported,
      reason,
      description: validDesc,
      rideId: ride,
      bookingId: booking,
    });
    return res.status(201).json({
      success: true,
      message: 'Safety report submitted successfully. Our safety trust team will review this.',
      report,
    });
  }

  const report = await Report.create({
    reporter: reporterId,
    reported,
    reason,
    description: validDesc,
    ride: mongoose.isValidObjectId(ride) ? ride : null,
    booking: mongoose.isValidObjectId(booking) ? booking : null,
  });

  res.status(201).json({
    success: true,
    message: 'Safety report submitted successfully. Our safety trust team will review this.',
    report,
  });
});

const getReports = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const reports = store.getReports();
    return res.json({ success: true, count: reports.length, reports });
  }

  const reports = await Report.find()
    .populate('reporter', 'name email')
    .populate('reported', 'name email')
    .sort('-createdAt');

  res.json({ success: true, count: reports.length, reports });
});

module.exports = { submitReport, getReports };
