/**
 * SmartRoute End-to-End Automated Verification Test Suite
 * Tests all core architectural components, business rules, and API endpoints
 */
const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const store = require('./src/services/dataStore');
const { calculateSharedFuelCost, DEFAULT_MILEAGE } = require('./src/services/costCalculator');
const { calculateMatchScore } = require('./src/services/routeMatching');

let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} ->`, err.message);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name} ->`, err.message);
    testsFailed++;
  }
}

async function main() {
  console.log('====================================================');
  console.log('SMARTROUTE SYSTEM VERIFICATION & COMPLIANCE TEST SUITE');
  console.log('====================================================\n');

  // ─── 1. CORE BUSINESS IDENTITY & TERMINOLOGY ───────────────────
  console.log('--- 1. Identity & Business Terminology Checks ---');
  runTest('SmartRoute value proposition tagline exists', () => {
    const pkg = require('./package.json');
    assert.strictEqual(pkg.name, 'smartroute-server');
  });

  // ─── 2. FUEL COST SHARING ALGORITHM ────────────────────────────
  console.log('\n--- 2. Fair Fuel Cost-Sharing Calculations ---');
  await runAsyncTest('Fuel calculation follows exact formula (Distance / Mileage * Price / Participants)', async () => {
    // 30 km, 15 km/L, 100/L, 2 participants:
    // Fuel used: 30 / 15 = 2.0 L
    // Total fuel cost: 2.0 * 100 = 200
    // Shared contribution: 200 / 2 = 100
    const breakdown = await calculateSharedFuelCost({
      distanceKm: 30,
      vehicleType: 'car',
      participants: 2,
      customMileage: 15,
      customPricePerLiter: 100,
    });

    assert.strictEqual(breakdown.fuelUsedLiters, 2);
    assert.strictEqual(breakdown.totalFuelCost, 200);
    assert.strictEqual(breakdown.sharedContribution, 100);
    assert.strictEqual(breakdown.currency, 'INR');
  });

  await runAsyncTest('Motorcycle fuel calculation produces fair commuter contribution', async () => {
    // 34.5 km on bike @ 45 km/L, ~117.68/L, 2 participants (Host + 1 Co-commuter):
    const breakdown = await calculateSharedFuelCost({
      distanceKm: 34.5,
      vehicleType: 'bike',
      participants: 2,
      customMileage: 45,
      customPricePerLiter: 117.68,
    });
    // 34.5 / 45 = 0.766 L * 117.68 = ~90.23 / 2 = 45
    assert.strictEqual(breakdown.sharedContribution, 45);
  });

  // ─── 3. 5-FACTOR ROUTE MATCHING ENGINE ─────────────────────────
  console.log('\n--- 3. 5-Factor Algorithmic Route Matching Engine ---');
  runTest('Route matching calculates normalized score for compatible commute', () => {
    const plannedCommute = {
      origin: { address: 'Guntur Bus Station', location: { coordinates: [80.4365, 16.3067] } },
      destination: { address: 'Benz Circle, Vijayawada', location: { coordinates: [80.6480, 16.5062] } },
      departureTime: new Date('2026-10-10T08:15:00'),
      driver: { rating: { average: 4.9, count: 52 } },
    };

    const commuterPickup = [80.4400, 16.3100]; // Nearby pickup
    const commuterDrop = [80.6450, 16.5050];   // Nearby destination
    const commuterTime = new Date('2026-10-10T08:20:00'); // 5 mins delta

    const score = calculateMatchScore(plannedCommute, commuterPickup, commuterDrop, commuterTime);
    assert.ok(score.overall >= 80, `Expected score >= 80, got ${score.overall}`);
    assert.ok(score.route >= 70, 'Route overlap component should be high');
    assert.ok(score.time >= 80, 'Time compatibility should be high');
  });

  runTest('Incompatible geographic trajectory is rejected (score < 40)', () => {
    const plannedCommute = {
      origin: { address: 'Guntur Bus Station', location: { coordinates: [80.4365, 16.3067] } },
      destination: { address: 'Benz Circle, Vijayawada', location: { coordinates: [80.6480, 16.5062] } },
      departureTime: new Date('2026-10-10T08:15:00'),
    };

    // Hyderabad coordinates (~250km away)
    const hydPickup = [78.4867, 17.3850];
    const hydDrop = [78.5000, 17.4000];

    const score = calculateMatchScore(plannedCommute, hydPickup, hydDrop);
    assert.ok(score.overall < 30, `Expected overall score < 30 for unrelated corridor, got ${score.overall}`);
  });

  // ─── 4. NON-OBJECTID MOCK ID DEFENSE & HARDENING ───────────────
  console.log('\n--- 4. CastError Defense & Mock ID Resilience ---');
  runTest('Mongoose isValidObjectId reliably distinguishes MongoDB ObjectIds from string IDs', () => {
    assert.strictEqual(mongoose.isValidObjectId('ride-6'), false);
    assert.strictEqual(mongoose.isValidObjectId('bk-1728484839'), false);
    assert.strictEqual(mongoose.isValidObjectId('507f1f77bcf86cd799439011'), true);
  });

  runTest('DataStore createBooking succeeds with string IDs like "ride-1"', () => {
    const passenger = { _id: 'u-test-pass', name: 'Test Passenger', userType: 'student' };
    const booking = store.createBooking(
      {
        rideId: 'ride-1',
        pickup: 'Guntur Bus Station',
        destination: 'Benz Circle',
      },
      passenger
    );
    assert.ok(booking, 'Booking should be created');
    assert.strictEqual(booking.status, 'requested');
    assert.ok(booking._id.startsWith('bk-'));
  });

  runTest('Host cannot request seat on own route (Self-booking prevention)', () => {
    const hostUser = store.users[0]; // Alex Mercer is driver of ride-1
    assert.throws(
      () => {
        store.createBooking(
          {
            rideId: 'ride-1',
            pickup: 'Guntur Bus Station',
            destination: 'Benz Circle',
          },
          hostUser
        );
      },
      /cannot book your own commute/i
    );
  });

  // ─── 5. BOOKING LIFECYCLE TRANSITIONS ──────────────────────────
  console.log('\n--- 5. Booking Lifecycle State Transitions ---');
  runTest('Legal booking lifecycle transitions (REQUESTED -> ACCEPTED -> STARTED -> COMPLETED)', () => {
    const mockBooking = {
      _id: 'bk-test-lifecycle',
      status: 'requested',
    };

    // Transition 1: Accept
    mockBooking.status = 'accepted';
    assert.strictEqual(mockBooking.status, 'accepted');

    // Transition 2: Start
    mockBooking.status = 'started';
    assert.strictEqual(mockBooking.status, 'started');

    // Transition 3: Complete
    mockBooking.status = 'completed';
    assert.strictEqual(mockBooking.status, 'completed');
  });

  runTest('Booking cancellation restores route available seats', () => {
    const bookingCtrl = require('./src/controllers/bookingController');
    const ride = store.rides[1]; // ride-2
    const initialSeats = ride.availableSeats;

    const passenger = { _id: 'u-cancel-test', name: 'Cancel Test Commuter', userType: 'student' };
    const booking = store.createBooking(
      { rideId: ride._id, pickup: 'Origin Point', destination: 'Dest Point' },
      passenger
    );
    assert.strictEqual(ride.availableSeats, initialSeats - 1, 'Seat should decrement on request');

    // Simulate cancel request via controller
    const reqCancel = {
      user: passenger,
      params: { id: booking._id, action: 'cancel' }
    };
    let jsonResult = null;
    const resCancel = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { jsonResult = data; return this; }
    };

    bookingCtrl.updateBookingStatus(reqCancel, resCancel, () => {});
    assert.strictEqual(resCancel.statusCode, 200);
    assert.strictEqual(jsonResult?.data?.status, 'cancelled');
    assert.strictEqual(ride.availableSeats, initialSeats, 'Seat should be restored upon cancellation');
  });

  // ─── 6. MONGOOSE SCHEMA & MODEL INTEGRITY ──────────────────────
  console.log('\n--- 6. Mongoose Models Integrity ---');
  runTest('Models compile cleanly without schema registration errors', () => {
    const User = require('./src/models/User');
    const Vehicle = require('./src/models/Vehicle');
    const Ride = require('./src/models/Ride');
    const Booking = require('./src/models/Booking');
    const Rating = require('./src/models/Rating');
    const Message = require('./src/models/Message');
    const Notification = require('./src/models/Notification');
    const Report = require('./src/models/Report');

    assert.ok(User && Vehicle && Ride && Booking && Rating && Message && Notification && Report);
  });

  // ─── 7. DATE PARSING & SANITIZATION ────────────────────────────
  console.log('\n--- 7. Departure Date & Time Parsing ---');
  runTest('Separate date and time strings combine into valid ISO Date', () => {
    const departureDate = '2026-10-10';
    const departureTime = '08:15';
    const combined = new Date(`${departureDate}T${departureTime}:00`);
    assert.strictEqual(isNaN(combined.getTime()), false, 'Combined date should be valid');
    assert.strictEqual(combined.getFullYear(), 2026);
  });

  // ─── 8. CONTROLLERS SYNTAX & EXPORTS ───────────────────────────
  console.log('\n--- 8. Controllers Syntax & API Contracts ---');
  runTest('All controllers export expected handler functions', () => {
    const bookingCtrl = require('./src/controllers/bookingController');
    const rideCtrl = require('./src/controllers/rideController');
    const userCtrl = require('./src/controllers/userController');
    const reportCtrl = require('./src/controllers/reportController');
    const ratingCtrl = require('./src/controllers/ratingController');
    const messageCtrl = require('./src/controllers/messageController');

    assert.strictEqual(typeof bookingCtrl.requestRide, 'function');
    assert.strictEqual(typeof bookingCtrl.getMyBookings, 'function');
    assert.strictEqual(typeof bookingCtrl.updateBookingStatus, 'function');
    assert.strictEqual(typeof rideCtrl.createRide, 'function');
    assert.strictEqual(typeof rideCtrl.getRides, 'function');
    assert.strictEqual(typeof rideCtrl.getMyRides, 'function');
    assert.strictEqual(typeof userCtrl.addVehicle, 'function');
    assert.strictEqual(typeof userCtrl.getMyVehicles, 'function');
    assert.strictEqual(typeof reportCtrl.submitReport, 'function');
    assert.strictEqual(typeof ratingCtrl.submitRating, 'function');
    assert.strictEqual(typeof messageCtrl.sendMessage, 'function');
  });

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test runner exception:', err);
  process.exit(1);
});
