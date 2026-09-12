import { createClient } from '@supabase/supabase-js';

const url = 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';
const supabaseAdmin = createClient(url, key);

const TABLE_SCHEMAS = {
  products: new Set([
    'id', 'supplier_id', 'sector_id', 'title', 'description', 'base_price_per_unit',
    'unit_label', 'bulk_minimum_order', 'technical_specifications', 'quality_grade',
    'hsn_code', 'certifications', 'hero_image_url', 'gallery_image_urls',
    'last_price_update', 'is_stale', 'stale_fallback_supplier_id', 'inventory_count',
    'is_active', 'created_at', 'updated_at'
  ]),
  users: new Set([
    'id', 'firebase_uid', 'company_name', 'registered_email', 'corporate_phone',
    'role', 'status', 'gst_number', 'pan_number', 'warehouse_address',
    'city', 'state', 'pincode', 'geo_lat', 'geo_lng', 'company_logo_url',
    'annual_turnover_lakhs', 'year_established', 'whatsapp_number', 'created_at',
    'updated_at', 'display_id', 'onboarding_complete', 'gst_verified',
    'gst_legal_name', 'gst_status', 'categories', 'full_name', 'job_title',
    'website', 'about_us', 'platforms_sold_on', 'total_employees',
    'sourcing_frequency', 'annual_spending', 'phone_number'
  ]),
  rfqs: new Set([
    'id', 'buyer_id', 'product_name', 'quantity', 'unit', 'target_price',
    'destination', 'deadline', 'notes', 'buyer_email', 'status',
    'created_at', 'updated_at'
  ]),
  rfq_quotes: new Set([
    'id', 'rfq_id', 'supplier_id', 'quoted_price', 'notes', 'gst_rate',
    'gst_amount', 'price_before_gst', 'supplier_location', 'delivery_days',
    'platform_fee', 'status', 'created_at', 'updated_at'
  ]),
  trade_orders: new Set([
    'id', 'buyer_id', 'supplier_id', 'product_id', 'quantity', 'unit_label',
    'agreed_unit_price', 'logistics_cost', 'tax_rate_percent', 'tax_amount',
    'subtotal', 'total_contract_value', 'advance_paid_10', 'balance_due_90',
    'current_state', 'qr_payment_reference', 'rerouted_from_supplier_id',
    'reroute_reason', 'buyer_notes', 'supplier_notes', 'estimated_delivery_days',
    'created_at', 'updated_at'
  ]),
  platform_ledger: new Set([
    'id', 'order_id', 'entry_type', 'amount', 'from_entity_id', 'to_entity_id',
    'payment_reference', 'description', 'created_at'
  ]),
  search_logs: new Set([
    'id', 'user_id', 'query', 'sector_slug', 'results_count', 'ip_address',
    'user_agent', 'created_at'
  ]),
  industry_sectors: new Set([
    'id', 'parent_id', 'name', 'slug', 'description', 'icon_identifier',
    'hero_image_url', 'display_order', 'is_active', 'created_at'
  ])
};

function sanitizeAndMapPayload(rawTable, rawData) {
  let targetTable = rawTable;
  if (rawTable === 'warehouses') targetTable = 'products';
  if (rawTable === 'payments') targetTable = 'platform_ledger';

  const schema = TABLE_SCHEMAS[targetTable];
  const sanitized = {};

  if (!rawData || typeof rawData !== 'object') {
    return { targetTable, sanitized };
  }

  // 1. Products
  if (targetTable === 'products') {
    if (rawData.product_name !== undefined && rawData.title === undefined) {
      sanitized.title = String(rawData.product_name).trim();
    } else if (rawData.title !== undefined) {
      sanitized.title = String(rawData.title).trim();
    }
    if (rawData.product_stored !== undefined && !sanitized.title) {
      sanitized.title = String(rawData.product_stored).trim();
    }
    if (rawData.price_per_unit !== undefined && rawData.base_price_per_unit === undefined) {
      const p = String(rawData.price_per_unit).replace(/[^0-9.]/g, '');
      sanitized.base_price_per_unit = parseFloat(p) || 0;
    } else if (rawData.base_price_per_unit !== undefined) {
      sanitized.base_price_per_unit = parseFloat(rawData.base_price_per_unit) || 0;
    }
    if (rawData.unit !== undefined && rawData.unit_label === undefined) {
      sanitized.unit_label = String(rawData.unit).trim();
    }
    if (rawData.moq !== undefined && rawData.bulk_minimum_order === undefined) {
      sanitized.bulk_minimum_order = parseInt(rawData.moq, 10) || 1;
    }
    if (rawData.inventory_count !== undefined) {
      sanitized.inventory_count = parseInt(rawData.inventory_count, 10) || 0;
    }
    if (rawData.stock_available !== undefined && rawData.inventory_count === undefined) {
      const s = String(rawData.stock_available).replace(/[^0-9]/g, '');
      sanitized.inventory_count = parseInt(s, 10) || 0;
    }
    if (rawData.quality_grade !== undefined) {
      sanitized.quality_grade = String(rawData.quality_grade);
    }
    if (rawData.hsn_code !== undefined) {
      sanitized.hsn_code = rawData.hsn_code ? String(rawData.hsn_code).trim() : null;
    }
    if (rawData.status !== undefined) {
      const s = String(rawData.status).toLowerCase();
      sanitized.is_active = (s === 'active' || s === 'true' || s === '1');
    }
    if (rawData.is_active !== undefined) {
      sanitized.is_active = Boolean(rawData.is_active);
    }
    if (rawData.description !== undefined) {
      sanitized.description = String(rawData.description);
    }
  }

  // 2. Users
  else if (targetTable === 'users') {
    if (rawData.contact_person !== undefined && rawData.full_name === undefined) {
      sanitized.full_name = String(rawData.contact_person).trim();
    }
    if (rawData.user_and_business !== undefined && rawData.company_name === undefined) {
      sanitized.company_name = String(rawData.user_and_business).trim();
    }
    if (rawData.email !== undefined && rawData.registered_email === undefined) {
      sanitized.registered_email = String(rawData.email).trim();
    }
    if (rawData.phone_number !== undefined && rawData.corporate_phone === undefined) {
      sanitized.corporate_phone = String(rawData.phone_number).trim();
    }
    if (rawData.turnover !== undefined && rawData.annual_turnover_lakhs === undefined) {
      const t = String(rawData.turnover).replace(/[^0-9.]/g, '');
      if (t) sanitized.annual_turnover_lakhs = parseFloat(t);
    }
  }

  // 3. RFQs
  else if (targetTable === 'rfqs') {
    if (rawData.product !== undefined && rawData.product_name === undefined) {
      sanitized.product_name = String(rawData.product).trim();
    }
    if (rawData.target_price !== undefined) {
      sanitized.target_price = parseFloat(rawData.target_price) || 0;
    }
    if (rawData.quantity !== undefined) {
      sanitized.quantity = parseInt(rawData.quantity, 10) || 1;
    }
    if (rawData.sector || rawData.category || rawData.gst_rate !== undefined || rawData.buyer_gst || rawData.buyer_phone) {
      let currentNotes = rawData.notes || '';
      let meta = {};
      if (currentNotes.includes('<!--CONTACT_META:')) {
        const match = currentNotes.match(/<!--CONTACT_META:(.*?)-->/);
        if (match && match[1]) {
          try { meta = JSON.parse(match[1]); } catch {}
        }
      }
      if (rawData.sector) { meta.sector = rawData.sector; meta.category = rawData.sector; }
      if (rawData.category) { meta.category = rawData.category; meta.sector = rawData.category; }
      if (rawData.gst_rate !== undefined) meta.gst_rate = Number(rawData.gst_rate);
      if (rawData.buyer_gst) meta.gst = rawData.buyer_gst;
      if (rawData.buyer_phone) meta.phone = rawData.buyer_phone;
      if (rawData.buyer_alternate_phone) meta.alt_phone = rawData.buyer_alternate_phone;
      if (rawData.buyer_email) meta.email = rawData.buyer_email;

      currentNotes = currentNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
      sanitized.notes = `<!--CONTACT_META:${JSON.stringify(meta)}-->${currentNotes ? `\n${currentNotes}` : ''}`.trim();
    }
  }

  // Filter final payload strictly against genuine table schema
  const cleanPayload = {};
  for (const [k, v] of Object.entries(sanitized)) {
    if (schema && schema.has(k) && k !== 'id' && k !== 'created_at') {
      cleanPayload[k] = v;
    }
  }

  if (schema) {
    for (const [k, v] of Object.entries(rawData)) {
      if (schema.has(k) && cleanPayload[k] === undefined && k !== 'id' && k !== 'created_at') {
        cleanPayload[k] = v;
      }
    }
  }

  return { targetTable, sanitized: cleanPayload };
}

async function runAllTests() {
  console.log('=== TEST SUITE: ALL ADMIN DATABASE TABLE UPDATES ===\n');

  // 1. Test Products with full virtual payload
  console.log('1. Testing "products" update with contact_person & joined fields...');
  const { data: prod } = await supabaseAdmin.from('products').select('id, title, base_price_per_unit').limit(1).single();
  const prodVirtualData = {
    id: prod.id,
    product_name: prod.title,
    user_and_business: 'Test Enterprise Supplier',
    contact_person: 'Supplier General Manager',
    phone_number: '+91-9876543210',
    email: 'supplier@test.com',
    price_per_unit: '₹' + prod.base_price_per_unit,
    unit: 'kg',
    moq: '500 kg',
    inventory_count: '2500',
    quality_grade: 'Grade A Export',
    location: 'Mumbai, Maharashtra',
    gst_number: '27AAECR1234F1Z5',
    status: 'Active'
  };

  const { targetTable: t1, sanitized: s1 } = sanitizeAndMapPayload('products', prodVirtualData);
  s1.updated_at = new Date().toISOString();
  const { data: pRes, error: pErr } = await supabaseAdmin.from(t1).update(s1).eq('id', prod.id).select().single();
  if (pErr) throw new Error('Products update failed: ' + pErr.message);
  console.log('   ✓ Products updated successfully:', pRes.title, '(Zero schema errors)');

  // 2. Test Warehouses (virtual table mapped to products)
  console.log('\n2. Testing "warehouses" update with contact_person & warehouse_address...');
  const warehouseVirtualData = {
    id: prod.id,
    product_stored: prod.title,
    user_and_business: 'Aaudumbar Agro Warehousing',
    contact_person: 'Warehouse Head',
    phone_number: '+91-8408841998',
    email: 'wh@aaudumbar.com',
    warehouse_address: 'Gat No 120, Chakan, Pune',
    stock_available: '4500 kg',
    gst_number: '27AAECR1234F1Z5'
  };
  const { targetTable: t2, sanitized: s2 } = sanitizeAndMapPayload('warehouses', warehouseVirtualData);
  s2.updated_at = new Date().toISOString();
  const { data: whRes, error: whErr } = await supabaseAdmin.from(t2).update(s2).eq('id', prod.id).select().single();
  if (whErr) throw new Error('Warehouses update failed: ' + whErr.message);
  console.log('   ✓ Warehouses updated successfully as products target:', whRes.title);

  // 3. Test Users with virtual fields
  console.log('\n3. Testing "users" update with contact_person & products_added...');
  const { data: usr } = await supabaseAdmin.from('users').select('id, company_name, registered_email').limit(1).single();
  const userVirtualData = {
    id: usr.id,
    user_and_business: usr.company_name || 'B2B Enterprise User',
    contact_person: 'Head of Procurement',
    email: usr.registered_email,
    phone_number: '+91-9226497450',
    products_added: '5 items',
    search_history: '3 queries',
    raw_products_count: 5,
    raw_searches_count: 3,
    location: 'Pune, Maharashtra',
    gst_number: '27AAECR1234F1Z5',
    turnover: '₹50 Lakhs'
  };
  const { targetTable: t3, sanitized: s3 } = sanitizeAndMapPayload('users', userVirtualData);
  s3.updated_at = new Date().toISOString();
  const { data: uRes, error: uErr } = await supabaseAdmin.from(t3).update(s3).eq('id', usr.id).select().single();
  if (uErr) throw new Error('Users update failed: ' + uErr.message);
  console.log('   ✓ Users updated successfully:', uRes.company_name, uRes.full_name);

  // 4. Test RFQs with sector metadata
  console.log('\n4. Testing "rfqs" update with sector, category, gst_rate...');
  const { data: rfq } = await supabaseAdmin.from('rfqs').select('id, product_name').limit(1).single();
  const rfqVirtualData = {
    id: rfq.id,
    product_name: rfq.product_name,
    sector: 'industrial-machinery',
    category: 'industrial-machinery',
    quantity: '500',
    target_price: '450',
    destination: 'Pune, MH',
    gst_rate: '18',
    buyer_phone: '+91-8408841998',
    status: 'open'
  };
  const { targetTable: t4, sanitized: s4 } = sanitizeAndMapPayload('rfqs', rfqVirtualData);
  s4.updated_at = new Date().toISOString();
  const { data: rfqRes, error: rfqErr } = await supabaseAdmin.from(t4).update(s4).eq('id', rfq.id).select().single();
  if (rfqErr) throw new Error('RFQs update failed: ' + rfqErr.message);
  console.log('   ✓ RFQs updated successfully with packed sector metadata:', rfqRes.product_name);

  console.log('\n========================================');
  console.log('🎉 ALL ADMIN DATABASE SAVES VERIFIED 100% ERROR-FREE!');
  console.log('========================================');
}

runAllTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
