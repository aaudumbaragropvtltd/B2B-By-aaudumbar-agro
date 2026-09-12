import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

export async function GET(request) {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let user = null;
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: tokenUser } = await supabaseAdmin.auth.getUser(token);
          if (tokenUser?.user) {
            user = tokenUser.user;
          }
        } catch (e) {
          console.warn('Bearer auth error in dashboard orders:', e.message);
        }
      }
    }

    if (!user) {
      try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      } catch (e) {}
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { id: userId, role } = profile;

    let query = supabaseAdmin
      .from('trade_orders')
      .select(`
        id,
        quantity,
        unit_label,
        agreed_unit_price,
        logistics_cost,
        tax_rate_percent,
        tax_amount,
        subtotal,
        total_contract_value,
        advance_paid_10,
        balance_due_90,
        current_state,
        buyer_notes,
        supplier_notes,
        estimated_delivery_days,
        created_at,
        product:products ( id, title, hero_image_url ),
        buyer:users!trade_orders_buyer_id_fkey ( id, company_name, registered_email, corporate_phone ),
        supplier:users!trade_orders_supplier_id_fkey ( id, company_name, registered_email, corporate_phone, warehouse_address )
      `)
      .order('created_at', { ascending: false });

    const { searchParams } = new URL(request.url);
    const viewParam = searchParams.get('view') || searchParams.get('role');

    if (viewParam === 'buyer' || role === 'buyer') {
      // Show ONLY orders placed by the user (as buyer)
      query = query.eq('buyer_id', userId);
    } else if (viewParam === 'supplier' || role === 'supplier') {
      // Show orders received by the supplier
      query = query.eq('supplier_id', userId);
    } else {
      // Default: show orders placed by this user
      query = query.eq('buyer_id', userId);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Error fetching orders' }, { status: 500 });
    }

    const STATUS_LABEL_MAP = {
      quotation_issued: 'Quotation Issued',
      price_locked_10: 'Price Locked (10% Paid)',
      warehouse_loading: 'Warehouse Loading',
      settled: 'Settled ✅',
      cancelled: 'Cancelled',
      rerouted: 'Rerouted',
    };

    // Map the Supabase result to the format expected by the frontend
    const mappedOrders = (orders || []).map(order => {
      const isBuyerRole = role === 'buyer';
      const counterparty = isBuyerRole ? order.supplier?.company_name : order.buyer?.company_name;
      
      // Extract exact commodity title from buyer_notes if created from an RFQ
      let resolvedTitle = order.product?.title || 'Trade Commodity';
      if (order.buyer_notes && order.buyer_notes.includes('Accepted RFQ:')) {
        const match = order.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
        if (match && match[1]) {
          resolvedTitle = match[1].trim();
        }
      }

      const totalVal = Number(order.total_contract_value || 0);
      const advance10 = Number(order.advance_paid_10 || totalVal * 0.10);
      const balance90 = Number(order.balance_due_90 || totalVal * 0.90);
      const rawState = order.current_state || 'price_locked_10';
      
      return {
        id: order.id,
        productName: resolvedTitle,
        supplierName: counterparty || 'B2B India Verified Partner',
        value: `₹${totalVal.toLocaleString('en-IN')}`,
        rawTotal: totalVal,
        advancePaid: advance10,
        advancePaidFormatted: `₹${Math.round(advance10).toLocaleString('en-IN')}`,
        balanceDue: balance90,
        balanceDueFormatted: `₹${Math.round(balance90).toLocaleString('en-IN')}`,
        status: rawState,
        statusLabel: STATUS_LABEL_MAP[rawState] || rawState.replace(/_/g, ' '),
        current_state: rawState,
        quantity: order.quantity,
        unit: order.unit_label,
        agreedUnitPrice: order.agreed_unit_price,
        deliveryDays: order.estimated_delivery_days || 7,
        buyerNotes: order.buyer_notes,
        buyer: order.buyer,
        supplier: order.supplier,
        date: new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      };
    });

    return NextResponse.json({ orders: mappedOrders });
  } catch (error) {
    console.error('Error in GET /api/dashboard/orders:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
