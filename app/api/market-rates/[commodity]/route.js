// ============================================================================
// COMMODITY SPECIFIC MANDI RATES API
// ============================================================================
// Example: GET /api/market-rates/turmeric
// Sourced from CommodityOnline & APMC Mandi Network
// ============================================================================

import { NextResponse } from 'next/server';
import { findCommodityByQuery, getAllCommodityRates } from '@/services/geminiMandiService';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const commoditySlug = resolvedParams?.commodity || '';

  const matched = findCommodityByQuery(commoditySlug);

  if (!matched) {
    return NextResponse.json({
      success: false,
      error: `Commodity '${commoditySlug}' not found.`,
      availableCommodities: getAllCommodityRates().map((c) => ({
        name: c.name,
        slug: c.slug,
      })),
    }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    source: 'CommodityOnline & APMC Agmarknet',
    sourceUrl: matched.sourceUrl,
    lastUpdated: new Date().toISOString(),
    commodity: matched,
  });
}
