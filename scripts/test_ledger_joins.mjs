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
  // Test relationships from platform_ledger to trade_orders and users
  const { data, error } = await sb
    .from('platform_ledger')
    .select(`
      *,
      trade_orders:order_id (
        id,
        current_state,
        total_contract_value,
        advance_paid_10,
        buyer_id,
        supplier_id,
        product_id,
        buyer:users!trade_orders_buyer_id_fkey(id, company_name, registered_email, corporate_phone),
        supplier:users!trade_orders_supplier_id_fkey(id, company_name, registered_email),
        product:products(id, title)
      ),
      payer:from_entity_id (
        id,
        company_name,
        registered_email,
        corporate_phone
      )
    `)
    .limit(5);

  console.log('Error:', error);
  console.log('Joined platform_ledger sample:', JSON.stringify(data?.[0], null, 2));
}

run();
