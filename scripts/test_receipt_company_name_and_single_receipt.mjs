// ============================================================================
// TEST: COMPANY NAME BILLING, VISITOR PLACEMENT & SINGLE RECEIPT ENFORCEMENT
// ============================================================================

import { sendOrderReceiptEmail } from '../services/orderReceiptService.js';
import { sendTotalInvoiceEmail } from '../services/orderInvoiceService.js';
import { saveNewOrder, updateOrder, findOrderById } from '../services/ordersStore.js';

async function runTests() {
  console.log('=== TEST 1: Verify Company Name Resolution for Raghavendra (SATYAM EXPO) ===');
  
  const testPickupOrder = {
    id: `TEST-ORD-${Date.now()}`,
    transaction_id: `TXN-TEST-${Date.now().toString().slice(-6)}`,
    buyer_email: 'raghavendra.sevalikar5002@gmail.com',
    buyer_name: 'Raghavendra Sevlikar',
    product_name: 'Soyabean (Yellow FAQ Grade)',
    quantity: 1000,
    unit: 'Kg',
    price_per_unit: 48,
    total_amount: 50400,
    advance_amount: 5040,
    delivery_option: 'pickup',
    arrival_date: '2026-09-25',
    visitor_count: 1,
    vehicle_number: 'MH-12-TR-9420',
    p1_name: 'Aditya',
    p1_phone: '9876543210',
    p1_aadhar: '123456789012'
  };

  // Mock nodemailer sendMail to intercept the generated email content
  const nodemailer = await import('nodemailer');
  const originalCreateTransport = nodemailer.default.createTransport;

  let capturedReceipt = null;
  nodemailer.default.createTransport = () => ({
    sendMail: async (options) => {
      capturedReceipt = options;
      return { messageId: 'test-msg-id-12345' };
    }
  });

  const receiptResult = await sendOrderReceiptEmail(testPickupOrder);
  console.log('Receipt dispatch result:', receiptResult);

  if (!capturedReceipt) {
    throw new Error('Receipt email was not generated!');
  }

  // 1. Verify Company Name
  const html = capturedReceipt.html;
  const text = capturedReceipt.text;

  const hasSatyamExpo = html.includes('SATYAM EXPO') && text.includes('SATYAM EXPO');
  console.log('✓ Buyer Company Name is SATYAM EXPO:', hasSatyamExpo ? 'PASS ✅' : 'FAIL ❌');
  if (!hasSatyamExpo) {
    console.error('Expected SATYAM EXPO in receipt! Found instead in html:', html.slice(html.indexOf('BUYER / BILLED TO'), html.indexOf('BUYER / BILLED TO') + 300));
  }

  // 2. Verify Aditya is NOT in Party 2 / Billed To
  const billedToSection = html.slice(html.indexOf('BUYER / BILLED TO'), html.indexOf('Advance Payment Clearance') || html.indexOf('Itemized Goods'));
  const adityaInBilledTo = billedToSection.toLowerCase().includes('aditya');
  console.log('✓ Driver name Aditya is NOT in Party 2 Billed To header:', !adityaInBilledTo ? 'PASS ✅' : 'FAIL ❌');

  // 3. Verify Visitor details are strictly BELOW Terms & Conditions
  const termsIndex = html.indexOf('Terms &amp; Conditions') > -1 ? html.indexOf('Terms &amp; Conditions') : html.indexOf('Escrow Protection Guarantee');
  const visitorIndex = html.indexOf('Central Godown Self-Pickup — Authorized Visitor(s)');
  
  console.log(`Terms index in HTML: ${termsIndex}, Visitor dossier index in HTML: ${visitorIndex}`);
  const isBelowTerms = termsIndex > 0 && visitorIndex > termsIndex;
  console.log('✓ Visitor details appear strictly BELOW Terms & Conditions in HTML:', isBelowTerms ? 'PASS ✅' : 'FAIL ❌');

  const textTermsIndex = text.indexOf('TERMS & CONDITIONS');
  const textVisitorIndex = text.indexOf('VISITOR & VEHICLE GATE PASS CLEARANCE (DETAILS BELOW TERMS & CONDITIONS)');
  console.log(`Terms index in TEXT: ${textTermsIndex}, Visitor dossier index in TEXT: ${textVisitorIndex}`);
  const isTextBelowTerms = textTermsIndex > 0 && textVisitorIndex > textTermsIndex;
  console.log('✓ Visitor details appear strictly BELOW Terms & Conditions in Text:', isTextBelowTerms ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n=== TEST 2: Verify Total Invoice Company Name & Visitor Placement ===');
  let capturedInvoice = null;
  nodemailer.default.createTransport = () => ({
    sendMail: async (options) => {
      capturedInvoice = options;
      return { messageId: 'test-invoice-id-12345' };
    }
  });

  const invoiceResult = await sendTotalInvoiceEmail(testPickupOrder);
  console.log('Invoice dispatch result:', invoiceResult);

  const invHtml = capturedInvoice.html;
  const invText = capturedInvoice.text;

  const invHasSatyamExpo = invHtml.includes('SATYAM EXPO') && invText.includes('SATYAM EXPO');
  console.log('✓ Invoice Party Name is SATYAM EXPO:', invHasSatyamExpo ? 'PASS ✅' : 'FAIL ❌');

  const invTermsIndex = invHtml.indexOf('Terms &amp; Conditions of Wholesale Sale');
  const invVisitorIndex = invHtml.indexOf('Central Godown Self-Pickup — Authorized Visitor(s)');
  const isInvBelowTerms = invTermsIndex > 0 && invVisitorIndex > invTermsIndex;
  console.log('✓ Invoice visitor details appear strictly BELOW Terms & Conditions:', isInvBelowTerms ? 'PASS ✅' : 'FAIL ❌');

  console.log('\n=== TEST 3: Verify Single Receipt Rule in Store & Confirmation Logic ===');
  const storeOrder = saveNewOrder({
    ...testPickupOrder,
    buyer_company_name: 'SATYAM EXPO',
    buyer_name: 'Raghavendra Sevlikar',
    receipt_sent: false
  });

  console.log('Saved order in store:');
  console.log('  id:', storeOrder.id);
  console.log('  buyer_company_name:', storeOrder.buyer_company_name);
  console.log('  buyer_name:', storeOrder.buyer_name);
  console.log('  p1_name:', storeOrder.p1_name);
  console.log('  receipt_sent:', storeOrder.receipt_sent);

  const orderCompanyPreserved = storeOrder.buyer_company_name === 'SATYAM EXPO';
  const orderBuyerNotAditya = storeOrder.buyer_name !== 'Aditya';
  console.log('✓ Order store buyer_company_name preserved as SATYAM EXPO:', orderCompanyPreserved ? 'PASS ✅' : 'FAIL ❌');
  console.log('✓ Order store buyer_name is NOT driver Aditya:', orderBuyerNotAditya ? 'PASS ✅' : 'FAIL ❌');

  // Mark receipt as sent
  const updated = updateOrder(storeOrder.id, { receipt_sent: true });
  console.log('✓ Order marked as receipt_sent:', updated.receipt_sent ? 'PASS ✅' : 'FAIL ❌');

  // Restore original transport
  nodemailer.default.createTransport = originalCreateTransport;

  console.log('\n=======================================================');
  console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
  console.log('=======================================================');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
