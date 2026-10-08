/**
 * Fuel Price Service
 * Manages configurable, location-based fuel prices to calculate realistic travel cost contributions.
 */

const FuelPrice = require('../models/FuelPrice');

// Regional fallback prices (INR per Liter)
const DEFAULT_PRICES = {
  petrol: 117.68,
  diesel: 98.40,
  cng: 85.50,
  electric: 10.50, // per kWh equivalent
};

class FuelPriceService {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get effective fuel price per liter
   * @param {string} fuelType - 'petrol' | 'diesel' | 'cng' | 'electric'
   * @param {string} location - State or City name
   * @returns {Promise<number>} Price in INR per liter
   */
  async getPrice(fuelType = 'petrol', location = 'Andhra Pradesh') {
    const key = `${fuelType.toLowerCase()}_${location.toLowerCase()}`;
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const record = await FuelPrice.findOne({
          fuelType: fuelType.toLowerCase(),
        }).sort({ effectiveDate: -1 });

        if (record && record.pricePerLiter) {
          this.cache.set(key, record.pricePerLiter);
          return record.pricePerLiter;
        }
      }
    } catch (err) {
      console.warn('FuelPriceService database lookup note:', err.message);
    }

    const fallbackPrice = DEFAULT_PRICES[fuelType.toLowerCase()] || DEFAULT_PRICES.petrol;
    this.cache.set(key, fallbackPrice);
    return fallbackPrice;
  }

  /**
   * Update or set regional fuel price
   */
  async updatePrice(fuelType, pricePerLiter, location = 'Andhra Pradesh', source = 'Manual Configuration') {
    const key = `${fuelType.toLowerCase()}_${location.toLowerCase()}`;
    this.cache.set(key, pricePerLiter);

    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await FuelPrice.findOneAndUpdate(
          { fuelType: fuelType.toLowerCase(), location },
          { pricePerLiter, effectiveDate: new Date(), source },
          { upsert: true, new: true }
        );
      }
    } catch (err) {
      console.warn('FuelPriceService database update note:', err.message);
    }

    return { fuelType, pricePerLiter, location, currency: 'INR' };
  }
}

const fuelPriceService = new FuelPriceService();
module.exports = fuelPriceService;
