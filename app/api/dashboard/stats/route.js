import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

export async function GET(request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { id: userId, role, status } = profile;

    let stats = [];

    if (role === 'buyer') {
      const { data: activeOrders } = await supabaseAdmin
        .from('trade_orders')
        .select('id')
        .eq('buyer_id', userId)
        .neq('current_state', 'cancelled')
        .neq('current_state', 'settled');

      const { data: pendingQuotes } = await supabaseAdmin
        .from('trade_orders')
        .select('id')
        .eq('buyer_id', userId)
        .eq('current_state', 'quotation_issued');

      const { data: allOrders } = await supabaseAdmin
        .from('trade_orders')
        .select('total_contract_value, supplier_id, current_state')
        .eq('buyer_id', userId)
        .neq('current_state', 'cancelled');

      const totalSpent = allOrders?.reduce((acc, order) => acc + (order.total_contract_value || 0), 0) || 0;
      const uniqueSuppliers = new Set(allOrders?.map(o => o.supplier_id)).size;

      stats = [
        { label: 'Active Orders', value: activeOrders?.length?.toString() || '0', icon: '📦', change: 'Current' },
        { label: 'Pending Quotes', value: pendingQuotes?.length?.toString() || '0', icon: '📋', change: 'Awaiting Action' },
        { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: '💰', change: 'Lifetime' },
        { label: 'Suppliers Used', value: uniqueSuppliers.toString(), icon: '🏭', change: 'Unique' },
      ];
    } else {
      // Handles 'supplier', 'both', and 'admin'
      const { data: activeListings } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('supplier_id', userId)
        .eq('is_active', true);

      const { data: incomingOrders } = await supabaseAdmin
        .from('trade_orders')
        .select('id')
        .eq('supplier_id', userId)
        .neq('current_state', 'cancelled')
        .neq('current_state', 'settled');

      const { data: allOrders } = await supabaseAdmin
        .from('trade_orders')
        .select('total_contract_value')
        .eq('supplier_id', userId)
        .neq('current_state', 'cancelled');

      const revenue = allOrders?.reduce((acc, order) => acc + (order.total_contract_value || 0), 0) || 0;
      const verificationStr = status === 'active' ? 'Verified' : status === 'pending_verification' ? 'Pending' : 'Verified';

      stats = [
        { label: 'Active Listings', value: activeListings?.length?.toString() || '0', icon: '📦', change: 'Live' },
        { label: 'Incoming Orders', value: incomingOrders?.length?.toString() || '0', icon: '📥', change: 'To Process' },
        { label: 'Revenue', value: `₹${revenue.toLocaleString()}`, icon: '💰', change: 'Lifetime' },
        { label: 'Merchant Status', value: verificationStr, icon: '🛡️', change: role === 'both' ? 'Dual Trade' : 'Supplier' },
      ];
    }

    return NextResponse.json({ role, status, stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
