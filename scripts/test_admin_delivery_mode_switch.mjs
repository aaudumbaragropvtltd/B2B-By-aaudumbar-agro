import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('🚀 Starting Admin Delivery Mode Switching End-to-End Test...\n');

  // Step 1: Fetch orders from /api/admin/orders
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  if (!ordersRes.ok) {
    throw new Error(`Failed to fetch admin orders: ${ordersRes.statusText}`);
  }
  const ordersData = await ordersRes.json();
  const testOrder = ordersData.orders?.find(o => o.transaction_id === 'TXN-RZP-S7UDNE' || o.id === '5ee947a6-0279-4766-8aef-9f7e3b730698') || ordersData.orders?.[0];

  if (!testOrder) {
    throw new Error('No test order found in admin orders');
  }

  const orderId = testOrder.id || testOrder.transaction_id;
  console.log(`✓ Located target test order: ${testOrder.transaction_id} (ID: ${orderId})`);
  console.log(`  Initial delivery_option: ${testOrder.delivery_option}`);

  // Step 2: Switch to 'pickup' via PATCH /api/admin/orders
  console.log('\n--- TEST 1: Switch mode from delivery to pickup via PATCH /api/admin/orders ---');
  const patchRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderId,
      updates: {
        delivery_option: 'pickup',
        arrival_date: '2026-09-18',
        vehicle_number: 'MH-20-EQ-8888',
        p1_name: 'Suresh Gaikwad',
        p1_phone: '+91-9876543210',
        p1_aadhar: '8877-6655-4433',
        tracking_number: `GATE-PASS-2026-${String(orderId).slice(-4)}`
      }
    })
  });

  const patchJson = await patchRes.json();
  if (!patchRes.ok || !patchJson.success) {
    throw new Error(`PATCH /api/admin/orders failed: ${JSON.stringify(patchJson)}`);
  }
  console.log('✓ Successfully executed PATCH /api/admin/orders with delivery_option = "pickup"');

  // Verify in GET /api/admin/orders
  const verifyOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const verifyOrdersData = await verifyOrdersRes.json();
  const updatedAdminOrder = verifyOrdersData.orders.find(o => o.id === orderId || o.transaction_id === testOrder.transaction_id);
  console.log(`✓ Admin Orders GET check: delivery_option = "${updatedAdminOrder?.delivery_option}", vehicle = "${updatedAdminOrder?.vehicle_number}", driver = "${updatedAdminOrder?.p1_name}"`);
  if (updatedAdminOrder?.delivery_option !== 'pickup') {
    throw new Error(`Expected delivery_option to be 'pickup', but got '${updatedAdminOrder?.delivery_option}'`);
  }

  // Verify in GET /api/admin/logistics
  const verifyLogisticsRes = await fetch(`${BASE_URL}/api/admin/logistics`);
  const verifyLogisticsData = await verifyLogisticsRes.json();
  const updatedLogisticsItem = verifyLogisticsData.logistics.find(l => l.id === orderId || l.transaction_id === testOrder.transaction_id || l.order_id === orderId);
  console.log(`✓ Admin Logistics GET check: delivery_option = "${updatedLogisticsItem?.delivery_option}", vehicle = "${updatedLogisticsItem?.vehicle_number}", driver = "${updatedLogisticsItem?.p1_name}"`);
  if (updatedLogisticsItem?.delivery_option !== 'pickup') {
    throw new Error(`Expected logistics delivery_option to be 'pickup', but got '${updatedLogisticsItem?.delivery_option}'`);
  }

  // Step 3: Switch mode from 'pickup' to 'deliver' via PUT /api/admin/logistics
  console.log('\n--- TEST 2: Switch mode from pickup back to deliver via PUT /api/admin/logistics ---');
  const putRes = await fetch(`${BASE_URL}/api/admin/logistics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: orderId,
      delivery_option: 'deliver',
      delivery_address: 'Plot 55, Hinjewadi Phase 1, MIDC Pune, Maharashtra - 411057',
      receiver_name: 'Rajesh Sharma (Procurement Head)',
      receiver_phone: '+91-9123456789',
      transporter_name: 'Delhivery B2B Freight Logistics',
      delivery_date: '4 business days',
      tracking_number: `AWB-IND-${String(orderId).slice(-6)}`,
      dispatch_status: 'in_transit'
    })
  });

  const putJson = await putRes.json();
  if (!putRes.ok || !putJson.success) {
    throw new Error(`PUT /api/admin/logistics failed: ${JSON.stringify(putJson)}`);
  }
  console.log('✓ Successfully executed PUT /api/admin/logistics with delivery_option = "deliver"');

  // Verify in GET /api/admin/logistics
  const verifyLogisticsRes2 = await fetch(`${BASE_URL}/api/admin/logistics`);
  const verifyLogisticsData2 = await verifyLogisticsRes2.json();
  const switchedLogisticsItem = verifyLogisticsData2.logistics.find(l => l.id === orderId || l.transaction_id === testOrder.transaction_id || l.order_id === orderId);
  console.log(`✓ Admin Logistics GET check 2: delivery_option = "${switchedLogisticsItem?.delivery_option}", address = "${switchedLogisticsItem?.delivery_address}", transporter = "${switchedLogisticsItem?.transporter_name}"`);
  if (switchedLogisticsItem?.delivery_option !== 'deliver') {
    throw new Error(`Expected logistics delivery_option to be 'deliver', but got '${switchedLogisticsItem?.delivery_option}'`);
  }

  // Verify in GET /api/admin/orders
  const verifyOrdersRes2 = await fetch(`${BASE_URL}/api/admin/orders`);
  const verifyOrdersData2 = await verifyOrdersRes2.json();
  const switchedAdminOrder = verifyOrdersData2.orders.find(o => o.id === orderId || o.transaction_id === testOrder.transaction_id);
  console.log(`✓ Admin Orders GET check 2: delivery_option = "${switchedAdminOrder?.delivery_option}", address = "${switchedAdminOrder?.delivery_address}"`);
  if (switchedAdminOrder?.delivery_option !== 'deliver') {
    throw new Error(`Expected admin orders delivery_option to be 'deliver', but got '${switchedAdminOrder?.delivery_option}'`);
  }

  // Step 4: Verify buyer portal view via GET /api/orders/list
  console.log('\n--- TEST 3: Verify Buyer Portal reflects updated delivery mode ---');
  const buyerListRes = await fetch(`${BASE_URL}/api/orders/list?email=${encodeURIComponent(testOrder.buyer_email || 'raghavendra.sevalikar5730@gmail.com')}`);
  const buyerListData = await buyerListRes.json();
  const buyerOrder = buyerListData.orders?.find(o => o.id === orderId || o.transaction_id === testOrder.transaction_id);
  console.log(`✓ Buyer Portal check: delivery_option = "${buyerOrder?.delivery_option}", delivery_address = "${buyerOrder?.delivery_address}"`);
  if (buyerOrder && buyerOrder.delivery_option !== 'deliver') {
    throw new Error(`Expected buyer order delivery_option to be 'deliver', but got '${buyerOrder.delivery_option}'`);
  }

  console.log('\n🎉 ALL DELIVERY MODE SWITCHING TESTS PASSED PERFECTLY!\n');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
