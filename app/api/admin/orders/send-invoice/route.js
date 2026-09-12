import { NextResponse } from 'next/server';
import { readAllOrders } from '@/services/ordersStore';
import { sendTotalInvoiceEmail } from '@/services/orderInvoiceService';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, customEmail, buyerCompanyName, buyerGstin, buyerPhone, hsnCode, order: clientOrder } = body;

    if (!orderId && !clientOrder) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch direct orders from persistent JSON store
    const directOrders = readAllOrders();
    let order = directOrders.find(o => 
      (orderId && (o.id === orderId || o.transaction_id === orderId || o.id?.toString() === orderId?.toString() || o.transaction_id?.toString() === orderId?.toString()))
    );

    // 2. If not found in direct orders, check Supabase trade_orders
    if (!order && orderId) {
      try {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let query = supabaseAdmin
          .from('trade_orders')
          .select(`
            *,
            buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, gstin ),
            product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
          `);

        if (orderId.includes('-') && orderId.length === 36) {
          query = query.eq('id', orderId);
        } else {
          query = query.eq('qr_payment_reference', orderId);
        }

        const { data: so, error: soErr } = await query.single();

        if (!soErr && so) {
          let resolvedTitle = so.product?.title || 'Commercial Contract Commodity';
          if (so.buyer_notes && so.buyer_notes.includes('Accepted RFQ:')) {
            const match = so.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
            if (match && match[1]) resolvedTitle = match[1].trim();
          }

          let deliveryAddr = null;
          if (so.buyer_notes && so.buyer_notes.includes('Delivery to:')) {
            const match = so.buyer_notes.match(/Delivery to:\s*([^.\n]+)/i);
            if (match && match[1]) deliveryAddr = match[1].trim();
          }

          const totalAmt = Number(so.total_contract_value || 0);
          const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);
          const balanceAmt = Number(so.balance_due_90 || totalAmt * 0.90);
          const buyerPhoneNum = so.buyer?.corporate_phone || so.buyer?.phone_number || '';

          order = {
            id: so.id,
            transaction_id: so.qr_payment_reference || `TXN-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
            created_at: so.created_at,
            buyer_id: so.buyer_id,
            buyer_email: so.buyer?.registered_email || 'buyer@b2bindia.site',
            buyer_name: so.buyer?.company_name || so.buyer?.full_name || 'Registered Buyer',
            buyer_company_name: so.buyer?.company_name || so.buyer?.full_name || 'Registered Buyer',
            buyer_phone: buyerPhoneNum,
            buyer_whatsapp: so.buyer?.whatsapp_number || buyerPhoneNum,
            buyer_gstin: so.buyer?.gstin || '27AAACR1234F1Z5',
            buyer_location: [so.buyer?.city, so.buyer?.state].filter(Boolean).join(', '),
            product_name: resolvedTitle,
            quantity: so.quantity || 1,
            unit: so.unit_label || 'Units',
            price_per_unit: so.agreed_unit_price,
            total_amount: totalAmt,
            advance_amount: advanceAmt,
            balance_amount: balanceAmt,
            payment_status: '100% Fully Settled',
            order_status: so.current_state || 'settled',
            delivery_option: 'deliver',
            delivery_address: deliveryAddr || so.buyer?.city || 'Delivery Warehouse',
            delivery_date: so.estimated_delivery_days ? `${so.estimated_delivery_days} days` : 'Completed',
            receiver_name: so.buyer?.company_name || 'Authorized Receiver',
            receiver_phone: buyerPhoneNum,
            tracking_number: `B2B-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
            notes: so.buyer_notes || 'Trade Escrow Order'
          };
        }
      } catch (dbErr) {
        console.warn('Supabase lookup for invoice dispatch notice:', dbErr.message);
      }
    }

    // 3. Fallback to client-provided order data if needed
    if (!order && clientOrder) {
      order = clientOrder;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order record not found' }, { status: 404 });
    }

    const effectiveBuyerEmail = (customEmail || order.buyer_email || order.buyerEmail || '').trim();

    if (!effectiveBuyerEmail || !effectiveBuyerEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid buyer email is required' }, { status: 400 });
    }

    const options = {
      buyerEmail: effectiveBuyerEmail,
      buyerCompanyName: buyerCompanyName || order.buyer_company_name || order.buyer_name,
      buyerGstin: buyerGstin || order.buyer_gstin || order.gstin,
      buyerPhone: buyerPhone || order.buyer_phone || order.receiver_phone,
      hsnCode: hsnCode || order.hsn_code || order.hsn || '1006.30',
    };

    const result = await sendTotalInvoiceEmail(order, options);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch invoice email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✓ Official Tax Invoice [${result.invoiceNumber}] with both GSTINs successfully emailed to ${result.recipientEmail}`,
      invoiceNumber: result.invoiceNumber,
      transactionId: result.transactionId,
      recipientEmail: result.recipientEmail
    });

  } catch (err) {
    console.error('Error in /api/admin/orders/send-invoice:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
