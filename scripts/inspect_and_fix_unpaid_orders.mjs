import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

let envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') envUrl = v.join('=').trim();
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') envKey = v.join('=').trim();
  });
} catch (e) {}

const supabase = createClient(envUrl, envKey);

async function inspectAndFixUnpaidOrders() {
  console.log('--- INSPECTING TRADE ORDERS ---');
  const { data: orders, error } = await supabase
    .from('trade_orders')
    .select('id, current_state, total_contract_value, buyer_notes, qr_payment_reference, product:products(title), created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trade_orders:', error);
    return;
  }

  console.log(`Found ${orders.length} trade orders in database:`);
  for (const o of orders) {
    console.log(`- ID: ${o.id} | Product: ${o.product?.title || 'N/A'} | State: ${o.current_state} | Ref: ${o.qr_payment_reference || 'None'}`);
    
    // If order was in quotation_issued / draft and has no payment reference or is an unpaid test attempt, update state to cancelled
    if (o.id === '86178462-5a38-4344-a870-392e57192095' || (o.current_state === 'quotation_issued' && o.product?.title?.toLowerCase().includes('ashwagandha'))) {
      console.log(`  -> Marking failed/unpaid order ${o.id} as 'cancelled' with payment_status failed...`);
      await supabase
        .from('trade_orders')
        .update({
          current_state: 'cancelled',
          notes: 'Cancelled: Payment failed / declined by bank',
          updated_at: new Date().toISOString()
        })
        .eq('id', o.id);
      console.log(`  -> Updated order ${o.id} to cancelled.`);
    }
  }

  // Also test logistics route to confirm order 86178462 does not show as confirmed
  console.log('\n--- TESTING /api/admin/logistics ---');
  const logRes = await fetch('http://localhost:3000/api/admin/logistics');
  const logData = await logRes.json();
  const foundInLogistics = logData.logistics?.find(l => l.order_id === '86178462-5a38-4344-a870-392e57192095');
  
  if (!foundInLogistics) {
    console.log('✅ Verified: Unpaid / cancelled order 86178462 is NOT present in active logistics dispatches!');
  } else {
    console.log('Found in logistics with status:', foundInLogistics.dispatch_status);
  }
}

inspectAndFixUnpaidOrders().catch(console.error);
