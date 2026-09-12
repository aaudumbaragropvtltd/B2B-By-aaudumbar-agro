import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id (company_name, logo_url),
        supplier:supplier_id (company_name, logo_url),
        product:product_id (title)
      `)
      .or(`buyer_id.eq.${profile.id},supplier_id.eq.${profile.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    const body = await request.json();
    const { targetUserId, productId, rfqId } = body;

    let buyerId = profile.id;
    let supplierId = targetUserId;

    if (profile.role === 'supplier') {
      buyerId = targetUserId;
      supplierId = profile.id;
    }

    // Check if conversation already exists
    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('supplier_id', supplierId);
      
    if (productId) {
      query = query.eq('product_id', productId);
    } else {
      query = query.is('product_id', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Create new conversation
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert([{
        buyer_id: buyerId,
        supplier_id: supplierId,
        product_id: productId || null,
        rfq_id: rfqId || null,
        last_message_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
