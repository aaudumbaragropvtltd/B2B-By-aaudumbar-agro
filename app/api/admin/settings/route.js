// ============================================================================
// ADMIN PLATFORM SETTINGS API
// ============================================================================
// Endpoint: GET /api/admin/settings
// Endpoint: POST /api/admin/settings (Update settings live)
// ============================================================================

import { NextResponse } from 'next/server';
import { getAllSettings, updateSettings } from '@/utils/platformSettings';
import { logPlatformEvent } from '@/utils/platformLogs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const settings = await getAllSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid settings payload' }, { status: 400 });
    }

    const updated = await updateSettings(body);
    await logPlatformEvent({
      level: 'INFO',
      service: 'admin_settings',
      message: 'Platform dynamic business rules updated from Admin Panel',
      metadata: { updatedKeys: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      message: 'Platform settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
