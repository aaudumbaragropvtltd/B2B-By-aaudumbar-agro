// ============================================================================
// SEARCH LOG API
// ============================================================================
// Logs user search queries for admin visibility.
// Works for both authenticated and anonymous users.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createAdminClient } from '@/services/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, sectorSlug, resultsCount } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Use admin client to query user and insert (bypasses RLS)
    const supabaseAdmin = createAdminClient();

    // Try to get authenticated user from body or auth session
    let userId = body.userId || body.user_id || null;
    let matchedProfile = null;

    if (userId) {
      const { data: p } = await supabaseAdmin
        .from('users')
        .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
        .eq('id', userId)
        .single();
      matchedProfile = p;
    }

    if (!matchedProfile) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabaseAdmin
            .from('users')
            .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
            .eq('firebase_uid', user.id)
            .single();
          matchedProfile = p;
          if (p?.id) userId = p.id;
        }
      } catch (e) {}
    }

    if (!matchedProfile && body.email) {
      try {
        const { data: p } = await supabaseAdmin
          .from('users')
          .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
          .ilike('registered_email', body.email.trim())
          .single();
        matchedProfile = p;
        if (p?.id) userId = p.id;
      } catch (e) {}
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const ua = request.headers.get('user-agent') || '';

    // 1. Insert into search_logs
    const { error: insertError } = await supabaseAdmin
      .from('search_logs')
      .insert({
        user_id: userId || null,
        query: query.trim(),
        sector_slug: sectorSlug || null,
        results_count: resultsCount || 0,
        ip_address: ip,
        user_agent: ua,
      });

    if (insertError) {
      console.error('Search log insert error:', insertError);
    }

    // 2. Also log in activity_logs with rich contact and intent context
    try {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          user_id: userId || null,
          action: 'search',
          details: {
            query: query.trim(),
            sector_slug: sectorSlug || null,
            results_count: resultsCount || 0,
            full_name: matchedProfile?.full_name || null,
            company_name: matchedProfile?.company_name || null,
            phone: matchedProfile?.corporate_phone || matchedProfile?.phone_number || body.phone || null,
            email: matchedProfile?.registered_email || body.email || null,
            gst: matchedProfile?.gst_number || null,
            city: matchedProfile?.city || null,
            timestamp: new Date().toISOString()
          },
          ip_address: ip
        });
    } catch (actErr) {
      console.warn('Activity log search insert warning:', actErr.message);
    }

    return NextResponse.json({ success: true, userId: userId || null });
  } catch (error) {
    console.error('Search log error:', error);
    // Non-critical — return success anyway
    return NextResponse.json({ success: true });
  }
}
