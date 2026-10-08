const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { notify } = require('../services/notificationService');

const submitRating = asyncHandler(async (req, res) => {
  const { bookingId, overall, categories, comment } = req.body;

  const booking = await Booking.findById(bookingId).populate('ride');
  if (!booking) throw new AppError('Booking not found.', 404);
  if (booking.status !== 'completed') throw new AppError('Can only rate completed rides.', 400);

  // Determine if rater is driver or passenger
  const isDriver = booking.driver.toString() === req.user._id.toString();
  const isPassenger = booking.passenger.toString() === req.user._id.toString();
  if (!isDriver && !isPassenger) throw new AppError('Not authorized.', 403);

  // Who is being rated
  const rateeId = isDriver ? booking.passenger : booking.driver;
  const role = isDriver ? 'passenger' : 'driver';

  // Check if already rated
  const existing = await Rating.findOne({ rater: req.user._id, booking: bookingId });
  if (existing) throw new AppError('You have already rated this ride.', 400);

  const rating = await Rating.create({
    rater: req.user._id,
    ratee: rateeId,
    ride: booking.ride._id,
    booking: bookingId,
    role,
    overall,
    categories: categories || {},
    comment: comment || '',
  });

  // Update the ratee's aggregate rating
  const ratee = await User.findById(rateeId);
  if (ratee) {
    ratee.updateRating(overall);
    await ratee.save();
  }

  // Mark rated flag on booking
  if (isDriver) booking.passengerRated = true;
  else booking.driverRated = true;
  await booking.save();

  // Notify ratee
  const io = req.app.get('io');
  await notify(io, rateeId, 'rating_received', 'New Rating Received ⭐', `${req.user.name} rated you ${overall}/5 stars!`, {
    bookingId,
    ratingId: rating._id,
    overall,
  });

  res.status(201).json({ success: true, message: 'Rating submitted successfully!', rating });
});

const getUserRatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role } = req.query;
  const filter = { ratee: req.params.userId };
  if (role) filter.role = role;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [ratings, total] = await Promise.all([
    Rating.find(filter)
      .populate('rater', 'name profilePhoto')
      .populate('ride', 'origin destination departureTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Rating.countDocuments(filter),
  ]);

  // Calculate averages
  const avgResult = await Rating.aggregate([
    { $match: { ratee: require('mongoose').Types.ObjectId.createFromHexString(req.params.userId) } },
    { $group: { _id: null, avg: { $avg: '$overall' }, count: { $sum: 1 } } },
  ]);
  const average = avgResult.length ? +avgResult[0].avg.toFixed(2) : 0;
  const totalCount = avgResult.length ? avgResult[0].count : 0;

  res.json({ success: true, count: ratings.length, total, average, totalRatings: totalCount, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), ratings });
});

const checkIfRated = asyncHandler(async (req, res) => {
  const existing = await Rating.findOne({ rater: req.user._id, booking: req.params.bookingId });
  res.json({ success: true, hasRated: !!existing, rating: existing || null });
});

module.exports = { submitRating, getUserRatings, checkIfRated };
