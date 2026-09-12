import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: rfq, error } = await supabase
    .from('rfqs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('Latest RFQ:', rfq);
  console.log('Error if any:', error);
}

run();
