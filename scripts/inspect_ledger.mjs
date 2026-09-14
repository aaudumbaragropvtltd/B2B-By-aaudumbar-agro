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
  const { data: ledger, error } = await sb
    .from('platform_ledger')
    .select(`
      id,
      order_id,
      entry_type,
      amount,
      from_entity_id,
      payment_reference,
      description,
      created_at,
      trade_orders:order_id (
        id,
        current_state,
        total_contract_value,
        advance_paid_10,
        buyer_id,
        supplier_id,
        product_id,
        buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number ),
        supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email ),
        product:products ( id, title )
      ),
      payer:from_entity_id (
        id,
        display_id,
        company_name,
        full_name,
        registered_email,
        corporate_phone,
        whatsapp_number
      )
    `)
    .order('created_at', { ascending: false });

  console.log('Error:', error);
  console.log('Total ledger entries:', ledger?.length);
  console.log('Recent 5 entries:', JSON.stringify(ledger?.slice(0, 5), null, 2));
}

run();
