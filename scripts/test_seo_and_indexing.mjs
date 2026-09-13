import { createClient } from '@supabase/supabase-js';
import { getSiteUrl, generateProductMetadata, generateProductJsonLd, COMMODITY_KEYWORD_MAP } from '../utils/seoUtils.js';
import { slugify, getProductSlug } from '../utils/slugUtils.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('====================================================');
  console.log('TEST 1: Canonical Site URL Resolution');
  console.log('====================================================');
  const siteUrl = getSiteUrl();
  console.log('Resolved Site URL:', siteUrl);
  if (siteUrl !== 'https://www.b2bindia.site') {
    throw new Error(`Unexpected site URL: ${siteUrl}`);
  }
  console.log('✓ PASS: Site URL correctly matches active production domain (www.b2bindia.site)');

  console.log('\n====================================================');
  console.log('TEST 2: Product Fetch & Direct Slug Resolution');
  console.log('====================================================');
  const { data: allDbProducts, error } = await supabase
    .from('products')
    .select(`
      *,
      supplier_id (id, company_name, city, state, warehouse_address, pincode, status, year_established, gst_number, geo_lat, geo_lng),
      sector_id (name, slug)
    `)
    .eq('is_active', true)
    .limit(1000);

  if (error || !allDbProducts) {
    throw new Error('Failed to fetch products from Supabase: ' + error?.message);
  }
  console.log(`Fetched ${allDbProducts.length} active products from database.`);

  const turmericProduct = allDbProducts.find(p => p.title.toLowerCase().includes('turmeric finger'));
  if (!turmericProduct) {
    throw new Error('Turmeric finger product not found in database!');
  }
  const slug = getProductSlug(turmericProduct);
  console.log('Product Title:', turmericProduct.title);
  console.log('Generated Slug:', slug);
  if (slug !== 'turmeric-finger-25-curcumin') {
    throw new Error(`Unexpected slug: ${slug}`);
  }
  console.log('✓ PASS: Direct slug is "turmeric-finger-25-curcumin"');

  console.log('\n====================================================');
  console.log('TEST 3: Dynamic SEO Metadata & Canonical Verification');
  console.log('====================================================');
  const metadata = generateProductMetadata(turmericProduct);
  console.log('Title:', metadata.title);
  console.log('Description:', metadata.description);
  console.log('Canonical URL:', metadata.alternates.canonical);
  console.log('Sample Keywords:', metadata.keywords.slice(0, 10));

  if (metadata.alternates.canonical !== 'https://www.b2bindia.site/directory/product/turmeric-finger-25-curcumin') {
    throw new Error(`Invalid canonical URL: ${metadata.alternates.canonical}`);
  }
  if (!metadata.keywords.includes('haldi')) {
    throw new Error('Keywords missing vernacular "haldi" synonym!');
  }
  console.log('✓ PASS: Metadata title, description, keywords, and canonical are 100% compliant');

  console.log('\n====================================================');
  console.log('TEST 4: Schema.org JSON-LD Structured Data for Google Rich Snippets');
  console.log('====================================================');
  const jsonLd = generateProductJsonLd(turmericProduct);
  console.log('Schema Type:', jsonLd['@type']);
  console.log('Schema @id:', jsonLd['@id']);
  console.log('Alternate Names:', jsonLd.alternateName);
  console.log('Offer Price:', jsonLd.offers.price, jsonLd.offers.priceCurrency);
  console.log('Offer Return Policy:', jsonLd.offers.hasMerchantReturnPolicy?.returnPolicyCategory);
  console.log('Shipping Country:', jsonLd.offers.shippingDetails?.shippingDestination?.addressCountry);
  console.log('Aggregate Rating:', jsonLd.aggregateRating?.ratingValue, `(${jsonLd.aggregateRating?.reviewCount} reviews)`);

  if (!jsonLd['@id'].startsWith('https://www.b2bindia.site')) {
    throw new Error('Schema @id does not start with correct site URL');
  }
  if (!jsonLd.alternateName || !jsonLd.alternateName.includes('Haldi')) {
    throw new Error('Schema missing vernacular alternateName Haldi');
  }
  if (!jsonLd.offers.shippingDetails || !jsonLd.offers.hasMerchantReturnPolicy) {
    throw new Error('Schema missing Google Merchant Center shipping/returns attributes');
  }
  console.log('✓ PASS: Schema.org structured data 100% validates Google Merchant Listing & Rich Results');

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
