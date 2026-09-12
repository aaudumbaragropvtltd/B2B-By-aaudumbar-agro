// ============================================================================
// RAZORPAY STANDARD PAYMENT SIGNATURE VERIFICATION ENDPOINT
// ============================================================================
// Endpoint: POST /api/verify-payment
// Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
// Validates authentic payment signatures and returns success.
// ============================================================================

import { NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/services/razorpay';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const razorpay_order_id = body.razorpay_order_id || body.razorpayOrderId || body.order_id;
    const razorpay_payment_id = body.razorpay_payment_id || body.razorpayPaymentId || body.payment_id;
    const razorpay_signature = body.razorpay_signature || body.razorpaySignature || body.signature;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
        },
        { status: 400 }
      );
    }

    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Payment verification failed: Invalid signature mismatch',
        },
        { status: 400 }
      );
    }

    // If internal orderId is provided and Supabase is configured, update trade_orders
    const orderId = body.orderId || body.internalOrderId;
    if (orderId && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'price_locked_10',
            qr_payment_reference: `RZP-${razorpay_payment_id}`,
            notes: `Razorpay Verified Txn: ${razorpay_payment_id} | Order: ${razorpay_order_id}`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('Database note during verification:', dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
