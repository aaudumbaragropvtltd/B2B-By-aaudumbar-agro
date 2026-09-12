import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
const TARGET_ORDER_ID = '5ee947a6-0279-4766-8aef-9f7e3b730698';
const USER_EMAIL = 'raghavendra.sevalikar5730@gmail.com';

async function verifyUserOrderStatus(expectedStatus) {
  const res = await fetch(`${BASE_URL}/api/orders/list?email=${encodeURIComponent(USER_EMAIL)}`);
  if (!res.ok) throw new Error(`Orders list API error: ${res.status}`);
  const data = await res.json();
  const order = (data.orders || []).find(o => o.id === TARGET_ORDER_ID || o.transaction_id?.includes('S7UDNE'));
  if (!order) throw new Error(`Order ${TARGET_ORDER_ID} not found in user orders list`);
  
  const actualStatus = order.order_status;
  if (actualStatus !== expectedStatus) {
    throw new Error(`Status mismatch: expected "${expectedStatus}", got "${actualStatus}"`);
  }
  return order;
}

async function runTest() {
  console.log('================================================================');
  console.log('🧪 TEST: ADMIN STATUS UPDATE -> USER ORDERS SECTION REALTIME SYNC');
  console.log('================================================================\n');

  console.log(`Target Order: ${TARGET_ORDER_ID}`);
  console.log(`User Email:   ${USER_EMAIL}\n`);

  // 1. Test update via Admin Logistics: "ready_for_pickup"
  console.log('Test 1: Updating status to "ready_for_pickup" via Admin Logistics (PUT /api/admin/logistics)...');
  const putPickupRes = await fetch(`${BASE_URL}/api/admin/logistics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: TARGET_ORDER_ID,
      dispatch_status: 'ready_for_pickup',
      delivery_option: 'pickup'
    })
  });
  if (!putPickupRes.ok) throw new Error(`PUT /api/admin/logistics failed: ${putPickupRes.status}`);
  console.log('  ✓ Admin Logistics responded 200 OK');
  
  const userOrder1 = await verifyUserOrderStatus('ready_for_pickup');
  console.log(`  ✅ User orders section displays: [${userOrder1.order_status}] (🏢 Ready for Godown Pickup)\n`);

  // 2. Test update via Admin Logistics: "in_transit"
  console.log('Test 2: Updating status to "in_transit" via Admin Logistics (PUT /api/admin/logistics)...');
  const putTransitRes = await fetch(`${BASE_URL}/api/admin/logistics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: TARGET_ORDER_ID,
      dispatch_status: 'in_transit'
    })
  });
  if (!putTransitRes.ok) throw new Error(`PUT /api/admin/logistics failed: ${putTransitRes.status}`);
  console.log('  ✓ Admin Logistics responded 200 OK');

  const userOrder2 = await verifyUserOrderStatus('in_transit');
  console.log(`  ✅ User orders section displays: [${userOrder2.order_status}] (🚚 In Transit / Dispatched)\n`);

  // 3. Test update via Admin Orders: "warehouse_loading"
  console.log('Test 3: Updating status to "warehouse_loading" via Admin Orders (PATCH /api/admin/orders)...');
  const patchLoadingRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: TARGET_ORDER_ID,
      updates: {
        order_status: 'warehouse_loading'
      }
    })
  });
  if (!patchLoadingRes.ok) throw new Error(`PATCH /api/admin/orders failed: ${patchLoadingRes.status}`);
  console.log('  ✓ Admin Orders responded 200 OK');

  const userOrder3 = await verifyUserOrderStatus('warehouse_loading');
  console.log(`  ✅ User orders section displays: [${userOrder3.order_status}] (🏭 Warehouse Loading)\n`);

  // 4. Test update via Admin Orders: "confirmed"
  console.log('Test 4: Updating status to "confirmed" via Admin Orders (PATCH /api/admin/orders)...');
  const patchConfirmedRes = await fetch(`${BASE_URL}/api/admin/orders`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: TARGET_ORDER_ID,
      updates: {
        order_status: 'confirmed'
      }
    })
  });
  if (!patchConfirmedRes.ok) throw new Error(`PATCH /api/admin/orders failed: ${patchConfirmedRes.status}`);
  console.log('  ✓ Admin Orders responded 200 OK');

  const userOrder4 = await verifyUserOrderStatus('confirmed');
  console.log(`  ✅ User orders section displays: [${userOrder4.order_status}] (🔒 10% Advance Escrow Paid)\n`);

  // 5. Restore back to user's desired "ready_for_pickup" state
  console.log('Test 5: Setting back to "ready_for_pickup" as shown on active admin panel...');
  await fetch(`${BASE_URL}/api/admin/logistics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: TARGET_ORDER_ID,
      dispatch_status: 'ready_for_pickup',
      delivery_option: 'pickup'
    })
  });
  const finalOrder = await verifyUserOrderStatus('ready_for_pickup');
  console.log(`  ✅ Order ${TARGET_ORDER_ID} finalized with status: [${finalOrder.order_status}] (🏢 Ready for Godown Pickup)\n`);

  console.log('================================================================');
  console.log('🎉 STATUS UPDATE REALTIME PROPAGATION FULLY VERIFIED 100%!');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
