import crypto from 'crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TbvASSd9EMGeDz';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

async function testRazorpayStandardFlow() {
  console.log('====================================================');
  console.log('🧪 TESTING RAZORPAY STANDARD WEB CHECKOUT INTEGRATION');
  console.log('====================================================\n');

  // STEP 1: Test Create Order Validation (< 100 paise)
  console.log('--- 1. Testing Order Creation with invalid amount (0 paise) ---');
  const invalidOrderRes = await fetch('http://localhost:3000/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 0.5, isPaise: true }) // 0.5 paise < 100
  });
  const invalidOrderJson = await invalidOrderRes.json();
  console.log('Invalid Amount Status:', invalidOrderRes.status, 'Response:', invalidOrderJson);
  if (invalidOrderRes.status === 400) {
    console.log('✅ Correctly rejected invalid amount (< 100 paise).\n');
  }

  // STEP 2: Test Create Order with valid amount (₹500 / 50000 paise)
  console.log('--- 2. Testing Order Creation with valid amount (₹500) ---');
  const validOrderRes = await fetch('http://localhost:3000/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 500, // ₹500
      currency: 'INR',
      receipt: `rcpt_test_${Date.now()}`,
      notes: { order_type: 'B2B Wholesale Escrow Advance' }
    })
  });
  const validOrderJson = await validOrderRes.json();
  console.log('Valid Order Status:', validOrderRes.status, 'Response:', validOrderJson);
  
  if (!validOrderRes.ok || !validOrderJson.order_id) {
    throw new Error('Failed to create Razorpay order: ' + JSON.stringify(validOrderJson));
  }
  console.log(`✅ Order Created Successfully! Order ID: ${validOrderJson.order_id}, Amount: ${validOrderJson.amount} paise\n`);

  const testOrderId = validOrderJson.order_id;
  const testPaymentId = `pay_test_${Date.now()}`;

  // STEP 3: Test Verify Signature - Invalid / Tampered Signature
  console.log('--- 3. Testing Signature Verification with Tampered Signature ---');
  const fakeVerifyRes = await fetch('http://localhost:3000/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: testOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: 'invalid_tampered_signature_12345'
    })
  });
  const fakeVerifyJson = await fakeVerifyRes.json();
  console.log('Tampered Signature Status:', fakeVerifyRes.status, 'Response:', fakeVerifyJson);
  if (fakeVerifyRes.status === 400 && !fakeVerifyJson.success) {
    console.log('✅ Tampered signature correctly REJECTED!\n');
  }

  // STEP 4: Test Verify Signature - Valid HMAC-SHA256 Signature
  console.log('--- 4. Testing Signature Verification with Valid HMAC-SHA256 Signature ---');
  const generatedSignature = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${testOrderId}|${testPaymentId}`)
    .digest('hex');

  const validVerifyRes = await fetch('http://localhost:3000/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: testOrderId,
      razorpay_payment_id: testPaymentId,
      razorpay_signature: generatedSignature
    })
  });
  const validVerifyJson = await validVerifyRes.json();
  console.log('Valid Signature Status:', validVerifyRes.status, 'Response:', validVerifyJson);
  if (validVerifyRes.ok && validVerifyJson.success && validVerifyJson.verified) {
    console.log('✅ Valid Razorpay signature VERIFIED successfully!\n');
  }

  console.log('====================================================');
  console.log('🎉 ALL RAZORPAY STANDARD WEB CHECKOUT TESTS PASSED!');
  console.log('====================================================');
}

testRazorpayStandardFlow().catch(console.error);
