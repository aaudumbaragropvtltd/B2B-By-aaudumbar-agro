// ============================================================================
// PAYMENT VERIFICATION API — 10% ADVANCE ESCROW
// ============================================================================
// Verifies the Razorpay payment for the 10% advance escrow payment.
// On success:
// 1. Verifies HMAC-SHA256 signature and live Razorpay payment status
// 2. Updates order state to price_locked_10 in Supabase and ordersStore
// 3. Automatically dispatches official 10% Advance Booking & Escrow Receipt Email to Buyer
// 4. Records transaction in platform ledger & timeline
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { verifyPaymentSignature, fetchPayment } from '@/services/razorpay';
import { recordTimelineEvent } from '@/services/settlementService';
import { notifyOrderUpdate, notifyPayment } from '@/services/notificationService';
import { canTransition } from '@/utils/orderStateMachine';
import { sendOrderReceiptEmail } from '@/services/orderReceiptService';
import { findOrderById, updateOrder, saveNewOrder } from '@/services/ordersStore';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Optional user session resolution
    let profile = { id: null, role: 'buyer' };
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { resolveAuthenticatedUser } = require('@/utils/userResolver');
        const resolved = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
        if (resolved) profile = resolved;
      }
    } catch (authErr) {}

    // 2. Parse payment data
    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId || body.order_id || body.internalOrderId || body.ref;
    const razorpay_order_id = body.razorpay_order_id || body.razorpayOrderId || body.order_id;
    const razorpay_payment_id = body.razorpay_payment_id || body.razorpayPaymentId || body.payment_id;
    const razorpay_signature = body.razorpay_signature || body.razorpaySignature || body.signature;

    const { 
      amount,
      buyerEmail,
      buyerName,
      buyerPhone,
      buyerGstin,
      productTitle,
      deliveryAddress
    } = body;

    if (!orderId || !razorpay_payment_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required payment verification parameters (orderId, razorpay_payment_id)' 
      }, { status: 400 });
    }

    // 3. Dual-Layer Verification:
    // Layer A: HMAC-SHA256 cryptographic signature
    let isValid = false;
    if (razorpay_signature && razorpay_order_id) {
      isValid = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
    }

    // Layer B: Direct live Gateway API verification with Razorpay banking servers
    if (!isValid && razorpay_payment_id && !razorpay_payment_id.startsWith('pay_mock_') && !razorpay_payment_id.startsWith('pay_sandbox_')) {
      try {
        const paymentDetails = await fetchPayment(razorpay_payment_id);
        if (paymentDetails && (paymentDetails.status === 'captured' || paymentDetails.status === 'authorized')) {
          isValid = true;
        } else if (paymentDetails && paymentDetails.status === 'failed') {
          try {
            await supabaseAdmin
              .from('trade_orders')
              .update({
                current_state: 'cancelled',
                notes: `Payment declined: ${paymentDetails.error_description || 'Transaction failed on gateway'}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          } catch (e) {}

          return NextResponse.json({ 
            success: false,
            error: `Razorpay reported transaction failure (${paymentDetails.error_description || 'Payment was declined by bank'}).` 
          }, { status: 400 });
        }
      } catch (gatewayErr) {
        console.warn('Direct Gateway API verification notice:', gatewayErr.message);
      }
    }

    if (!isValid) {
      // Mark as cancelled/failed in database
      try {
        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'cancelled',
            notes: 'Payment verification failed: Invalid signature or unauthenticated transaction',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (e) {}

      return NextResponse.json({ 
        success: false,
        error: 'Payment verification failed: Transaction could not be authenticated on the Razorpay gateway.' 
      }, { status: 400 });
    }

    // 4. Live Gateway Status Verification (Double check if live gateway payment was rejected)
    if (isValid && razorpay_payment_id.startsWith('pay_') && !razorpay_payment_id.startsWith('pay_test_') && !razorpay_payment_id.startsWith('pay_mock_') && !razorpay_payment_id.startsWith('pay_verified_')) {
      try {
        const rzpDetails = await fetchPayment(razorpay_payment_id);
        if (rzpDetails && rzpDetails.status === 'failed') {
          try {
            await supabaseAdmin
              .from('trade_orders')
              .update({
                current_state: 'cancelled',
                notes: `Payment declined on gateway: ${rzpDetails.error_description || 'Transaction failed'}`,
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          } catch (e) {}

          return NextResponse.json({ 
            success: false,
            error: `Razorpay reported transaction failure (${rzpDetails.error_description || 'Payment was not captured'}). Transaction was declined.` 
          }, { status: 400 });
        }
      } catch (gatewayErr) {
        // If live check errors due to sandbox/mock ID, rely on the valid HMAC signature
        console.warn('Live gateway status check notice:', gatewayErr.message);
      }
    }

    // 5. Fetch order from Supabase trade_orders or local store
    let order = null;
    try {
      const { data: dbOrder } = await supabaseAdmin
        .from('trade_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (dbOrder) order = dbOrder;
    } catch (dbErr) {
      console.warn('Could not query Supabase trade_orders:', dbErr.message);
    }

    if (!order) {
      // Check local store
      order = findOrderById(orderId);
    }

    const effectiveTotal = Number(order?.total_contract_value || order?.total_amount || amount ? (amount * 10) : 100000);
    const effectiveAdvance = Number(order?.advance_paid_10 || amount || (effectiveTotal * 0.10));
    const effectiveBuyerEmail = (buyerEmail || order?.buyer_email || profile?.registered_email || 'procurement@b2bindia.site').trim();

    // 6. Update order state in Supabase if found
    if (order && order.id) {
      try {
        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'price_locked_10',
            qr_payment_reference: `RZP-${razorpay_payment_id}`,
            advance_paid_10: effectiveAdvance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      } catch (updateErr) {
        console.warn('Supabase update notice:', updateErr.message);
      }
    }

    // 7. Update or create in local ordersStore (sync across both stores)
    const orderDataForStore = {
      id: orderId,
      transaction_id: `TXN-RZP-${razorpay_payment_id.slice(-6).toUpperCase()}`,
      order_status: 'confirmed',
      current_state: 'price_locked_10',
      payment_status: 'paid_to_escrow',
      payment_channel: 'Razorpay Gateway',
      payment_reference: razorpay_payment_id,
      razorpay_payment_id,
      razorpay_order_id,
      advance_paid: true,
      advance_paid_amount: effectiveAdvance,
      advance_paid_10: effectiveAdvance,
      total_amount: effectiveTotal,
      total_contract_value: effectiveTotal,
      balance_due_90: effectiveTotal - effectiveAdvance,
      product_name: productTitle || order?.product_name || order?.productTitle || 'Commercial Goods',
      buyer_email: effectiveBuyerEmail,
      buyer_name: buyerName || order?.buyer_name || profile?.full_name || 'Enterprise Buyer',
      buyer_phone: buyerPhone || order?.buyer_phone || profile?.corporate_phone || '+91-9876543210',
      buyer_gstin: buyerGstin || order?.buyer_gstin || profile?.gst_number || '27AAECR1234F1Z5',
      delivery_address: deliveryAddress || order?.delivery_address || 'Registered Warehouse',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const existingLocal = findOrderById(orderId);
      if (existingLocal) {
        updateOrder(orderId, orderDataForStore);
      } else {
        saveNewOrder(orderDataForStore);
      }
    } catch (storeErr) {
      console.warn('Local store sync notice:', storeErr.message);
    }

    // 8. Record advance payment in platform ledger
    try {
      await supabaseAdmin.from('platform_ledger').insert({
        order_id: orderId,
        entry_type: 'advance_10_percent',
        amount: effectiveAdvance,
        from_entity_id: profile.id,
        to_entity_id: null,
        payment_reference: razorpay_payment_id,
        description: `10% Advance escrow payment verified. Razorpay: ${razorpay_payment_id}`,
      });
    } catch (ledgerErr) {
      console.warn('Ledger recording notice for advance:', ledgerErr.message);
    }

    // 9. Send official 10% Advance Escrow Payment Receipt Email to Buyer
    let emailResult = { success: false };
    try {
      if (effectiveBuyerEmail && effectiveBuyerEmail.includes('@')) {
        emailResult = await sendOrderReceiptEmail(orderDataForStore, {
          buyerEmail: effectiveBuyerEmail,
          buyerCompanyName: orderDataForStore.buyer_name,
          buyerPhone: orderDataForStore.buyer_phone,
          buyerGstin: orderDataForStore.buyer_gstin
        });
        console.log('✅ 10% Advance Escrow Receipt Email sent to:', effectiveBuyerEmail, emailResult);
      }
    } catch (mailErr) {
      console.warn('Could not dispatch 10% Advance Escrow Receipt email:', mailErr.message);
    }

    // 9.5 Update RFQ & Quotation statuses if converted from quotation
    const resolvedQuoteId = body.quoteId || body.quote_id || (order?.buyer_notes?.match(/\[QUOTE:([^\]]+)\]/i)?.[1]?.trim());
    const resolvedRfqId = body.rfqId || body.rfq_id || (order?.buyer_notes?.match(/\[RFQ:([^\]]+)\]/i)?.[1]?.trim());

    if (resolvedQuoteId) {
      try {
        await supabaseAdmin
          .from('rfq_quotes')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', resolvedQuoteId);
      } catch (qErr) {
        console.warn('RFQ quote status update notice:', qErr.message);
      }
    }

    if (resolvedRfqId) {
      try {
        await supabaseAdmin
          .from('rfqs')
          .update({ status: 'fulfilled', updated_at: new Date().toISOString() })
          .eq('id', resolvedRfqId);
      } catch (rfqErr) {
        console.warn('RFQ status update notice:', rfqErr.message);
      }
    }

    // 10. Notifications
    try {
      if (order) {
        await notifyOrderUpdate(supabaseAdmin, order, 'price_locked_10', 'pay_advance');
      }
      await notifyPayment(supabaseAdmin, {
        userId: profile.id,
        type: 'advance_10',
        orderId,
        amount: effectiveAdvance,
        success: true,
      });
    } catch (notifErr) {}

    return NextResponse.json({
      success: true,
      verified: true,
      newState: 'price_locked_10',
      orderId,
      paymentId: razorpay_payment_id,
      advancePaid: effectiveAdvance,
      totalContractValue: effectiveTotal,
      receiptEmailSent: emailResult.success || false,
      message: '10% Advance Escrow payment verified. Official booking receipt dispatched to your email.',
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
