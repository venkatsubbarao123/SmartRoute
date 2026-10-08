const mongoose = require('mongoose');
const Report = require('../models/Report');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const store = require('../services/dataStore');

const submitReport = asyncHandler(async (req, res) => {
  const { reported, reason, description, ride, booking } = req.body;
  const reporterId = req.user?._id || req.user?.id || 'u-reporter';

  if (!reported) throw new AppError('Reported user is required.', 400);
  if (!reason) throw new AppError('Reason is required.', 400);
  if (!description || description.trim().length < 10) {
    throw new AppError('Description must be at least 10 characters.', 400);
  }

  if (mongoose.connection.readyState !== 1) {
    const report = store.createReport({
      reporter: reporterId,
      reported,
      reason,
      description: description.trim(),
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
    description: description.trim(),
    ride,
    booking,
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
