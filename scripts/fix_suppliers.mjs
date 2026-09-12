import { createClient } from '@supabase/supabase-js';


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MOCK_SUPPLIERS = {
  'agriculture': { company_name: 'Jain Irrigation Systems Ltd', city: 'Jalgaon', state: 'Maharashtra', pincode: '425001' },
  'apparel-fashion': { company_name: 'Arvind Mills Ltd', city: 'Ahmedabad', state: 'Gujarat', pincode: '380025' },
  'automobile-ev': { company_name: 'Sundram Fasteners Ltd', city: 'Chennai', state: 'Tamil Nadu', pincode: '600004' },
  'ayurvedic-herbal': { company_name: 'Dabur Industrial', city: 'Ghaziabad', state: 'UP', pincode: '201001' },
  'chemicals-polymers': { company_name: 'Pidilite Industries', city: 'Mumbai', state: 'Maharashtra', pincode: '400021' },
  'it-hardware': { company_name: 'HCL Infosystems', city: 'Noida', state: 'UP', pincode: '201301' },
  'electronics-electrical': { company_name: 'Polycab India Ltd', city: 'Mumbai', state: 'Maharashtra', pincode: '400028' },
  'food-beverage': { company_name: 'Himalayan Agri Exports', city: 'Karnal', state: 'Haryana', pincode: '132001' },
  'medical-surgical': { company_name: 'Poly Medicure Ltd', city: 'Faridabad', state: 'Haryana', pincode: '121004' },
  'industrial-cnc': { company_name: 'Jyoti CNC Automation', city: 'Rajkot', state: 'Gujarat', pincode: '360024' },
  'construction': { company_name: 'UltraTech Cement', city: 'Mumbai', state: 'Maharashtra', pincode: '400093' },
  'metals-steel': { company_name: 'Tata Steel Ltd', city: 'Jamshedpur', state: 'Jharkhand', pincode: '831001' }
};

const DEFAULT_SUPPLIER = { company_name: 'B2B India Verified Supplier', city: 'Pune', state: 'Maharashtra', pincode: '411001' };

async function fixSuppliers() {
  console.log('Starting Supplier Data Fix...');

  // 1. Get or create users for each supplier
  const supplierIdMap = {};
  
  for (const [sectorSlug, supplierInfo] of Object.entries(MOCK_SUPPLIERS)) {
    // Check if exists
    let { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('company_name', supplierInfo.company_name)
      .single();
      
    if (!existingUser) {
      // Create it
      console.log(`Creating mock supplier: ${supplierInfo.company_name}`);
      const mockUid = `mock-supplier-${sectorSlug}`;
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          firebase_uid: mockUid,
          registered_email: `${sectorSlug}@example.com`,
          corporate_phone: '9999999999',
          role: 'supplier',
          status: 'active',
          company_name: supplierInfo.company_name,
          city: supplierInfo.city,
          state: supplierInfo.state,
          pincode: supplierInfo.pincode,
          categories: [sectorSlug]
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('Error creating user:', createError);
      } else {
        supplierIdMap[sectorSlug] = newUser.id;
      }
    } else {
      supplierIdMap[sectorSlug] = existingUser.id;
    }
  }

  // Ensure default supplier exists
  let { data: defaultUser } = await supabaseAdmin.from('users').select('id').eq('company_name', DEFAULT_SUPPLIER.company_name).single();
  if (!defaultUser) {
    const { data: newUser } = await supabaseAdmin.from('users').insert({
      firebase_uid: 'mock-supplier-default',
      registered_email: `default@example.com`,
      corporate_phone: '9999999999',
      role: 'supplier',
      status: 'active',
      ...DEFAULT_SUPPLIER
    }).select('id').single();
    defaultUser = newUser;
  }
  
  // 2. Fetch all products with their sector
  const { data: products, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('id, industry_sectors(slug)');

  if (fetchError || !products) {
    console.error('Failed to fetch products:', fetchError);
    return;
  }

  console.log(`Found ${products.length} products to update.`);

  // 3. Update products to map to the correct supplier
  let updatedCount = 0;
  for (const product of products) {
    const sectorSlug = product.industry_sectors?.slug;
    const targetSupplierId = defaultUser.id;

    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        supplier_id: targetSupplierId
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to update product ${product.id}:`, updateError);
    } else {
      updatedCount++;
    }
  }

  console.log(`Successfully mapped ${updatedCount} products to realistic suppliers!`);
}

fixSuppliers().catch(console.error);
