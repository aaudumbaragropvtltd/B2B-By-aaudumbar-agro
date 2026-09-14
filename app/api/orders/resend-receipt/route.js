import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { readAllOrders } from '@/services/ordersStore';
import { sendOrderReceiptEmail } from '@/services/orderReceiptService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, email } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID or Transaction ID is required' }, { status: 400 });
    }

    const orders = readAllOrders();
    let order = orders.find(o => o.id === orderId || o.transaction_id === orderId);

    if (!order) {
      // Check Supabase trade_orders
      try {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let query = supabaseAdmin
          .from('trade_orders')
          .select(`
            *,
            buyer:users!trade_orders_buyer_id_fkey ( id, company_name, full_name, registered_email, corporate_phone, phone_number ),
            supplier:users!trade_orders_supplier_id_fkey ( id, company_name, full_name, registered_email, corporate_phone ),
            product:products ( id, title )
          `);

        if (orderId.includes('-') && orderId.length === 36) {
          query = query.eq('id', orderId);
        } else {
          query = query.eq('qr_payment_reference', orderId);
        }

        const { data: so } = await query.single();

        if (so) {
          let resolvedTitle = so.product?.title || 'Contract Commodity';
          if (so.buyer_notes && so.buyer_notes.includes('Accepted RFQ:')) {
            const match = so.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
            if (match && match[1]) resolvedTitle = match[1].trim();
          }

          const totalAmt = Number(so.total_contract_value || 0);
          const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);

          order = {
            id: so.id,
            transaction_id: so.qr_payment_reference || `TXN-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
            created_at: so.created_at,
            buyer_email: so.buyer?.registered_email || 'buyer@b2bindia.site',
            buyer_company_name: so.buyer?.company_name || 'Enterprise Buyer',
            company_name: so.buyer?.company_name || 'Enterprise Buyer',
            buyer_contact_person: so.buyer?.full_name || 'Authorized Representative',
            buyer_name: so.buyer?.company_name || so.buyer?.full_name || 'Registered Buyer',
            buyer_phone: so.buyer?.corporate_phone || so.buyer?.phone_number || '',
            product_name: resolvedTitle,
            quantity: so.quantity || 1,
            unit: so.unit_label || 'Units',
            price_per_unit: so.agreed_unit_price,
            total_amount: totalAmt,
            advance_amount: advanceAmt,
            balance_amount: Number(so.balance_due_90 || totalAmt * 0.90),
            payment_status: 'paid_to_escrow',
            order_status: so.current_state || 'price_locked_10',
            delivery_option: 'deliver',
            receiver_name: so.buyer?.company_name || 'Authorized Buyer',
            receiver_phone: so.buyer?.corporate_phone || '',
            tracking_number: `B2B-ESCROW-${so.id.slice(0, 8).toUpperCase()}`
          };
        }
      } catch (dbErr) {
        console.warn('Supabase fetch for receipt notice:', dbErr.message);
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order record not found' }, { status: 404 });
    }

    const targetEmail = (email || order.buyer_email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid recipient email address' }, { status: 400 });
    }

    const orderToEmail = {
      ...order,
      buyer_email: targetEmail
    };

    const result = await sendOrderReceiptEmail(orderToEmail);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch receipt email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `10% Order Booking Receipt sent to ${targetEmail}`,
      receiptRef: result.receiptRef,
      transactionId: result.transactionId,
      recipientEmail: targetEmail
    });

  } catch (err) {
    console.error('Error in /api/orders/resend-receipt:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
