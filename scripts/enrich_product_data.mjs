import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// High-fidelity IndiaMART style description templates
const generateDescription = (title, sectorName) => {
  return `
We are a leading manufacturer and wholesale supplier of premium quality **${title}**, catering to bulk B2B requirements across India. Sourced from the finest materials and adhering to strict industry standards, our ${title} ensures exceptional durability, performance, and reliability. 

**Key Specifications & Features:**
- **Category:** ${sectorName}
- **Quality Grade:** Premium / Export Quality
- **Applications:** Suitable for industrial, commercial, and heavy-duty applications.
- **Features:** High efficiency, robust construction, rust-resistant, and low maintenance.
- **Packaging:** Safe, transit-ready bulk packaging.

**Why Choose Us?**
As verified suppliers on B2B India, we guarantee 100% genuine products, on-time delivery, and highly competitive wholesale pricing. Our state-of-the-art facility in Chhatrapati Sambhajinagar allows us to fulfill large-scale orders with a rapid turnaround time. 

*Contact us today for a custom quotation or to request a sample.*
  `.trim();
};

const generateSeoKeywords = (title, sectorName) => {
  const baseWords = title.split(' ').map(w => w.toLowerCase());
  return [
    `${title} manufacturer in India`,
    `Wholesale ${title}`,
    `Bulk ${title} supplier`,
    `${sectorName} exporter`,
    `Premium ${title} price`,
    `B2B ${title} online`
  ];
};

async function enrichDatabase() {
  console.log('🚀 Starting Data Enrichment...');

  // 1. Update Aaudumbar Agro's precise location
  console.log('📍 Updating supplier location for Aaudumbar Agro...');
  const { error: userError } = await supabaseAdmin
    .from('users')
    .update({
      warehouse_address: 'Plot No.5, Prerna Nagar, Garkheda Parisar',
      city: 'Chhatrapati Sambhajinagar',
      state: 'Maharashtra',
      pincode: '431009',
      geo_lat: 19.8597,
      geo_lng: 75.3340
    })
    .eq('company_name', 'Aaudumbar Agro');

  if (userError) {
    console.error('❌ Failed to update supplier:', userError);
    return;
  }
  console.log('✅ Supplier location updated precisely.');

  // 2. Fetch all products with their sector
  const { data: products, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, title, industry_sectors(name)');

  if (fetchError || !products) {
    console.error('❌ Failed to fetch products:', fetchError);
    return;
  }

  console.log(`📦 Found ${products.length} products to enrich.`);

  // 3. Update all products
  let updatedCount = 0;
  for (const product of products) {
    const sectorName = product.industry_sectors?.name || 'General';
    const richDescription = generateDescription(product.title, sectorName);
    const seoKeywords = generateSeoKeywords(product.title, sectorName);
    
    // Convert SEO keywords to a JSONB format or append to technical_specifications
    const technical_specifications = {
      seo_keywords: seoKeywords,
      manufacturer: 'Aaudumbar Agro',
      country_of_origin: 'India',
      brand: 'Aaudumbar Premium'
    };

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        description: richDescription,
        technical_specifications: technical_specifications
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`❌ Failed to update product ${product.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }

  console.log(`✅ Successfully enriched ${updatedCount}/${products.length} products with IndiaMART style descriptions and SEO keywords.`);
}

enrichDatabase().catch(console.error);
