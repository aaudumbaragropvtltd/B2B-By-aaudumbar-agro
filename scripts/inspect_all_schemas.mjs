import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

const tables = [
  'products',
  'users',
  'rfqs',
  'rfq_quotes',
  'trade_orders',
  'platform_ledger',
  'search_logs',
  'industry_sectors',
  'messages',
  'conversations'
];

async function inspectAllSchemas() {
  console.log('--- INSPECTING ALL POSTGRESQL TABLES IN SUPABASE ---');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table [${table}] Error:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Table [${table}] Columns (${Object.keys(data[0]).length}):`, Object.keys(data[0]));
    } else {
      // Empty table, insert a dummy rollback or check
      console.log(`Table [${table}] returned 0 rows, testing select id`);
    }
  }
}

inspectAllSchemas();
