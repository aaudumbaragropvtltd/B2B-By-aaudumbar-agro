import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMoreTables() {
  const tables = [
    'users', 'products', 'rfqs', 'rfq_quotes', 'quotes', 'trade_orders',
    'platform_ledger', 'activity_logs', 'notifications', 'logistics_shipments',
    'search_logs', 'industry_sectors', 'messages', 'conversations', 'order_status_history',
    'platform_settings', 'platform_banners', 'audit_logs', 'system_config', 'site_config',
    'app_settings', 'metadata', 'kv_store', 'key_value'
  ];

  for (const t of tables) {
    const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`✓ Exists: ${t} (${count} rows)`);
    }
  }
}
checkMoreTables();
