import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('--- ALL TRADE ORDERS (last 10) ---');
  const { data: tradeOrders } = await sb
    .from('trade_orders')
    .select(`
      id, created_at, current_state, buyer_id, supplier_id, total_contract_value, advance_paid_10, qr_payment_reference, buyer_notes,
      buyer:users!trade_orders_buyer_id_fkey(id, company_name, registered_email, corporate_phone),
      product:products(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(JSON.stringify(tradeOrders, null, 2));

  console.log('\n--- DIRECT ORDERS JSON (latest 5) ---');
  const directOrders = JSON.parse(fs.readFileSync('data/direct_orders.json', 'utf8'));
  console.log(JSON.stringify(directOrders.slice(0, 5), null, 2));
}

run();
