// ============================================================================
// ADMIN SYSTEM AUDIT & HEALTH LOGS API
// ============================================================================
// Endpoint: GET /api/admin/logs
// Endpoint: DELETE /api/admin/logs
// ============================================================================

import { NextResponse } from 'next/server';
import { getPlatformLogs, clearPlatformLogs } from '@/utils/platformLogs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const service = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await getPlatformLogs({ level, service, limit });

    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearPlatformLogs();
    return NextResponse.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
