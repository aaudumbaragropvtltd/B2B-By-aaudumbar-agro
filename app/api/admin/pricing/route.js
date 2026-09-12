import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Commission rate lookup by sector slug
function getCommissionRate(sectorSlug) {
  if (!sectorSlug) return 5;
  const slug = sectorSlug.toLowerCase();
  const agriSlugs = ['agriculture', 'food-beverage', 'food_beverage'];
  const textileSlugs = ['apparel-fashion', 'apparel-garments', 'textiles', 'textiles-fabrics', 'textile-machinery'];
  if (agriSlugs.includes(slug)) return 2;
  if (textileSlugs.includes(slug)) return 7;
  return 5;
}

/**
 * GET /api/admin/pricing
 * Returns full pricing breakdown for all products (admin only).
 * Falls back to computed data if the admin_product_pricing table doesn't exist.
 */
export async function GET(request) {
  try {
    // Verify admin cookie
    const adminToken = request.cookies.get('b2b_admin_token')?.value;
    if (!adminToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to fetch from admin_product_pricing table first
    let pricingData = null;

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createAdminClient } = await import('@/services/supabaseServer');
        const supabase = createAdminClient();

        // Try dedicated pricing table first
        const { data: adminPricing, error: pricingError } = await supabase
          .from('admin_product_pricing')
          .select('*')
          .order('sector_slug', { ascending: true })
          .order('product_title', { ascending: true });

        if (!pricingError && adminPricing && adminPricing.length > 0) {
          pricingData = adminPricing;
        } else {
          // Fallback: compute from products table
          const { data: products, error: prodError } = await supabase
            .from('products')
            .select(`
              id, title, base_price_per_unit, unit_label, hsn_code, quality_grade, inventory_count,
              supplier_id (company_name),
              sector_id (name, slug)
            `)
            .order('created_at', { ascending: false });

          if (!prodError && products) {
            pricingData = products.map(p => {
              const sectorSlug = p.sector_id?.slug || '';
              const commissionRate = getCommissionRate(sectorSlug);
              const displayedPrice = Number(p.base_price_per_unit);
              const supplierBasePrice = Math.round((displayedPrice / (1 + commissionRate / 100)) * 100) / 100;
              const commissionAmount = Math.round((displayedPrice - supplierBasePrice) * 100) / 100;
              const gstRate = 18;
              const gstAmount = Math.round(displayedPrice * gstRate / 100 * 100) / 100;
              const totalWithGst = Math.round((displayedPrice + gstAmount) * 100) / 100;
              const isLogisticsEligible = ['agriculture', 'food-beverage'].includes(sectorSlug);

              return {
                id: p.id,
                product_id: p.id,
                product_title: p.title,
                supplier_name: p.supplier_id?.company_name || '-',
                sector_name: p.sector_id?.name || '-',
                sector_slug: sectorSlug,
                unit_label: p.unit_label,
                hsn_code: p.hsn_code,
                quality_grade: p.quality_grade,
                inventory_count: p.inventory_count,
                supplier_base_price: supplierBasePrice,
                commission_rate_percent: commissionRate,
                commission_amount: commissionAmount,
                displayed_price: displayedPrice,
                gst_rate_percent: gstRate,
                gst_on_displayed_price: gstAmount,
                total_price_with_gst: totalWithGst,
                logistics_eligible: isLogisticsEligible,
                logistics_rate_per_kg: isLogisticsEligible ? 2.3 : 0,
              };
            });
          }
        }
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    }

    // Final fallback: static demo data
    if (!pricingData) {
      pricingData = getDemoPricingData();
    }

    // Compute summary stats
    const totalProducts = pricingData.length;
    const totalCommission = pricingData.reduce((sum, p) => sum + Number(p.commission_amount || 0), 0);
    const totalGst = pricingData.reduce((sum, p) => sum + Number(p.gst_on_displayed_price || 0), 0);
    const avgCommissionRate = pricingData.length > 0 
      ? pricingData.reduce((sum, p) => sum + Number(p.commission_rate_percent || 0), 0) / pricingData.length 
      : 0;

    return NextResponse.json({
      pricing: pricingData,
      summary: {
        totalProducts,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalGst: Math.round(totalGst * 100) / 100,
        avgCommissionRate: Math.round(avgCommissionRate * 100) / 100,
      }
    });
  } catch (error) {
    console.error('Admin pricing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Demo data fallback when Supabase is not connected
function getDemoPricingData() {
  const demoProducts = [
    { title: 'Drip Irrigation System Kit (1 Hectare)', supplier: 'Jain Irrigation Systems Ltd', sector: 'Agriculture', slug: 'agriculture', price: 45900, unit: 'kit', hsn: '84248990' },
    { title: 'Agricultural Submersible Pumping Kit (5HP)', supplier: 'Jain Irrigation Systems Ltd', sector: 'Agriculture', slug: 'agriculture', price: 39270, unit: 'unit', hsn: '84131100' },
    { title: 'High-Yield Hybrid Tomato Seeds (Arka Rakshak)', supplier: 'Jain Irrigation Systems Ltd', sector: 'Agriculture', slug: 'agriculture', price: 1224, unit: 'packet', hsn: '12099190' },
    { title: 'Premium Selvedge Denim Fabric (12oz Indigo)', supplier: 'Arvind Mills Ltd', sector: 'Apparel & Fashion', slug: 'apparel-fashion', price: 910, unit: 'meter', hsn: '52094200' },
    { title: 'Combed Cotton Yarn (40s Count, Ring Spun)', supplier: 'Arvind Mills Ltd', sector: 'Apparel & Fashion', slug: 'apparel-fashion', price: 305, unit: 'kg', hsn: '52052400' },
    { title: 'Handloom Khadi Fabric (Muslin Grade)', supplier: 'Arvind Mills Ltd', sector: 'Apparel & Fashion', slug: 'apparel-fashion', price: 449, unit: 'meter', hsn: '52091100' },
    { title: 'High-Tensile Hex Bolt Set (Grade 10.9)', supplier: 'Sundram Fasteners Ltd', sector: 'Automobile & EV', slug: 'automobile-ev', price: 152, unit: 'kg', hsn: '73181500' },
    { title: 'BLDC Motor Controller Kit (48V/72V, 3KW)', supplier: 'Sundram Fasteners Ltd', sector: 'Automobile & EV', slug: 'automobile-ev', price: 8925, unit: 'unit', hsn: '85044090' },
    { title: 'Disc Brake Assembly (Ventilated, 280mm)', supplier: 'Sundram Fasteners Ltd', sector: 'Automobile & EV', slug: 'automobile-ev', price: 3360, unit: 'set', hsn: '87083010' },
    { title: 'HDPE Granules (Blow Moulding Grade)', supplier: 'Reliance Polymers Division', sector: 'Chemicals & Polymers', slug: 'chemicals-polymers', price: 121, unit: 'kg', hsn: '39012000' },
    { title: 'Premium Cashew Kernels W240 (Bulk)', supplier: 'Milan Dry Fruits & Spices', sector: 'Food & Beverage', slug: 'food-beverage', price: 938, unit: 'kg', hsn: '08013200' },
    { title: 'Salem Whole Turmeric Fingers', supplier: 'Milan Dry Fruits & Spices', sector: 'Food & Beverage', slug: 'food-beverage', price: 148, unit: 'kg', hsn: '09103010' },
    { title: 'Basmati Rice 1121 (Extra Long Grain)', supplier: 'Milan Dry Fruits & Spices', sector: 'Food & Beverage', slug: 'food-beverage', price: 87, unit: 'kg', hsn: '10063020' },
  ];

  return demoProducts.map((p, idx) => {
    const commissionRate = getCommissionRate(p.slug);
    const displayedPrice = p.price;
    const supplierBasePrice = Math.round((displayedPrice / (1 + commissionRate / 100)) * 100) / 100;
    const commissionAmount = Math.round((displayedPrice - supplierBasePrice) * 100) / 100;
    const gstRate = 18;
    const gstAmount = Math.round(displayedPrice * gstRate / 100 * 100) / 100;
    const totalWithGst = Math.round((displayedPrice + gstAmount) * 100) / 100;
    const isLogisticsEligible = ['agriculture', 'food-beverage'].includes(p.slug);

    return {
      id: `demo-pricing-${idx + 1}`,
      product_id: `demo-pricing-${idx + 1}`,
      product_title: p.title,
      supplier_name: p.supplier,
      sector_name: p.sector,
      sector_slug: p.slug,
      unit_label: p.unit,
      hsn_code: p.hsn,
      supplier_base_price: supplierBasePrice,
      commission_rate_percent: commissionRate,
      commission_amount: commissionAmount,
      displayed_price: displayedPrice,
      gst_rate_percent: gstRate,
      gst_on_displayed_price: gstAmount,
      total_price_with_gst: totalWithGst,
      logistics_eligible: isLogisticsEligible,
      logistics_rate_per_kg: isLogisticsEligible ? 2.3 : 0,
    };
  });
}
