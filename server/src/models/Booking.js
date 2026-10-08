const mongoose = require('mongoose');

/**
 * Booking Schema
 * Tracks passenger ride requests and their lifecycle
 * Stores match scores for transparency and analytics
 */
const bookingSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger is required'],
    },
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'rejected', 'cancelled', 'started', 'completed'],
      default: 'requested',
    },

    // Passenger's desired pickup location
    pickupLocation: {
      address: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number], // [lon, lat]
      },
    },

    // Passenger's desired drop location
    dropLocation: {
      address: { type: String, trim: true },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: [Number], // [lon, lat]
      },
    },

    // Match score breakdown from routeMatching service
    matchScore: {
      route: { type: Number, default: 0 },
      time: { type: Number, default: 0 },
      pickup: { type: Number, default: 0 },
      destination: { type: Number, default: 0 },
      reliability: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },

    // Cost split for this passenger
    costContribution: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Reason for cancellation/rejection
    cancelReason: { type: String, trim: true },

    // Rating done flags
    driverRated: { type: Boolean, default: false },
    passengerRated: { type: Boolean, default: false },

    // Timestamps for status changes
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ passenger: 1, status: 1 });
bookingSchema.index({ ride: 1, status: 1 });
bookingSchema.index({ driver: 1, status: 1 });
bookingSchema.index({ 'pickupLocation.location': '2dsphere' });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
