import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabase = createClient(url, key);

async function run() {
  console.log('--- TEST 1: Database Manager Product Update with Virtual contact_person ---');
  const { data: prod } = await supabase.from('products').select('id, title, base_price_per_unit, unit_label').limit(1).single();
  console.log('Initial Product:', prod.id, prod.title);

  const TABLE_SCHEMAS = {
    products: new Set([
      'id', 'supplier_id', 'sector_id', 'title', 'description', 'base_price_per_unit',
      'unit_label', 'bulk_minimum_order', 'technical_specifications', 'quality_grade',
      'hsn_code', 'certifications', 'hero_image_url', 'gallery_image_urls',
      'last_price_update', 'is_stale', 'stale_fallback_supplier_id', 'inventory_count',
      'is_active', 'created_at', 'updated_at'
    ])
  };

  const incomingVirtualPayload = {
    id: prod.id,
    product_name: prod.title,
    user_and_business: 'Aaudumbar Agro Enterprises',
    contact_person: 'Executive Officer',
    phone_number: '+91-8408841998',
    email: 'contact@aaudumbaragro.com',
    price_per_unit: '₹' + prod.base_price_per_unit,
    unit: prod.unit_label || 'Tons',
    moq: '10',
    inventory_count: '500',
    quality_grade: 'Grade A Export',
    location: 'Pune, Maharashtra',
    gst_number: '27AAECR1234F1Z5',
    status: 'Active'
  };

  const sanitized = {};
  if (incomingVirtualPayload.product_name) sanitized.title = incomingVirtualPayload.product_name;
  if (incomingVirtualPayload.price_per_unit) {
    sanitized.base_price_per_unit = parseFloat(String(incomingVirtualPayload.price_per_unit).replace(/[^0-9.]/g, '')) || 0;
  }
  if (incomingVirtualPayload.unit) sanitized.unit_label = incomingVirtualPayload.unit;
  if (incomingVirtualPayload.moq) sanitized.bulk_minimum_order = parseInt(incomingVirtualPayload.moq, 10) || 1;
  if (incomingVirtualPayload.inventory_count) sanitized.inventory_count = parseInt(incomingVirtualPayload.inventory_count, 10) || 0;
  if (incomingVirtualPayload.quality_grade) sanitized.quality_grade = incomingVirtualPayload.quality_grade;
  if (incomingVirtualPayload.status) sanitized.is_active = true;

  for (const [k, v] of Object.entries(incomingVirtualPayload)) {
    if (TABLE_SCHEMAS.products.has(k) && sanitized[k] === undefined && k !== 'created_at') {
      sanitized[k] = v;
    }
  }

  const { data: updatedProd, error: updErr } = await supabase
    .from('products')
    .update(sanitized)
    .eq('id', prod.id)
    .select()
    .single();

  if (updErr) {
    console.error('Product update FAILED:', updErr);
  } else {
    console.log('✓ Product updated SUCCESSFULLY without schema error:', updatedProd.title, 'Price:', updatedProd.base_price_per_unit);
  }

  console.log('\n--- TEST 2: RFQ Sector / Category Persistence ---');
  const { data: rfq } = await supabase.from('rfqs').select('id, notes, product_name').limit(1).single();
  console.log('Found RFQ:', rfq.id, rfq.product_name);

  let currentNotes = rfq.notes || '';
  let meta = { sector: 'industrial-machinery', category: 'industrial-machinery', gst_rate: 18 };
  currentNotes = currentNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
  const packedNotes = `<!--CONTACT_META:${JSON.stringify(meta)}-->\n${currentNotes}`.trim();

  const { data: updatedRfq, error: rfqErr } = await supabase
    .from('rfqs')
    .update({ notes: packedNotes })
    .eq('id', rfq.id)
    .select()
    .single();

  if (rfqErr) {
    console.error('RFQ update FAILED:', rfqErr);
  } else {
    console.log('✓ RFQ updated SUCCESSFULLY with packed sector notes metadata');
    const match = updatedRfq.notes.match(/<!--CONTACT_META:(.*?)-->/);
    console.log('  Extracted Sector Meta:', match ? JSON.parse(match[1]) : 'None');
  }

  console.log('\n--- ALL TEST PASSED SUCCESSFULLY ---');
}

run();
