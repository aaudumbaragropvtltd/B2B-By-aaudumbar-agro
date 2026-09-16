import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'pjsh8sfp',
  api_key: process.env.CLOUDINARY_API_KEY || '164365618618592',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'H5GwR59AmnRevsNBxOyeyiYwAvk',
  secure: true
});

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const imagesToUpload = [
  {
    productTitle: "1121 Steam Basmati Rice (Export Quality Bulk 50kg Bags)",
    localFile: "basmati_rice_bulk.jpg",
    publicId: "basmati_rice_bulk_export_aaudumbar_agro"
  },
  {
    productTitle: "Organic Guntur Teja Red Chilli Powder (Export Grade Bulk)",
    localFile: "red_chilli_powder_bulk.jpg",
    publicId: "red_chilli_powder_bulk_aaudumbar_agro"
  },
  {
    productTitle: "Chakki Fresh Whole Wheat Flour (Atta 50kg Bulk Bags)",
    localFile: "wheat_flour_bulk.jpg",
    publicId: "wheat_flour_atta_bulk_50kg_aaudumbar_agro"
  },
  {
    productTitle: "Pure Kachi Ghani Cold Pressed Mustard Oil (15L Wholesale Tins)",
    localFile: "mustard_oil_bulk.jpg",
    publicId: "kachi_ghani_mustard_oil_15l_aaudumbar_agro"
  },
  {
    productTitle: "Primary Mill TMT Steel Bars Fe-550D (BIS 1786 Certified)",
    localFile: "tmt_steel_bars.jpg",
    publicId: "tmt_steel_bars_fe550d_wholesale_aaudumbar_agro"
  },
  {
    productTitle: "Nano-Polished Vitrified Floor Tiles 600x600mm (Morbi Factory Direct)",
    localFile: "vitrified_tiles_bulk.jpg",
    publicId: "vitrified_floor_tiles_600x600_aaudumbar_agro"
  },
  {
    productTitle: "Automatic Multi-Head Pouch Packaging Machine (Pneumatic VFFS)",
    localFile: "packaging_machine_bulk.jpg",
    publicId: "automatic_pouch_packaging_machine_aaudumbar_agro"
  },
  {
    productTitle: "550W Mono PERC Bifacial Solar PV Modules (ALMM & BIS Approved)",
    localFile: "solar_panels_bulk.jpg",
    publicId: "mono_perc_bifacial_solar_modules_550w_aaudumbar_agro"
  },
  {
    productTitle: "Paracetamol IP/BP/USP Grade API Powder (WHO-GMP Certified)",
    localFile: "paracetamol_api_bulk.jpg",
    publicId: "paracetamol_api_bulk_powder_aaudumbar_agro"
  },
  {
    productTitle: "Combed 100% Cotton Yarn 30s/40s (Tirupur Hosiery Grade Bulk)",
    localFile: "cotton_yarn_bulk.jpg",
    publicId: "combed_cotton_yarn_30s_40s_aaudumbar_agro"
  }
];

async function main() {
  console.log("=== 1. Starting Cloudinary Uploads ===");
  const uploadedUrls = {};

  const imagesDir = path.resolve(__dirname, '../public/images/products');

  for (const item of imagesToUpload) {
    const filePath = path.join(imagesDir, item.localFile);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }

    console.log(`Uploading ${item.localFile} to Cloudinary...`);
    const uploadRes = await cloudinary.uploader.upload(filePath, {
      folder: 'b2b-bharat/products',
      public_id: item.publicId,
      overwrite: true,
      resource_type: 'image'
    });

    console.log(`✅ Uploaded: ${uploadRes.secure_url}`);
    uploadedUrls[item.productTitle] = uploadRes.secure_url;
  }

  console.log("\n=== 2. Updating Supabase Database with Cloudinary URLs ===");
  for (const [title, url] of Object.entries(uploadedUrls)) {
    const { data, error } = await supabase
      .from('products')
      .update({
        hero_image_url: url,
        gallery_image_urls: [url]
      })
      .eq('title', title);

    if (error) {
      console.error(`Error updating DB for "${title}":`, error);
    } else {
      console.log(`Updated DB product: "${title}" -> ${url}`);
    }
  }

  console.log("\n=== 3. Updating data/products.js with Cloudinary URLs ===");
  const productsJsPath = path.resolve(__dirname, '../data/products.js');
  let productsJsContent = fs.readFileSync(productsJsPath, 'utf8');

  for (const item of imagesToUpload) {
    const oldPath = `/images/products/${item.localFile}`;
    const newUrl = uploadedUrls[item.productTitle];
    if (newUrl && productsJsContent.includes(oldPath)) {
      productsJsContent = productsJsContent.replaceAll(oldPath, newUrl);
      console.log(`Replaced in products.js: ${oldPath} -> ${newUrl}`);
    }
  }
  fs.writeFileSync(productsJsPath, productsJsContent, 'utf8');

  console.log("\n=== 4. Updating scripts/seed_aaudumbar_gap_products.mjs ===");
  const seedScriptPath = path.resolve(__dirname, './seed_aaudumbar_gap_products.mjs');
  let seedScriptContent = fs.readFileSync(seedScriptPath, 'utf8');

  for (const item of imagesToUpload) {
    const oldPath = `/images/products/${item.localFile}`;
    const newUrl = uploadedUrls[item.productTitle];
    if (newUrl && seedScriptContent.includes(oldPath)) {
      seedScriptContent = seedScriptContent.replaceAll(oldPath, newUrl);
      console.log(`Replaced in seed script: ${oldPath} -> ${newUrl}`);
    }
  }
  fs.writeFileSync(seedScriptPath, seedScriptContent, 'utf8');

  console.log("\n🎉 ALL IMAGES POSTED TO CLOUDINARY AND URLS FULLY SYNCHRONIZED!");
}

main().catch(err => {
  console.error("Fatal error during Cloudinary upload:", err);
  process.exit(1);
});
