import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_RFQ_UUID_MAP = {
  'rfq-demo-1': 'ab546f64-078e-4e36-833b-107546a13d98',
  'rfq-demo-2': '09ee35ac-0aeb-4e62-ad46-2e16415da572',
  'rfq-demo-3': '50b4c0e6-47a4-4105-a37c-7dc6cc0ad690',
  'rfq-demo-4': 'd93685c6-0e7c-4ee1-bfa3-65a5b70fec04',
  'rfq-demo-5': '138a7069-92c7-478c-a062-b943a2600ed5',
  'rfq-demo-6': 'b261904f-12df-4e1c-9b13-3b642893db7b',
};

function resolveRfqUuid(id) {
  if (DEMO_RFQ_UUID_MAP[id]) return DEMO_RFQ_UUID_MAP[id];
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;
  return '09ee35ac-0aeb-4e62-ad46-2e16415da572';
}

async function test() {
  console.log('--- Testing Quote Submission for rfq-demo-2 ---');
  const resolvedId = resolveRfqUuid('rfq-demo-2');
  console.log(`Resolved rfq-demo-2 ➔ ${resolvedId}`);

  // Fetch RFQ
  const { data: rfq, error: rfqErr } = await supabaseAdmin
    .from('rfqs')
    .select('id, product_name, quantity, target_price')
    .eq('id', resolvedId)
    .single();

  if (rfqErr || !rfq) {
    console.error('RFQ not found:', rfqErr);
    return;
  }
  console.log('Found RFQ:', rfq);

  // Find sample supplier
  const { data: users } = await supabaseAdmin.from('users').select('id, registered_email').limit(1);
  const supplierId = users[0].id;

  // Insert test quote
  const rawPrice = 34;
  const listedPrice = rawPrice * 1.03;
  const quantity = rfq.quantity || 25000;
  const totalListedBase = listedPrice * quantity;
  const gst = totalListedBase * 0.18;
  const finalTotal = Math.round(totalListedBase + gst);

  const { data: quote, error: quoteErr } = await supabaseAdmin
    .from('rfq_quotes')
    .insert([{
      rfq_id: resolvedId,
      supplier_id: supplierId,
      price_before_gst: listedPrice,
      gst_rate: 18,
      gst_amount: gst,
      quoted_price: finalTotal,
      platform_fee: rawPrice * 0.03 * quantity,
      supplier_location: 'Pune Warehouse',
      delivery_days: 7,
      notes: 'Automated test quote for High-Tensile Hex Head Bolts'
    }])
    .select()
    .single();

  if (quoteErr) {
    console.error('❌ Quote insert failed:', quoteErr);
  } else {
    console.log('✅ Quote inserted successfully into database:', {
      quote_id: quote.id,
      rfq_id: quote.rfq_id,
      quoted_price: quote.quoted_price,
      price_before_gst: quote.price_before_gst
    });

    // Clean up test quote
    await supabaseAdmin.from('rfq_quotes').delete().eq('id', quote.id);
    console.log('Cleaned up test quote.');
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
