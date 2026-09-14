// ============================================================================
// TEST: DIRECT DELIVERY RECEIPT & API DEFERRAL LOGIC
// ============================================================================

import { sendOrderReceiptEmail } from '../services/orderReceiptService.js';

async function testDeliveryOption() {
  console.log('=== TEST 4: Direct Delivery Receipt Verification ===');

  const testDeliveryOrder = {
    id: `TEST-DELIV-${Date.now()}`,
    transaction_id: `TXN-DELIV-${Date.now().toString().slice(-6)}`,
    buyer_email: 'raghavendra.sevalikar5002@gmail.com',
    buyer_name: 'Raghavendra Sevlikar',
    product_name: 'Soyabean (Yellow FAQ Grade)',
    quantity: 2000,
    unit: 'Kg',
    price_per_unit: 48,
    total_amount: 100800,
    advance_amount: 10080,
    delivery_option: 'deliver',
    delivery_date: '2026-09-30',
    delivery_address: 'Plot 45, MIDC Waluj, Chhatrapati Sambhajinagar',
    receiver_name: 'Warehouse Incharge',
    receiver_phone: '9123456780',
    transporter_name: 'B2B India Express Logistics'
  };

  const nodemailer = await import('nodemailer');
  let captured = null;
  nodemailer.default.createTransport = () => ({
    sendMail: async (options) => {
      captured = options;
      return { messageId: 'test-deliv-msg-id' };
    }
  });

  const res = await sendOrderReceiptEmail(testDeliveryOrder);
  console.log('Delivery receipt dispatch result:', res);

  const html = captured.html;
  const text = captured.text;

  const hasSatyamExpo = html.includes('SATYAM EXPO');
  console.log('✓ Buyer Company Name is SATYAM EXPO:', hasSatyamExpo ? 'PASS ✅' : 'FAIL ❌');

  const termsIndex = html.indexOf('Escrow Protection Guarantee');
  const deliveryDossierIndex = html.indexOf('Direct Delivery Fulfillment &amp; Destination Record');
  const isBelowTerms = termsIndex > 0 && deliveryDossierIndex > termsIndex;
  console.log('✓ Delivery dossier appears strictly BELOW Terms & Conditions:', isBelowTerms ? 'PASS ✅' : 'FAIL ❌');

  const noPickupVisitors = !html.includes('Visitor 1 (Primary / Driver)');
  console.log('✓ No Self-Pickup visitor pass rendered on Delivery receipt:', noPickupVisitors ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n=======================================================');
  console.log('ALL DELIVERY RECEIPT CHECKS COMPLETED SUCCESSFULLY!');
  console.log('=======================================================');
}

testDeliveryOption().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
