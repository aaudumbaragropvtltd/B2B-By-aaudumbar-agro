// Automated Test: One-time logistics selection immutability & details update
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== Test: One-Time Logistics Selection & Details Update ===\n');

  const testTxn1 = `TXN-LOCK-TEST-${Date.now()}`;
  console.log(`1. Creating order with Self Godown Pickup: ${testTxn1}`);

  const createRes1 = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId: testTxn1,
      buyerEmail: 'test_pickup_buyer@enterprise.in',
      deliveryOption: 'pickup',
      arrivalDate: '2026-09-20',
      vehicleNumber: 'MH 14 AB 1111',
      p1Name: 'Raju Driver',
      p1Phone: '9822011111',
      p1Aadhar: '111122223333',
      productTitle: 'Organic Basmati Rice',
      quantity: 2000,
      totalAmount: 150000,
      advanceAmount: 15000
    })
  });

  const createData1 = await createRes1.json();
  console.log('Create Pickup Response:', createRes1.status, createData1.delivery_option);
  if (createData1.delivery_option !== 'pickup') {
    throw new Error(`Expected delivery_option to be 'pickup', got: ${createData1.delivery_option}`);
  }

  console.log('\n2. Attempting to switch mode to Direct Delivery (should be blocked / remain pickup)...');
  const updateRes1 = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId: testTxn1,
      buyerEmail: 'test_pickup_buyer@enterprise.in',
      deliveryOption: 'deliver', // HACK/ATTEMPT TO SWITCH
      deliveryAddress: 'Attempted Delivery Address',
      // updated details for pickup:
      arrivalDate: '2026-09-25', // Updated arrival date
      vehicleNumber: 'MH 14 AB 9999', // Updated vehicle
      p1Name: 'Raju Driver (Updated)'
    })
  });

  const updateData1 = await updateRes1.json();
  console.log('Update Response:', updateRes1.status, updateData1.delivery_option);
  console.log('Updated Arrival Date:', updateData1.arrival_date);
  console.log('Updated Vehicle:', updateData1.vehicle_number);

  if (updateData1.delivery_option !== 'pickup') {
    throw new Error(`SECURITY BREACH: Expected delivery_option to stay 'pickup', but it changed to: ${updateData1.delivery_option}`);
  }
  if (updateData1.vehicle_number !== 'MH 14 AB 9999' || updateData1.arrival_date !== '2026-09-25') {
    throw new Error(`FAIL: Specific details did not update properly!`);
  }
  console.log('✓ Success: Pickup mode was permanently retained AND specific details were successfully updated!');

  // Now test with Deliver mode
  const testTxn2 = `TXN-LOCK-DELIVER-${Date.now()}`;
  console.log(`\n3. Creating order with Direct Delivery: ${testTxn2}`);

  const createRes2 = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId: testTxn2,
      buyerEmail: 'test_deliver_buyer@enterprise.in',
      deliveryOption: 'deliver',
      deliveryDate: '2026-09-18',
      deliveryAddress: 'Plot 55, MIDC Industrial Area, Pune',
      receiverName: 'Amit Desai',
      receiverPhone: '9822022222',
      productTitle: 'Wheat Grain Grade A',
      quantity: 5000,
      totalAmount: 200000,
      advanceAmount: 20000
    })
  });

  const createData2 = await createRes2.json();
  console.log('Create Deliver Response:', createRes2.status, createData2.delivery_option);
  if (createData2.delivery_option !== 'deliver') {
    throw new Error(`Expected delivery_option to be 'deliver', got: ${createData2.delivery_option}`);
  }

  console.log('\n4. Attempting to switch mode to Self Pickup (should be blocked / remain deliver)...');
  const updateRes2 = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionId: testTxn2,
      buyerEmail: 'test_deliver_buyer@enterprise.in',
      deliveryOption: 'pickup', // HACK/ATTEMPT TO SWITCH
      arrivalDate: '2026-09-22',
      vehicleNumber: 'MH 12 XY 9999',
      // updated details for delivery:
      deliveryAddress: 'Plot 77, MIDC Waluj, Chhatrapati Sambhajinagar (Updated Destination)',
      receiverName: 'Amit Desai (Site Manager)',
      receiverPhone: '9822033333'
    })
  });

  const updateData2 = await updateRes2.json();
  console.log('Update Response:', updateRes2.status, updateData2.delivery_option);
  console.log('Updated Delivery Address:', updateData2.delivery_address);
  console.log('Updated Receiver:', updateData2.receiver_name);

  if (updateData2.delivery_option !== 'deliver') {
    throw new Error(`SECURITY BREACH: Expected delivery_option to stay 'deliver', but it changed to: ${updateData2.delivery_option}`);
  }
  if (!updateData2.delivery_address.includes('Plot 77') || updateData2.receiver_name !== 'Amit Desai (Site Manager)') {
    throw new Error(`FAIL: Delivery details did not update properly!`);
  }
  console.log('✓ Success: Delivery mode was permanently retained AND address details were successfully updated!');

  console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
