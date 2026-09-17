// ============================================================================
// CRON: COMMODITYONLINE LIVE MANDI RATES SYNC AGENT
// ============================================================================
// Automatically synchronizes live wholesale Mandi rates directly from
// https://www.commodityonline.com/mandiprices into the platform database.
// Can be triggered by cron providers (Vercel Cron, GitHub Actions, or local schedule).
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLiveRates, getAllCommodities } from '@/services/commodityOnlineLiveService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  return handleSync(request);
}

export async function POST(request) {
  return handleSync(request);
}

async function handleSync(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch active products to match with CommodityOnline benchmarks
    const { data: products, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('id, title, base_price_per_unit')
      .eq('is_active', true)
      .limit(5);

    if (fetchErr) throw fetchErr;

    const allCatalogCommodities = getAllCommodities();
    const results = [];

    // 2. For each active product, fetch live rates from CommodityOnline
    for (const product of (products || [])) {
      const titleLower = product.title.toLowerCase();
      
      // Match product to CommodityOnline slug
      const matched = allCatalogCommodities.find(c => 
        titleLower.includes(c.name.toLowerCase()) || 
        titleLower.includes(c.slug.replace(/-/g, ' ')) ||
        c.slug.split('-').some(word => word.length > 3 && titleLower.includes(word))
      );

      const commoditySlug = matched ? matched.slug : 'all';

      try {
        // Fetch live Mandi rates from https://www.commodityonline.com/mandiprices
        const liveData = await getLiveRates({
          commodity: commoditySlug,
          state: 'all',
          market: 'all',
          refresh: true
        });

        if (liveData.records && liveData.records.length > 0) {
          const prices = liveData.records
            .map(r => r.modalPrice)
            .filter(p => typeof p === 'number' && p > 0);

          if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

            // Save to market_rates table in Supabase
            try {
              await supabaseAdmin
                .from('market_rates')
                .insert([{
                  product_id: product.id,
                  commodity_name: product.title,
                  min_price: minPrice,
                  max_price: maxPrice,
                  average_price: avgPrice,
                  source_url: liveData.sourceUrl || `https://www.commodityonline.com/mandiprices/${commoditySlug}`,
                  is_competitor: false
                }]);
            } catch (dbErr) {
              console.warn('[Sync Agent] DB insert notice:', dbErr.message);
            }

            results.push({
              product: product.title,
              commodityOnlineSlug: commoditySlug,
              ourPrice: product.base_price_per_unit,
              mandiModalAvg: avgPrice,
              mandiPerKg: parseFloat((avgPrice / 100).toFixed(2)),
              minModal: minPrice,
              maxModal: maxPrice,
              mandisSampled: liveData.records.length,
              source: 'https://www.commodityonline.com/mandiprices'
            });
          }
        }
      } catch (err) {
        console.warn(`[Sync Agent] Notice syncing ${product.title}:`, err.message);
      }
    }

    return NextResponse.json({
      success: true,
      source: 'https://www.commodityonline.com/mandiprices',
      timestamp: new Date().toISOString(),
      synchronizedCount: results.length,
      data: results
    });

  } catch (error) {
    console.error('[Sync Agent] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
