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
    .select('id, created_at, current_state, total_contract_value, advance_paid_10, qr_payment_reference, product:products(title)')
    .order('created_at', { ascending: false });

  console.log('Total trade_orders in DB:', tradeOrders.length);
  console.table(tradeOrders.map(o => ({
    id: o.id.slice(0, 8),
    title: (o.product?.title || '').slice(0, 25),
    state: o.current_state,
    total: o.total_contract_value,
    advance: o.advance_paid_10,
    qr_ref: (o.qr_payment_reference || '').slice(0, 20),
    created_at: o.created_at?.slice(0, 10)
  })));
}

run();
