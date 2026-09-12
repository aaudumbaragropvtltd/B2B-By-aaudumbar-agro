import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('================================================================');
  console.log('🧪 VERIFICATION TEST: USER LOGISTICS DETAILS UPDATE -> ADMIN SYNC');
  console.log('================================================================\n');

  // STEP 1: Fetch initial Admin Orders to pick a test order
  console.log('Step 1: Fetching existing orders from Admin API...');
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  if (!ordersRes.ok) {
    throw new Error(`Failed to fetch admin orders: ${ordersRes.status} ${ordersRes.statusText}`);
  }
  const ordersData = await ordersRes.json();
  const allOrders = ordersData.orders || [];
  console.log(`✓ Fetched ${allOrders.length} orders from Admin Panel.\n`);

  if (allOrders.length === 0) {
    throw new Error('No orders found to test');
  }

  // Pick a delivery order
  let deliveryOrder = allOrders.find(o => o.delivery_option === 'deliver') || allOrders[0];
  console.log(`Selected Delivery Order for test:
  - ID: ${deliveryOrder.id}
  - Transaction ID: ${deliveryOrder.transaction_id}
  - Current Address: ${deliveryOrder.delivery_address}
  - Current Receiver: ${deliveryOrder.receiver_name}
  - Current Receiver Phone: ${deliveryOrder.receiver_phone}
  `);

  // STEP 2: Simulate User updating delivery logistics details in user portal
  const testNewAddress = 'Plot 777, Chakan Industrial Area Phase 4, Pune - 410501, Maharashtra';
  const testNewReceiver = 'Vikramaditya Rao (Site Chief)';
  const testNewPhone = '9876509999';
  const testNewDeliveryDate = '2026-09-25';
  const testNewTransporter = 'Express Heavy Freight Lines';

  console.log('Step 2: Submitting User Details Update via POST /api/logistics/confirm...');
  const updatePayload = {
    orderId: deliveryOrder.id,
    transactionId: deliveryOrder.transaction_id,
    deliveryOption: 'deliver',
    buyerEmail: deliveryOrder.buyer_email || 'test.buyer@enterprise.in',
    deliveryAddress: testNewAddress,
    deliveryDate: testNewDeliveryDate,
    receiverName: testNewReceiver,
    receiverPhone: testNewPhone,
    transporterName: testNewTransporter,
    productTitle: deliveryOrder.product_name,
    quantity: deliveryOrder.quantity,
    totalAmount: deliveryOrder.total_amount,
  };

  const confirmRes = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  if (!confirmRes.ok) {
    const errBody = await confirmRes.text();
    throw new Error(`Logistics confirm failed: ${confirmRes.status} ${errBody}`);
  }
  const confirmData = await confirmRes.json();
  console.log('✓ User logistics update response:', confirmData.success ? 'SUCCESS' : 'FAILED');

  // STEP 3: Verify update is reflected in GET /api/admin/orders
  console.log('\nStep 3: Checking GET /api/admin/orders to verify update propagation...');
  const verifyOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const verifyOrdersData = await verifyOrdersRes.json();
  const updatedOrder = (verifyOrdersData.orders || []).find(
    o => o.id === deliveryOrder.id || o.transaction_id === deliveryOrder.transaction_id
  );

  if (!updatedOrder) {
    throw new Error('Could not find order in admin panel after update!');
  }

  console.log('Admin Orders record for this order:');
  console.log('  - Delivery Address:', updatedOrder.delivery_address);
  console.log('  - Receiver Name:', updatedOrder.receiver_name);
  console.log('  - Receiver Phone:', updatedOrder.receiver_phone);
  console.log('  - Delivery Date:', updatedOrder.delivery_date);

  const addressMatched = updatedOrder.delivery_address === testNewAddress;
  const receiverMatched = updatedOrder.receiver_name === testNewReceiver;
  const phoneMatched = updatedOrder.receiver_phone === testNewPhone;

  if (!addressMatched || !receiverMatched || !phoneMatched) {
    console.error('❌ Mismatch in Admin Orders update:');
    console.error(`  Address matched: ${addressMatched} (${updatedOrder.delivery_address} vs ${testNewAddress})`);
    console.error(`  Receiver matched: ${receiverMatched} (${updatedOrder.receiver_name} vs ${testNewReceiver})`);
    console.error(`  Phone matched: ${phoneMatched} (${updatedOrder.receiver_phone} vs ${testNewPhone})`);
    throw new Error('Admin orders did not reflect user update!');
  }
  console.log('✅ PASS: Admin Orders successfully updated with new user details!\n');

  // STEP 4: Verify update is reflected in GET /api/admin/logistics
  console.log('Step 4: Checking GET /api/admin/logistics to verify fleet synchronization...');
  const logisticsRes = await fetch(`${BASE_URL}/api/admin/logistics`);
  const logisticsData = await logisticsRes.json();
  const updatedLogistics = (logisticsData.logistics || []).find(
    l => l.order_id === deliveryOrder.id || l.transaction_id === deliveryOrder.transaction_id || l.id === deliveryOrder.id
  );

  if (!updatedLogistics) {
    throw new Error('Could not find order in admin logistics after update!');
  }

  console.log('Admin Logistics record:');
  console.log('  - Delivery Address:', updatedLogistics.delivery_address);
  console.log('  - Receiver Name:', updatedLogistics.receiver_name);
  console.log('  - Receiver Phone:', updatedLogistics.receiver_phone);

  const logAddressMatched = updatedLogistics.delivery_address === testNewAddress;
  const logReceiverMatched = updatedLogistics.receiver_name === testNewReceiver;
  const logPhoneMatched = updatedLogistics.receiver_phone === testNewPhone;

  if (!logAddressMatched || !logReceiverMatched || !logPhoneMatched) {
    console.error('❌ Mismatch in Admin Logistics update:');
    console.error(`  Address matched: ${logAddressMatched}`);
    console.error(`  Receiver matched: ${logReceiverMatched}`);
    console.error(`  Phone matched: ${logPhoneMatched}`);
    throw new Error('Admin logistics did not reflect user update!');
  }
  console.log('✅ PASS: Admin Logistics & Fleet successfully updated with new user details!\n');

  // STEP 5: Test Pickup order user update
  console.log('Step 5: Testing Self-Pickup user update propagation...');
  let pickupOrder = allOrders.find(o => o.delivery_option === 'pickup');
  if (!pickupOrder) {
    console.log('No existing pickup order found, using first order with mode switched to pickup...');
    pickupOrder = allOrders[0];
  }

  const testNewVehicle = 'MH 14 XX 7890';
  const testNewDriver = 'Balasaheb Shinde (Primary)';
  const testNewDriverPhone = '9822114455';
  const testNewArrivalDate = '2026-09-30';

  const pickupPayload = {
    orderId: pickupOrder.id,
    transactionId: pickupOrder.transaction_id,
    deliveryOption: 'pickup',
    buyerEmail: pickupOrder.buyer_email || 'test.pickup@enterprise.in',
    arrivalDate: testNewArrivalDate,
    vehicleNumber: testNewVehicle,
    p1Name: testNewDriver,
    p1Phone: testNewDriverPhone,
    p1Aadhar: '887766554433',
    productTitle: pickupOrder.product_name,
    quantity: pickupOrder.quantity,
    totalAmount: pickupOrder.total_amount,
  };

  const confirmPickupRes = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pickupPayload)
  });

  if (!confirmPickupRes.ok) {
    throw new Error(`Pickup logistics confirm failed: ${confirmPickupRes.status}`);
  }

  // Verify in Admin Orders
  const verifyPickupOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const verifyPickupOrdersData = await verifyPickupOrdersRes.json();
  const updatedPickupOrder = (verifyPickupOrdersData.orders || []).find(
    o => o.id === pickupOrder.id || o.transaction_id === pickupOrder.transaction_id
  );

  console.log('Admin Orders record for pickup:');
  console.log('  - Arrival Date:', updatedPickupOrder.arrival_date);
  console.log('  - Vehicle Number:', updatedPickupOrder.vehicle_number);
  console.log('  - Driver (p1_name):', updatedPickupOrder.p1_name);
  console.log('  - Driver Phone:', updatedPickupOrder.p1_phone);

  if (
    updatedPickupOrder.vehicle_number !== testNewVehicle ||
    updatedPickupOrder.p1_name !== testNewDriver
  ) {
    console.error('❌ Mismatch in pickup admin orders sync');
    throw new Error('Pickup admin orders sync failed');
  }
  console.log('✅ PASS: Pickup user update successfully synced to Admin Orders!\n');

  // Verify in Admin Logistics
  const verifyPickupLogisticsRes = await fetch(`${BASE_URL}/api/admin/logistics`);
  const verifyPickupLogisticsData = await verifyPickupLogisticsRes.json();
  const updatedPickupLogistics = (verifyPickupLogisticsData.logistics || []).find(
    l => l.order_id === pickupOrder.id || l.transaction_id === pickupOrder.transaction_id || l.id === pickupOrder.id
  );

  console.log('Admin Logistics record for pickup:');
  console.log('  - Vehicle Number:', updatedPickupLogistics.vehicle_number);
  console.log('  - Driver Name:', updatedPickupLogistics.p1_name);

  if (
    updatedPickupLogistics.vehicle_number !== testNewVehicle ||
    updatedPickupLogistics.p1_name !== testNewDriver
  ) {
    console.error('❌ Mismatch in pickup admin logistics sync');
    throw new Error('Pickup admin logistics sync failed');
  }
  console.log('✅ PASS: Pickup user update successfully synced to Admin Logistics!\n');

  console.log('================================================================');
  console.log('🎉 ALL USER UPDATE -> ADMIN PANEL SYNCHRONIZATION TESTS PASSED 100%!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('\n❌ TEST RUNNER FAILED:', err.message);
  process.exit(1);
});
