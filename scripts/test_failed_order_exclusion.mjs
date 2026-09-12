// Automated Test: Ensure failed/unpaid orders are NEVER placed or displayed in Admin Orders or Logistics & Fleet
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== Test: Completed Payment Only Policy in Admin & Logistics ===\n');

  // 1. Fetch current admin orders
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const ordersData = await ordersRes.json();
  console.log(`1. Admin Orders count: ${ordersData.orders?.length}`);

  // Assert no cancelled, failed, quotation_issued, or unpaid orders are present
  const uncompletedInAdminOrders = (ordersData.orders || []).filter(o => {
    const isUncompleted = ['cancelled', 'payment_failed', 'quotation_issued', 'unpaid', 'draft'].includes(o.order_status) ||
                          o.payment_status === 'Payment Failed / Cancelled' ||
                          o.payment_status === 'payment_failed' ||
                          o.payment_status === 'unpaid';
    return isUncompleted;
  });

  if (uncompletedInAdminOrders.length > 0) {
    throw new Error(`FAIL: Found ${uncompletedInAdminOrders.length} uncompleted/failed orders in /admin/orders!`);
  }
  console.log('✓ Verified: Zero failed, cancelled, or unpaid orders in Admin Orders section.');

  // 2. Fetch current admin logistics & fleet
  const logRes = await fetch(`${BASE_URL}/api/admin/logistics`);
  const logData = await logRes.json();
  console.log(`\n2. Logistics & Fleet shipments count: ${logData.logistics?.length}`);

  const uncompletedInLogistics = (logData.logistics || []).filter(l => {
    return ['cancelled', 'payment_failed', 'quotation_issued', 'unpaid', 'failed'].includes(l.dispatch_status);
  });

  if (uncompletedInLogistics.length > 0) {
    throw new Error(`FAIL: Found ${uncompletedInLogistics.length} uncompleted/failed shipments in /admin/logistics!`);
  }
  console.log('✓ Verified: Zero failed, cancelled, or unpaid shipments in Logistics & Fleet section.');

  console.log('\n=== ALL ENFORCEMENT CHECKS PASSED! ===');
}

runTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
