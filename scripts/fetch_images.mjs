import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import google from 'googlethis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importing using dynamic import to avoid cache
const { CATEGORIES, SUPPLIER, PRODUCTS } = await import('../data/products.js?t=' + Date.now());

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log(`Fetching new images for ${PRODUCTS.length} products...`);
  
  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    try {
      // Adding 'india' or 'b2b' helps get more accurate product images for generic names
      const query = `${product.name} product india`;
      console.log(`[${i + 1}/${PRODUCTS.length}] Searching image for: ${product.name}`);
      
      const images = await google.image(query, { safe: false });
      
      // Filter out some known bad domains (like facebook, lookaside, etc)
      const validImages = images.filter(img => 
        !img.url.includes('lookaside') && 
        !img.url.includes('facebook') &&
        !img.url.includes('fbsbx') &&
        img.url.startsWith('http')
      );

      if (validImages.length > 0) {
        product.image = validImages[0].url;
        console.log(`Found image: ${product.image}`);
      } else if (images.length > 0) {
        product.image = images[0].url;
        console.log(`Found fallback image: ${product.image}`);
      }
    } catch (e) {
      console.error(`Failed to fetch image for ${product.name}:`, e.message);
    }
    
    // 500ms delay to avoid rate limiting
    await delay(500);
  }
  
  // Write the file back
  const fileContent = `// ============================================================================
// B2B INDIA — COMPREHENSIVE PRODUCT CATALOG
// ============================================================================
// Real IndiaMART-style products across 38 categories.
// All products supplied by "Aaudumbar Agro"
// ============================================================================

export const SUPPLIER = ${JSON.stringify(SUPPLIER, null, 2).replace(/"([^"]+)":/g, '$1:')};

// ── Category Definitions ──
export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2).replace(/"([^"]+)":/g, '$1:')};

// ── Product Catalog ──
export const PRODUCTS = ${JSON.stringify(PRODUCTS, null, 2).replace(/"([^"]+)":/g, '$1:')};
`;

  const outPath = path.resolve(__dirname, '../data/products.js');
  fs.writeFileSync(outPath, fileContent, 'utf-8');
  console.log("data/products.js has been successfully updated with accurate images.");
}

run();
