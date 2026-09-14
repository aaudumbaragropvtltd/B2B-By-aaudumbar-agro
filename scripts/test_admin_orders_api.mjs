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

const VALID_SUPABASE_PAYMENT_STATES = [
  'price_locked_10',
  'warehouse_loading',
  'settled'
];

async function test() {
  const ledgerMap = new Map();
  const { data: ledgerEntries } = await supabaseAdmin
    .from('platform_ledger')
    .select('order_id, payment_reference')
    .not('order_id', 'is', null)
    .order('created_at', { ascending: false });

  (ledgerEntries || []).forEach(l => {
    if (l.order_id && l.payment_reference && !ledgerMap.has(l.order_id)) {
      ledgerMap.set(l.order_id, l.payment_reference);
    }
  });

  const { data, error } = await supabaseAdmin
    .from('trade_orders')
    .select(`
      *,
      buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state ),
      supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, warehouse_address ),
      product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
    `)
    .in('current_state', VALID_SUPABASE_PAYMENT_STATES)
    .order('created_at', { ascending: false });

  console.log('Query error:', error);
  console.log('Orders found:', data?.length);

  const soy = data?.find(o => o.id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  if (soy) {
    const liveTxnId = ledgerMap.get(soy.id) || soy.qr_payment_reference;
    console.log('✅ SOYABEAN ORDER FOUND:');
    console.log({
      id: soy.id,
      product: soy.product?.title,
      transaction_id: liveTxnId,
      state: soy.current_state,
      total: soy.total_contract_value,
      advance: soy.advance_paid_10
    });
  } else {
    console.log('❌ Soy order not found');
  }
}

test();
