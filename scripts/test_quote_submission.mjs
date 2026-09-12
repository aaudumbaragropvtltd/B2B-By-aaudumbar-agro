import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuoteSubmission() {
  const { data: rfqs } = await supabase.from('rfqs').select('id, product_name').limit(1);
  const { data: user } = await supabase.from('users').select('id, company_name').eq('registered_email', 'raghavendra.sevalikar5730@gmail.com').single();

  console.log('Testing with RFQ:', rfqs[0]?.product_name, 'and Supplier:', user?.company_name);

  const payload = {
    rfq_id: rfqs[0].id,
    supplier_id: user.id,
    price_before_gst: 8000,
    gst_rate: 18,
    gst_amount: 1440,
    quoted_price: 9680,
    platform_fee: 240,
    supplier_location: 'Pune Depot',
    delivery_days: 5,
    notes: 'Test quote verified'
  };

  const { data: q, error: qErr } = await supabase.from('rfq_quotes').insert([payload]).select();
  console.log('Quote Insert Result:', { q, qErr });
}

testQuoteSubmission();
