// ============================================================================
// RAZORPAY STANDARD ORDER CREATION ENDPOINT
// ============================================================================
// Endpoint: POST /api/create-order
// Creates an official Razorpay order with amount in paise (min 100 paise / ₹1).
// ============================================================================

import { NextResponse } from 'next/server';
import { createRazorpayOrder, getPublicKeyId, isRazorpayConfigured } from '@/services/razorpay';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { amount, currency = 'INR', receipt, notes = {} } = body;

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json(
        { error: 'Amount is required and must be a valid number' },
        { status: 400 }
      );
    }

    // Convert to paise if not already (check if integer >= 100 or decimal in INR)
    const numAmount = Number(amount);
    let amountInPaise;
    
    // If client passes isPaise: true or amount is clearly already in paise (> 1000 for standard transactions or explicitly specified)
    if (body.isPaise) {
      amountInPaise = Math.round(numAmount);
    } else {
      // Default: treat amount as Rupees (INR) and convert to paise
      amountInPaise = Math.round(numAmount * 100);
    }

    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Amount must be at least 100 paise (₹1.00)' },
        { status: 400 }
      );
    }

    const receiptId = receipt || `rcpt_${Date.now()}`;
    const order = await createRazorpayOrder({
      amount: amountInPaise,
      currency,
      receipt: receiptId,
      notes,
      isPaise: true,
    });

    const keyId = getPublicKeyId();

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: keyId,
      status: order.status,
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    if (error.message && error.message.includes('Authentication failed')) {
      return NextResponse.json(
        { error: 'Razorpay Authentication failed: Invalid Key ID or Secret', details: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error creating Razorpay order' },
      { status: 500 }
    );
  }
}
