import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: rfqs } = await supabase
    .from('rfqs')
    .select('*, users!rfqs_buyer_id_fkey(company_name, registered_email, corporate_phone, phone_number)')
    .order('created_at', { ascending: false })
    .limit(3);

  for (const rfq of rfqs) {
    let parsedPhone = rfq.buyer_phone || rfq.users?.corporate_phone || rfq.users?.phone_number || '';
    let parsedAltPhone = rfq.buyer_alternate_phone || rfq.users?.phone_number || '';
    let cleanNotes = rfq.notes || '';

    if (rfq.notes && rfq.notes.includes('<!--CONTACT_META:')) {
      try {
        const match = rfq.notes.match(/<!--CONTACT_META:(.*?)-->/);
        if (match && match[1]) {
          const meta = JSON.parse(match[1]);
          if (meta.phone) parsedPhone = meta.phone;
          if (meta.alt_phone) parsedAltPhone = meta.alt_phone;
          cleanNotes = rfq.notes.replace(/<!--CONTACT_META:.*?-->/, '').trim();
        }
      } catch (e) {
        console.warn('Error parsing:', e);
      }
    }

    console.log(`RFQ #${rfq.id.slice(0, 8)} (${rfq.product_name}):`);
    console.log(`  - Buyer: ${rfq.users?.company_name}`);
    console.log(`  - Primary Phone: ${parsedPhone}`);
    console.log(`  - Alternate Phone: ${parsedAltPhone}`);
    console.log(`  - Clean Notes: "${cleanNotes}"`);
  }
}

run();
