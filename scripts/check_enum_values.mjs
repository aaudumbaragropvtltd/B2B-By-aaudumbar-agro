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
  // Test individual states to see which ones fail
  const candidates = [
    'draft',
    'rfq_created',
    'quotation_issued',
    'price_locked_10',
    'warehouse_loading',
    'in_transit',
    'dispatched',
    'out_for_delivery',
    'ready_for_pickup',
    'collected',
    'delivered',
    'completed',
    'settled',
    'cancelled',
    'disputed'
  ];

  for (const s of candidates) {
    const { data, error } = await sb.from('trade_orders').select('id').eq('current_state', s).limit(1);
    if (error) {
      console.log(`State "${s}": INVALID (${error.message})`);
    } else {
      console.log(`State "${s}": VALID (found ${data.length})`);
    }
  }
}

run();
