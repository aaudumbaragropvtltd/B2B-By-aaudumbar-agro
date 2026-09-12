// ============================================================================
// NOTIFICATIONS API
// ============================================================================
// GET: Fetch user's notifications (with pagination + unread count)
// PATCH: Mark notification(s) as read
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    const offset = (page - 1) * limit;

    // Fetch notifications
    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: fetchError, count } = await query;

    if (fetchError) throw fetchError;

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
      total: count || 0,
      page,
      limit,
    });

  } catch (error) {
    console.warn('Notifications fetch notice (falling back to empty):', error?.message || error);
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      total: 0,
      page: 1,
      limit: 20,
    });
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('user_id', profile.id);

      if (error) throw error;

      return NextResponse.json({ success: true, marked: notificationIds.length });
    }

    return NextResponse.json({ error: 'Provide notificationIds or markAllRead' }, { status: 400 });

  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
