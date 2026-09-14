import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const VALID_COMPLETED_PAYMENT_STATES = [
  'price_locked_10',
  'warehouse_loading',
  'settled'
];

async function run() {
  const { data, error } = await sb
    .from('trade_orders')
    .select(`
      *,
      buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state ),
      supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, warehouse_address ),
      product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
    `)
    .in('current_state', VALID_COMPLETED_PAYMENT_STATES)
    .order('created_at', { ascending: false });

  console.log('Query error:', error);
  console.log('Returned count:', data?.length);
  const soy = data?.find(o => o.id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  console.log('Found soy order?', Boolean(soy));
  if (soy) {
    console.log('Soy order:', {
      id: soy.id,
      product: soy.product?.title,
      buyer: soy.buyer?.company_name || soy.buyer?.full_name,
      supplier: soy.supplier?.company_name,
      notes: soy.buyer_notes
    });
  }
}

run();
