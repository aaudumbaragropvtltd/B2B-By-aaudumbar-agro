import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/services/supabaseServer';

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productTitle, category } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    let userId = body.userId || body.user_id || null;
    let matchedProfile = null;

    // 1. Resolve user profile if provided directly
    if (userId) {
      const { data: p } = await supabaseAdmin
        .from('users')
        .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
        .eq('id', userId)
        .single();
      matchedProfile = p;
    }

    // 2. Try resolving via email
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

    // 3. Fallback: try session cookie
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

    // Resolve real product UUID if productId is a slug
    let realProductId = productId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    let resolvedTitle = productTitle || null;

    if (!isUuid) {
      const { data: prod } = await supabaseAdmin
        .from('products')
        .select('id, title')
        .ilike('title', productId.replace(/-/g, ' '))
        .limit(1)
        .single();
      if (prod?.id) {
        realProductId = prod.id;
        if (!resolvedTitle) resolvedTitle = prod.title;
      }
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    // 4. Insert into user_product_views if user & valid UUID product exists
    if (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realProductId)) {
      try {
        await supabaseAdmin
          .from('user_product_views')
          .insert({
            user_id: userId,
            product_id: realProductId
          });
      } catch (viewErr) {
        console.warn('user_product_views insert notice:', viewErr.message);
      }
    }

    // 5. Insert into activity_logs with rich intent metadata
    try {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          user_id: userId || null,
          action: 'viewed_product',
          details: {
            product_id: realProductId,
            product_title: resolvedTitle || productTitle || productId,
            category: category || 'General',
            full_name: matchedProfile?.full_name || null,
            company_name: matchedProfile?.company_name || null,
            phone: matchedProfile?.corporate_phone || matchedProfile?.phone_number || null,
            email: matchedProfile?.registered_email || body.email || null,
            has_order: false,
            timestamp: new Date().toISOString()
          },
          ip_address: ip
        });
    } catch (actErr) {
      console.warn('activity_logs product view warning:', actErr.message);
    }

    return NextResponse.json({ success: true, userId: userId || null });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ success: true });
  }
}
