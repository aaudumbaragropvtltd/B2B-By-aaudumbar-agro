// Quick script to verify Supabase profiles table
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ihsgymlxdgmdrtwlnetr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII'
);

async function setup() {
  // Verify table exists by querying it
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.log('❌ Profiles table error:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('✅ Profiles table exists. Rows:', data.length);
  }
  
  // Check if we can query with expected columns
  const { data: cols, error: colErr } = await supabase
    .from('profiles')
    .select('id,company_name,email,role,status,gst_number,phone')
    .limit(0);
  if (colErr) {
    console.log('❌ Column check error:', colErr.message);
  } else {
    console.log('✅ All expected columns verified');
  }
}

setup().catch(console.error);
