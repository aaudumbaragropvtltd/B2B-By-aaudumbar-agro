import { createClient } from '@supabase/supabase-js';

async function listAllTables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, key);

  // We can query pg_tables via rpc or check known tables
  const candidateTables = [
    'users', 'products', 'rfqs', 'quotes', 'orders', 'order_status_history', 
    'logistics_shipments', 'platform_ledger', 'activity_logs', 'notifications',
    'categories', 'sectors', 'messages', 'chat_messages', 'settings'
  ];

  for (const t of candidateTables) {
    const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`✓ Table '${t}' exists. Rows: ${count}`);
    } else {
      console.log(`✗ Table '${t}': ${error.message}`);
    }
  }
}

listAllTables();
