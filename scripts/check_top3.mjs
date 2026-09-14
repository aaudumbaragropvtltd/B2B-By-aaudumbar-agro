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
  const { data: tradeOrders } = await sb
    .from('trade_orders')
    .select(`
      id, created_at, current_state, buyer_id, supplier_id, total_contract_value, advance_paid_10, qr_payment_reference, buyer_notes,
      product:products(id, title)
    `)
    .order('created_at', { ascending: false })
    .limit(3);
  console.log('Top 3 trade orders:', JSON.stringify(tradeOrders, null, 2));
}

run();
