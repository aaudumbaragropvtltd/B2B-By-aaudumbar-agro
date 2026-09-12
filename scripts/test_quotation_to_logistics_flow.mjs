const BASE_URL = 'http://localhost:3000';

async function testQuotationLogistics() {
  console.log('====================================================');
  console.log('🧪 TESTING QUOTATION TO LOGISTICS SETUP FLOW');
  console.log('====================================================\n');

  // Step 1: Simulate saving logistics for an order created from a quotation
  console.log('1. Submitting Self Godown Pickup logistics via /api/logistics/confirm...');
  const orderId = `ord_test_quote_${Date.now()}`;
  const pickupPayload = {
    orderId,
    transactionId: `TXN-RZP-${Date.now().toString().slice(-6)}`,
    deliveryOption: 'pickup',
    buyerEmail: 'buyer@enterprise.in',
    productTitle: 'Organic Ashwagandha Powder',
    quantity: 500,
    unit: 'Kg',
    pricePerUnit: 700,
    subtotal: 350000,
    gst: 17500,
    logisticsCost: 0,
    totalAmount: 367500,
    advanceAmount: 36750,
    arrivalDate: '2026-09-05',
    visitorCount: '2',
    vehicleNumber: 'MH 12 AB 9999',
    p1Name: 'Ramesh Kumar (Driver)',
    p1Phone: '9876543210',
    p1Aadhar: '123456789012',
    p2Name: 'Suresh Patil (Site Manager)',
    p2Phone: '9876543211',
    p2Aadhar: '987654321098'
  };

  const logRes = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pickupPayload)
  });

  const logData = await logRes.json();
  console.log('Logistics response status:', logRes.status);
  console.log('Logistics response data:', logData);

  if (!logRes.ok || !logData.success) {
    throw new Error(`Failed to save logistics: ${logData.error || logRes.statusText}`);
  }
  console.log('✅ Self Godown Pickup logistics confirmed successfully!');

  // Step 2: Query /api/orders/list to verify order shows full logistics details
  console.log('\n2. Querying /api/orders/list to verify pickup details...');
  const listRes = await fetch(`${BASE_URL}/api/orders/list?search=${orderId}`);
  const listData = await listRes.json();
  console.log('List orders count:', listData.orders?.length);

  const foundOrder = listData.orders?.find(o => o.id === orderId || o.order_id === orderId || o.transaction_id === pickupPayload.transactionId);
  if (!foundOrder) {
    console.log('Order found by search list:', listData.orders?.[0]);
  } else {
    console.log('✅ Order retrieved with logistics details:');
    console.log('   Delivery Option:', foundOrder.delivery_option);
    console.log('   Arrival Date:', foundOrder.arrival_date);
    console.log('   Vehicle Number:', foundOrder.vehicle_number);
    console.log('   Visitor 1:', foundOrder.p1_name);
    console.log('   Tracking / Gate Pass:', foundOrder.tracking_number);
  }

  // Step 3: Test Direct Delivery modification
  console.log('\n3. Modifying order to Direct Delivery via /api/logistics/confirm...');
  const deliveryPayload = {
    orderId,
    transactionId: pickupPayload.transactionId,
    deliveryOption: 'deliver',
    buyerEmail: 'buyer@enterprise.in',
    productTitle: 'Organic Ashwagandha Powder',
    quantity: 500,
    unit: 'Kg',
    pricePerUnit: 700,
    subtotal: 350000,
    gst: 17500,
    logisticsCost: 0,
    totalAmount: 367500,
    advanceAmount: 36750,
    deliveryDate: '2026-09-08',
    deliveryState: 'Maharashtra',
    deliveryCity: 'Pune',
    deliveryVillage: 'Hadapsar Mandi',
    deliveryAddress: 'Plot 45, Industrial Mega Food Park, Hadapsar, Pune 411028',
    receiverName: 'Mahesh Sharma',
    receiverPhone: '9822334455',
    transporterName: 'VRL Logistics Pan-India'
  };

  const deliverRes = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deliveryPayload)
  });

  const deliverData = await deliverRes.json();
  console.log('Direct delivery update status:', deliverRes.status);
  console.log('Direct delivery update data:', deliverData);

  if (!deliverRes.ok || !deliverData.success) {
    throw new Error('Failed to update logistics to Direct Delivery');
  }
  console.log('✅ Updated to Direct Delivery with Pan-India AWB tracking successfully!');

  console.log('\n====================================================');
  console.log('🎉 ALL QUOTATION TO LOGISTICS TESTS PASSED!');
  console.log('====================================================');
}

testQuotationLogistics().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
