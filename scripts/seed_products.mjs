import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// We need to import the data. Since we are in Node and the file is a standard ES module (but might have aliases), we'll parse it or import it.
// Actually, data/products.js uses export const... let's import it directly.
import { SUPPLIER, CATEGORIES, PRODUCTS } from '../data/products.js';

async function seed() {
  console.log("Starting DB seeding...");
  
  // 1. Setup Supplier
  console.log("Checking/creating supplier: Aaudumbar Agro");
  let supplierId = null;
  const { data: existingUser, error: userFetchError } = await supabase
    .from('users')
    .select('id')
    .eq('company_name', 'Aaudumbar Agro')
    .single();

  if (existingUser) {
    supplierId = existingUser.id;
    console.log("Found existing supplier ID:", supplierId);
  } else {
    // Need a dummy firebase_uid and email to satisfy constraints
    const dummyUid = 'firebase_uid_aaudumbar_' + Date.now();
    const dummyEmail = `contact_${Date.now()}@aaudumbaragro.com`;
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        firebase_uid: dummyUid,
        company_name: 'Aaudumbar Agro',
        registered_email: dummyEmail,
        corporate_phone: '+91-9876543210',
        role: 'supplier',
        status: 'active',
        gst_number: '27AAACA1234A1Z' + Math.floor(Math.random() * 9),
        warehouse_address: 'Main MIDC',
        city: 'Chhatrapati Sambhajinagar',
        state: 'Maharashtra',
        pincode: '431001',
        geo_lat: 19.8762,
        geo_lng: 75.3433,
        onboarding_complete: true,
        categories: ['Agriculture', 'Food'],
      })
      .select('id')
      .single();
      
    if (createError) {
      console.error("Error creating supplier:", createError);
      process.exit(1);
    }
    supplierId = newUser.id;
    console.log("Created new supplier with ID:", supplierId);
  }

  // 2. Setup Categories
  console.log("Syncing 38 categories...");
  const categoryIdMap = {}; // slug -> uuid
  for (const cat of CATEGORIES) {
    const slug = cat.id; // e.g. 'building-construction'
    
    // Check if exists
    const { data: existingCat } = await supabase
      .from('industry_sectors')
      .select('id')
      .eq('slug', slug)
      .single();
      
    if (existingCat) {
      categoryIdMap[slug] = existingCat.id;
    } else {
      const { data: newCat, error: catError } = await supabase
        .from('industry_sectors')
        .insert({
          name: cat.name,
          slug: slug,
          icon_identifier: cat.icon,
          is_active: true
        })
        .select('id')
        .single();
        
      if (catError) {
        console.error("Error creating category:", slug, catError);
      } else {
        categoryIdMap[slug] = newCat.id;
      }
    }
  }
  console.log("Categories synced.");

  // 3. Clear existing products from this supplier to avoid duplicates
  console.log("Clearing old products for supplier to avoid duplicates...");
  await supabase.from('products').delete().eq('supplier_id', supplierId);

  // 4. Insert Products
  console.log(`Inserting ${PRODUCTS.length} products...`);
  const productsToInsert = PRODUCTS.map(p => {
    const sectorId = categoryIdMap[p.category];
    if (!sectorId) {
      console.warn(`Warning: No sector ID found for category ${p.category}`);
    }
    
    return {
      supplier_id: supplierId,
      sector_id: sectorId,
      title: p.name,
      description: `High quality ${p.name} supplied by Aaudumbar Agro. Verified product for B2B wholesale.`,
      base_price_per_unit: p.price,
      unit_label: p.unit,
      bulk_minimum_order: parseInt(p.moq) || 1,
      hero_image_url: p.image,
      quality_grade: p.badge || 'Standard',
      is_active: true,
      inventory_count: 500
    };
  }).filter(p => p.sector_id); // Only insert if sector mapped successfully

  // Insert in batches of 50
  for (let i = 0; i < productsToInsert.length; i += 50) {
    const batch = productsToInsert.slice(i, i + 50);
    const { error: insertError } = await supabase.from('products').insert(batch);
    if (insertError) {
      console.error("Error inserting products batch:", insertError);
    } else {
      console.log(`Inserted batch ${i} to ${i + batch.length}`);
    }
  }

  console.log("Done! Products have been seeded to Supabase.");
}

seed().catch(console.error);
