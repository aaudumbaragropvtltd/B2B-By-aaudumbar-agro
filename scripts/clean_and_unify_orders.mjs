import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanAndUnify() {
  console.log('1. Updating trade_orders for soybean order 7320c7be...');
  const { data: updatedTradeOrder, error: toErr } = await supabaseAdmin
    .from('trade_orders')
    .update({
      qr_payment_reference: 'pay_TbvfL2ta8KG90j',
      updated_at: new Date().toISOString()
    })
    .eq('id', '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8')
    .select();

  console.log('trade_orders update result:', updatedTradeOrder?.length, toErr || 'OK');

  console.log('2. Cleaning data/direct_orders.json...');
  const ordersFile = 'data/direct_orders.json';
  let directOrders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));

  // Filter out TEST-ORD- items
  const initialCount = directOrders.length;
  directOrders = directOrders.filter(o => !o.id?.startsWith('TEST-ORD-') && !o.transaction_id?.startsWith('TXN-TEST-'));
  console.log(`Filtered out ${initialCount - directOrders.length} test orders.`);

  // Check if soybean order 7320c7be already in directOrders
  const existingIdx = directOrders.findIndex(o => o.id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');

  const unifiedSoyOrder = {
    id: '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8',
    order_id: '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8',
    transaction_id: 'pay_TbvfL2ta8KG90j',
    payment_reference: 'pay_TbvfL2ta8KG90j',
    created_at: '2026-09-14T13:12:40.958Z',
    updated_at: new Date().toISOString(),
    buyer_email: 'raghavendra.sevalikar5002@gmail.com',
    buyer_company_name: 'SATYAM EXPO',
    company_name: 'SATYAM EXPO',
    buyer_contact_person: 'Raghavendra Sevlikar',
    buyer_name: 'Raghavendra Sevlikar',
    buyer_phone: '9226497450',
    product_id: '47a16ec8-33df-4c91-a5c9-f23a5054bb83',
    product_name: 'Soyabean (Yellow FAQ Grade)',
    quantity: 1,
    unit: 'Kg',
    price_per_unit: 105,
    subtotal: 105,
    gst: 5.25,
    logistics_cost: 0,
    total_amount: 110.25,
    advance_amount: 11.03,
    payment_status: 'paid_to_escrow',
    order_status: 'confirmed',
    current_state: 'price_locked_10',
    receipt_sent: true,
    supplier_id: 'sup-aaudumbar-1',
    supplier_name: 'Aaudumbar Agro Pvt. Ltd.',
    supplier_company_name: 'Aaudumbar Agro Pvt. Ltd.',
    supplier_contact_person: 'Aditya Patil',
    supplier_phone: '+91 84088 41998',
    supplier_email: 'aaudumbaragro@gmail.com',
    supplier_gstin: '27ABACA6256A1Z2',
    supplier_location: 'Chhatrapati Sambhajinagar, Maharashtra',
    supplier_godown: 'Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar',
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
    tracking_number: 'GATE-PASS-3848',
    notes: 'Direct Wholesale Escrow Order.'
  };

  if (existingIdx >= 0) {
    directOrders[existingIdx] = unifiedSoyOrder;
  } else {
    directOrders.unshift(unifiedSoyOrder);
  }

  fs.writeFileSync(ordersFile, JSON.stringify(directOrders, null, 2), 'utf8');
  console.log(`Saved ${directOrders.length} unified orders to data/direct_orders.json`);
}

cleanAndUnify();
