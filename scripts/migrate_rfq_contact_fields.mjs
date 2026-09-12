import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing column availability in rfqs and rfq_quotes...');
  
  // Test rfqs insert/update with new columns
  const { data: rfqs, error: rfqErr } = await supabase
    .from('rfqs')
    .select('id, buyer_email')
    .limit(1);

  console.log('RFQs test query:', { count: rfqs?.length, error: rfqErr?.message });

  // Test rfq_quotes
  const { data: quotes, error: qErr } = await supabase
    .from('rfq_quotes')
    .select('id')
    .limit(1);

  console.log('Quotes test query:', { count: quotes?.length, error: qErr?.message });
}

run();
