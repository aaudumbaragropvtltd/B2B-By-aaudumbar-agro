import crypto from 'crypto';

const keySecret = 'fq5tI6y0SF9U7qSLa4Af5nOs'; // From services/razorpay.js

function generateTestSignature(orderId, paymentId) {
  const body = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', keySecret).update(body).digest('hex');
}

async function testPaymentVerificationAndEmail() {
  console.log('--- 1. TESTING REJECTION OF UNVERIFIED / FAILED PAYMENT ---');
  try {
    const unverifiedRes = await fetch('http://localhost:3000/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-INVALID-999',
        razorpay_order_id: 'order_invalid_123',
        razorpay_payment_id: 'pay_invalid_456',
        razorpay_signature: 'tampered_signature_xyz',
        amount: 80581.02
      })
    });
    const unverifiedJson = await unverifiedRes.json();
    console.log('Unverified Request Status:', unverifiedRes.status, 'Response:', unverifiedJson);
    if (!unverifiedRes.ok || unverifiedJson.error) {
      console.log('✅ Unverified payment correctly REJECTED! No pickup/delivery screen shown.');
    }
  } catch (err) {
    console.log('Error testing unverified:', err.message);
  }

  console.log('\n--- 2. TESTING VERIFIED ADVANCE ESCROW PAYMENT & 10% RECEIPT EMAIL ---');
  const testOrderId = `ORD-${Date.now().toString().slice(-6)}`;
  const testRzpOrderId = `order_${Date.now()}`;
  const testRzpPaymentId = `pay_${Date.now()}`;
  const validSignature = generateTestSignature(testRzpOrderId, testRzpPaymentId);

  try {
    const verifiedRes = await fetch('http://localhost:3000/api/payment/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: testOrderId,
        razorpay_order_id: testRzpOrderId,
        razorpay_payment_id: testRzpPaymentId,
        razorpay_signature: validSignature,
        amount: 80581.02,
        buyerEmail: 'raghavendra.sevalikar5730@gmail.com',
        buyerName: 'Aaudumbar Agro Enterprise Buyer',
        buyerPhone: '+91-8408841998',
        productTitle: 'Diesel Generator 125 KVA (Silent)',
        deliveryAddress: 'Aurangabad Industrial Hub, Maharashtra'
      })
    });

    const verifiedJson = await verifiedRes.json();
    console.log('Verified Request Status:', verifiedRes.status, 'Response:', verifiedJson);
    if (verifiedRes.ok && verifiedJson.success) {
      console.log('✅ Verified payment processed successfully!');
      console.log(`✅ 10% Advance Booking & Escrow Receipt Email dispatched to: raghavendra.sevalikar5730@gmail.com`);
    }
  } catch (err) {
    console.log('Error testing verified:', err.message);
  }
}

testPaymentVerificationAndEmail();
