import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

// List of all expected tables from the ERD diagram and user requirements
const expectedTables = [
  'users',
  'profiles',
  'industry_sectors',
  'products',
  'rfqs',
  'rfq_quotes',
  'trade_orders',
  'platform_ledger',
  'search_logs',
  'activity_logs',
  'user_product_views',
  'conversations',
  'messages',
  'logistics_arrangements',
  'logistics',
  'payments',
  'order_timeline'
];

async function auditDatabase() {
  console.log('====================================================');
  console.log('🔍 DEEP SCHEMA & TABLE AUDIT OF SUPABASE DATABASE');
  console.log('====================================================\n');

  const report = {};

  for (const tableName of expectedTables) {
    console.log(`Checking table [${tableName}]...`);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        report[tableName] = {
          exists: false,
          error: error.message,
          code: error.code,
          columns: []
        };
        console.log(`  ❌ Table [${tableName}] DOES NOT EXIST or Error: ${error.message}`);
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
        
        // If table exists but has 0 rows, let's discover columns by inserting a dummy or checking schema
        let discoveredCols = columns;
        if (discoveredCols.length === 0) {
          // Attempt an insert with empty object to inspect error message which reveals columns or try selecting single
          const { error: insertErr } = await supabase.from(tableName).insert({ __non_existent_field_test__: 1 });
          // If table has empty rows, test common column selects
          const testCols = ['id', 'user_id', 'order_id', 'created_at', 'updated_at', 'status', 'buyer_id', 'supplier_id'];
          const availableCols = [];
          for (const col of testCols) {
            const { error: colErr } = await supabase.from(tableName).select(col).limit(1);
            if (!colErr) availableCols.push(col);
          }
          discoveredCols = availableCols;
        }

        report[tableName] = {
          exists: true,
          columns: discoveredCols,
          rowCount: data?.length || 0
        };
        console.log(`  ✅ Table [${tableName}] EXISTS. Found ${discoveredCols.length} sample/verified columns.`);
        if (discoveredCols.length > 0) {
          console.log(`     Columns:`, discoveredCols.join(', '));
        }
      }
    } catch (e) {
      report[tableName] = { exists: false, error: e.message };
      console.log(`  ❌ Exception on [${tableName}]:`, e.message);
    }
  }

  console.log('\n====================================================');
  console.log('📋 AUDIT SUMMARY:');
  console.log('====================================================');
  for (const [tbl, info] of Object.entries(report)) {
    if (info.exists) {
      console.log(`✅ ${tbl.padEnd(25)} : EXISTS (${info.columns?.length || 0} cols detected)`);
    } else {
      console.log(`❌ ${tbl.padEnd(25)} : MISSING / ERROR (${info.error})`);
    }
  }
}

auditDatabase().catch(err => console.error('Audit failed:', err));
