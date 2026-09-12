import { NextResponse } from 'next/server';
import { createAdminClient } from '@/services/supabaseServer';
import { saveNewOrder, findOrderById, updateOrder } from '@/services/ordersStore';
import { sendOrderReceiptEmail } from '@/services/orderReceiptService';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Server-side validation
    if (!body.deliveryOption) {
      return NextResponse.json({ error: 'Delivery option is required' }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const txnId = body.transactionId || body.transaction_id || `TXN-IND-${timestamp.toString().slice(-6)}${randomSuffix}`;
    const targetOrderId = body.orderId || body.order_id || null;

    // Check if order already exists in store
    let existingOrder = (targetOrderId && findOrderById(targetOrderId)) || (txnId && findOrderById(txnId)) || null;

    // ENFORCE ONE-TIME SELECTION RULE:
    // Once Direct Delivery ('deliver') or Self Godown Pickup ('pickup') has been confirmed, it cannot be changed.
    // The user can update all fields (dates, address, receiver, vehicle, driver), but NOT the mode.
    let finalDeliveryOption = body.deliveryOption;
    if (existingOrder && existingOrder.delivery_option) {
      finalDeliveryOption = existingOrder.delivery_option;
    } else if (targetOrderId) {
      try {
        const supabase = createAdminClient();
        const { data: dbOrder } = await supabase
          .from('trade_orders')
          .select('buyer_notes')
          .eq('id', targetOrderId)
          .maybeSingle();

        if (dbOrder?.buyer_notes) {
          const match = dbOrder.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/);
          if (match) {
            try {
              const meta = JSON.parse(match[1]);
              if (meta.delivery_option) {
                finalDeliveryOption = meta.delivery_option;
              }
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    // Standardized payload ensuring user updates are completely preserved and propagated to Admin Panel
    const orderPayload = {
      id: existingOrder?.id || targetOrderId || null,
      order_id: targetOrderId || existingOrder?.order_id || existingOrder?.id || null,
      transaction_id: txnId || existingOrder?.transaction_id,
      buyer_email: body.buyerEmail || body.buyer_email || existingOrder?.buyer_email || 'buyer@b2bindia.site',
      buyer_name: existingOrder?.buyer_name || body.buyerName || body.receiverName || body.p1Name || 'Verified Buyer',
      buyer_phone: existingOrder?.buyer_phone || body.buyerPhone || body.receiverPhone || body.p1Phone || '',
      product_id: body.productId || body.product_id || existingOrder?.product_id || null,
      product_name: body.productTitle || body.product_name || body.productName || existingOrder?.product_name || 'Commercial Goods',
      quantity: Number(body.quantity) || existingOrder?.quantity || 1000,
      unit: body.unit || existingOrder?.unit || 'Kg',
      price_per_unit: Number(body.pricePerUnit || body.price_per_unit) || existingOrder?.price_per_unit || 0,
      subtotal: Number(body.subtotal) || existingOrder?.subtotal || 0,
      gst: Number(body.gst) || existingOrder?.gst || 0,
      logistics_cost: Number(body.logisticsCost || body.logistics_cost) || existingOrder?.logistics_cost || 0,
      total_amount: Number(body.totalAmount || body.total_amount || body.total) || existingOrder?.total_amount || 0,
      advance_amount: Number(body.advanceAmount || body.advance_amount) || existingOrder?.advance_amount || ((Number(body.totalAmount || body.total) || 0) * 0.1),
      payment_status: existingOrder?.payment_status || 'paid_to_escrow',
      order_status: existingOrder?.order_status || 'confirmed',
      delivery_status: existingOrder?.delivery_status || existingOrder?.order_status || 'confirmed',
      
      delivery_option: finalDeliveryOption,
      delivery_date: (body.deliveryDate !== undefined ? body.deliveryDate : body.delivery_date) ?? existingOrder?.delivery_date ?? null,
      delivery_address: (body.deliveryAddress !== undefined ? body.deliveryAddress : body.delivery_address) ?? existingOrder?.delivery_address ?? null,
      receiver_name: (body.receiverName !== undefined ? body.receiverName : body.receiver_name) ?? existingOrder?.receiver_name ?? null,
      receiver_phone: (body.receiverPhone !== undefined ? body.receiverPhone : body.receiver_phone) ?? existingOrder?.receiver_phone ?? null,
      transporter_name: (body.transporterName !== undefined ? body.transporterName : body.transporter_name) ?? existingOrder?.transporter_name ?? null,
      
      arrival_date: (body.arrivalDate !== undefined ? body.arrivalDate : body.arrival_date) ?? existingOrder?.arrival_date ?? null,
      visitor_count: body.visitorCount ? parseInt(body.visitorCount) : (existingOrder?.visitor_count || 1),
      vehicle_number: (body.vehicleNumber !== undefined ? body.vehicleNumber : body.vehicle_number) ?? existingOrder?.vehicle_number ?? null,
      p1_name: (body.p1Name !== undefined ? body.p1Name : body.p1_name) ?? existingOrder?.p1_name ?? null,
      p1_phone: (body.p1Phone !== undefined ? body.p1Phone : body.p1_phone) ?? existingOrder?.p1_phone ?? null,
      p1_aadhar: (body.p1Aadhar !== undefined ? body.p1Aadhar : body.p1_aadhar) ?? existingOrder?.p1_aadhar ?? null,
      p2_name: (body.p2Name !== undefined ? body.p2Name : body.p2_name) ?? existingOrder?.p2_name ?? null,
      p2_phone: (body.p2Phone !== undefined ? body.p2Phone : body.p2_phone) ?? existingOrder?.p2_phone ?? null,
      p2_aadhar: (body.p2Aadhar !== undefined ? body.p2Aadhar : body.p2_aadhar) ?? existingOrder?.p2_aadhar ?? null,
      tracking_number: existingOrder?.tracking_number || (finalDeliveryOption === 'pickup' 
        ? (body.trackingNumber || `GATE-PASS-${timestamp.toString().slice(-4)}`) 
        : (body.trackingNumber || `AWB-IND-${timestamp.toString().slice(-6)}`))
    };

    // 1. Save or update in ordersStore (persisted in JSON file & local cache)
    let savedOrder;
    if (existingOrder) {
      savedOrder = updateOrder(existingOrder.id || existingOrder.transaction_id || existingOrder.order_id, orderPayload);
    } else {
      savedOrder = saveNewOrder(orderPayload);
    }

    // 2. Synchronize to Supabase (trade_orders table & logistics_arrangements)
    try {
      const supabase = createAdminClient();
      
      // Structured Logistics Metadata
      const logisticsMeta = {
        delivery_option: orderPayload.delivery_option,
        delivery_date: orderPayload.delivery_date,
        delivery_address: orderPayload.delivery_address,
        receiver_name: orderPayload.receiver_name,
        receiver_phone: orderPayload.receiver_phone,
        transporter_name: orderPayload.transporter_name,
        arrival_date: orderPayload.arrival_date,
        visitor_count: orderPayload.visitor_count,
        vehicle_number: orderPayload.vehicle_number,
        p1_name: orderPayload.p1_name,
        p1_phone: orderPayload.p1_phone,
        p1_aadhar: orderPayload.p1_aadhar,
        p2_name: orderPayload.p2_name,
        p2_phone: orderPayload.p2_phone,
        p2_aadhar: orderPayload.p2_aadhar,
        tracking_number: orderPayload.tracking_number,
        confirmed_at: new Date().toISOString()
      };

      const metaString = `<!--LOGISTICS_META:${JSON.stringify(logisticsMeta)}-->`;

      const isUuid = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      let targetDbOrderId = null;
      if (targetOrderId && isUuid(targetOrderId)) {
        targetDbOrderId = targetOrderId;
      } else if (existingOrder?.id && isUuid(existingOrder.id)) {
        targetDbOrderId = existingOrder.id;
      }

      if (!targetDbOrderId) {
        // Find safely by qr_payment_reference or buyer_notes without casting txnId to uuid
        const { data: matchedOrder } = await supabase
          .from('trade_orders')
          .select('id, buyer_notes')
          .or(`qr_payment_reference.eq.${txnId},qr_payment_reference.ilike.%${txnId.slice(-6)}%,buyer_notes.ilike.%${txnId}%`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (matchedOrder) targetDbOrderId = matchedOrder.id;
      }

      if (targetDbOrderId) {
        const { data: existingTradeOrder } = await supabase
          .from('trade_orders')
          .select('buyer_notes, current_state, qr_payment_reference')
          .eq('id', targetDbOrderId)
          .maybeSingle();

        if (existingTradeOrder) {
          let cleanNotes = (existingTradeOrder?.buyer_notes || '').replace(/<!--LOGISTICS_META:.*?-->/s, '').trim();
          const updatedNotes = `${metaString}\n${cleanNotes}`.trim();

          await supabase
            .from('trade_orders')
            .update({
              buyer_notes: updatedNotes,
              current_state: existingTradeOrder?.current_state === 'quotation_issued' ? 'price_locked_10' : (existingTradeOrder?.current_state || 'price_locked_10'),
              qr_payment_reference: existingTradeOrder?.qr_payment_reference || txnId || undefined,
              updated_at: new Date().toISOString()
            })
            .eq('id', targetDbOrderId);
        }
      }

      // Also attempt inserting/updating logistics_arrangements
      const dbPayload = {
        order_id: targetOrderId || orderPayload.id || orderPayload.transaction_id,
        delivery_option: orderPayload.delivery_option,
        delivery_date: orderPayload.delivery_date,
        delivery_address: orderPayload.delivery_address,
        receiver_name: orderPayload.receiver_name,
        receiver_phone: orderPayload.receiver_phone,
        transporter_name: orderPayload.transporter_name,
        arrival_date: orderPayload.arrival_date,
        visitor_count: orderPayload.visitor_count,
        vehicle_number: orderPayload.vehicle_number,
        p1_name: orderPayload.p1_name,
        p1_phone: orderPayload.p1_phone,
        p1_aadhar: orderPayload.p1_aadhar,
        p2_name: orderPayload.p2_name,
        p2_phone: orderPayload.p2_phone,
        p2_aadhar: orderPayload.p2_aadhar,
        tracking_number: orderPayload.tracking_number,
        dispatch_status: 'confirmed'
      };

      const { data: existingArrangement } = await supabase
        .from('logistics_arrangements')
        .select('id')
        .eq('order_id', dbPayload.order_id)
        .maybeSingle();

      if (existingArrangement?.id) {
        await supabase
          .from('logistics_arrangements')
          .update({ ...dbPayload, updated_at: new Date().toISOString() })
          .eq('id', existingArrangement.id);
      } else {
        await supabase.from('logistics_arrangements').insert([dbPayload]).select().catch(() => {});
      }
    } catch (dbErr) {
      console.warn('Supabase sync notice in logistics confirm (handled):', dbErr.message);
    }

    // 3. Automatically send 10% payment clearance & order booking receipt email
    try {
      sendOrderReceiptEmail(savedOrder)
        .then(result => {
          if (result.success) {
            console.log('10% Order Booking Receipt Email sent successfully:', result.receiptRef);
          } else {
            console.warn('10% Receipt email notice:', result.error);
          }
        })
        .catch(emailErr => {
          console.error('Async receipt email dispatch error:', emailErr);
        });
    } catch (emailTriggerErr) {
      console.error('Receipt email trigger error:', emailTriggerErr);
    }

    return NextResponse.json({ success: true, ...savedOrder, data: savedOrder });

  } catch (err) {
    console.error('Logistics confirmation API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
