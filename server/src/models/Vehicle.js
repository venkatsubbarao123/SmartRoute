const mongoose = require('mongoose');

/**
 * Vehicle Schema
 * Tracks vehicles registered by drivers on the platform
 */
const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'motorcycle'],
      required: [true, 'Vehicle type is required'],
      default: 'bike',
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric'],
      default: 'petrol',
    },
    mileage: {
      type: Number,
      required: [true, 'Vehicle mileage (km/L) is required'],
      min: [5, 'Mileage must be at least 5 km/L'],
      max: [100, 'Mileage cannot exceed 100 km/L'],
      default: 45, // 45 km/L for bikes, 15 km/L for cars
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1990, 'Year must be 1990 or later'],
      max: [new Date().getFullYear() + 1, 'Invalid year'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    seats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Vehicle must have at least 1 seat'],
      max: [8, 'Maximum 8 seats allowed'],
      default: 1,
    },
    availableSeats: {
      type: Number,
      default: 1,
    },
    // Vehicle documents
    documents: {
      rcBook: { type: String, default: null },       // RC book image URL
      insurance: { type: String, default: null },    // Insurance image URL
      pollutionCert: { type: String, default: null }, // PUC image URL
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

vehicleSchema.index({ owner: 1 });
vehicleSchema.index({ registrationNumber: 1 });

// Virtual: Display name
vehicleSchema.virtual('displayName').get(function () {
  return `${this.year} ${this.brand} ${this.model} (${this.color})`;
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;
