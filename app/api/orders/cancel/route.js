import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { updateOrder } from '@/services/ordersStore';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, reason = 'Payment Failed or Cancelled by User' } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Update in Supabase trade_orders if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'cancelled',
            notes: `Cancelled: ${reason}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('DB cancel note:', dbErr.message);
      }
    }

    // 2. Update local ordersStore if exists
    try {
      updateOrder(orderId, {
        order_status: 'cancelled',
        delivery_status: 'cancelled',
        payment_status: 'payment_failed',
        notes: `Cancelled: ${reason}`,
        updated_at: new Date().toISOString(),
      });
    } catch (storeErr) {
      console.warn('Store update note:', storeErr.message);
    }

    return NextResponse.json({
      success: true,
      order_status: 'cancelled',
      payment_status: 'payment_failed',
      message: 'Order status successfully marked as cancelled / payment failed.',
      orderId,
    });
  } catch (err) {
    console.error('Error cancelling order:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
