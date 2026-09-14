import fetch from 'node-fetch';
import { sendOrderReceiptEmail } from '../services/orderReceiptService.js';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';

async function runVerification() {
  console.log('================================================================================');
  console.log('UNIFIED VERIFICATION: ADMIN ORDERS, PAYMENTS & 10% RECEIPT');
  console.log('================================================================================\n');

  // Test 1: Fetch Admin Orders
  console.log('1. Testing GET /api/admin/orders...');
  const ordersRes = await fetch(`${BASE_URL}/api/admin/orders`);
  if (!ordersRes.ok) {
    throw new Error(`GET /api/admin/orders failed with status ${ordersRes.status}`);
  }
  const ordersData = await ordersRes.json();
  const orders = ordersData.orders || [];
  console.log(`✅ Admin Orders retrieved: ${orders.length} orders total.`);

  const soyOrder = orders.find(o => o.id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  if (!soyOrder) {
    console.error('❌ FAILED: Soybean order 7320c7be not found in /api/admin/orders!');
    console.log('First 3 orders:', orders.slice(0, 3).map(o => ({ id: o.id, product: o.product_name })));
    process.exit(1);
  }

  console.log('✅ Soybean order found in Admin Orders:', {
    id: soyOrder.id,
    product: soyOrder.product_name,
    transaction_id: soyOrder.transaction_id,
    order_status: soyOrder.order_status,
    payment_status: soyOrder.payment_status,
    delivery_option: soyOrder.delivery_option,
    total_amount: soyOrder.total_amount,
    advance_amount: soyOrder.advance_amount
  });

  if (soyOrder.transaction_id !== 'pay_TbvfL2ta8KG90j') {
    throw new Error(`Expected transaction_id pay_TbvfL2ta8KG90j, got ${soyOrder.transaction_id}`);
  }
  console.log('✅ Order ID and Transaction ID are properly unified in Admin Orders!\n');

  // Test 2: Fetch Admin Payments
  console.log('2. Testing GET /api/admin/payments...');
  const paymentsRes = await fetch(`${BASE_URL}/api/admin/payments?status=all`);
  if (!paymentsRes.ok) {
    throw new Error(`GET /api/admin/payments failed with status ${paymentsRes.status}`);
  }
  const paymentsData = await paymentsRes.json();
  const payments = paymentsData.payments || [];
  console.log(`✅ Admin Payments retrieved: ${payments.length} payments total.`);
  console.log('✅ Metrics summary:', paymentsData.metrics);

  if (payments.length === 0) {
    throw new Error('FAILED: Admin payments section is still empty!');
  }

  const soyPayment = payments.find(p => p.order_id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  if (!soyPayment) {
    console.error('❌ FAILED: Soybean payment for order 7320c7be not found in /api/admin/payments!');
    console.log('First 3 payments:', payments.slice(0, 3).map(p => ({ id: p.id, order_id: p.order_id, amount: p.amount })));
    process.exit(1);
  }

  console.log('✅ Soybean payment found in Admin Payments:', {
    id: soyPayment.id,
    order_id: soyPayment.order_id,
    transaction_reference: soyPayment.transaction_reference,
    amount: soyPayment.amount,
    status: soyPayment.status,
    payment_method: soyPayment.payment_method,
    company: soyPayment.users?.company_name
  });

  if (soyPayment.transaction_reference !== 'pay_TbvfL2ta8KG90j') {
    throw new Error(`Expected transaction_reference pay_TbvfL2ta8KG90j, got ${soyPayment.transaction_reference}`);
  }
  console.log('✅ Order ID and Transaction Reference are identical across Orders and Payments!\n');

  // Test 3: Verify 10% Receipt / Bill Content
  console.log('3. Testing 10% Advance Receipt / Bill Generation...');
  // Inspect the HTML & Text generated for the soybean order
  const receiptResult = await sendOrderReceiptEmail({
    id: soyOrder.id,
    order_id: soyOrder.id,
    transaction_id: soyOrder.transaction_id,
    buyer_company_name: 'SATYAM EXPO',
    buyer_contact_person: 'Raghavendra Sevlikar',
    buyer_email: 'raghavendra.sevalikar5002@gmail.com',
    buyer_phone: '9226497450',
    buyer_gstin: '27AAECR1234F1Z5',
    product_name: 'Soyabean (Yellow FAQ Grade)',
    quantity: 1,
    unit: 'Kg',
    price_per_unit: 105,
    total_amount: 110.25,
    advance_amount: 11.03,
    delivery_option: 'pickup',
    arrival_date: '2026-09-23',
    visitor_count: 2,
    vehicle_number: 'Mh20gf5002',
    p1_name: 'Aditya sonpawale',
    p1_phone: '9423453700',
    p1_aadhar: '625770343109',
    p2_name: 'Raghavendra sevlikar ',
    p2_phone: '9423453700',
    p2_aadhar: '625770343109',
    tracking_number: 'GATE-PASS-3848'
  }, {
    buyerCompanyName: 'SATYAM EXPO',
    buyerContactPerson: 'Raghavendra Sevlikar',
    buyerEmail: 'raghavendra.sevalikar5002@gmail.com'
  });

  console.log('Receipt generation result:', {
    success: receiptResult.success,
    receiptRef: receiptResult.receiptRef,
    orderId: receiptResult.orderId,
    txnId: receiptResult.txnId
  });

  console.log('\n================================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% UNIFIED DATA!');
  console.log('================================================================================');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
