// ============================================================================
// RAZORPAY WEBHOOK HANDLER
// ============================================================================
// Handles Razorpay webhook events as a server-side fallback.
// Verifies webhook signature and processes payment events.
//
// Configure in Razorpay Dashboard:
//   URL: https://your-domain.com/api/webhook/payment
//   Secret: RAZORPAY_WEBHOOK_SECRET env var
//   Events: payment.captured, payment.failed, order.paid
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/services/razorpay';
import { notifyPayment } from '@/services/notificationService';

export async function POST(request) {
  try {
    // 1. Read raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 2. Verify webhook signature
    if (signature && !verifyWebhookSignature(rawBody, signature)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`[Webhook] Received event: ${eventType}`);

    // 3. Initialize Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key'
    );

    // 4. Handle payment.captured — payment was successful
    if (eventType === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      if (!payment) return NextResponse.json({ status: 'ignored', reason: 'no payment entity' });

      const orderId = payment.notes?.order_id;
      const paymentType = payment.notes?.payment_type;

      if (!orderId) {
        console.log('[Webhook] No order_id in payment notes. Ignoring.');
        return NextResponse.json({ status: 'ignored', reason: 'no order_id' });
      }

      // Fetch the order
      const { data: order } = await supabaseAdmin
        .from('trade_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) {
        console.log(`[Webhook] Order ${orderId} not found`);
        return NextResponse.json({ status: 'ignored', reason: 'order not found' });
      }

      // Handle 10% advance payment
      if (paymentType === 'advance_10_percent' && order.current_state === 'quotation_issued') {
        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'price_locked_10',
            razorpay_payment_id_advance: payment.id,
            qr_payment_reference: `RZP-${payment.id}`,
          })
          .eq('id', orderId);

        // Record ledger entry
        await supabaseAdmin.from('platform_ledger').insert({
          order_id: orderId,
          entry_type: 'advance_10_percent',
          amount: payment.amount / 100, // Razorpay sends amount in paise
          from_entity_id: order.buyer_id,
          to_entity_id: null,
          payment_reference: payment.id,
          description: `10% advance (webhook). Razorpay: ${payment.id}`,
        });

        // Timeline entry
        await supabaseAdmin.from('order_timeline').insert({
          order_id: orderId,
          from_state: 'quotation_issued',
          to_state: 'price_locked_10',
          action: 'pay_advance_webhook',
          notes: `Advance payment confirmed via webhook. Amount: ₹${payment.amount / 100}`,
          metadata: { razorpay_payment_id: payment.id },
        });

        // Notify
        await notifyPayment(supabaseAdmin, {
          userId: order.buyer_id,
          type: 'advance_10',
          orderId,
          amount: payment.amount / 100,
          success: true,
        });

        // Record in payments table
        await supabaseAdmin.from('payments').insert({
          user_id: order.buyer_id,
          order_id: orderId,
          amount: payment.amount / 100,
          currency: payment.currency || 'INR',
          payment_method: payment.method || 'Razorpay',
          status: 'successful',
          transaction_reference: payment.id,
          payment_type: paymentType || 'advance_10_percent',
          notes: `Confirmed via Webhook (Payment ID: ${payment.id})`
        });

        console.log(`[Webhook] Order ${orderId} advanced to price_locked_10`);
      }

      return NextResponse.json({ status: 'processed', orderId, paymentType });
    }

    // 5. Handle payment.failed
    if (eventType === 'payment.failed') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.notes?.order_id;
      const failureReason = payment?.error_description || payment?.error_reason || 'Transaction declined by bank/gateway';
      const errorCode = payment?.error_code || 'GATEWAY_ERROR';

      if (orderId) {
        // Fetch order
        const { data: order } = await supabaseAdmin
          .from('trade_orders')
          .select('buyer_id, current_state')
          .eq('id', orderId)
          .single();

        const buyerId = order?.buyer_id || null;

        // 1. Mark order as cancelled in trade_orders
        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'cancelled',
            notes: `Payment Failed: ${failureReason} (Code: ${errorCode})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        // 2. Timeline entry
        try {
          await supabaseAdmin.from('order_timeline').insert({
            order_id: orderId,
            from_state: order?.current_state || 'quotation_issued',
            to_state: 'cancelled',
            action: 'payment_failed_webhook',
            notes: `Payment failed on gateway: ${failureReason}`,
            metadata: { razorpay_payment_id: payment?.id, error_code: errorCode },
          });
        } catch (tErr) {}

        // 3. Update local store
        try {
          const { updateOrder } = require('@/services/ordersStore');
          updateOrder(orderId, {
            order_status: 'cancelled',
            payment_status: 'payment_failed',
            delivery_status: 'cancelled',
            notes: `Payment Failed: ${failureReason}`,
            updated_at: new Date().toISOString(),
          });
        } catch (sErr) {}

        if (buyerId) {
          await notifyPayment(supabaseAdmin, {
            userId: buyerId,
            type: payment?.notes?.payment_type || 'unknown',
            orderId,
            amount: (payment?.amount || 0) / 100,
            success: false,
          });
        }

        // Record failed payment in payments table
        await supabaseAdmin.from('payments').insert({
          user_id: buyerId,
          order_id: orderId,
          amount: (payment?.amount || 0) / 100,
          currency: payment?.currency || 'INR',
          payment_method: payment?.method || 'Razorpay',
          status: 'failed',
          transaction_reference: payment?.id || `FAIL-${Date.now()}`,
          payment_type: payment?.notes?.payment_type || 'advance_10_percent',
          failure_reason: failureReason,
          notes: `Failed via Webhook: ${errorCode} - ${failureReason}`
        });

        // Activity log
        await supabaseAdmin.from('activity_logs').insert({
          action: 'payment_failed_webhook',
          details: {
            order_id: orderId,
            razorpay_payment_id: payment?.id,
            error: failureReason,
            code: errorCode,
          },
        });

        console.log(`[Webhook] Order ${orderId} marked as cancelled due to payment failure`);
      }

      return NextResponse.json({ status: 'processed', event: 'payment.failed', orderId });
    }

    // 6. Unhandled event type
    console.log(`[Webhook] Unhandled event type: ${eventType}`);
    return NextResponse.json({ status: 'ignored', event: eventType });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

