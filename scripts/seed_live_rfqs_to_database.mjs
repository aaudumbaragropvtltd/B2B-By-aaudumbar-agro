import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const SHOWCASE_RFQS = [
  {
    product_name: 'HDPE Granules / Polyethylene Raw Material',
    quantity: 50,
    unit: 'Tons',
    target_price: 94000,
    destination: 'Bhiwandi Logistics Park, Mumbai',
    deadline: '2026-09-05',
    status: 'open',
    notes: 'Blow moulding grade for industrial containers. Virgin prime polymer only.',
  },
  {
    product_name: 'Active Pharmaceutical Intermediate (Paracetamol IP/BP)',
    quantity: 10,
    unit: 'Tons',
    target_price: 480000,
    destination: 'Baddi Industrial Zone, HP',
    deadline: '2026-09-08',
    status: 'open',
    notes: 'GMP certified batches with complete Certificate of Analysis (COA).',
  }
];

async function seed() {
  const { data: users } = await supabaseAdmin.from('users').select('id').limit(1);
  const buyerId = users[0].id;

  for (const rfq of SHOWCASE_RFQS) {
    const { data: existing } = await supabaseAdmin
      .from('rfqs')
      .select('id, product_name')
      .eq('product_name', rfq.product_name)
      .maybeSingle();

    if (existing) {
      console.log(`[EXISTS] ${rfq.product_name} (ID: ${existing.id})`);
    } else {
      const { data: created, error: insertErr } = await supabaseAdmin
        .from('rfqs')
        .insert([{
          buyer_id: buyerId,
          product_name: rfq.product_name,
          quantity: rfq.quantity,
          unit: rfq.unit,
          target_price: rfq.target_price,
          destination: rfq.destination,
          deadline: rfq.deadline,
          status: 'open',
          notes: rfq.notes
        }])
        .select('id, product_name')
        .single();

      if (insertErr) {
        console.error(`Failed to insert RFQ ${rfq.product_name}:`, insertErr.message);
      } else {
        console.log(`[CREATED] ${rfq.product_name} (UUID: ${created.id})`);
      }
    }
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
