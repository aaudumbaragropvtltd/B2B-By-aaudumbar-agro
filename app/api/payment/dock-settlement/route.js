// ============================================================================
// DOCK SETTLEMENT API — 90% BALANCE PAYMENT
// ============================================================================
// Creates a Razorpay order for the 90% dock balance payment.
// Only accessible when order is in 'warehouse_loading' state.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createRazorpayOrder, getPublicKeyId } from '@/services/razorpay';

export async function POST(request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get buyer profile
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role, registered_email, company_name, corporate_phone')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Get the order
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('trade_orders')
      .select('*, products(title, sector_id(slug))')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Verify order state
    if (order.current_state !== 'warehouse_loading') {
      return NextResponse.json({
        error: `Order must be in "warehouse_loading" state for dock payment. Current state: ${order.current_state}`,
      }, { status: 400 });
    }

    // Verify buyer owns this order
    if (order.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'You are not the buyer of this order' }, { status: 403 });
    }

    // 4. Calculate dock payment amount (90% of total)
    const dockAmount = Number(order.balance_due_90) || Number(order.total_contract_value) * 0.90;

    // 5. Create Razorpay order for dock payment
    const razorpayOrder = await createRazorpayOrder({
      amount: dockAmount,
      currency: 'INR',
      receipt: `dock-${orderId.slice(0, 8)}`,
      notes: {
        order_id: orderId,
        payment_type: 'dock_90_percent',
        buyer_company: profile.company_name,
      },
    });

    // 6. Store the Razorpay order reference on the trade order
    await supabaseAdmin
      .from('trade_orders')
      .update({ qr_payment_reference: `RZP-DOCK-${razorpayOrder.id}` })
      .eq('id', orderId);

    // 7. Return payment details for frontend
    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      razorpayKeyId: getPublicKeyId(),
      amount: dockAmount,
      currency: 'INR',
      orderId,
      prefill: {
        name: profile.company_name,
        email: profile.registered_email,
        contact: profile.corporate_phone,
      },
      notes: {
        productTitle: order.products?.title,
        paymentType: '90% Dock Balance',
      },
    });

  } catch (error) {
    console.error('Dock settlement order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dock payment order' },
      { status: 500 }
    );
  }
}
