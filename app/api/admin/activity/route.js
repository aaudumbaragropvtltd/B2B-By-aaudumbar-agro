// ============================================================================
// ADMIN ACTIVITY API
// ============================================================================
// Returns activity logs and search logs for the admin dashboard.
// Protected — admin role only.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createAdminClient } from '@/services/supabaseServer';

async function verifyAdmin(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const supabaseAdmin = createAdminClient();
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('firebase_uid', user.id)
    .single();

  if (!profile || profile.role !== 'admin') return null;
  return profile;
}

export async function GET(request) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'activity'; // 'activity' or 'searches'
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    const supabaseAdmin = createAdminClient();

    if (type === 'searches') {
      // Fetch search logs with full user contact info
      const { data: searches, count, error: searchError } = await supabaseAdmin
        .from('search_logs')
        .select('*, users(id, display_id, full_name, company_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, role, gst_number)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (searchError) {
        console.error('Search logs query error:', searchError);
        return NextResponse.json({ error: 'Failed to fetch search logs' }, { status: 500 });
      }

      return NextResponse.json({
        logs: searches || [],
        total: count || 0,
        page,
        limit,
      });
    } else {
      // Fetch activity logs with full user contact info
      const { data: activities, count, error: activityError } = await supabaseAdmin
        .from('activity_logs')
        .select('*, users(id, display_id, full_name, company_name, registered_email, corporate_phone, phone_number, whatsapp_number, role)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (activityError) {
        console.error('Activity logs query error:', activityError);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
      }

      return NextResponse.json({
        logs: activities || [],
        total: count || 0,
        page,
        limit,
      });
    }
  } catch (error) {
    console.error('Admin activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
