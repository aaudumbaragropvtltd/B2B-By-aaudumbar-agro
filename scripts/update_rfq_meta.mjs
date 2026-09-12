import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const contactMeta = {
    phone: '9226497450',
    alt_phone: '+91 99887 76655',
    email: 'rsevmail@gmail.com'
  };

  const { data, error } = await supabase
    .from('rfqs')
    .update({
      notes: `<!--CONTACT_META:${JSON.stringify(contactMeta)}-->`
    })
    .eq('id', '195c4896-869d-4b99-b22f-06f7097b3914')
    .select();

  console.log('Updated RFQ 195c4896:', { data, error });
}

run();
