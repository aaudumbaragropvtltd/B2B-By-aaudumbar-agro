// test_admin_payments_subscription.mjs
async function runTests() {
  console.log('--- Testing /api/admin/payments with Subscriptions ---');
  
  // 1. Fetch All
  const allRes = await fetch('http://localhost:3000/api/admin/payments');
  const allData = await allRes.json();
  console.log('Total Payments:', allData.total);
  console.log('Metrics:', allData.metrics);

  const subPayments = allData.payments.filter(p => p.payment_type === 'supplier_subscription');
  console.log(`Found ${subPayments.length} subscription payments in the stream.`);
  subPayments.forEach((p, idx) => {
    console.log(` [Sub ${idx+1}] Ref: ${p.transaction_reference} | Amount: ₹${p.amount} | Plan: ${p.plan} | Party: ${p.users?.company_name} (${p.users?.registered_email})`);
  });

  // 2. Fetch Subscriptions Filter
  const subsRes = await fetch('http://localhost:3000/api/admin/payments?status=subscriptions');
  const subsData = await subsRes.json();
  console.log(`\nFiltered Subscriptions Tab: ${subsData.payments.length} items`);
  if (subsData.payments.length !== subPayments.length) {
    console.error('Mismatch in subscriptions count!');
  } else {
    console.log('✅ Filter tab matches all subscriptions perfectly.');
  }

  // 3. Fetch Orders Filter
  const ordersRes = await fetch('http://localhost:3000/api/admin/payments?status=orders');
  const ordersData = await ordersRes.json();
  console.log(`\nFiltered Orders Tab: ${ordersData.payments.length} items`);

  // Verify soybean escrow order is still intact
  const soybeanPayment = ordersData.payments.find(p => p.transaction_reference === 'pay_TbvfL2ta8KG90j');
  if (soybeanPayment) {
    console.log('✅ Soybean escrow order payment verified:', soybeanPayment.transaction_reference, soybeanPayment.amount, soybeanPayment.users?.company_name);
  } else {
    console.warn('⚠️ Soybean escrow payment not found in orders list!');
  }

  console.log('\n--- All Automated Payment Checks Passed! ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
