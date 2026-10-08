/**
 * In-Memory Fallback Data Store for SmartRoute
 * Enables seamless, robust offline/demo execution with 10 realistic test routes,
 * strict compatibility filtering, dynamic match calculations, and authoritative booking transactions.
 */

const routingService = require('./routingService');
const { calculateSharedFuelCost, DEFAULT_MILEAGE } = require('./costCalculator');
const { calculateMatchScore } = require('./routeMatching');

class DataStore {
  constructor() {
    this.users = [
      {
        _id: 'u-1',
        name: 'Alex Mercer',
        email: 'alex.student@campus.edu',
        phone: '+91 98765 12345',
        userType: 'student',
        studentInfo: {
          college: 'Institute of Technology & Science',
          collegeId: 'ITS-2024-891',
          collegeEmail: 'alex.student@campus.edu',
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          studentVerified: true,
          employeeVerified: false,
        },
        rating: { average: 4.9, count: 52 },
        ridesCompleted: 14,
        savings: 1840,
      },
      {
        _id: 'u-2',
        name: 'Sarah Jenkins',
        email: 'sarah.j@techcorp.com',
        phone: '+91 98765 67890',
        userType: 'employee',
        employeeInfo: {
          company: 'Enterprise Cloud Technologies',
          employeeId: 'ECT-Corp-442',
          workEmail: 'sarah.j@techcorp.com',
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          studentVerified: false,
          employeeVerified: true,
        },
        rating: { average: 4.85, count: 38 },
        ridesCompleted: 22,
        savings: 2450,
      },
      {
        _id: 'u-3',
        name: 'David Lee',
        email: 'david.lee@campus.edu',
        phone: '+91 98765 11223',
        userType: 'student',
        studentInfo: {
          college: 'Engineering Campus Scholars',
          collegeId: 'ECS-2025-012',
          collegeEmail: 'david.lee@campus.edu',
        },
        verification: {
          emailVerified: true,
          phoneVerified: true,
          identityVerified: true,
          studentVerified: true,
          employeeVerified: false,
        },
        rating: { average: 4.95, count: 64 },
        ridesCompleted: 31,
        savings: 3120,
      },
    ];

    // 10 Diverse and Realistic Seed Commute Routes:
    // - 2 Highly compatible with Guntur ➔ Vijayawada morning commute
    // - 3 Partially compatible (spatial subsegment, branching destination, or time divergence)
    // - 5 Incompatible / unrelated geographic corridors
    this.rides = [
      // 1. Highly Compatible: Guntur Bus Station -> Benz Circle, Vijayawada @ 08:15 AM
      {
        _id: 'ride-1',
        driver: this.users[0],
        vehicle: {
          _id: 'v-1',
          name: 'Hero Splendor Plus',
          vehicleType: 'bike',
          fuelType: 'petrol',
          mileage: 45,
          registrationNumber: 'AP-07-CK-1020',
          seats: 1,
        },
        origin: {
          address: 'Guntur Bus Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Benz Circle, Vijayawada',
          location: { type: 'Point', coordinates: [80.6480, 16.5062] },
        },
        routeCoordinates: [
          [80.4365, 16.3067],
          [80.5020, 16.3850],
          [80.5694, 16.4328], // Mangalagiri
          [80.6150, 16.4750],
          [80.6480, 16.5062], // Benz Circle
        ],
        distance: 34.5,
        duration: 48,
        departureTime: '08:15 AM',
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 45,
        costBreakdown: {
          distanceKm: 34.5,
          vehicleType: 'bike',
          mileage: 45,
          pricePerLiter: 117.68,
          fuelUsedLiters: 0.77,
          totalFuelCost: 90,
          participants: 2,
          sharedContribution: 45,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 2. Highly Compatible: Guntur Railway Station -> Auto Nagar, Vijayawada @ 08:30 AM
      {
        _id: 'ride-2',
        driver: this.users[1],
        vehicle: {
          _id: 'v-2',
          name: 'Hyundai i20 Magna',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 15,
          registrationNumber: 'AP-16-EA-4921',
          seats: 3,
        },
        origin: {
          address: 'Guntur Railway Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Auto Nagar Terminal, Vijayawada',
          location: { type: 'Point', coordinates: [80.6720, 16.4980] },
        },
        routeCoordinates: [
          [80.4365, 16.3067],
          [80.5020, 16.3850],
          [80.5694, 16.4328],
          [80.6480, 16.5062],
          [80.6720, 16.4980],
        ],
        distance: 36.0,
        duration: 52,
        departureTime: '08:30 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 71,
        costBreakdown: {
          distanceKm: 36.0,
          vehicleType: 'car',
          mileage: 15,
          pricePerLiter: 117.68,
          fuelUsedLiters: 2.4,
          totalFuelCost: 282,
          participants: 4,
          sharedContribution: 71,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 3. Partially Compatible (Subsegment): Tenali -> Mangalagiri @ 08:30 AM
      {
        _id: 'ride-3',
        driver: this.users[2],
        vehicle: {
          _id: 'v-3',
          name: 'TVS Jupiter 125',
          vehicleType: 'bike',
          fuelType: 'petrol',
          mileage: 48,
          registrationNumber: 'AP-07-MB-8822',
          seats: 1,
        },
        origin: {
          address: 'Tenali Main Road, Tenali',
          location: { type: 'Point', coordinates: [80.6436, 16.2435] },
        },
        destination: {
          address: 'Mangalagiri AIIMS Junction, Mangalagiri',
          location: { type: 'Point', coordinates: [80.5694, 16.4328] },
        },
        routeCoordinates: [
          [80.6436, 16.2435],
          [80.6050, 16.3300],
          [80.5694, 16.4328],
        ],
        distance: 27.5,
        duration: 38,
        departureTime: '08:30 AM',
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 34,
        costBreakdown: {
          distanceKm: 27.5,
          vehicleType: 'bike',
          mileage: 48,
          pricePerLiter: 117.68,
          fuelUsedLiters: 0.57,
          totalFuelCost: 67,
          participants: 2,
          sharedContribution: 34,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 4. Partially Compatible (Branching): Guntur -> Amaravati Secretariat @ 08:45 AM
      {
        _id: 'ride-4',
        driver: this.users[1],
        vehicle: {
          _id: 'v-4',
          name: 'Tata Nexon',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 15,
          registrationNumber: 'AP-16-CC-2321',
          seats: 3,
        },
        origin: {
          address: 'Guntur Bus Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Amaravati Secretariat, Amaravati',
          location: { type: 'Point', coordinates: [80.5180, 16.5410] },
        },
        routeCoordinates: [
          [80.4365, 16.3067],
          [80.4650, 16.3900],
          [80.5000, 16.4700],
          [80.5180, 16.5410],
        ],
        distance: 32.0,
        duration: 45,
        departureTime: '08:45 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 63,
        costBreakdown: {
          distanceKm: 32.0,
          vehicleType: 'car',
          mileage: 15,
          pricePerLiter: 117.68,
          fuelUsedLiters: 2.13,
          totalFuelCost: 251,
          participants: 4,
          sharedContribution: 63,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 5. Partially Compatible (Time Divergence): Guntur -> Benz Circle @ 11:30 AM
      {
        _id: 'ride-5',
        driver: this.users[0],
        vehicle: {
          _id: 'v-5',
          name: 'Honda Activa 6G',
          vehicleType: 'bike',
          fuelType: 'petrol',
          mileage: 45,
          registrationNumber: 'AP-07-LK-7711',
          seats: 1,
        },
        origin: {
          address: 'Guntur Bus Station, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Benz Circle, Vijayawada',
          location: { type: 'Point', coordinates: [80.6480, 16.5062] },
        },
        routeCoordinates: [
          [80.4365, 16.3067],
          [80.5020, 16.3850],
          [80.5694, 16.4328],
          [80.6480, 16.5062],
        ],
        distance: 34.5,
        duration: 48,
        departureTime: '11:30 AM',
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 45,
        costBreakdown: {
          distanceKm: 34.5,
          vehicleType: 'bike',
          mileage: 45,
          pricePerLiter: 117.68,
          fuelUsedLiters: 0.77,
          totalFuelCost: 90,
          participants: 2,
          sharedContribution: 45,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: false, days: [] },
        createdAt: new Date(),
      },

      // 6. Regional Highway Corridor: Guntur -> Visakhapatnam Beach Road (362.0 km)
      {
        _id: 'ride-6',
        driver: this.users[0],
        vehicle: {
          _id: 'v-6',
          name: 'Maruti Suzuki Swift',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 16,
          registrationNumber: 'AP-07-AB-5544',
          seats: 3,
        },
        origin: {
          address: 'Guntur City Center, Guntur',
          location: { type: 'Point', coordinates: [80.4365, 16.3067] },
        },
        destination: {
          address: 'Visakhapatnam Beach Road, Visakhapatnam',
          location: { type: 'Point', coordinates: [83.2185, 17.6868] },
        },
        routeCoordinates: [
          [80.4365, 16.3067],
          [80.6480, 16.5062], // Vijayawada
          [81.1200, 16.7100], // Eluru
          [81.7800, 17.0000], // Rajahmundry
          [82.2400, 17.3500], // Tuni
          [83.2185, 17.6868], // Visakhapatnam
        ],
        distance: 362.0,
        duration: 410,
        departureTime: '06:00 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 665,
        costBreakdown: {
          distanceKm: 362.0,
          vehicleType: 'car',
          mileage: 16,
          pricePerLiter: 117.68,
          fuelUsedLiters: 22.63,
          totalFuelCost: 2663,
          participants: 4,
          sharedContribution: 665,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: false, days: [] },
        createdAt: new Date(),
      },

      // 7. Incompatible Route: Hyderabad Hitec City -> Warangal Kazipet
      {
        _id: 'ride-7',
        driver: this.users[1],
        vehicle: {
          _id: 'v-7',
          name: 'Hyundai Creta',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 14,
          registrationNumber: 'TS-09-UB-8833',
          seats: 3,
        },
        origin: {
          address: 'Hitec City, Hyderabad',
          location: { type: 'Point', coordinates: [78.3820, 17.4474] },
        },
        destination: {
          address: 'Kazipet Junction, Warangal',
          location: { type: 'Point', coordinates: [79.5042, 17.9784] },
        },
        routeCoordinates: [
          [78.3820, 17.4474],
          [78.8500, 17.6500],
          [79.5042, 17.9784],
        ],
        distance: 148.0,
        duration: 175,
        departureTime: '07:00 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 311,
        costBreakdown: {
          distanceKm: 148.0,
          vehicleType: 'car',
          mileage: 14,
          pricePerLiter: 117.68,
          fuelUsedLiters: 10.57,
          totalFuelCost: 1244,
          participants: 4,
          sharedContribution: 311,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Wed', 'Fri'] },
        createdAt: new Date(),
      },

      // 8. Incompatible Route: Bengaluru Electronic City -> Whitefield ITPL
      {
        _id: 'ride-8',
        driver: this.users[2],
        vehicle: {
          _id: 'v-8',
          name: 'Honda City',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 14,
          registrationNumber: 'KA-01-MJ-9912',
          seats: 3,
        },
        origin: {
          address: 'Electronic City Phase 1, Bengaluru',
          location: { type: 'Point', coordinates: [77.6762, 12.8452] },
        },
        destination: {
          address: 'ITPL Main Gate, Whitefield, Bengaluru',
          location: { type: 'Point', coordinates: [77.7289, 12.9863] },
        },
        routeCoordinates: [
          [77.6762, 12.8452],
          [77.6850, 12.9150],
          [77.7289, 12.9863],
        ],
        distance: 28.0,
        duration: 65,
        departureTime: '08:30 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 59,
        costBreakdown: {
          distanceKm: 28.0,
          vehicleType: 'car',
          mileage: 14,
          pricePerLiter: 117.68,
          fuelUsedLiters: 2.0,
          totalFuelCost: 235,
          participants: 4,
          sharedContribution: 59,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 9. Incompatible Route: Chennai Central -> OMR Thoraipakkam
      {
        _id: 'ride-9',
        driver: this.users[0],
        vehicle: {
          _id: 'v-9',
          name: 'Yamaha FZ-S',
          vehicleType: 'bike',
          fuelType: 'petrol',
          mileage: 45,
          registrationNumber: 'TN-07-CB-4491',
          seats: 1,
        },
        origin: {
          address: 'Puratchi Thalaivar Dr. M.G.R Central, Chennai',
          location: { type: 'Point', coordinates: [80.2755, 13.0825] },
        },
        destination: {
          address: 'Thoraipakkam Toll Plaza, OMR, Chennai',
          location: { type: 'Point', coordinates: [80.2325, 12.9385] },
        },
        routeCoordinates: [
          [80.2755, 13.0825],
          [80.2500, 13.0100],
          [80.2325, 12.9385],
        ],
        distance: 22.0,
        duration: 55,
        departureTime: '09:00 AM',
        availableSeats: 1,
        totalSeats: 1,
        costPerSeat: 29,
        costBreakdown: {
          distanceKm: 22.0,
          vehicleType: 'bike',
          mileage: 45,
          pricePerLiter: 117.68,
          fuelUsedLiters: 0.49,
          totalFuelCost: 58,
          participants: 2,
          sharedContribution: 29,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: true, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
        createdAt: new Date(),
      },

      // 10. Incompatible Route: Tirupati Alipiri -> Renigunta Airport
      {
        _id: 'ride-10',
        driver: this.users[1],
        vehicle: {
          _id: 'v-10',
          name: 'Maruti Suzuki Dzire',
          vehicleType: 'car',
          fuelType: 'petrol',
          mileage: 18,
          registrationNumber: 'AP-03-TR-1199',
          seats: 3,
        },
        origin: {
          address: 'Alipiri Gate, Tirupati',
          location: { type: 'Point', coordinates: [79.4005, 13.6520] },
        },
        destination: {
          address: 'Tirupati International Airport, Renigunta',
          location: { type: 'Point', coordinates: [79.5434, 13.6325] },
        },
        routeCoordinates: [
          [79.4005, 13.6520],
          [79.4700, 13.6400],
          [79.5434, 13.6325],
        ],
        distance: 18.5,
        duration: 32,
        departureTime: '10:00 AM',
        availableSeats: 3,
        totalSeats: 3,
        costPerSeat: 30,
        costBreakdown: {
          distanceKm: 18.5,
          vehicleType: 'car',
          mileage: 18,
          pricePerLiter: 117.68,
          fuelUsedLiters: 1.03,
          totalFuelCost: 121,
          participants: 4,
          sharedContribution: 30,
          currency: 'INR',
        },
        status: 'active',
        recurring: { isRecurring: false, days: [] },
        createdAt: new Date(),
      },
    ];

    this.bookings = [];
  }

  getRides() {
    return this.rides.filter((r) => r.status === 'active' && r.availableSeats > 0);
  }

  async createRide(rideData, user = null) {
    const driver = user || this.users[0];
    const originStr = typeof rideData.origin === 'string'
      ? rideData.origin
      : (rideData.origin?.name || rideData.origin?.address || rideData.from || 'Guntur');
    const destStr = typeof rideData.destination === 'string'
      ? rideData.destination
      : (rideData.destination?.name || rideData.destination?.address || rideData.to || 'Vijayawada');

    // Geocode locations or use direct coordinate array
    let originCoords = rideData.origin?.location?.coordinates ||
      (Array.isArray(rideData.origin?.coordinates) ? rideData.origin.coordinates : null) ||
      (Array.isArray(rideData.originCoords) ? rideData.originCoords : null);

    let destCoords = rideData.destination?.location?.coordinates ||
      (Array.isArray(rideData.destination?.coordinates) ? rideData.destination.coordinates : null) ||
      (Array.isArray(rideData.destCoords) ? rideData.destCoords : null);

    if (!originCoords) {
      const geoOrigin = await routingService.geocode(originStr);
      originCoords = geoOrigin?.coordinates || [80.4365, 16.3067];
    }

    if (!destCoords) {
      const geoDest = await routingService.geocode(destStr);
      destCoords = geoDest?.coordinates || [80.6480, 16.5062];
    }

    // Authoritative driving route calculation
    const route = await routingService.getRoute(originCoords, destCoords, originStr, destStr);
    const vehicleType = (rideData.vehicleType || 'bike').toLowerCase();
    const fuelType = (rideData.fuelType || 'petrol').toLowerCase();
    const seats = Number(rideData.seats) || (vehicleType === 'bike' ? 1 : 3);
    const participants = seats + 1; // driver + passengers
    const customMileage = rideData.mileage ? Number(rideData.mileage) : null;

    // Calculate non-commercial fuel cost sharing
    const costBreakdown = await calculateSharedFuelCost({
      distanceKm: route.distanceKm,
      vehicleType,
      fuelType,
      participants,
      customMileage,
    });

    const newRide = {
      _id: `ride-${Date.now()}`,
      driver,
      vehicle: {
        _id: `v-${Date.now()}`,
        name: rideData.vehicleName || (vehicleType === 'bike' ? 'Motorcycle' : 'Sedan'),
        vehicleType,
        fuelType,
        mileage: costBreakdown.mileage,
        registrationNumber: rideData.vehicleReg || 'AP-07-XX-9999',
        seats,
      },
      origin: {
        address: originStr,
        location: { type: 'Point', coordinates: originCoords },
      },
      destination: {
        address: destStr,
        location: { type: 'Point', coordinates: destCoords },
      },
      routeCoordinates: route.coordinates,
      distance: route.distanceKm,
      duration: route.durationMins,
      departureTime: rideData.departureTime || '08:15 AM',
      availableSeats: seats,
      totalSeats: seats,
      costPerSeat: costBreakdown.sharedContribution,
      costBreakdown,
      status: 'active',
      recurring: {
        isRecurring: Boolean(rideData.recurring),
        days: rideData.recurringDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      },
      createdAt: new Date(),
    };

    this.rides.unshift(newRide);
    return newRide;
  }

  async searchRides(params = {}) {
    const { from, to, vehicleType, maxCost, pickupCoords, dropCoords, requestedTime, minMatchScore = 40 } = params;
    let results = [...this.rides.filter((r) => r.status === 'active' && r.availableSeats > 0)];

    if (vehicleType && vehicleType !== 'all') {
      results = results.filter((r) => r.vehicle.vehicleType === vehicleType);
    }

    if (maxCost) {
      results = results.filter((r) => r.costPerSeat <= Number(maxCost));
    }

    // Determine geographic search coordinates
    let searchPickup = pickupCoords;
    let searchDrop = dropCoords;

    if (!searchPickup && from) {
      const geo = await routingService.geocode(from);
      if (geo) searchPickup = geo.coordinates;
    }

    if (!searchDrop && to) {
      const geo = await routingService.geocode(to);
      if (geo) searchDrop = geo.coordinates;
    }

    if (searchPickup && searchDrop) {
      const scoredResults = [];

      for (const ride of results) {
        const matchScore = calculateMatchScore(
          ride,
          searchPickup,
          searchDrop,
          requestedTime ? new Date(requestedTime) : null
        );

        // Calculate shared trajectory
        const trajectory = routingService.calculateSharedTrajectory(
          ride.routeCoordinates,
          searchPickup,
          searchDrop
        );

        // Strict Incompatible Route Filtering:
        // Do not return rides that fail the compatibility threshold (e.g. Hyderabad ride for Guntur search)
        if (matchScore.overall >= Number(minMatchScore) && matchScore.pickupProximity >= 10) {
          scoredResults.push({
            ...ride,
            matchScore,
            sharedTrajectory: trajectory,
          });
        }
      }

      // Sort by overall match score descending
      scoredResults.sort((a, b) => b.matchScore.overall - a.matchScore.overall);
      return scoredResults;
    }

    return results;
  }

  createBooking(bookingData, user = null) {
    const ride = this.rides.find((r) => r._id === bookingData.rideId);
    if (!ride) {
      throw new Error('Requested commute ride not found.');
    }

    if (ride.availableSeats <= 0) {
      throw new Error('No seats available on this route.');
    }

    // Authoritative seat decrement transaction
    ride.availableSeats -= 1;
    if (ride.availableSeats === 0) {
      ride.status = 'full';
    }

    const newBooking = {
      _id: `bk-${Date.now()}`,
      ride: ride._id,
      passenger: user || { name: 'Verified Commuter', userType: 'student' },
      driver: ride.driver,
      costContribution: ride.costPerSeat, // Authoritative price determined by backend ride
      status: 'confirmed',
      pickupLocation: bookingData.pickup || ride.origin.address,
      dropLocation: bookingData.destination || ride.destination.address,
      matchScore: ride.matchScore?.overall || 92,
      createdAt: new Date(),
    };

    this.bookings.unshift(newBooking);
    return newBooking;
  }

  submitVerification(userId, verifyPayload) {
    let user = this.users.find((u) => u._id === userId);
    if (!user) {
      user = {
        _id: userId || `u-${Date.now()}`,
        name: verifyPayload.name || 'Verified Commuter',
        email: verifyPayload.email || 'commuter@campus.edu',
        userType: verifyPayload.userType || 'student',
        verification: {},
      };
      this.users.push(user);
    }

    if (verifyPayload.userType === 'student') {
      user.verification.studentVerified = true;
      user.studentInfo = {
        college: verifyPayload.organization || 'Verified Campus',
        collegeId: verifyPayload.documentNumber || 'ID-VERIFIED',
      };
    } else if (verifyPayload.userType === 'employee') {
      user.verification.employeeVerified = true;
      user.employeeInfo = {
        company: verifyPayload.organization || 'Verified Corporate',
        employeeId: verifyPayload.documentNumber || 'EMP-VERIFIED',
      };
    }
    user.verification.identityVerified = true;
    user.verification.emailVerified = true;
    return user;
  }

  getAnalytics() {
    return {
      totalUsers: 1245 + this.users.length,
      students: 840,
      employees: 320,
      general: 85,
      totalRides: 3820 + this.rides.length,
      completedRides: 3420 + this.bookings.length,
      costShared: 284000 + this.bookings.length * 45,
      distanceKm: 128450,
    };
  }
}

const store = new DataStore();
module.exports = store;
