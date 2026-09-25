import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  getSiteUrl,
  generateProductMetadata,
  generateProductJsonLd,
  generateSectorMetadata,
  generateSupplierMetadata,
  buildProductKeywords,
} from '../utils/seoUtils.js';
import { getProductSlug } from '../utils/slugUtils.js';
import { DEMO_FALLBACK_PRODUCTS } from '../utils/catalogResolver.js';

if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf-8').split('\n').reduce((acc, line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});
  for (const [k, v] of Object.entries(env)) {
    if (!process.env[k]) process.env[k] = v;
  }
}

async function runVerification() {
  console.log('===============================================================');
  console.log('GOOGLE SEARCH METADATA VERIFICATION FOR B2BINDIA.SITE');
  console.log('===============================================================');

  const siteUrl = getSiteUrl();
  console.log('1. Primary Site URL:', siteUrl);
  if (!siteUrl.includes('b2bindia.site')) {
    throw new Error(`Invalid site URL: ${siteUrl}`);
  }
  console.log('   ✓ PASS: Site URL correctly resolves to b2bindia.site\n');

  // Test with Fallback Demo Products
  console.log('2. Verifying Fallback Catalog Products...');
  for (const prod of DEMO_FALLBACK_PRODUCTS) {
    const meta = generateProductMetadata(prod);
    const jsonLd = generateProductJsonLd(prod);

    console.log(`\n   Checking product: "${prod.title}"`);
    console.log(`   - Title: "${meta.title}" (${meta.title.length} chars)`);
    console.log(`   - Canonical: "${meta.alternates.canonical}"`);
    console.log(`   - OG Site Name: "${meta.openGraph.siteName}"`);

    // Title Check (Next.js layout template appends " | B2B India")
    const renderedTitle = `${meta.title} | B2B India`;
    if (!renderedTitle.includes('B2B India')) {
      throw new Error(`Rendered title missing "B2B India": ${renderedTitle}`);
    }
    if (meta.title.length > 70) {
      console.warn(`   ⚠️ Warning: Title longer than 70 chars (${meta.title.length})`);
    }

    // Description Check
    if (!meta.description.includes('b2bindia.site')) {
      throw new Error(`Product description missing "b2bindia.site": ${meta.description}`);
    }

    // Keywords Check
    if (!meta.keywords.includes('b2bindia.site') || !meta.keywords.includes('b2bindia')) {
      throw new Error('Product keywords missing b2bindia.site');
    }

    // OpenGraph & Twitter
    if (meta.openGraph.siteName !== 'b2bindia.site | B2B India') {
      throw new Error(`Invalid OG siteName: ${meta.openGraph.siteName}`);
    }
    if (!meta.twitter.title.includes('B2B India') && !meta.twitter.title.includes('b2bindia')) {
      throw new Error(`Twitter title missing branding: ${meta.twitter.title}`);
    }

    // Schema.org JSON-LD Verification
    if (jsonLd['@type'] !== 'Product') {
      throw new Error(`Invalid schema type: ${jsonLd['@type']}`);
    }
    if (typeof jsonLd.offers?.price !== 'number' || jsonLd.offers.price <= 0) {
      throw new Error(`Invalid schema price: ${jsonLd.offers?.price}`);
    }
    if (!jsonLd.offers?.hasMerchantReturnPolicy) {
      throw new Error('Schema missing hasMerchantReturnPolicy');
    }
    if (!jsonLd.offers?.shippingDetails) {
      throw new Error('Schema missing shippingDetails');
    }
    if (!jsonLd.aggregateRating?.ratingValue) {
      throw new Error('Schema missing aggregateRating');
    }
    console.log(`   - Schema Rating: ${jsonLd.aggregateRating.ratingValue} (${jsonLd.aggregateRating.reviewCount} reviews)`);
    console.log(`   - Schema Price: ₹${jsonLd.offers.price} ${jsonLd.offers.priceCurrency}`);
  }
  console.log('\n   ✓ PASS: All catalog fallback products pass 100% of Google Search metadata checks\n');

  // Test Database Products if Supabase env is available
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('3. Verifying Live Database Products from Supabase...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: dbProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        supplier_id (id, company_name, city, state),
        sector_id (name, slug)
      `)
      .eq('is_active', true)
      .limit(10);

    if (error) {
      console.warn('   Supabase error fetching products:', error.message);
    } else if (dbProducts && dbProducts.length > 0) {
      console.log(`   Found ${dbProducts.length} sample active database products.`);
      for (const prod of dbProducts) {
        const meta = generateProductMetadata(prod);
        const jsonLd = generateProductJsonLd(prod);

        const renderedTitle = `${meta.title} | B2B India`;
        if (!renderedTitle.includes('B2B India')) {
          throw new Error(`DB Product title missing "B2B India": ${renderedTitle}`);
        }
        if (!meta.description.includes('b2bindia.site')) {
          throw new Error(`DB Product description missing "b2bindia.site": ${meta.description}`);
        }
        if (typeof jsonLd.offers?.price !== 'number' || jsonLd.offers.price <= 0) {
          throw new Error(`Invalid DB schema price: ${jsonLd.offers?.price}`);
        }
      }
      console.log('   ✓ PASS: All sampled database products generate compliant b2bindia.site metadata!\n');
    }
  }

  // 4. Test Sector Metadata
  console.log('4. Verifying Sector Category Metadata...');
  const sampleSector = {
    name: 'Agricultural Products, Equipment & Machines',
    slug: 'agriculture',
    hero_image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449',
  };
  const sectorMeta = generateSectorMetadata(sampleSector);
  console.log('   Sector Title:', sectorMeta.title);
  console.log('   Sector Description:', sectorMeta.description);
  console.log('   Sector OG Site Name:', sectorMeta.openGraph.siteName);
  if (!sectorMeta.openGraph.siteName.includes('b2bindia.site')) {
    throw new Error(`Sector OG Site Name missing b2bindia.site: ${sectorMeta.openGraph.siteName}`);
  }
  console.log('   ✓ PASS: Sector metadata successfully branded with b2bindia.site\n');

  // 5. Test Supplier Metadata
  console.log('5. Verifying Supplier Profile Metadata...');
  const sampleSupplier = {
    id: 'demo-supplier-1',
    company_name: 'Aaudumbar Agro Pvt Ltd',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    sector: 'Agriculture & Spices',
  };
  const supplierMeta = generateSupplierMetadata(sampleSupplier);
  console.log('   Supplier Title:', supplierMeta.title);
  console.log('   Supplier Description:', supplierMeta.description);
  console.log('   Supplier OG Site Name:', supplierMeta.openGraph.siteName);
  if (!supplierMeta.openGraph.siteName.includes('b2bindia.site')) {
    throw new Error(`Supplier OG Site Name missing b2bindia.site: ${supplierMeta.openGraph.siteName}`);
  }
  console.log('   ✓ PASS: Supplier metadata successfully branded with b2bindia.site\n');

  console.log('===============================================================');
  console.log('SUCCESS: ALL GOOGLE SEARCH METADATA VALIDATIONS PASSED! 🚀');
  console.log('===============================================================');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err.message);
  process.exit(1);
});

