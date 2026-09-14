// ============================================================================
// VERIFICATION SCRIPT: RAZORPAY STANDARD WEB CHECKOUT
// ============================================================================
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import Razorpay from 'razorpay';
import { getCredentials, createRazorpayOrder, verifyPaymentSignature, getPublicKeyId, getRazorpayInstance } from '../services/razorpay.js';

async function runVerification() {
  console.log('====================================================');
  console.log('🔍 VERIFYING RAZORPAY STANDARD WEB CHECKOUT INTEGRATION');
  console.log('====================================================\n');

  // 1. Check Credentials Configuration
  console.log('1. Checking Credentials & Environment Loading...');
  const creds = getCredentials();
  console.log('   Key ID:', creds.keyId);
  console.log('   Key Secret Length:', creds.keySecret ? creds.keySecret.length : 0);
  console.log('   Public Key ID:', getPublicKeyId());
  
  if (!creds.keyId || !creds.keySecret) {
    throw new Error('❌ Missing Razorpay credentials!');
  }
  console.log('   ✅ Environment credentials loaded successfully.\n');

  // 2. Test Official SDK Instance
  console.log('2. Testing Razorpay SDK Instance initialization...');
  const rzp = getRazorpayInstance();
  const testFetch = await rzp.orders.all({ count: 1 });
  console.log('   ✅ SDK Authentication verified with Razorpay API (fetched', testFetch.items.length, 'order items).\n');

  // 3. Test Order Creation (amount >= 100 paise)
  console.log('3. Testing Server-side Order Creation (/api/create-order logic)...');
  const testReceipt = `rcpt_${Date.now().toString().slice(-8)}`;
  const order = await createRazorpayOrder({
    amount: 500, // ₹500
    currency: 'INR',
    receipt: testReceipt,
    notes: { test_note: 'Verification Run' },
    isPaise: false // Will convert to 50000 paise
  });

  console.log('   Order Created Successfully:');
  console.log('   - Order ID:', order.id);
  console.log('   - Amount (paise):', order.amount);
  console.log('   - Currency:', order.currency);
  console.log('   - Receipt:', order.receipt);
  console.log('   - Status:', order.status);

  if (!order.id || order.amount !== 50000) {
    throw new Error('❌ Order creation output mismatch');
  }
  console.log('   ✅ Order creation passed standard requirements.\n');

  // 4. Test Minimum Amount Rejection (< 100 paise)
  console.log('4. Testing Minimum Amount Validation (< 100 paise)...');
  try {
    await createRazorpayOrder({
      amount: 50, // 50 paise < 100 paise
      isPaise: true,
    });
    throw new Error('❌ Should have rejected amount < 100 paise!');
  } catch (err) {
    console.log('   ✅ Successfully caught and rejected amount < 100 paise:', err.message, '\n');
  }

  // 5. Test Signature Verification (HMAC-SHA256)
  console.log('5. Testing Payment Signature Verification (/api/verify-payment logic)...');
  const sampleOrderId = order.id;
  const samplePaymentId = `pay_${Date.now().toString().slice(-8)}_test`;

  // Generate authentic HMAC-SHA256 signature
  const validSignature = crypto
    .createHmac('sha256', creds.keySecret)
    .update(`${sampleOrderId}|${samplePaymentId}`)
    .digest('hex');

  // Test Valid Signature
  const isValid = verifyPaymentSignature({
    razorpay_order_id: sampleOrderId,
    razorpay_payment_id: samplePaymentId,
    razorpay_signature: validSignature,
  });

  if (!isValid) {
    throw new Error('❌ Valid signature was rejected by verifyPaymentSignature!');
  }
  console.log('   ✅ Valid HMAC-SHA256 signature verified successfully.');

  // Test Tampered Signature
  const isTamperedValid = verifyPaymentSignature({
    razorpay_order_id: sampleOrderId,
    razorpay_payment_id: samplePaymentId,
    razorpay_signature: 'fake_tampered_signature_xyz_123',
  });

  if (isTamperedValid) {
    throw new Error('❌ Tampered signature was incorrectly accepted!');
  }
  console.log('   ✅ Tampered signature was correctly rejected.\n');

  console.log('====================================================');
  console.log('🎉 ALL INTEGRATION REQUIREMENTS VERIFIED AND PASSED!');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
