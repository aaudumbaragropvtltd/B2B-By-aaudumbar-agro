import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('trade_orders').select('id, current_state, qr_payment_reference, buyer_notes');
  console.log('Trade orders in Supabase:', data?.length);
  data?.forEach(o => {
    console.log(`- ID: ${o.id}, state: ${o.current_state}, qr: ${o.qr_payment_reference}`);
  });
}

check();
