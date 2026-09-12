import { NextResponse } from 'next/server';
import { readAllOrders } from '@/services/ordersStore';
import { sendTotalInvoiceEmail } from '@/services/orderInvoiceService';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, email, customEmail } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID or Transaction ID is required' }, { status: 400 });
    }

    // 1. Check local orders store
    const directOrders = readAllOrders();
    let order = directOrders.find(o => 
      o.id === orderId || 
      o.transaction_id === orderId || 
      o.id?.toString() === orderId?.toString() || 
      o.transaction_id?.toString() === orderId?.toString()
    );

    // 2. Check Supabase trade_orders if not found or to enrich
    try {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      let query = supabaseAdmin
        .from('trade_orders')
        .select(`
          *,
          buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gstin ),
          product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
        `);

      if (orderId.includes('-') && orderId.length === 36) {
        query = query.eq('id', orderId);
      } else {
        query = query.eq('qr_payment_reference', orderId);
      }

      const { data: so } = await query.maybeSingle();

      if (so) {
        let parsedLogistics = {};
        if (so.buyer_notes && so.buyer_notes.includes('<!--LOGISTICS_META:')) {
          try {
            const match = so.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/s);
            if (match && match[1]) parsedLogistics = JSON.parse(match[1]);
          } catch(e) {}
        }

        let resolvedTitle = so.product?.title || 'Commercial Commodity Contract';
        if (so.buyer_notes && so.buyer_notes.includes('Accepted RFQ:')) {
          const match = so.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
          if (match && match[1]) resolvedTitle = match[1].trim();
        }

        let deliveryAddr = parsedLogistics.delivery_address || null;
        if (!deliveryAddr && so.buyer_notes && so.buyer_notes.includes('Delivery to:')) {
          const match = so.buyer_notes.match(/Delivery to:\s*([^.\n]+)/i);
          if (match && match[1]) deliveryAddr = match[1].trim();
        }

        const totalAmt = Number(so.total_contract_value || 0);
        const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);
        const balanceAmt = Number(so.balance_due_90 || totalAmt * 0.90);
        const buyerPhoneNum = so.buyer?.corporate_phone || so.buyer?.phone_number || '';

        const dbOrder = {
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
          order_status: parsedLogistics.dispatch_status || parsedLogistics.order_status || so.current_state || 'settled',
          delivery_option: parsedLogistics.delivery_option || (parsedLogistics.visitor_count ? 'pickup' : 'deliver'),
          delivery_address: deliveryAddr || so.buyer?.city || 'Delivery Warehouse',
          delivery_date: parsedLogistics.delivery_date || (so.estimated_delivery_days ? `${so.estimated_delivery_days} days` : 'Completed'),
          receiver_name: parsedLogistics.receiver_name || so.buyer?.company_name || 'Authorized Receiver',
          receiver_phone: parsedLogistics.receiver_phone || buyerPhoneNum,
          arrival_date: parsedLogistics.arrival_date || null,
          vehicle_number: parsedLogistics.vehicle_number || null,
          p1_name: parsedLogistics.p1_name || null,
          p1_phone: parsedLogistics.p1_phone || null,
          p1_aadhar: parsedLogistics.p1_aadhar || null,
          tracking_number: parsedLogistics.tracking_number || `B2B-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
          notes: so.buyer_notes || 'Trade Escrow Order'
        };

        order = order ? { ...dbOrder, ...order } : dbOrder;
      }
    } catch (dbErr) {
      console.warn('Supabase lookup in /api/orders/send-invoice notice:', dbErr.message);
    }

    if (!order) {
      return NextResponse.json({ error: 'Order record not found.' }, { status: 404 });
    }

    // Check status eligibility: Total GST invoice is allowed once warehouse loading or godown collection begins
    const eligibleStatuses = ['warehouse_loading', 'collected', 'ready_for_pickup', 'in_transit', 'out_for_delivery', 'delivered', 'settled', 'completed'];
    const currentStatus = order.order_status || order.dispatch_status || order.status || '';
    
    if (!eligibleStatuses.includes(currentStatus)) {
      return NextResponse.json({ 
        error: 'Total GST Tax Invoice will be generated once Warehouse Loading begins or the order is Collected at Godown.' 
      }, { status: 400 });
    }

    const effectiveRecipientEmail = (email || customEmail || order.buyer_email || order.buyerEmail || '').trim();

    if (!effectiveRecipientEmail || !effectiveRecipientEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid recipient email address is required to dispatch invoice.' }, { status: 400 });
    }

    const options = {
      buyerEmail: effectiveRecipientEmail,
      buyerCompanyName: order.buyer_company_name || order.buyer_name || order.company_name,
      buyerGstin: order.buyer_gstin || order.gstin,
      buyerPhone: order.buyer_phone || order.receiver_phone,
      hsnCode: order.hsn_code || order.hsn || '1006.30',
    };

    const result = await sendTotalInvoiceEmail(order, options);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to dispatch invoice email.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✓ Official 100% GST Tax Invoice [${result.invoiceNumber}] successfully sent to ${result.recipientEmail}!`,
      invoiceNumber: result.invoiceNumber,
      transactionId: result.transactionId,
      recipientEmail: result.recipientEmail
    });

  } catch (err) {
    console.error('Error in /api/orders/send-invoice:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
