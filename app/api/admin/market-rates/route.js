import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch rates
    const { data, error } = await supabaseAdmin
      .from('market_rates')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) {
      console.warn('market_rates table notice:', error.message);
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.warn('Error fetching market rates:', error.message);
    return NextResponse.json([]);
  }
}
