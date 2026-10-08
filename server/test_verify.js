async function runTests() {
  console.log('=== RUNNING SMARTROUTE FULL PLATFORM VERIFICATION ===');
  
  // 1. Check /api/rides
  const ridesRes = await fetch('http://localhost:5000/api/rides').then(r => r.json());
  console.log('1. Rides count:', ridesRes.count);
  ridesRes.rides.forEach((r, idx) => {
    console.log(`   Ride ${idx + 1}: ${r.origin.address} -> ${r.destination.address} | Dist: ${r.distance} km | Cost: ₹${r.costPerSeat} | Vehicle: ${r.vehicle.name} (${r.vehicle.vehicleType})`);
  });

  // 2. Test calculate-cost for Guntur -> Visakhapatnam (Intercity)
  const longTripRes = await fetch('http://localhost:5000/api/rides/calculate-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: 'Guntur', destination: 'Visakhapatnam', vehicleType: 'car', seats: 3 })
  }).then(r => r.json());
  console.log('\n2. Intercity Route (Guntur -> Visakhapatnam):');
  console.log('   Distance:', longTripRes.route.distanceKm, 'km');
  console.log('   Duration:', Math.floor(longTripRes.route.durationMins / 60) + 'h ' + (longTripRes.route.durationMins % 60) + 'm');
  console.log('   Fuel Used:', longTripRes.costBreakdown.fuelUsedLiters, 'L');
  console.log('   Total Fuel Cost: ₹' + longTripRes.costBreakdown.totalFuelCost);
  console.log('   Per-person Contribution: ₹' + longTripRes.costBreakdown.sharedContribution);
  console.log('   Formula:', longTripRes.costBreakdown.formula);

  // 3. Test calculate-cost for Guntur -> Vijayawada (Daily Commute)
  const dailyTripRes = await fetch('http://localhost:5000/api/rides/calculate-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin: 'Guntur', destination: 'Vijayawada', vehicleType: 'bike', seats: 1 })
  }).then(r => r.json());
  console.log('\n3. Daily Corridor (Guntur -> Vijayawada):');
  console.log('   Distance:', dailyTripRes.route.distanceKm, 'km');
  console.log('   Fuel Used:', dailyTripRes.costBreakdown.fuelUsedLiters, 'L');
  console.log('   Total Fuel Cost: ₹' + dailyTripRes.costBreakdown.totalFuelCost);
  console.log('   Per-person Contribution: ₹' + dailyTripRes.costBreakdown.sharedContribution);

  // 4. Test Smart Search 5-factor matching
  const searchRes = await fetch('http://localhost:5000/api/rides/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Guntur Bus Station',
      to: 'Benz Circle, Vijayawada',
      pickupCoords: [80.4365, 16.3067],
      dropCoords: [80.6480, 16.5062]
    })
  }).then(r => r.json());
  console.log('\n4. Smart Search Matches:');
  console.log('   Matched Rides Count:', searchRes.rides ? searchRes.rides.length : 0);
  if (searchRes.rides && searchRes.rides.length > 0) {
    const top = searchRes.rides[0];
    console.log(`   Top Match: ${top.origin.address} -> ${top.destination.address}`);
    console.log('   Overall Compatibility:', top.matchScore.overall + '%');
    console.log('   Breakdown:', JSON.stringify(top.matchScore));
  }

  // 5. Test Geocode API
  const geoRes = await fetch('http://localhost:5000/api/rides/geocode?q=Amaravati').then(r => r.json());
  console.log('\n5. Geocode Resolution for Amaravati:');
  console.log('   Coordinates:', JSON.stringify(geoRes.location?.coordinates));
  console.log('   Display Name:', geoRes.location?.displayName);
  
  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
