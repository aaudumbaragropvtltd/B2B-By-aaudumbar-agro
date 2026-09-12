import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { getProductGstRate } from '../utils/gstUtils.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- Synchronizing Legally Accurate GST Rates for All Catalog Products ---');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, hsn_code, technical_specifications');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products.length} products to audit and update for GST accuracy.`);

  let updatedCount = 0;
  for (const product of products) {
    const gstInfo = getProductGstRate(product);
    
    let specs = product.technical_specifications || {};
    if (typeof specs === 'string') {
      try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
    }

    specs.gst_percentage = gstInfo.percentage.toString();
    specs['GST Rate'] = `${gstInfo.percentage}%`;

    const { error: updateErr } = await supabase
      .from('products')
      .update({
        technical_specifications: specs
      })
      .eq('id', product.id);

    if (updateErr) {
      console.error(`Failed to update GST for product ${product.id}:`, updateErr);
    } else {
      updatedCount++;
      console.log(`[GST ${gstInfo.percentage}%] ${product.title} ➔ ${gstInfo.label}`);
    }
  }

  console.log(`✅ Completed GST Audit: ${updatedCount} products updated with category-accurate GST rates.`);

  // Also update data/production_platform_db.json
  const dbPath = path.join(process.cwd(), 'data', 'production_platform_db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const rawDb = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawDb);
      
      if (Array.isArray(db.products)) {
        db.products = db.products.map(p => {
          const gstInfo = getProductGstRate(p);
          let specs = p.technical_specifications || {};
          specs.gst_percentage = gstInfo.percentage.toString();
          specs['GST Rate'] = `${gstInfo.percentage}%`;
          p.technical_specifications = specs;
          return p;
        });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`Updated GST rates in data/production_platform_db.json.`);
      }
    } catch (err) {
      console.warn('Could not update JSON db:', err.message);
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
