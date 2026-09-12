import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: sectors, error } = await supabaseAdmin
      .from('industry_sectors')
      .select('*')
      .order('display_order');

    if (error) throw error;
    
    return NextResponse.json(sectors);
  } catch (error) {
    console.error('Error fetching admin sectors:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', sectors: [] }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { id, name, slug, description, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('industry_sectors')
      .update({ name, slug, description, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json({ success: true, sector: data });
  } catch (error) {
    console.error('Error updating sector:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { name, slug, description, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('industry_sectors')
      .insert({
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description || '',
        is_active: is_active !== false
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, sector: data });
  } catch (error) {
    console.error('Error creating sector:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) return NextResponse.json({ error: 'Sector ID is required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('industry_sectors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true, message: 'Sector deleted successfully' });
  } catch (error) {
    console.error('Error deleting sector:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
