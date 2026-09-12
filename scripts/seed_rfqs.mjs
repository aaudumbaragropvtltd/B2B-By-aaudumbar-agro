import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRFQs() {
  console.log('Fetching users to link RFQs...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, company_name, registered_email')
    .limit(10);

  if (userError || !users || users.length === 0) {
    console.error('No users found in database:', userError);
    return;
  }

  const buyerId = users[0].id;
  console.log(`Using user ID ${buyerId} (${users[0].company_name}) for seed RFQs.`);

  const sampleRFQs = [
    {
      buyer_id: buyerId,
      product_name: 'High-Tensile Hex Head Bolts & Fasteners (M12-M24)',
      quantity: 25000,
      unit: 'Pieces',
      target_price: 45.00,
      destination: 'Chakan Industrial Area, Pune',
      deadline: '2026-09-15',
      notes: 'Grade 8.8 and 10.9 with zinc phosphating. ISO/TS certification required.',
      status: 'open',
      buyer_email: users[0].registered_email
    },
    {
      buyer_id: buyerId,
      product_name: 'Basmati Rice 1121 Steam (Export Quality)',
      quantity: 500,
      unit: 'Tons',
      target_price: 82000.00,
      destination: 'Mundra Port, Gujarat',
      deadline: '2026-09-20',
      notes: 'Packaging in 50kg PP bags with custom export stenciling. Third-party inspection.',
      status: 'open',
      buyer_email: users[0].registered_email
    },
    {
      buyer_id: buyerId,
      product_name: 'HDPE Granules / Polyethylene Polymer (Blow Moulding)',
      quantity: 50,
      unit: 'Tons',
      target_price: 94000.00,
      destination: 'Bhiwandi Logistics Hub, Mumbai',
      deadline: '2026-09-10',
      notes: 'Prime virgin polymer for industrial container manufacturing.',
      status: 'open',
      buyer_email: users[0].registered_email
    },
    {
      buyer_id: buyerId,
      product_name: 'Solar Grid-Tie Inverters (50kW Three Phase)',
      quantity: 120,
      unit: 'Units',
      target_price: 185000.00,
      destination: 'Jaipur Solar Park Site',
      deadline: '2026-09-25',
      notes: 'BIS approved with minimum 5-year on-site manufacturer replacement warranty.',
      status: 'open',
      buyer_email: users[0].registered_email
    },
    {
      buyer_id: buyerId,
      product_name: 'Active Pharma Intermediate (Paracetamol IP/BP)',
      quantity: 10,
      unit: 'Tons',
      target_price: 480000.00,
      destination: 'Baddi Industrial Zone, Himachal Pradesh',
      deadline: '2026-09-12',
      notes: 'GMP certified batches with complete Certificate of Analysis (COA).',
      status: 'open',
      buyer_email: users[0].registered_email
    },
    {
      buyer_id: buyerId,
      product_name: 'Combed Cotton Yarn (Count 30s & 40s)',
      quantity: 40000,
      unit: 'Kg',
      target_price: 285.00,
      destination: 'Tirupur Textile Processing Hub',
      deadline: '2026-09-18',
      notes: 'Evenness testing reports required. Ready stock preferred.',
      status: 'open',
      buyer_email: users[0].registered_email
    }
  ];

  console.log('Inserting seed RFQs into database...');
  for (const rfq of sampleRFQs) {
    const { data, error } = await supabase
      .from('rfqs')
      .insert([rfq])
      .select()
      .single();

    if (error) {
      console.warn(`Direct insert failed for ${rfq.product_name}:`, error.message);
      // Fallback without buyer_email
      const { buyer_email, ...basicRfq } = rfq;
      const { data: d2, error: e2 } = await supabase.from('rfqs').insert([basicRfq]).select().single();
      if (e2) {
        console.error(`Fallback insert failed:`, e2.message);
      } else {
        console.log(`Inserted (basic): ${d2.product_name}`);
      }
    } else {
      console.log(`Inserted: ${data.product_name}`);
    }
  }

  console.log('Seed RFQs complete!');
}

seedRFQs();
