import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { orderId, transactionSignature, amountPaid, paymentStage, physicalArrivalDate } = await request.json();

    // 1. Structural Payload Validation
    if (!orderId || !transactionSignature || !amountPaid || !paymentStage) {
      return NextResponse.json({ error: "Malformed payment clearance telemetry payload." }, { status: 400 });
    }

    // 2. Fetch target contract state with associated product metrics
    const { data: order, error: orderError } = await supabaseAdmin
      .from('trade_orders')
      .select('*, products(name, base_price_per_kg)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Target contract trace not found in database records." }, { status: 404 });
    }

    // 3. Stage 1: Processing the 10% Price Lock Advance Payment
    if (paymentStage === 'ADVANCE_10') {
      const expectedAdvance = Number(order.total_cost) * 0.10;
      
      // Allow a tiny margin for float point variations
      if (Math.abs(amountPaid - expectedAdvance) > 1.0) {
        return NextResponse.json({ error: "Advance value mismatch. Escrow verification denied." }, { status: 422 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('trade_orders')
        .update({ stage: 'price_locked', metadata: { advance_tx: transactionSignature } })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true, nextRequiredStage: "LOADING_90" });
    }

    // 4. Stage 2: Final Warehouse QR Loading Code Verification (Remaining 90%)
    if (paymentStage === 'FINAL_90') {
      if (order.stage !== 'price_locked') {
        return NextResponse.json({ error: "Order must be in locked stage for warehouse settlement." }, { status: 400 });
      }

      // Check for Early Arrival Hospitality Perk (Exactly 1 day before loading window)
      let accommodationVoucherIssued = false;
      if (physicalArrivalDate && order.scheduled_loading_date) {
        const arrival = new Date(physicalArrivalDate);
        const scheduled = new Date(order.scheduled_loading_date);
        
        const timeDifference = scheduled.getTime() - arrival.getTime();
        const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        if (daysDifference === 1) {
          accommodationVoucherIssued = true;
        }
      }

      // Compute Platform Fee Split Rules (Fixed ₹2 per kilogram structural platform fee)
      const platformFee = Number(order.quantity_kg) * 2.00;
      const supplierPayout = Number(amountPaid) - platformFee;

      // Ensure ledger math is balanced before committing
      if (supplierPayout <= 0) {
        return NextResponse.json({ error: "Invalid financial allocation breakdown." }, { status: 400 });
      }

      // 5. Atomic Update Execution via Supabase Relational Client
      const { error: ledgerError } = await supabaseAdmin.rpc('execute_order_settlement', {
        p_order_id: orderId,
        p_gross: amountPaid,
        p_fee: platformFee,
        p_payout: supplierPayout,
        p_accommodation: accommodationVoucherIssued,
        p_signature: transactionSignature
      });

      if (ledgerError) throw ledgerError;

      return NextResponse.json({
        success: true,
        finalStage: "settled",
        accommodationVoucherIssued,
        invoiceManifest: {
          grossCollected: amountPaid,
          platformCut: platformFee,
          supplierNet: supplierPayout,
          hospitalityCovered: accommodationVoucherIssued
        }
      });
    }

    return NextResponse.json({ error: "Unrecognized settlement phase target." }, { status: 400 });

  } catch (error) {
    console.error("Critical Escrow System Execution Exception:", error);
    return NextResponse.json({ error: "Internal processing loop timeout failure.", details: error.message }, { status: 500 });
  }
}
