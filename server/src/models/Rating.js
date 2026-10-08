const mongoose = require('mongoose');

/**
 * Rating Schema
 * Stores post-ride ratings between drivers and passengers
 */
const ratingSchema = new mongoose.Schema(
  {
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rater is required'],
    },
    ratee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ratee is required'],
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking is required'],
    },
    role: {
      type: String,
      enum: ['driver', 'passenger'],
      required: [true, 'Role is required'],
    },
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    categories: {
      cleanliness: { type: Number, min: 1, max: 5, default: null },
      safety: { type: Number, min: 1, max: 5, default: null },
      punctuality: { type: Number, min: 1, max: 5, default: null },
      behaviour: { type: Number, min: 1, max: 5, default: null },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ratingSchema.index({ rater: 1, booking: 1 }, { unique: true });
ratingSchema.index({ ratee: 1 });
ratingSchema.index({ ride: 1 });

const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
