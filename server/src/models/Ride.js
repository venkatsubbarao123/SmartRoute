const mongoose = require('mongoose');

/**
 * Ride Schema
 * Core ride-offering model with geospatial route support
 * Supports recurring rides and smart route matching
 */
const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    status: {
      type: String,
      enum: ['active', 'full', 'cancelled', 'completed', 'started'],
      default: 'active',
    },

    // Origin point
    origin: {
      address: {
        type: String,
        required: [true, 'Origin address is required'],
        trim: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },

    // Destination point
    destination: {
      address: {
        type: String,
        required: [true, 'Destination address is required'],
        trim: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
    },

    // Intermediate stops
    waypoints: [
      {
        address: { type: String, trim: true },
        location: {
          type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
          },
          coordinates: [Number], // [lon, lat]
        },
        order: { type: Number, default: 0 },
      },
    ],

    // Full route coordinates for matching (array of [lon, lat] pairs)
    routeCoordinates: {
      type: [[Number]],
      default: [],
    },

    departureTime: {
      type: Date,
      required: [true, 'Departure time is required'],
    },

    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [0, 'Available seats cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Must have at least 1 seat'],
    },

    // Recurring ride configuration
    recurring: {
      isRecurring: { type: Boolean, default: false },
      days: {
        type: [String],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: [],
      },
      endDate: { type: Date, default: null },
    },

    costPerSeat: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },

    // Route metrics
    distance: {
      type: Number, // kilometres
      default: 0,
      min: 0,
    },
    duration: {
      type: Number, // minutes
      default: 0,
      min: 0,
    },

    // Ride preferences
    preferences: {
      genderPreference: {
        type: String,
        enum: ['any', 'male_only', 'female_only'],
        default: 'any',
      },
      smokingAllowed: { type: Boolean, default: false },
      musicAllowed: { type: Boolean, default: true },
      petsAllowed: { type: Boolean, default: false },
      luggageAllowed: { type: Boolean, default: true },
    },

    // Notes from driver
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Cancelled reason
    cancelReason: { type: String, trim: true },

    // Actual start/end times
    actualStartTime: { type: Date, default: null },
    actualEndTime: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 2dsphere indexes for geospatial queries
rideSchema.index({ 'origin.location': '2dsphere' });
rideSchema.index({ 'destination.location': '2dsphere' });
rideSchema.index({ driver: 1, status: 1 });
rideSchema.index({ departureTime: 1 });
rideSchema.index({ status: 1 });

// Virtual: seats taken
rideSchema.virtual('seatsTaken').get(function () {
  return this.totalSeats - this.availableSeats;
});

// Virtual: is ride in the past
rideSchema.virtual('isExpired').get(function () {
  return this.departureTime < new Date() && this.status === 'active';
});

const Ride = mongoose.model('Ride', rideSchema);
module.exports = Ride;
