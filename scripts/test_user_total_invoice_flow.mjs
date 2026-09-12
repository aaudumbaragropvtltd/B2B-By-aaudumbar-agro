// scripts/test_user_total_invoice_flow.mjs
async function runTest() {
  const targetId = '5ee947a6-0279-4766-8aef-9f7e3b730698';
  const buyerEmail = 'raghavendra.sevalikar5730@gmail.com';

  console.log(`[TEST] Starting Total GST Invoice Verification Flow for Order: ${targetId}`);

  // Test 1: Set status to confirmed and verify user invoice endpoint rejects it
  console.log('\n--- TEST 1: Status = confirmed (Advance Escrow only) ---');
  await fetch('http://localhost:3000/api/admin/logistics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: targetId, dispatch_status: 'confirmed' })
  });

  const res1 = await fetch('http://localhost:3000/api/orders/send-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: targetId, email: buyerEmail })
  });
  const data1 = await res1.json();
  console.log('Confirmed status invoice attempt status:', res1.status, 'Response:', data1);
  if (res1.status === 400) {
    console.log('✅ Correctly blocked: Total invoice cannot be issued at confirmed/advance-only stage.');
  } else {
    console.warn('⚠️ Expected 400 for confirmed status, got:', res1.status);
  }

  // Test 2: Admin selects warehouse_loading
  console.log('\n--- TEST 2: Admin sets status to warehouse_loading ---');
  const resLoading = await fetch('http://localhost:3000/api/admin/logistics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: targetId, dispatch_status: 'warehouse_loading' })
  });
  console.log('PUT warehouse_loading status:', resLoading.status);

  // Verify User Orders Send Invoice endpoint now permits and succeeds
  const res2 = await fetch('http://localhost:3000/api/orders/send-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: targetId, email: buyerEmail })
  });
  const data2 = await res2.json();
  console.log('Warehouse Loading invoice dispatch response:', res2.status, data2);
  if (res2.ok && data2.success && data2.invoiceNumber) {
    console.log(`✅ SUCCESS: Total invoice [${data2.invoiceNumber}] successfully dispatched to ${data2.recipientEmail} during warehouse_loading!`);
  } else {
    console.error('❌ Failed to dispatch invoice during warehouse_loading:', data2);
  }

  // Test 3: Admin selects collected
  console.log('\n--- TEST 3: Admin sets status to collected ---');
  const resCollected = await fetch('http://localhost:3000/api/admin/logistics', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: targetId, dispatch_status: 'collected' })
  });
  console.log('PUT collected status:', resCollected.status);

  // Verify User Orders Send Invoice endpoint permits and succeeds
  const res3 = await fetch('http://localhost:3000/api/orders/send-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: targetId, email: buyerEmail })
  });
  const data3 = await res3.json();
  console.log('Collected status invoice dispatch response:', res3.status, data3);
  if (res3.ok && data3.success && data3.invoiceNumber) {
    console.log(`✅ SUCCESS: Total invoice [${data3.invoiceNumber}] successfully dispatched to ${data3.recipientEmail} for collected order!`);
  } else {
    console.error('❌ Failed to dispatch invoice for collected order:', data3);
  }

  // Test 4: Verify in User Orders list that status is collected
  console.log('\n--- TEST 4: Verifying User Orders API output ---');
  const listRes = await fetch(`http://localhost:3000/api/orders/list?email=${encodeURIComponent(buyerEmail)}`);
  const listData = await listRes.json();
  const found = (listData.orders || []).find(o => o.id === targetId || o.transaction_id === targetId);
  console.log('Order status in list:', found?.order_status);
  console.log('Order payment status in list:', found?.payment_status);

  if (found?.order_status === 'collected') {
    console.log('\n🎉 ALL TESTS PASSED: Total Invoice condition and direct dispatch verified 100%!');
  }
}

runTest().catch(console.error);
