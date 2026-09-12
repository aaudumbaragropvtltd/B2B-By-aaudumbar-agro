import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

const candidateTables = [
  'logistics',
  'order_logistics',
  'shipments',
  'deliveries',
  'tracking',
  'platform_settings',
  'activity_logs',
  'user_memberships',
  'memberships',
  'escrow_accounts',
  'notifications',
  'banners',
  'quote_negotiations',
  'buyer_searches',
  'audit_logs',
  'profiles'
];

async function checkCandidateTables() {
  console.log('--- CHECKING ADDITIONAL CANDIDATE TABLES ---');
  for (const table of candidateTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table [${table}] Error: ${error.message}`);
    } else {
      console.log(`✅ Table [${table}] EXISTS! Columns:`, data && data.length > 0 ? Object.keys(data[0]) : '(0 rows)');
    }
  }
}

checkCandidateTables();
