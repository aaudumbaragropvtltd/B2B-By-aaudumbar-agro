// ============================================================================
// PUBLIC BANNERS API
// ============================================================================
// Endpoint: GET /api/banners
// Returns active promotional banners for Hero and marketing sections.
// ============================================================================

import { NextResponse } from 'next/server';
import { getActiveBanners } from '@/utils/platformBanners';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const banners = await getActiveBanners(sector);

    return NextResponse.json({
      success: true,
      banners,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
