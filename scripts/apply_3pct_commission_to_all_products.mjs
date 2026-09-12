import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('--- Applying 3% Commission to All Product Base Values ---');
  
  // 1. Fetch all products from Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, base_price_per_unit, technical_specifications');

  if (error) {
    console.error('Error fetching products from Supabase:', error);
  } else {
    console.log(`Found ${products.length} products in Supabase products table.`);
    
    let updatedCount = 0;
    for (const product of products) {
      const originalPrice = parseFloat(product.base_price_per_unit) || 0;
      
      // Calculate 3% commission added to base
      const commissionAmount = parseFloat((originalPrice * 0.03).toFixed(2));
      const newPrice = parseFloat((originalPrice * 1.03).toFixed(2));
      
      let specs = product.technical_specifications || {};
      if (typeof specs === 'string') {
        try { specs = JSON.parse(specs); } catch (e) { specs = {}; }
      }
      
      // If already processed with supplier_net_price, skip re-multiplying
      if (specs.supplier_net_price && specs.platform_commission_percent === 3) {
        console.log(`[SKIP] Product ID ${product.id} ("${product.title}") already has 3% commission applied.`);
        continue;
      }

      specs.supplier_net_price = originalPrice;
      specs.platform_commission_percent = 3;
      specs.platform_fee_per_unit = commissionAmount;

      const { error: updateError } = await supabase
        .from('products')
        .update({
          base_price_per_unit: newPrice,
          technical_specifications: specs
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`Failed to update product ${product.id}:`, updateError);
      } else {
        updatedCount++;
        console.log(`[UPDATED] ${product.title}: ₹${originalPrice} -> ₹${newPrice} (+₹${commissionAmount} 3% Commission)`);
      }
    }
    console.log(`Supabase Update Complete: ${updatedCount} products updated with 3% commission.`);
  }

  // 2. Update local fallback JSON database if present
  const dbPath = path.join(process.cwd(), 'data', 'production_platform_db.json');
  if (fs.existsSync(dbPath)) {
    try {
      const rawDb = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(rawDb);
      
      if (Array.isArray(db.products)) {
        let jsonUpdatedCount = 0;
        db.products = db.products.map(p => {
          if (p.base_price_per_unit && !p._commission_applied_3pct) {
            const oldVal = parseFloat(p.base_price_per_unit) || 0;
            p.supplier_net_price = oldVal;
            p.base_price_per_unit = parseFloat((oldVal * 1.03).toFixed(2));
            p._commission_applied_3pct = true;
            jsonUpdatedCount++;
          }
          return p;
        });
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        console.log(`Updated ${jsonUpdatedCount} products in data/production_platform_db.json with 3% commission.`);
      }
    } catch (err) {
      console.warn('Could not update production_platform_db.json:', err.message);
    }
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
