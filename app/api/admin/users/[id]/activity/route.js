import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required', views: [], searches: [], payments: [] }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch user product views, searches, and payments in parallel
    const [viewsRes, searchesRes, paymentsRes] = await Promise.all([
      supabaseAdmin
        .from('user_product_views')
        .select(`
          id,
          viewed_at,
          products (
            id,
            title,
            base_price_per_unit,
            unit_label,
            hero_image_url,
            bulk_minimum_order
          )
        `)
        .eq('user_id', id)
        .order('viewed_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('search_logs')
        .select('id, query, sector_slug, results_count, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabaseAdmin
        .from('platform_ledger')
        .select('*')
        .eq('from_entity_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
    ]);

    return NextResponse.json({
      views: viewsRes.data || [],
      searches: searchesRes.data || [],
      payments: paymentsRes.data || []
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', views: [], searches: [], payments: [] }, { status: 500 });
  }
}
