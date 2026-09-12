import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';
const RAZORPAY_KEY_SECRET = 'fq5tI6y0SF9U7qSLa4Af5nOs';

function generateSignature(orderId, paymentId, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

async function testCheckoutFlow() {
  console.log('====================================================');
  console.log('🧪 TESTING END-TO-END CHECKOUT & VERIFICATION FLOW');
  console.log('====================================================\n');

  // Step 1: Call /api/checkout
  console.log('1. Calling /api/checkout...');
  const checkoutRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quote: {
        productId: 'prod-test-commodity',
        quantity: 10,
        unitLabel: 'Kg',
        unitPrice: 500,
        taxRatePercent: 5,
        taxAmount: 250,
        subtotal: 5000,
        totalContractValue: 5250,
        advanceRequired10: 525,
        buyerEmail: 'enterprise@buyer.in',
      },
      paymentMethod: 'razorpay',
      paymentOption: 'upi',
    }),
  });

  const checkoutData = await checkoutRes.json();
  console.log('Checkout Response Status:', checkoutRes.status);
  console.log('Checkout Data:', checkoutData);

  if (!checkoutRes.ok || !checkoutData.orderId) {
    throw new Error('Checkout API failed to create order');
  }

  const internalOrderId = checkoutData.orderId;
  const razorpayOrderId = checkoutData.razorpayOrderId;
  console.log(`✅ Order created successfully: ${internalOrderId}`);
  console.log(`✅ Razorpay Order ID: ${razorpayOrderId}`);

  // Step 2: Test /api/payment/verify with missing parameters (should return 400 with clean error)
  console.log('\n2. Testing /api/payment/verify with missing parameters...');
  const missingRes = await fetch(`${BASE_URL}/api/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: internalOrderId,
      // razorpay_payment_id missing
    }),
  });
  const missingData = await missingRes.json();
  console.log('Missing params response status:', missingRes.status, missingData);
  if (missingRes.status !== 400) {
    throw new Error('Expected 400 for missing payment parameters');
  }
  console.log('✅ Correctly rejected request missing payment parameters.');

  // Step 3: Test /api/payment/verify with valid cryptographic signature
  console.log('\n3. Testing /api/payment/verify with valid HMAC signature...');
  const fakePaymentId = 'pay_verified_' + Date.now();
  const validSignature = generateSignature(razorpayOrderId || `order_${internalOrderId}`, fakePaymentId, RAZORPAY_KEY_SECRET);

  const verifyRes = await fetch(`${BASE_URL}/api/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: internalOrderId,
      razorpay_order_id: razorpayOrderId || `order_${internalOrderId}`,
      razorpay_payment_id: fakePaymentId,
      razorpay_signature: validSignature,
      amount: checkoutData.advanceAmount,
      buyerEmail: 'enterprise@buyer.in',
      productTitle: 'Organic Basmati Rice',
    }),
  });

  const verifyData = await verifyRes.json();
  console.log('Verification response status:', verifyRes.status);
  console.log('Verification data:', verifyData);

  if (verifyRes.status === 200 && verifyData.success) {
    console.log('✅ /api/payment/verify passed successfully and locked 10% advance escrow!');
  } else {
    throw new Error('Verification failed with valid signature');
  }

  console.log('\n====================================================');
  console.log('🎉 ALL CHECKOUT & VERIFICATION FLOW TESTS PASSED!');
  console.log('====================================================');
}

testCheckoutFlow().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
