// ============================================================================
// COMMODITYONLINE LIVE RATES API ROUTE
// ============================================================================
// Endpoint: /api/market-rates/commodityonline
// Query parameters:
// - action: "commodities" | "states" | "markets" | "rates"
// - commodity: string (e.g. "turmeric", "soyabean", "cotton")
// - state: string (e.g. "maharashtra", "madhya-pradesh")
// - market: string (e.g. "hingoli", "indore")
// - refresh: "true" | "false"
// ============================================================================

import { NextResponse } from 'next/server';
import {
  getAllCommodities,
  getStatesForCommodity,
  getMarketsForCommodityAndState,
  getLiveRates,
} from '@/services/commodityOnlineLiveService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'rates';
    const commodity = searchParams.get('commodity') || 'all';
    const state = searchParams.get('state') || 'all';
    const market = searchParams.get('market') || 'all';
    const refresh = searchParams.get('refresh') === 'true';

    // 1. Return all 498 commodities
    if (action === 'commodities') {
      const commodities = getAllCommodities();
      return NextResponse.json({
        success: true,
        total: commodities.length,
        commodities,
      });
    }

    // 2. Return states for a commodity
    if (action === 'states') {
      const states = getStatesForCommodity(commodity);
      return NextResponse.json({
        success: true,
        commodity,
        total: states.length,
        states,
      });
    }

    // 3. Return markets for commodity + state
    if (action === 'markets') {
      const markets = getMarketsForCommodityAndState(commodity, state);
      return NextResponse.json({
        success: true,
        commodity,
        state,
        total: markets.length,
        markets,
      });
    }

    // 4. Return live Mandi rates table
    const data = await getLiveRates({ commodity, state, market, refresh });

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('[/api/market-rates/commodityonline] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch live CommodityOnline data',
        records: [],
      },
      { status: 500 }
    );
  }
}
