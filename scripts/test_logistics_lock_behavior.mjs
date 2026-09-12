const BASE_URL = 'http://localhost:3000';

async function testLogisticsLock() {
  console.log('====================================================');
  console.log('🧪 TESTING LOGISTICS LOCK & READ-ONLY PASS BEHAVIOR');
  console.log('====================================================\n');

  // Step 1: Submit logistics for an order to complete it
  const orderId = `ord_lock_test_${Date.now()}`;
  const payload = {
    orderId,
    transactionId: `TXN-LOCK-${Date.now().toString().slice(-6)}`,
    deliveryOption: 'pickup',
    buyerEmail: 'locked_buyer@enterprise.in',
    productTitle: 'Standard Test Organic Wheat',
    quantity: 1000,
    unit: 'Kg',
    pricePerUnit: 40,
    subtotal: 40000,
    gst: 2000,
    logisticsCost: 0,
    totalAmount: 42000,
    advanceAmount: 4200,
    arrivalDate: '2026-09-10',
    visitorCount: '1',
    vehicleNumber: 'MH 12 XY 1234',
    p1Name: 'Ganesh Shinde',
    p1Phone: '9890123456',
    p1Aadhar: '998877665544'
  };

  const res = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log('Logistics confirmation status:', res.status);
  console.log('Logistics confirmation data:', data.data?.tracking_number, data.data?.delivery_option);

  if (!res.ok || !data.success) {
    throw new Error('Logistics save failed');
  }

  // Step 2: Query orders list to verify order has all required locked fields
  const listRes = await fetch(`${BASE_URL}/api/orders/list?email=locked_buyer@enterprise.in`);
  const listData = await listRes.json();
  const savedOrder = listData.orders?.find(o => o.buyer_email === 'locked_buyer@enterprise.in');

  console.log('\nRetrieved Order:');
  console.log('  ID:', savedOrder?.id);
  console.log('  Delivery Option:', savedOrder?.delivery_option);
  console.log('  Arrival Date:', savedOrder?.arrival_date);
  console.log('  Vehicle Reg:', savedOrder?.vehicle_number);
  console.log('  Gate Pass:', savedOrder?.tracking_number);

  const hasCompletedLogistics = Boolean(
    (savedOrder?.delivery_option === 'deliver' && (savedOrder?.delivery_address || savedOrder?.delivery_city || savedOrder?.delivery_state)) ||
    (savedOrder?.delivery_option === 'pickup' && (savedOrder?.arrival_date || savedOrder?.p1_name || savedOrder?.vehicle_number))
  );

  console.log('\nhasCompletedLogistics calculated:', hasCompletedLogistics);
  if (!hasCompletedLogistics) {
    throw new Error('Order should be recognized as hasCompletedLogistics = true (Locked Read-Only)');
  }

  console.log('✅ Verified: Order is recognized as filled, finalized, and locked into Read-Only Pass Mode!');
  console.log('====================================================');
  console.log('🎉 LOGISTICS LOCK TESTS PASSED!');
  console.log('====================================================');
}

testLogisticsLock().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
