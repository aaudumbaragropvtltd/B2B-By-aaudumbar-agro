// scripts/test_collected_status.mjs
async function runTest() {
  const targetId = '5ee947a6-0279-4766-8aef-9f7e3b730698';
  console.log(`[TEST] Testing 'collected' status update for order: ${targetId}`);

  // 1. Update status to 'collected' via Admin Logistics PUT
  console.log('\n[STEP 1] Updating status to "collected" via /api/admin/logistics PUT...');
  const putRes = await fetch('http://localhost:3000/api/admin/logistics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: targetId,
      dispatch_status: 'collected'
    })
  });
  const putData = await putRes.json();
  console.log('PUT Response status:', putRes.status, 'Body:', putData);

  // 2. Fetch Admin Logistics
  console.log('\n[STEP 2] Verifying status in /api/admin/logistics GET...');
  const logRes = await fetch('http://localhost:3000/api/admin/logistics');
  const logData = await logRes.json();
  const logItem = (logData.logistics || []).find(l => l.id === targetId || l.order_id === targetId);
  console.log('Logistics Item dispatch_status:', logItem?.dispatch_status);

  // 3. Fetch Admin Orders
  console.log('\n[STEP 3] Verifying status in /api/admin/orders GET...');
  const ordRes = await fetch('http://localhost:3000/api/admin/orders');
  const ordData = await ordRes.json();
  const ordItem = (ordData.orders || []).find(o => o.id === targetId || o.transaction_id === targetId);
  console.log('Admin Order order_status:', ordItem?.order_status);

  // 4. Fetch User Orders List
  console.log('\n[STEP 4] Verifying status in /api/orders/list GET...');
  const userRes = await fetch('http://localhost:3000/api/orders/list?email=raghavendra.sevalikar5730@gmail.com');
  const userData = await userRes.json();
  const userItem = (userData.orders || []).find(o => o.id === targetId || o.transaction_id === targetId);
  console.log('User Order order_status:', userItem?.order_status);
  console.log('User Order dispatch_status:', userItem?.dispatch_status);

  if (userItem?.order_status === 'collected' || userItem?.dispatch_status === 'collected') {
    console.log('\n✅ SUCCESS: "collected" status successfully updated in Admin and propagated to User Orders!');
  } else {
    console.error('\n❌ FAIL: "collected" status did not match expectations.');
  }
}

runTest().catch(console.error);
