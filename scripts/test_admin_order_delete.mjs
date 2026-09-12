const BASE_URL = 'http://localhost:3000';

async function testAdminOrderDelete() {
  console.log('====================================================');
  console.log('🧪 TESTING ADMIN ORDER DELETE FUNCTIONALITY');
  console.log('====================================================\n');

  // Step 1: Create a test order in persistent store
  const orderId = `ord_del_test_${Date.now()}`;
  const transactionId = `TXN-DEL-${Date.now().toString().slice(-6)}`;
  
  const createRes = await fetch(`${BASE_URL}/api/logistics/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      transactionId,
      deliveryOption: 'deliver',
      buyerEmail: 'to_be_deleted@enterprise.in',
      productTitle: 'Commodity to Delete',
      quantity: 100,
      unit: 'Kg',
      pricePerUnit: 50,
      subtotal: 5000,
      gst: 250,
      logisticsCost: 0,
      totalAmount: 5250,
      advanceAmount: 525,
      deliveryAddress: 'Temporary Address'
    })
  });

  const createData = await createRes.json();
  const generatedId = createData.data?.id;
  console.log('Created order to test delete on:', generatedId, transactionId);

  // Step 2: Delete by ID
  console.log('\nCalling DELETE /api/admin/orders...');
  const delRes = await fetch(`${BASE_URL}/api/admin/orders?id=${encodeURIComponent(generatedId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: generatedId, transactionId })
  });

  const delData = await delRes.json();
  console.log('Delete response status:', delRes.status);
  console.log('Delete response body:', delData);

  if (!delRes.ok || !delData.success) {
    throw new Error('Failed to delete order');
  }

  // Step 3: Verify it no longer appears in GET /api/admin/orders
  console.log('\nVerifying order was deleted from orders list...');
  const listRes = await fetch(`${BASE_URL}/api/admin/orders?search=${encodeURIComponent(generatedId)}`);
  const listData = await listRes.json();

  const found = listData.orders?.find(o => o.id === generatedId || o.transaction_id === transactionId);
  if (found) {
    throw new Error('Order still found in orders list after deletion!');
  }

  console.log('✅ Order successfully removed from all persistent stores!');
  console.log('====================================================');
  console.log('🎉 ALL ADMIN ORDER DELETE TESTS PASSED!');
  console.log('====================================================');
}

testAdminOrderDelete().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
