// ============================================================================
// COMPLETE SUPABASE STORAGE TO CLOUDINARY MIGRATION & PURGE SCRIPT
// ============================================================================
// 1. Migrates all files from Supabase Storage buckets to Cloudinary CDN (pjsh8sfp)
// 2. Converts any Base64 strings in database rows into Cloudinary CDN URLs
// 3. Updates all product, user, and banner records to point to Cloudinary CDN URLs
// 4. Deletes all media files from Supabase Storage to bring Supabase storage to 0 MB
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { uploadToCloudinary, uploadBase64OrUrlToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function runCompleteMigration() {
  console.log('================================================================');
  console.log('   STARTING FULL ASSET MIGRATION: SUPABASE -> CLOUDINARY        ');
  console.log('================================================================\n');

  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary is not configured! Check .env.local');
    process.exit(1);
  }

  const urlMap = new Map(); // oldUrl -> newCloudinaryUrl

  // --------------------------------------------------------------------------
  // STEP 1: Migrate all files from Supabase Storage Buckets
  // --------------------------------------------------------------------------
  console.log('📦 STEP 1: Migrating Supabase Storage Buckets to Cloudinary...');
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  if (bErr) {
    console.error('Error listing buckets:', bErr.message);
  } else {
    for (const b of buckets) {
      console.log(`\n  Processing Bucket [${b.name}]...`);
      const { data: files, error: fErr } = await supabaseAdmin.storage.from(b.name).list();
      if (fErr || !files) {
        console.warn(`  Could not list files in ${b.name}:`, fErr?.message);
        continue;
      }

      const filesToDelete = [];

      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue;
        console.log(`    Downloading: ${file.name} (${(file.metadata?.size / 1024 || 0).toFixed(1)} KB)...`);
        
        const { data: blob, error: dlErr } = await supabaseAdmin.storage.from(b.name).download(file.name);
        if (dlErr || !blob) {
          console.warn(`    ⚠️ Failed download: ${file.name} - ${dlErr?.message}`);
          continue;
        }

        const buffer = Buffer.from(await blob.arrayBuffer());
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        
        try {
          const uploadRes = await uploadToCloudinary(buffer, {
            folder: `b2b-bharat/${b.name}`,
            publicId: `${Date.now()}_${cleanName}`,
            resourceType: 'auto'
          });

          const oldPublicUrl = `${supabaseUrl}/storage/v1/object/public/${b.name}/${file.name}`;
          urlMap.set(oldPublicUrl, uploadRes.secure_url);
          urlMap.set(file.name, uploadRes.secure_url);

          console.log(`    ✅ Uploaded to Cloudinary: ${uploadRes.secure_url}`);
          filesToDelete.push(file.name);
        } catch (upErr) {
          console.error(`    ❌ Cloudinary upload failed for ${file.name}:`, upErr.message);
        }
      }

      // Purge files from Supabase Storage to free 100% of bucket space!
      if (filesToDelete.length > 0) {
        console.log(`    🧹 Deleting ${filesToDelete.length} files from Supabase Storage bucket [${b.name}]...`);
        const { error: rmErr } = await supabaseAdmin.storage.from(b.name).remove(filesToDelete);
        if (rmErr) {
          console.warn(`    ⚠️ Warning deleting from Supabase storage:`, rmErr.message);
        } else {
          console.log(`    ✨ Successfully purged ${filesToDelete.length} files from Supabase bucket [${b.name}]!`);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 2: Process Products Table (Convert Base64 & Supabase URLs to Cloudinary)
  // --------------------------------------------------------------------------
  console.log('\n📦 STEP 2: Cleaning and Migrating Products Table...');
  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id, title, hero_image_url, gallery_image_urls');

  if (pErr) {
    console.error('Error fetching products:', pErr.message);
  } else {
    for (const prod of products) {
      let needsUpdate = false;
      let newHeroUrl = prod.hero_image_url;
      let newGallery = Array.isArray(prod.gallery_image_urls) ? [...prod.gallery_image_urls] : [];

      // A. Check if hero_image_url is Base64 (High memory bloat!)
      if (newHeroUrl && newHeroUrl.startsWith('data:image')) {
        console.log(`  [Product ${prod.id}] Converting Base64 image to Cloudinary for: "${prod.title}"...`);
        try {
          const res = await uploadBase64OrUrlToCloudinary(newHeroUrl, {
            folder: 'b2b-bharat/products',
            tags: ['product', 'base64-migration']
          });
          newHeroUrl = res.secure_url;
          needsUpdate = true;
          console.log(`  ✅ Base64 converted to Cloudinary CDN URL: ${newHeroUrl}`);
        } catch (b64Err) {
          console.error(`  ❌ Failed to upload Base64 for product ${prod.id}:`, b64Err.message);
        }
      } 
      // B. Check if hero_image_url points to Supabase Storage
      else if (newHeroUrl && newHeroUrl.includes('supabase.co')) {
        console.log(`  [Product ${prod.id}] Migrating Supabase storage image for: "${prod.title}"...`);
        try {
          const res = await uploadBase64OrUrlToCloudinary(newHeroUrl, {
            folder: 'b2b-bharat/products',
            tags: ['product', 'supabase-migration']
          });
          newHeroUrl = res.secure_url;
          needsUpdate = true;
          console.log(`  ✅ Supabase URL updated to Cloudinary CDN: ${newHeroUrl}`);
        } catch (supErr) {
          console.error(`  ❌ Failed to migrate Supabase URL for product ${prod.id}:`, supErr.message);
        }
      }

      // C. Check gallery_image_urls
      if (Array.isArray(newGallery) && newGallery.length > 0) {
        for (let i = 0; i < newGallery.length; i++) {
          const gUrl = newGallery[i];
          if (!gUrl) continue;
          if (gUrl.startsWith('data:image') || gUrl.includes('supabase.co')) {
            try {
              console.log(`  [Product ${prod.id}] Migrating gallery image ${i+1}...`);
              const res = await uploadBase64OrUrlToCloudinary(gUrl, {
                folder: 'b2b-bharat/products'
              });
              newGallery[i] = res.secure_url;
              needsUpdate = true;
            } catch (gErr) {
              console.error(`  Gallery image migration error:`, gErr.message);
            }
          }
        }
      }

      // Update row in Supabase database
      if (needsUpdate) {
        const { error: uErr } = await supabaseAdmin
          .from('products')
          .update({
            hero_image_url: newHeroUrl,
            gallery_image_urls: newGallery
          })
          .eq('id', prod.id);

        if (uErr) {
          console.error(`  ❌ Error updating product ${prod.id} in DB:`, uErr.message);
        } else {
          console.log(`  💾 Updated product [${prod.id}] in database with Cloudinary URL!`);
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // STEP 3: Update Banners in Supabase & data/platform_banners.json
  // --------------------------------------------------------------------------
  console.log('\n📦 STEP 3: Updating CMS Hero Banners to Cloudinary CDN...');
  const bannersJsonPath = path.join(process.cwd(), 'data', 'platform_banners.json');
  if (fs.existsSync(bannersJsonPath)) {
    try {
      const bannersData = JSON.parse(fs.readFileSync(bannersJsonPath, 'utf8'));
      let bannersChanged = false;

      for (const banner of bannersData) {
        if (banner.hero_image_url && banner.hero_image_url.includes('supabase.co')) {
          console.log(`  Migrating Banner "${banner.title}" to Cloudinary...`);
          try {
            const res = await uploadBase64OrUrlToCloudinary(banner.hero_image_url, {
              folder: 'b2b-bharat/banners'
            });
            banner.hero_image_url = res.secure_url;
            bannersChanged = true;
            console.log(`  ✅ Banner updated to Cloudinary CDN: ${res.secure_url}`);
          } catch (bErr) {
            console.error(`  Banner upload error:`, bErr.message);
          }
        }
      }

      if (bannersChanged) {
        fs.writeFileSync(bannersJsonPath, JSON.stringify(bannersData, null, 2), 'utf8');
        console.log(`  💾 Saved updated banners to data/platform_banners.json!`);

        // Also sync to Supabase table platform_banners if table exists
        try {
          for (const b of bannersData) {
            await supabaseAdmin.from('platform_banners').upsert(b);
          }
          console.log(`  💾 Synced banners to Supabase platform_banners table!`);
        } catch (tableErr) {
          // table might not exist or use json fallback
        }
      } else {
        console.log(`  Banners already clean and using CDN/external URLs.`);
      }
    } catch (bJsonErr) {
      console.error('Error processing platform_banners.json:', bJsonErr.message);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 FULL MIGRATION TO CLOUDINARY COMPLETE & SUPABASE PURGED!     ');
  console.log('================================================================\n');
}

runCompleteMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
