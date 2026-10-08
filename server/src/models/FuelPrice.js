const mongoose = require('mongoose');

/**
 * Fuel Price Configuration Model
 * Tracks regional fuel prices to dynamically calculate non-commercial travel costs
 */
const fuelPriceSchema = new mongoose.Schema(
  {
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric'],
      default: 'petrol',
      required: true,
    },
    pricePerLiter: {
      type: Number,
      required: true,
      min: [1, 'Price must be greater than zero'],
      default: 117.68, // Current Andhra Pradesh / Telangana reference price
    },
    currency: {
      type: String,
      default: 'INR',
    },
    location: {
      type: String,
      default: 'Andhra Pradesh',
      trim: true,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: 'Official Regional Benchmark',
    },
  },
  { timestamps: true }
);

fuelPriceSchema.index({ fuelType: 1, location: 1 });

const FuelPrice = mongoose.model('FuelPrice', fuelPriceSchema);
module.exports = FuelPrice;
