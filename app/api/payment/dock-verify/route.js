// ============================================================================
// DOCK PAYMENT VERIFICATION API — 90% BALANCE
// ============================================================================
// Verifies the Razorpay dock payment, then executes the full settlement:
// - Updates order to 'settled'
// - Inserts 3 ledger entries (dock payment, commission, supplier payout)
// - Records timeline + sends notifications
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { verifyPaymentSignature } from '@/services/razorpay';
import { computeSettlement, executeSettlement, recordTimelineEvent } from '@/services/settlementService';
import { notifyOrderUpdate, notifyPayment } from '@/services/notificationService';

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

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('firebase_uid', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Parse payment data
    const body = await request.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    // 3. Verify Razorpay signature
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await notifyPayment(supabaseAdmin, {
        userId: profile.id,
        type: 'dock_90',
        orderId,
        amount: 0,
        success: false,
      });
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    // 4. Fetch the order with product + sector info
    const { data: order, error: orderError } = await supabaseAdmin
      .from('trade_orders')
      .select('*, products(title, sector_id(slug, name))')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 5. Verify order state
    if (order.current_state !== 'warehouse_loading') {
      return NextResponse.json({
        error: `Order must be in "warehouse_loading" state for dock settlement. Current: ${order.current_state}`,
      }, { status: 400 });
    }

    if (order.buyer_id !== profile.id) {
      return NextResponse.json({ error: 'You are not the buyer of this order' }, { status: 403 });
    }

    // 6. Compute settlement
    const sectorSlug = order.products?.sector_id?.slug || 'default';
    const settlement = computeSettlement(order, sectorSlug);

    // 7. Execute atomic settlement
    const result = await executeSettlement(supabaseAdmin, {
      orderId,
      dockPaymentAmount: settlement.dockPaymentDue,
      commissionRate: settlement.commissionRatePercent,
      commissionAmount: settlement.commissionAmount,
      supplierPayout: settlement.supplierPayout,
      razorpayPaymentId: razorpay_payment_id,
      buyerId: order.buyer_id,
      supplierId: order.supplier_id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Settlement failed' }, { status: 500 });
    }

    // 8. Record in platform_ledger & send notifications
    await Promise.allSettled([
      supabaseAdmin.from('platform_ledger').insert({
        order_id: orderId,
        entry_type: 'dock_final_90_percent',
        amount: settlement.dockPaymentDue,
        from_entity_id: profile.id,
        to_entity_id: null,
        payment_reference: razorpay_payment_id,
        description: `90% Dock Settlement. Razorpay: ${razorpay_payment_id}`,
      }),
      notifyOrderUpdate(supabaseAdmin, order, 'settled', 'dock_payment_settled'),
      notifyPayment(supabaseAdmin, {
        userId: profile.id,
        type: 'dock_90',
        orderId,
        amount: settlement.dockPaymentDue,
        success: true,
      }),
    ]);

    // 9. Log settlement activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: profile.id,
      action: 'order_settled',
      details: {
        order_id: orderId,
        total_value: settlement.totalContractValue,
        commission: settlement.commissionAmount,
        supplier_payout: settlement.supplierPayout,
        razorpay_payment_id,
      },
    });

    return NextResponse.json({
      success: true,
      newState: 'settled',
      settlement: settlement.breakdown,
      message: 'Order settled successfully. Supplier payout initiated.',
    });

  } catch (error) {
    console.error('Dock payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Settlement failed' },
      { status: 500 }
    );
  }
}
