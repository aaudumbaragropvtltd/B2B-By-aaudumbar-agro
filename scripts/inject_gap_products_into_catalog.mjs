import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GAP_PRODUCTS } from './seed_aaudumbar_gap_products.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.resolve(__dirname, '../data/products.js');
let fileContent = fs.readFileSync(productsFilePath, 'utf8');

const AAUDUMBAR_SUPPLIER_OBJ = {
  id: "114f0006-bdd3-430d-95ba-0f9df91aa7eb",
  company_name: "Aaudumbar Agro",
  city: "Chhatrapati Sambhajinagar",
  state: "Maharashtra",
  geo_lat: 19.8597,
  geo_lng: 75.334
};

const newProductsArray = GAP_PRODUCTS.map((p, idx) => ({
  id: `agro-gap-${idx + 1}`,
  name: p.title,
  category: p.sector_slug,
  price: p.base_price_per_unit,
  unit: p.unit_label,
  moq: `${p.bulk_minimum_order} ${p.unit_label}`,
  image: p.hero_image_url,
  badge: p.quality_grade,
  supplier: AAUDUMBAR_SUPPLIER_OBJ,
  description: p.description,
  technical_specifications: p.technical_specifications
}));

// Check if agro-gap-1 is already in data/products.js
if (fileContent.includes('agro-gap-1')) {
  console.log("agro-gap-1 already exists in data/products.js");
  process.exit(0);
}

const targetString = 'export const PRODUCTS = [\n';
if (!fileContent.includes(targetString)) {
  console.error("Could not find 'export const PRODUCTS = [' in data/products.js");
  process.exit(1);
}

const formattedNewProducts = newProductsArray.map(p => {
  return `  ${JSON.stringify(p, null, 2).replace(/\n/g, '\n  ')},`;
}).join('\n');

const updatedContent = fileContent.replace(targetString, `${targetString}${formattedNewProducts}\n`);

fs.writeFileSync(productsFilePath, updatedContent, 'utf8');
console.log(`Successfully injected ${newProductsArray.length} new gap products into data/products.js!`);
