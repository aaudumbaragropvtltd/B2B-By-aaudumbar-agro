// ============================================================================
// PUBLIC PLATFORM SETTINGS API
// ============================================================================
// Endpoint: GET /api/settings/public
// Safe public endpoints for checkout and pricing calculators.
// ============================================================================

import { NextResponse } from 'next/server';
import { getAllSettings } from '@/utils/platformSettings';

export async function GET() {
  try {
    const all = await getAllSettings();
    // Exclude internal/secret keys if any
    const publicSettings = {};
    for (const [key, item] of Object.entries(all)) {
      publicSettings[key] = item.value;
    }

    return NextResponse.json({
      success: true,
      settings: publicSettings,
      meta: all,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
