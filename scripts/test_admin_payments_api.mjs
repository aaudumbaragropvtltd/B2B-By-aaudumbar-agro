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

async function test() {
  const { data: ledger, count, error } = await supabaseAdmin
    .from('platform_ledger')
    .select(`
      id,
      order_id,
      entry_type,
      amount,
      from_entity_id,
      to_entity_id,
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
        buyer_notes,
        buyer:users!trade_orders_buyer_id_fkey (
          id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number, city, state
        ),
        product:products ( id, title )
      ),
      payer:from_entity_id (
        id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number, city, state
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false });

  console.log('Ledger query error:', error);
  console.log('Total ledger entries:', count);

  const formattedPayments = (ledger || []).map(l => {
    const buyer = l.payer || l.trade_orders?.buyer || null;
    return {
      id: l.id,
      order_id: l.order_id,
      amount: Number(l.amount || 0),
      status: 'successful',
      payment_method: l.payment_reference?.startsWith('pay_') ? 'Razorpay Gateway' : 'Bank Transfer',
      payment_type: l.entry_type || 'advance_10_percent',
      transaction_reference: l.payment_reference || `TXN-ESCROW-${(l.order_id || '').slice(0, 8).toUpperCase()}`,
      created_at: l.created_at,
      users: buyer,
      trade_orders: l.trade_orders ? {
        id: l.trade_orders.id,
        current_state: l.trade_orders.current_state,
        total_contract_value: l.trade_orders.total_contract_value,
        product: l.trade_orders.product
      } : null,
      notes: l.description
    };
  });

  console.log('Formatted payments count:', formattedPayments.length);
  const soy = formattedPayments.find(p => p.order_id === '7320c7be-4aa0-4ea8-80b8-1d2fd897a3a8');
  console.log('Soybean payment found in formatted payments:', soy);
}

test();
