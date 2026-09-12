import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = 'fq5tI6y0SF9U7qSLa4Af5nOs';
const BASE_URL = 'http://localhost:3000';

function generateValidSignature(orderId, paymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING PAYMENT FAILURE & STATE MACHINE FIXES');
  console.log('====================================================\n');

  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Strict Signature Verification (Mock & Tampered Signatures Must Fail)
  // ----------------------------------------------------
  console.log('\n--- 1. Testing Signature Verification Logic ---');
  const fakeOrderId = 'order_test_' + Date.now();
  const fakePaymentId = 'pay_test_' + Date.now();
  
  // A. Mock signature should fail
  const mockSigRes = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: fakeOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: 'mock_signature',
    }),
  });
  const mockSigJson = await mockSigRes.json();
  assert(mockSigRes.status === 400 && mockSigJson.verified === false, 'Mock signature must return 400 & verified=false');

  // B. Tampered signature should fail
  const tamperedSigRes = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: fakeOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: 'bad_signature_1234567890abcdef',
    }),
  });
  const tamperedSigJson = await tamperedSigRes.json();
  assert(tamperedSigRes.status === 400 && tamperedSigJson.verified === false, 'Tampered signature must return 400 & verified=false');

  // C. Valid Cryptographic HMAC-SHA256 signature should pass
  const validSig = generateValidSignature(fakeOrderId, fakePaymentId, RAZORPAY_KEY_SECRET);
  const validSigRes = await fetch(`${BASE_URL}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: fakeOrderId,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSig,
    }),
  });
  const validSigJson = await validSigRes.json();
  assert(validSigRes.status === 200 && validSigJson.verified === true, 'Valid HMAC-SHA256 signature must return 200 & verified=true');

  // ----------------------------------------------------
  // TEST 2: /api/orders/cancel Endpoint
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Order Cancellation on Failure / Dismissal ---');
  const testOrderId = `test_order_fail_${Date.now()}`;

  // First create a test order in orders store or cancel directly
  const cancelRes = await fetch(`${BASE_URL}/api/orders/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: testOrderId,
      reason: 'User cancelled transaction on Razorpay modal',
    }),
  });
  const cancelJson = await cancelRes.json();
  assert(cancelRes.ok && cancelJson.success === true && cancelJson.order_status === 'cancelled', '/api/orders/cancel sets order_status to cancelled');

  // ----------------------------------------------------
  // TEST 3: Admin Orders API Excludes Cancelled / Unpaid from Paid Volume
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Admin Orders Data & Metrics ---');
  const adminRes = await fetch(`${BASE_URL}/api/admin/orders`);
  const adminJson = await adminRes.json();
  assert(adminRes.ok && Array.isArray(adminJson.orders), 'Admin orders API returns list of orders');

  const cancelledOrdersInAdmin = adminJson.orders.filter(o => o.order_status === 'cancelled');
  if (cancelledOrdersInAdmin.length > 0) {
    const firstCancelled = cancelledOrdersInAdmin[0];
    assert(
      firstCancelled.advance_amount === 0 && firstCancelled.payment_status.includes('Cancelled'),
      `Cancelled order #${firstCancelled.id.slice(0, 8)} shows ₹0 advance_amount and 'Payment Failed / Cancelled' status`
    );
  } else {
    console.log('ℹ️ No cancelled orders currently in DB snapshot to inspect.');
  }

  // ----------------------------------------------------
  // TEST 4: Admin Logistics Dispatches API Excludes Cancelled/Unpaid Orders
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Admin Logistics Dispatches Filtering ---');
  const logisticsRes = await fetch(`${BASE_URL}/api/admin/logistics`);
  const logisticsJson = await logisticsRes.json();
  assert(logisticsRes.ok && Array.isArray(logisticsJson.logistics), 'Admin logistics API returns logistics array');

  const cancelledInLogistics = (logisticsJson.logistics || []).filter(d => 
    d.order_status === 'cancelled' || d.current_state === 'cancelled' || d.status === 'cancelled'
  );
  assert(
    cancelledInLogistics.length === 0,
    'No cancelled / unpaid orders appear in active logistics dispatches'
  );

  console.log('\n====================================================');
  console.log(`📊 SUMMARY: ${testsPassed}/${totalTests} Tests Passed`);
  console.log('====================================================');

  if (testsPassed === totalTests) {
    console.log('🎉 ALL PAYMENT FAILURE & STATE MACHINE TESTS PASSED!');
  } else {
    console.error('⚠️ SOME TESTS FAILED. Please review output above.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
