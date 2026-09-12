import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('--- Checking & Migrating rfq_quotes Columns ---');
  
  // Test select to see existing columns
  const { data, error } = await supabaseAdmin.from('rfq_quotes').select('*').limit(1);
  if (error) {
    console.log('Error selecting rfq_quotes:', error.message);
  } else {
    console.log('rfq_quotes sample keys:', data?.[0] ? Object.keys(data[0]) : 'table is empty');
  }
}

migrate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
