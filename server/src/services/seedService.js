const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Ride = require('../models/Ride');
const bcrypt = require('bcryptjs');

async function seedInitialData() {
  try {
    const rideCount = await Ride.countDocuments();
    if (rideCount > 0) return;

    console.log('🌱 Seeding verified commuter routes into MongoDB Atlas...');

    const defaultPassword = 'SmartRoute@2026';

    const usersData = [
      {
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@techcorp.com',
        phone: '+91 98765 67890',
        password: defaultPassword,
        userType: 'employee',
        employeeInfo: { company: 'TechCorp Cloud Systems', employeeId: 'TC-904', workEmail: 'sarah.jenkins@techcorp.com' },
        verification: { emailVerified: true, phoneVerified: true, identityVerified: true, employeeVerified: true },
        rating: { average: 4.9, count: 48 },
        completedRides: 32,
      },
      {
        name: 'Alex Mercer',
        email: 'alex.mercer@campus.edu',
        phone: '+91 98765 12345',
        password: defaultPassword,
        userType: 'student',
        studentInfo: { college: 'Guntur Institute of Tech', collegeId: 'GIT-2024-11', collegeEmail: 'alex.mercer@campus.edu' },
        verification: { emailVerified: true, phoneVerified: true, identityVerified: true, studentVerified: true },
        rating: { average: 4.85, count: 36 },
        completedRides: 28,
      },
      {
        name: 'David Lee',
        email: 'david.lee@campus.edu',
        phone: '+91 98765 11223',
        password: defaultPassword,
        userType: 'student',
        studentInfo: { college: 'Vijayawada Engineering College', collegeId: 'VEC-2025-05', collegeEmail: 'david.lee@campus.edu' },
        verification: { emailVerified: true, phoneVerified: true, identityVerified: true, studentVerified: true },
        rating: { average: 4.95, count: 54 },
        completedRides: 41,
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@healthcenter.org',
        phone: '+91 98765 33445',
        password: defaultPassword,
        userType: 'employee',
        employeeInfo: { company: 'Capital Hospital', employeeId: 'CH-402', workEmail: 'priya.sharma@healthcenter.org' },
        verification: { emailVerified: true, phoneVerified: true, identityVerified: true, employeeVerified: true },
        rating: { average: 4.9, count: 29 },
        completedRides: 25,
      },
    ];

    const seededUsers = [];
    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.create(u);
      }
      seededUsers.push(user);
    }

    const vehiclesData = [
      {
        owner: seededUsers[0]._id,
        vehicleType: 'car',
        fuelType: 'petrol',
        brand: 'Hyundai',
        model: 'i20 Magna',
        year: 2022,
        color: 'Polar White',
        registrationNumber: 'AP-16-EA-4921',
        seats: 4,
        mileage: 15,
      },
      {
        owner: seededUsers[1]._id,
        vehicleType: 'bike',
        fuelType: 'petrol',
        brand: 'Hero',
        model: 'Splendor Plus',
        year: 2023,
        color: 'Black Silver',
        registrationNumber: 'AP-07-CK-1020',
        seats: 2,
        mileage: 45,
      },
      {
        owner: seededUsers[2]._id,
        vehicleType: 'bike',
        fuelType: 'petrol',
        brand: 'TVS',
        model: 'Jupiter 125',
        year: 2023,
        color: 'Titanium Grey',
        registrationNumber: 'AP-07-MB-8822',
        seats: 2,
        mileage: 48,
      },
      {
        owner: seededUsers[3]._id,
        vehicleType: 'car',
        fuelType: 'petrol',
        brand: 'Honda',
        model: 'Amaze S-MT',
        year: 2021,
        color: 'Meteoroid Grey',
        registrationNumber: 'AP-16-CG-3011',
        seats: 4,
        mileage: 16,
      },
    ];

    const seededVehicles = [];
    for (const v of vehiclesData) {
      let vehicle = await Vehicle.findOne({ registrationNumber: v.registrationNumber });
      if (!vehicle) {
        vehicle = await Vehicle.create(v);
      }
      seededVehicles.push(vehicle);
    }

    // Future departure date
    const departure = new Date();
    departure.setDate(departure.getDate() + 2);
    departure.setHours(8, 30, 0, 0);

    const ridesToCreate = [
      {
        driver: seededUsers[0]._id,
        vehicle: seededVehicles[0]._id,
        origin: {
          address: 'Guntur Railway Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Auto Nagar Terminal, Vijayawada',
          location: { type: 'Point', coordinates: [80.6720, 16.4980] },
        },
        departureTime: departure,
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 71,
        distance: 36.0,
        duration: 52,
        status: 'active',
        recurring: { isRecurring: true, days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      },
      {
        driver: seededUsers[1]._id,
        vehicle: seededVehicles[1]._id,
        origin: {
          address: 'Guntur Bus Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Benz Circle, Vijayawada',
          location: { type: 'Point', coordinates: [80.6480, 16.5062] },
        },
        departureTime: departure,
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 45,
        distance: 34.5,
        duration: 48,
        status: 'active',
        recurring: { isRecurring: true, days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
      },
      {
        driver: seededUsers[2]._id,
        vehicle: seededVehicles[2]._id,
        origin: {
          address: 'Tenali Bus Stand, Tenali',
          location: { type: 'Point', coordinates: [80.6433, 16.2430] },
        },
        destination: {
          address: 'Mangalagiri NRI Hospital, Mangalagiri',
          location: { type: 'Point', coordinates: [80.5694, 16.4328] },
        },
        departureTime: departure,
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 32,
        distance: 24.2,
        duration: 35,
        status: 'active',
      },
      {
        driver: seededUsers[3]._id,
        vehicle: seededVehicles[3]._id,
        origin: {
          address: 'Brodipet, Guntur',
          location: { type: 'Point', coordinates: [80.4420, 16.3090] },
        },
        destination: {
          address: 'Governorpet, Vijayawada',
          location: { type: 'Point', coordinates: [80.6280, 16.5120] },
        },
        departureTime: departure,
        availableSeats: 2,
        totalSeats: 3,
        costPerSeat: 65,
        distance: 33.0,
        duration: 45,
        status: 'active',
      },
    ];

    await Ride.insertMany(ridesToCreate);
    console.log(`✅ Successfully seeded ${ridesToCreate.length} active routes into MongoDB Atlas!`);
  } catch (err) {
    console.warn('⚠️ Seeding note:', err.message);
  }
}

module.exports = { seedInitialData };
