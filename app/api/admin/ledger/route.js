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

    // Fetch ledger entries with related entities
    const { data: ledger, error } = await supabaseAdmin
      .from('platform_ledger')
      .select(`
        *,
        from_entity:from_entity_id(company_name, role),
        to_entity:to_entity_id(company_name, role),
        trade_orders(total_contract_value, current_state)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    
    return NextResponse.json(ledger || []);
  } catch (error) {
    console.error('Error fetching admin ledger:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', ledger: [] }, { status: 500 });
  }
}
