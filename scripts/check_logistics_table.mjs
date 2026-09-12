import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

async function checkLogisticsArrangements() {
  const { data, error } = await supabase.from('logistics_arrangements').select('*').limit(1);
  if (error) {
    console.log('❌ logistics_arrangements does not exist:', error.message);
  } else {
    console.log('✅ logistics_arrangements exists! Rows:', data);
  }
}

checkLogisticsArrangements();
