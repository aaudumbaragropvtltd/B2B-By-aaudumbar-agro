import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ihsgymlxdgmdrtwlnetr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloc2d5bWx4ZGdtZHJ0d2xuZXRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzQ5NDY3OCwiZXhwIjoyMDk5MDcwNjc4fQ.kog1SWIohMiQ76VIOtL5Paa5MSZlV96_nOFjUW0UPII';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  console.log('--- Testing Product Add Flow for Dual Role ("both") and "buyer" ---');
  
  // Find a user with role 'both' or 'buyer'
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, firebase_uid, registered_email, role')
    .limit(5);

  if (error || !users.length) {
    console.error('No users found:', error);
    return;
  }

  console.log('Found sample users:', users.map(u => ({ email: u.registered_email, role: u.role })));
  
  const testUser = users.find(u => u.role === 'both' || u.role === 'buyer') || users[0];
  console.log(`Testing with user: ${testUser.registered_email} (Role: ${testUser.role})`);

  // Verify sector
  const { data: sector } = await supabaseAdmin.from('industry_sectors').select('id, slug').limit(1).single();

  // Test insertion with 3% commission
  const rawPrice = 200;
  const platformFee = parseFloat((rawPrice * 0.03).toFixed(2));
  const listedPrice = parseFloat((rawPrice + platformFee).toFixed(2));

  const { data: product, error: insertError } = await supabaseAdmin
    .from('products')
    .insert([{
      supplier_id: testUser.id,
      sector_id: sector.id,
      title: 'Automated Test Product (Organic Mustard Seeds)',
      description: 'High oil content export grade',
      base_price_per_unit: listedPrice,
      unit_label: 'kg',
      bulk_minimum_order: 1000,
      inventory_count: 10000,
      quality_grade: 'A Grade',
      technical_specifications: {
        supplier_net_price: rawPrice,
        platform_commission_percent: 3,
        platform_fee_per_unit: platformFee
      },
      is_active: true
    }])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert Error:', insertError);
  } else {
    console.log('✅ Product inserted successfully for dual/buyer user!');
    console.log('Inserted Product:', {
      id: product.id,
      title: product.title,
      listed_price: product.base_price_per_unit,
      specs: product.technical_specifications
    });

    // Cleanup test product
    await supabaseAdmin.from('products').delete().eq('id', product.id);
    console.log('Cleaned up test product.');
  }
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
