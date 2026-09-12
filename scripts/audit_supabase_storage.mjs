// Script to audit Supabase Storage buckets and tables with images
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function inspectStorage() {
  console.log('====================================================');
  console.log('   INSPECTING SUPABASE STORAGE & IMAGE TABLES       ');
  console.log('====================================================\n');

  // 1. Check Storage Buckets
  console.log('1. Checking Supabase Storage Buckets...');
  const { data: buckets, error: bucketsErr } = await supabaseAdmin.storage.listBuckets();
  if (bucketsErr) {
    console.error('Error listing buckets:', bucketsErr.message);
  } else {
    console.log(`Found ${buckets.length} bucket(s):`, buckets.map(b => b.name));
    for (const b of buckets) {
      const { data: files, error: filesErr } = await supabaseAdmin.storage.from(b.name).list();
      if (filesErr) {
        console.log(`  Bucket [${b.name}]: Error listing files - ${filesErr.message}`);
      } else {
        console.log(`  Bucket [${b.name}]: ${files.length} file(s) found`);
        files.forEach(f => console.log(`    - ${f.name} (${(f.metadata?.size / 1024 || 0).toFixed(1)} KB)`));
      }
    }
  }

  // 2. Check Products Table for Image URLs
  console.log('\n2. Checking products table...');
  const { data: products, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, title, hero_image_url, gallery_image_urls');

  if (prodErr) {
    console.error('Error querying products:', prodErr.message);
  } else {
    console.log(`Found ${products.length} product(s).`);
    const supabaseStoredProducts = products.filter(p => 
      (p.hero_image_url && p.hero_image_url.includes('supabase.co')) ||
      (Array.isArray(p.gallery_image_urls) && p.gallery_image_urls.some(url => url && url.includes('supabase.co'))) ||
      (p.hero_image_url && p.hero_image_url.startsWith('data:image'))
    );
    console.log(`Products with Supabase or Base64 images: ${supabaseStoredProducts.length}`);
    supabaseStoredProducts.forEach(p => console.log(`  - [${p.id}] ${p.title}: ${p.hero_image_url?.slice(0, 80)}...`));
  }

  // 3. Check Users Table for Logo URLs
  console.log('\n3. Checking users table...');
  const { data: users, error: userErr } = await supabaseAdmin
    .from('users')
    .select('id, company_name, company_logo_url');

  if (userErr) {
    console.error('Error querying users:', userErr.message);
  } else {
    console.log(`Found ${users.length} user(s).`);
    const supabaseUsers = users.filter(u => 
      (u.company_logo_url && u.company_logo_url.includes('supabase.co')) ||
      (u.company_logo_url && u.company_logo_url.startsWith('data:image'))
    );
    console.log(`Users with Supabase or Base64 logos: ${supabaseUsers.length}`);
    supabaseUsers.forEach(u => console.log(`  - [${u.id}] ${u.company_name}: ${u.company_logo_url?.slice(0, 80)}...`));
  }

  // 4. Check Industry Sectors Table
  console.log('\n4. Checking industry_sectors table...');
  const { data: sectors, error: secErr } = await supabaseAdmin
    .from('industry_sectors')
    .select('id, name, hero_image_url');

  if (secErr) {
    console.error('Error querying industry_sectors:', secErr.message);
  } else {
    console.log(`Found ${sectors?.length || 0} sector(s).`);
    const supabaseSectors = (sectors || []).filter(s => 
      s.hero_image_url && (s.hero_image_url.includes('supabase.co') || s.hero_image_url.startsWith('data:image'))
    );
    console.log(`Sectors with Supabase/Base64 hero images: ${supabaseSectors.length}`);
  }
}

inspectStorage();
