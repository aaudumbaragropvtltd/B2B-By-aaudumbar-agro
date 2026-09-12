import { createClient } from '@supabase/supabase-js';
import { slugify, getProductSlug } from '../utils/slugUtils.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test(idOrSlug) {
  console.log(`\nTesting lookup for: "${idOrSlug}"...`);
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const targetSlug = slugify(idOrSlug);

  if (isUUID) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        supplier_id (id, company_name, city, state, warehouse_address, pincode, status, year_established, gst_number, geo_lat, geo_lng),
        sector_id (name, slug)
      `)
      .eq('id', idOrSlug)
      .single();

    if (error) {
      console.log('UUID query error:', error.message);
    } else {
      console.log('UUID query found:', data?.title);
    }
  }

  const { data: allDbProducts, error: dbErr } = await supabase
    .from('products')
    .select(`
      *,
      supplier_id (id, company_name, city, state, warehouse_address, pincode, status, year_established, gst_number, geo_lat, geo_lng),
      sector_id (name, slug)
    `)
    .eq('is_active', true)
    .limit(1000);

  if (dbErr) {
    console.log('Fetch all error:', dbErr.message);
  } else {
    console.log(`Fetched ${allDbProducts?.length} active products.`);
    const match = allDbProducts.find(p => 
      slugify(p.title) === targetSlug ||
      slugify(p.title).includes(targetSlug) ||
      (p.title || '').toLowerCase().includes(idOrSlug.toLowerCase())
    );
    console.log('Fuzzy/slug match result:', match?.title);
  }
}

test('Rubber sheet');
test('87b84857-9f39-427c-b5f7-e8122e2ca981');
test('turmeric');
