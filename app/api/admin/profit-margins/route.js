// ============================================================================
// B2B INDIA — PROFIT MARGINS & PRICING INTELLIGENCE API
// ============================================================================
// Endpoint: GET /api/admin/profit-margins
// Accurately extracts actual supplier raw base rate + dynamic category platform fee + GST =
// exact B2B India earnings, supplier payout, and buyer total for all catalog products.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PRODUCTS as STATIC_PRODUCTS } from '@/data/products';
import { STATIC_SECTORS } from '@/constants/sectors';
import { DEFAULT_CATEGORY_FEES } from '@/constants/categoryFees';
import { getAllSettings } from '@/utils/platformSettings';
import { getProductGstRate } from '@/utils/gstUtils';
import { getCategoryFeePercentage } from '@/utils/commissionUtils';

// Known Database Sector UUID to Slug Map
const SECTOR_UUID_TO_SLUG = {
  'a38a19fe-f62f-49a1-beed-f916ce92f1b2': 'building-construction',
  'cbf4f79c-45cb-409c-806d-6ad6941952b0': 'electronics-electrical',
  '8913986b-4d55-42ce-844a-f62d078ea484': 'industrial-machinery',
  '426a727d-db22-4e7e-a43d-46e3c9d99a8a': 'apparel-garments',
  'a9cec48f-5e57-4433-b93a-c352698b0af8': 'food-agriculture',
  '3d72a92f-d341-4ce3-b123-933475e5760b': 'chemicals-dyes',
  '3bca8dbd-9ddb-4bbc-ab4f-dc2065e17faf': 'medical-healthcare',
  '1671b8c5-88cf-40f6-afe3-e57abbfadd0d': 'furniture-interiors',
  '50c15e6b-8413-4a94-aa88-10b0688afefe': 'packaging-paper',
  '6a094f9d-ffeb-400f-a7c7-21119d570b78': 'automobile-parts',
  'dec2b315-1827-4f1f-bafc-e2d8b0658ee9': 'solar-renewable',
  'ae4aacb8-7e70-4e96-898d-c46b6295724a': 'pipes-fittings',
  '8ed222a9-fb93-4483-96c8-257519d8346f': 'safety-security',
  'e2767a55-1aba-44b3-ac31-929b791272f7': 'textiles-fabrics',
  'e2e6fbcf-7260-44c0-9c72-4fd57d1dabf0': 'pharma-drugs',
  '4d23e777-2fa2-446d-9065-2f59e0746a0d': 'rubber-products',
  '434cc228-0a86-441e-b7f0-816b3ddb5923': 'plastic-products',
  'd6de8aa0-a20f-47c5-b94d-e0376906975e': 'gems-jewellery',
  'be665d7c-02bf-419a-8b1b-e4f71cc1ea86': 'printing-stationery',
  'a913c7bc-1b5b-4962-9553-bbe8dece9f9f': 'oil-gas',
  'acf9f8a2-2e03-47dd-9b65-7e83ef7c4132': 'metals-steel',
  'a48b77ac-f2ca-47ef-ac4f-540e67e17a70': 'water-treatment',
  '40229178-cb7f-4075-bc87-461de02c359a': 'hvac-refrigeration',
  'e4dd0ec1-c885-421c-8a11-631368615f42': 'lab-instruments',
  'd5f7549c-ca13-4aba-bfe4-6a26ef350afe': 'leather-products',
  '8a9aa587-7cbc-463b-89c3-e52df83b9f8b': 'sports-fitness',
  'ef88aba6-9eb0-41f7-a2fe-17d12d6f9f2d': 'gifts-handicrafts',
  'c1c8f912-2a8b-4042-97ca-5b494c3e8778': 'telecom-equipment',
  'd2f2f22a-4691-4057-9f9f-8bb2a4341a38': 'mining-minerals',
  '341774b3-ddb0-43ea-b326-d6c994bebd32': 'timber-wood',
  '77c31ce5-537c-447b-8e4d-b299210346c7': 'power-generation',
  '9d65818e-df5f-4694-8a1d-ae1428453346': 'ayurvedic-herbal',
  '7330cf5c-9fd8-4904-9b13-9256b217f9af': 'glass-ceramics',
  '7fb59b6f-e708-4638-a5af-7136bb320e20': 'logistics-handling',
  '9f52545a-a4da-4f95-9562-e3fb39b640be': 'marine-ship',
  '0f49457d-14ac-4d16-a410-ca24fc2a54ce': 'waste-recycling',
  'f9acceb9-74a9-411d-a670-a0674a1d15a8': 'cosmetics-personal',
  '63295f3a-5559-4d35-8102-b04f4686d1dd': 'education-training'
};

function resolveSector(input) {
  if (!input) return { name: 'Food & Agriculture', slug: 'food-agriculture' };
  const str = String(input).trim().toLowerCase();
  
  // 1. Check UUID map
  if (SECTOR_UUID_TO_SLUG[str]) {
    const slug = SECTOR_UUID_TO_SLUG[str];
    const found = STATIC_SECTORS.find(s => s.slug === slug);
    if (found) return found;
  }

  // 2. Check slug directly
  const foundBySlug = STATIC_SECTORS.find(s => s.slug === str);
  if (foundBySlug) return foundBySlug;

  // 3. Fallback
  return {
    name: str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    slug: str
  };
}

function getSupabaseAdmin() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return null;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectorFilter = searchParams.get('sector');
    const searchQuery = searchParams.get('search')?.toLowerCase();

    // 1. Fetch live dynamic platform settings
    const settings = await getAllSettings();
    const categoryFeesMap = settings.category_platform_fees?.value || DEFAULT_CATEGORY_FEES;
    const defaultFeePercent = Number(settings.default_platform_fee_percent?.value) || 3.0;
    const defaultGstRate = Number(settings.default_gst_percent?.value) || 18.0;

    // 2. Fetch products from database
    const supabase = getSupabaseAdmin();
    let dbProducts = [];
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbProducts = data;
      } catch (e) {
        console.warn('DB products fetch error:', e.message);
      }
    }

    // 3. Merge with static & prelisted catalog items
    const combinedProducts = [];
    const seenIds = new Set();

    dbProducts.forEach((p) => {
      seenIds.add(p.id);

      // RESOLVE TRUE RAW SUPPLIER PRICE:
      let rawBasePrice = 0;
      if (p.technical_specifications?.supplier_net_price !== undefined && p.technical_specifications?.supplier_net_price !== null) {
        rawBasePrice = Number(p.technical_specifications.supplier_net_price);
      } else if (p.supplier_net_price !== undefined && p.supplier_net_price !== null) {
        rawBasePrice = Number(p.supplier_net_price);
      } else if (p.technical_specifications?.platform_fee_per_unit) {
        rawBasePrice = Number(p.base_price_per_unit) - Number(p.technical_specifications.platform_fee_per_unit);
      } else if (p.base_price_per_unit) {
        // Stored catalog price has 3% commission included, reverse calculate raw price
        rawBasePrice = Math.round((Number(p.base_price_per_unit) / 1.03) * 100) / 100;
      }

      const sectorInfo = resolveSector(p.sector_id || p.category);

      combinedProducts.push({
        id: p.id,
        title: p.title || p.name,
        categorySlug: sectorInfo.slug,
        categoryName: sectorInfo.name,
        rawBasePrice: Number(rawBasePrice || 0),
        unit_label: p.unit_label || p.unit || 'Kg',
        bulk_minimum_order: Number(p.bulk_minimum_order || p.moq || 1000),
        hsn_code: p.hsn_code || (p.technical_specifications?.['HSN Code'] || p.technical_specifications?.hsn || ''),
        quality_grade: p.quality_grade || p.technical_specifications?.['Quality / Grade'] || 'Standard Grade',
        supplier_name: p.technical_specifications?.['Supplier Name'] || p.supplier_name || 'Verified Supplier',
        hero_image_url: p.hero_image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        source: 'Live Database',
        technical_specifications: p.technical_specifications || {},
      });
    });

    STATIC_PRODUCTS.forEach((p) => {
      const pid = `static-${p.id}`;
      if (!seenIds.has(pid)) {
        seenIds.add(pid);
        const sectorInfo = resolveSector(p.category);
        const rawBase = Number(p.price || p.base_price_per_unit || 0);

        combinedProducts.push({
          id: pid,
          title: p.name || p.title,
          categorySlug: sectorInfo.slug,
          categoryName: sectorInfo.name,
          rawBasePrice: rawBase,
          unit_label: p.unit || p.unit_label || 'Kg',
          bulk_minimum_order: Number(p.moq || p.bulk_minimum_order || 1000),
          hsn_code: p.hsn || p.hsn_code || '',
          quality_grade: p.specifications?.Grade || p.quality_grade || 'Premium Grade',
          supplier_name: p.supplier?.name || 'Aaudumbar Agro / Partner Mill',
          hero_image_url: p.image || p.hero_image_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
          source: 'Catalog Prelisted',
          technical_specifications: p.specifications || {},
        });
      }
    });

    // 4. Compute Financial & Profit Breakdown for each product
    let analyzedProducts = combinedProducts.map((p) => {
      const sectorSlug = p.categorySlug;
      const rawBasePrice = Number(p.rawBasePrice) || 0;

      // Platform Commission
      const platformFeePercent = getCategoryFeePercentage(sectorSlug, categoryFeesMap, defaultFeePercent);
      const platformFeePerUnit = Math.round(rawBasePrice * (platformFeePercent / 100) * 100) / 100;
      const priceWithFee = Math.round((rawBasePrice + platformFeePerUnit) * 100) / 100;

      // GST Resolution
      let gstPercent = defaultGstRate;
      if (p.technical_specifications?.gst_percentage) {
        gstPercent = Number(p.technical_specifications.gst_percentage);
      } else {
        const gstInfo = getProductGstRate(p, defaultGstRate);
        gstPercent = gstInfo.percentage;
      }

      const gstAmountPerUnit = Math.round(priceWithFee * (gstPercent / 100) * 100) / 100;
      const finalListedPrice = Math.round((priceWithFee + gstAmountPerUnit) * 100) / 100;

      // MOQ Bulk Totals
      const moq = Math.max(1, Number(p.bulk_minimum_order) || 1000);
      const totalRawSupplierPayout = Math.round(rawBasePrice * moq);
      const totalB2BEarnings = Math.round(platformFeePerUnit * moq);
      const totalGstCollected = Math.round(gstAmountPerUnit * moq);
      const totalGrossOrderValue = Math.round(finalListedPrice * moq);

      // Advance vs Pending Dock Split
      const isHighValue = totalGrossOrderValue >= 1000000;
      const advanceAmount = isHighValue ? 100000 : Math.round(totalGrossOrderValue * 0.1);
      const pendingDockAmount = Math.max(0, totalGrossOrderValue - advanceAmount);

      return {
        id: p.id,
        title: p.title,
        categorySlug: sectorSlug,
        categoryName: p.categoryName,
        supplierName: p.supplier_name,
        unitLabel: p.unit_label,
        hsnCode: p.hsn_code,
        qualityGrade: p.qualityGrade,
        heroImageUrl: p.hero_image_url,
        source: p.source,
        moq,
        // Unit economics
        rawBasePrice,
        platformFeePercent,
        platformFeePerUnit,
        priceWithFee,
        gstPercent,
        gstAmountPerUnit,
        finalListedPrice,
        // Deal economics at MOQ
        totalRawSupplierPayout,
        totalB2BEarnings,
        totalGstCollected,
        totalGrossOrderValue,
        advanceAmount,
        pendingDockAmount,
      };
    });

    // 5. Apply optional filters
    if (sectorFilter && sectorFilter !== 'all') {
      analyzedProducts = analyzedProducts.filter((p) => p.categorySlug === sectorFilter);
    }

    if (searchQuery) {
      analyzedProducts = analyzedProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery) ||
          p.categoryName.toLowerCase().includes(searchQuery) ||
          p.supplierName.toLowerCase().includes(searchQuery) ||
          (p.hsnCode && p.hsnCode.includes(searchQuery))
      );
    }

    // 6. Calculate Aggregated Portfolio KPIs
    const totalProductsCount = analyzedProducts.length;
    const totalProjectedOrderVolume = analyzedProducts.reduce((acc, p) => acc + p.totalGrossOrderValue, 0);
    const totalProjectedB2BEarnings = analyzedProducts.reduce((acc, p) => acc + p.totalB2BEarnings, 0);
    const totalSupplierPayouts = analyzedProducts.reduce((acc, p) => acc + p.totalRawSupplierPayout, 0);
    const totalGstFlow = analyzedProducts.reduce((acc, p) => acc + p.totalGstCollected, 0);
    const avgFeePercent =
      totalProductsCount > 0
        ? (analyzedProducts.reduce((acc, p) => acc + p.platformFeePercent, 0) / totalProductsCount).toFixed(1)
        : defaultFeePercent;

    return NextResponse.json({
      success: true,
      products: analyzedProducts,
      kpis: {
        totalProductsCount,
        totalProjectedOrderVolume,
        totalProjectedB2BEarnings,
        totalSupplierPayouts,
        totalGstFlow,
        avgFeePercent: Number(avgFeePercent),
        defaultFeePercent,
      },
      categoryFeesMap,
    });
  } catch (error) {
    console.error('Error calculating profit margins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
