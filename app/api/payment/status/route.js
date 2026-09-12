// ============================================================================
// PAYMENT STATUS LISTENER API — AJAX POLLING & STATUS VERIFICATION
// ============================================================================
// Checks the live real-time payment status of an Escrow Order.
// Used by the checkout page and modals to poll every 3 seconds for
// instant webhook or UPI / Bank Transfer / Razorpay confirmation.
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
    );

    // Query trade_orders table
    const { data: order, error } = await supabaseAdmin
      .from('trade_orders')
      .select('id, current_state, qr_payment_reference, razorpay_payment_id_advance, total_contract_value, product_id, supplier_id, buyer_id, updated_at')
      .or(`id.eq.${orderId},qr_payment_reference.ilike.%${orderId}%`)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Payment status query notice:', error.message);
    }

    // List of states indicating advance has been paid & locked
    const PAID_STATES = [
      'price_locked_10',
      'warehouse_loading',
      'in_transit',
      'dock_delivered',
      'dock_inspection_approved',
      'settled'
    ];

    if (order && PAID_STATES.includes(order.current_state)) {
      const advanceAmount = Math.round(Number(order.total_contract_value || 0) * 0.1);
      const isHighValue = Number(order.total_contract_value || 0) > 1000000;
      const finalAdvance = isHighValue ? 100000 : (advanceAmount || 10000);

      return NextResponse.json({
        success: true,
        paid: true,
        status: 'PAID',
        orderId: order.id,
        currentState: order.current_state,
        paymentReference: order.qr_payment_reference || order.razorpay_payment_id_advance || 'VERIFIED-ESCROW',
        advancePaid: finalAdvance,
        totalContractValue: order.total_contract_value || 0,
        updatedAt: order.updated_at,
      });
    }

    // If not found in DB or still in quotation_issued
    return NextResponse.json({
      success: true,
      paid: false,
      status: 'PENDING',
      orderId: orderId,
      currentState: order?.current_state || 'quotation_issued',
    });
  } catch (error) {
    console.error('Error in GET /api/payment/status:', error);
    return NextResponse.json({
      success: true,
      paid: false,
      status: 'PENDING',
      error: error.message
    });
  }
}
