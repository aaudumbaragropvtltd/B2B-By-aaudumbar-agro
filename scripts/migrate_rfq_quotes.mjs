import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 18;
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS price_before_gst NUMERIC(12, 2) DEFAULT 0;
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS supplier_location VARCHAR(255);
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS delivery_days INT DEFAULT 7;
    ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12, 2) DEFAULT 0;
  `;
  
  console.log('Running RFQ migration DDL...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('Migration RPC error:', error.message);
  } else {
    console.log('Migration completed successfully!');
  }

  // Check what quotes exist in rfq_quotes
  const { data: quotes, error: qErr } = await supabase
    .from('rfq_quotes')
    .select('*');
  console.log('Existing quotes in database:', quotes?.length || 0, quotes);
}

run();
