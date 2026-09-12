import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readAllOrders, writeAllOrders } from '@/services/ordersStore';
import { sendTotalInvoiceEmail } from '@/services/orderInvoiceService';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// GET — Fetch all logistics records, gate passes, shipments, and delivery tracking
export async function GET(request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';
    const status = searchParams.get('status') || 'all';

    // 1. Fetch from Supabase trade_orders and users in parallel
    const [ordersRes, usersRes] = await Promise.all([
      supabaseAdmin
        .from('trade_orders')
        .select(`
          id,
          product_id,
          quantity,
          unit_label,
          agreed_unit_price,
          total_contract_value,
          advance_paid_10,
          balance_due_90,
          current_state,
          qr_payment_reference,
          buyer_notes,
          created_at,
          updated_at,
          product:products ( id, title ),
          buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, warehouse_address, city, state, gst_number ),
          supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, warehouse_address, city, state, gst_number )
        `)
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('users').select('id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state')
    ]);

    const dbOrders = ordersRes.data || [];
    const usersList = usersRes.data || [];
    const usersMap = {};
    usersList.forEach(u => {
      if (u.id) usersMap[u.id] = u;
      if (u.registered_email) usersMap[u.registered_email.toLowerCase()] = u;
    });

    // 2. Fetch local ordersStore records (strictly completed payment orders only)
    const COMPLETED_PAYMENT_STATUSES = ['paid_to_escrow', 'paid', 'completed', 'settled', 'released_to_supplier'];
    const localOrders = readAllOrders().filter(o => {
      const isPaid = COMPLETED_PAYMENT_STATUSES.includes(o.payment_status);
      const isFailedOrUnpaid = o.payment_status === 'payment_failed' || 
                               o.payment_status === 'unpaid' ||
                               o.order_status === 'cancelled' || 
                               o.order_status === 'payment_failed' ||
                               o.order_status === 'quotation_issued';
      return isPaid && !isFailedOrUnpaid;
    });

    // 3. Try fetching from logistics_arrangements table in Supabase if exists
    let supabaseLogistics = [];
    try {
      const { data: logData, error: logErr } = await supabaseAdmin
        .from('logistics_arrangements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!logErr && Array.isArray(logData)) {
        supabaseLogistics = logData;
      }
    } catch (e) {
      // Non-critical fallback
    }

    // 4. Consolidate into standardized Logistics objects
    const logisticsMap = new Map();

    // Add local orders (only confirmed paid orders)
    localOrders.forEach(o => {
      const id = o.id || o.transaction_id || `LOG-${Date.now()}`;
      const buyerObj = usersMap[o.buyer_email?.toLowerCase()] || {};
      logisticsMap.set(id, {
        id,
        order_id: o.id || o.transaction_id || 'N/A',
        transaction_id: o.transaction_id || o.id,
        delivery_option: o.delivery_option || (o.visitor_count ? 'pickup' : 'deliver'),
        dispatch_status: o.order_status || o.delivery_status || 'confirmed',
        product_name: o.product_name || o.productTitle || 'Commercial Goods',
        quantity: o.quantity || 1000,
        unit: o.unit || 'Kg',
        total_amount: o.total_amount || o.total || 0,
        
        // Delivery Details
        delivery_date: o.delivery_date || null,
        delivery_address: o.delivery_address || buyerObj.warehouse_address || `${buyerObj.city || 'Pune'}, ${buyerObj.state || 'Maharashtra'}`,
        receiver_name: o.receiver_name || o.buyer_name || buyerObj.full_name || 'Consignee Manager',
        receiver_phone: o.receiver_phone || o.buyer_phone || buyerObj.corporate_phone || '+91-9226497450',
        transporter_name: o.transporter_name || 'B2B India Express Freight Fleet',
        
        // Pickup Details
        arrival_date: o.arrival_date || o.delivery_date || null,
        visitor_count: o.visitor_count ? parseInt(o.visitor_count, 10) : 1,
        vehicle_number: o.vehicle_number || 'MH-12-TR-9420',
        p1_name: o.p1_name || o.p1Name || 'Designated Driver',
        p1_phone: o.p1_phone || o.p1Phone || '+91-9819283746',
        p1_aadhar: o.p1_aadhar || o.p1Aadhar || 'XXXX-XXXX-4829',
        p2_name: o.p2_name || o.p2Name || null,
        p2_phone: o.p2_phone || o.p2Phone || null,
        p2_aadhar: o.p2_aadhar || o.p2Aadhar || null,
        
        tracking_number: o.tracking_number || (o.delivery_option === 'pickup' ? `GATE-PASS-2026-${String(id).slice(-4)}` : `AWB-IND-${String(id).slice(-6)}`),
        buyer_company: buyerObj.company_name || o.buyer_company || o.buyer_name || 'Enterprise Buyer',
        buyer_email: o.buyer_email || buyerObj.registered_email || 'buyer@b2bindia.site',
        supplier_company: o.supplier_company || 'Aaudumbar Agro Warehousing',
        notes: o.notes || '',
        created_at: o.created_at || new Date().toISOString()
      });
    });

    // Merge DB Trade Orders (Strictly only orders where payment has been completed)
    const paidStates = ['price_locked_10', 'warehouse_loading', 'in_transit', 'dispatched', 'ready_for_pickup', 'collected', 'delivered', 'completed', 'settled'];
    dbOrders.forEach(o => {
      // Exclude draft quotations, uncompleted checkout attempts, and cancelled orders from active logistics dispatches
      if (!paidStates.includes(o.current_state)) {
        return; // Skip unpaid / draft / cancelled / failed orders
      }

      let parsedLogistics = null;
      if (o.buyer_notes && o.buyer_notes.includes('<!--LOGISTICS_META:')) {
        try {
          const match = o.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/s);
          if (match && match[1]) {
            parsedLogistics = JSON.parse(match[1]);
          }
        } catch (e) {}
      }

      const id = o.id;
      const txnRef = o.qr_payment_reference;
      
      const isPickup = parsedLogistics?.delivery_option === 'pickup';
      let dispatchStatus = 'confirmed';
      if (parsedLogistics?.dispatch_status) {
        dispatchStatus = parsedLogistics.dispatch_status;
      } else if (o.current_state === 'dispatched' || o.current_state === 'in_transit') {
        dispatchStatus = 'in_transit';
      } else if (o.current_state === 'completed' || o.current_state === 'delivered' || o.current_state === 'settled') {
        dispatchStatus = isPickup ? 'collected' : 'delivered';
      } else if (o.current_state === 'warehouse_loading') {
        dispatchStatus = 'warehouse_loading';
      }

      // Look for match by id or transaction reference
      let existingKey = logisticsMap.has(id) ? id : null;
      if (!existingKey && txnRef) {
        for (const [key, item] of logisticsMap.entries()) {
          if (item.transaction_id === txnRef || item.order_id === txnRef) {
            existingKey = key;
            break;
          }
        }
      }

      if (existingKey) {
        const local = logisticsMap.get(existingKey);
        logisticsMap.set(existingKey, {
          ...local,
          delivery_option: parsedLogistics?.delivery_option || local.delivery_option,
          delivery_address: parsedLogistics?.delivery_address || local.delivery_address,
          delivery_date: parsedLogistics?.delivery_date || local.delivery_date,
          receiver_name: parsedLogistics?.receiver_name || local.receiver_name,
          receiver_phone: parsedLogistics?.receiver_phone || local.receiver_phone,
          transporter_name: parsedLogistics?.transporter_name || local.transporter_name,
          arrival_date: parsedLogistics?.arrival_date || local.arrival_date,
          visitor_count: parsedLogistics?.visitor_count || local.visitor_count,
          vehicle_number: (parsedLogistics?.vehicle_number) || local.vehicle_number,
          p1_name: (parsedLogistics?.p1_name) || local.p1_name,
          p1_phone: (parsedLogistics?.p1_phone) || local.p1_phone,
          p1_aadhar: (parsedLogistics?.p1_aadhar) || local.p1_aadhar,
          p2_name: parsedLogistics?.p2_name || local.p2_name,
          p2_phone: parsedLogistics?.p2_phone || local.p2_phone,
          p2_aadhar: parsedLogistics?.p2_aadhar || local.p2_aadhar,
          tracking_number: parsedLogistics?.tracking_number || local.tracking_number,
          dispatch_status: dispatchStatus || local.dispatch_status
        });
      } else {
        logisticsMap.set(id, {
          id,
          order_id: o.id,
          transaction_id: o.qr_payment_reference || o.id,
          delivery_option: parsedLogistics?.delivery_option || (isPickup ? 'pickup' : 'deliver'),
          dispatch_status: dispatchStatus,
          product_name: o.product?.title || 'Industrial Wholesale Commodity',
          quantity: o.quantity || 1000,
          unit: o.unit_label || 'units',
          total_amount: o.total_contract_value || 0,
          
          delivery_date: parsedLogistics?.delivery_date || null,
          delivery_address: parsedLogistics?.delivery_address || o.buyer?.warehouse_address || `${o.buyer?.city || 'Pune'}, ${o.buyer?.state || 'Maharashtra'}`,
          receiver_name: parsedLogistics?.receiver_name || o.buyer?.full_name || o.buyer?.company_name || 'Consignee Executive',
          receiver_phone: parsedLogistics?.receiver_phone || o.buyer?.corporate_phone || o.buyer?.phone_number || '+91-9226497450',
          transporter_name: parsedLogistics?.transporter_name || 'Pan-India Logistics Partner',
          
          arrival_date: parsedLogistics?.arrival_date || parsedLogistics?.delivery_date || null,
          visitor_count: parsedLogistics?.visitor_count || 1,
          vehicle_number: parsedLogistics?.vehicle_number || (isPickup ? 'MH-14-BT-5520' : 'MH-12-TR-9420'),
          p1_name: parsedLogistics?.p1_name || 'Authorized Fleet Driver',
          p1_phone: parsedLogistics?.p1_phone || '+91-9822001122',
          p1_aadhar: parsedLogistics?.p1_aadhar || 'XXXX-XXXX-9120',
          p2_name: parsedLogistics?.p2_name || null,
          p2_phone: parsedLogistics?.p2_phone || null,
          p2_aadhar: parsedLogistics?.p2_aadhar || null,
          
          tracking_number: parsedLogistics?.tracking_number || (isPickup ? `GATE-PASS-2026-${String(id).slice(-4)}` : `AWB-IND-${String(id).slice(-6)}`),
          buyer_company: o.buyer?.company_name || o.buyer?.full_name || 'Procurement Buyer',
          buyer_email: o.buyer?.registered_email || 'buyer@b2bindia.site',
          supplier_company: o.supplier?.company_name || 'Aaudumbar Agro Warehousing',
          notes: o.buyer_notes ? o.buyer_notes.replace(/<!--LOGISTICS_META:.*?-->/s, '').trim() : '',
          created_at: o.created_at
        });
      }
    });

    let allLogistics = Array.from(logisticsMap.values());

    // Filter by query
    if (query) {
      allLogistics = allLogistics.filter(l => 
        (l.order_id || '').toLowerCase().includes(query) ||
        (l.tracking_number || '').toLowerCase().includes(query) ||
        (l.buyer_company || '').toLowerCase().includes(query) ||
        (l.supplier_company || '').toLowerCase().includes(query) ||
        (l.vehicle_number || '').toLowerCase().includes(query) ||
        (l.receiver_name || '').toLowerCase().includes(query) ||
        (l.p1_name || '').toLowerCase().includes(query) ||
        (l.delivery_address || '').toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (status !== 'all') {
      allLogistics = allLogistics.filter(l => l.dispatch_status === status);
    }

    // Sort newest first
    allLogistics.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return NextResponse.json({
      success: true,
      count: allLogistics.length,
      logistics: allLogistics
    });
  } catch (error) {
    console.error('Error fetching admin logistics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PUT — Update Logistics Status, Fulfillment Mode (Pickup vs Delivery), Tracking Number, Transporter, Vehicle or Driver Details
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      id, 
      delivery_option,
      tracking_number, 
      dispatch_status, 
      vehicle_number, 
      transporter_name, 
      delivery_date, 
      arrival_date, 
      delivery_address,
      receiver_name,
      receiver_phone,
      p1_name,
      p1_phone,
      p1_aadhar,
      p2_name,
      p2_phone,
      p2_aadhar,
      visitor_count,
      notes 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Logistics / Order ID is required' }, { status: 400 });
    }

    // 1. Update in local ordersStore
    const orders = readAllOrders();
    const orderIndex = orders.findIndex(o => o.id === id || o.transaction_id === id || o.order_id === id);
    if (orderIndex !== -1) {
      orders[orderIndex] = {
        ...orders[orderIndex],
        ...(delivery_option !== undefined ? { delivery_option } : {}),
        ...(tracking_number !== undefined ? { tracking_number } : {}),
        ...(dispatch_status !== undefined ? { order_status: dispatch_status, delivery_status: dispatch_status } : {}),
        ...(vehicle_number !== undefined ? { vehicle_number } : {}),
        ...(transporter_name !== undefined ? { transporter_name } : {}),
        ...(delivery_date !== undefined ? { delivery_date } : {}),
        ...(arrival_date !== undefined ? { arrival_date } : {}),
        ...(delivery_address !== undefined ? { delivery_address } : {}),
        ...(receiver_name !== undefined ? { receiver_name } : {}),
        ...(receiver_phone !== undefined ? { receiver_phone } : {}),
        ...(p1_name !== undefined ? { p1_name } : {}),
        ...(p1_phone !== undefined ? { p1_phone } : {}),
        ...(p1_aadhar !== undefined ? { p1_aadhar } : {}),
        ...(p2_name !== undefined ? { p2_name } : {}),
        ...(p2_phone !== undefined ? { p2_phone } : {}),
        ...(p2_aadhar !== undefined ? { p2_aadhar } : {}),
        ...(visitor_count !== undefined ? { visitor_count: parseInt(visitor_count, 10) || 1 } : {}),
        ...(notes !== undefined ? { notes } : {}),
        updated_at: new Date().toISOString()
      };
      writeAllOrders(orders);
    }

    // 2. Update in Supabase trade_orders if matches
    const supabaseAdmin = getAdminClient();
    try {
      const dbUpdates = {};
      if (dispatch_status) {
        // Valid PostgreSQL enum values: 'quotation_issued', 'price_locked_10', 'warehouse_loading', 'settled', 'cancelled', 'rerouted'
        const dbStateMap = {
          'confirmed': 'price_locked_10',
          'price_locked_10': 'price_locked_10',
          'in_transit': 'warehouse_loading',
          'out_for_delivery': 'warehouse_loading',
          'delivered': 'settled',
          'collected': 'settled',
          'settled': 'settled',
          'ready_for_pickup': 'warehouse_loading',
          'warehouse_loading': 'warehouse_loading',
          'cancelled': 'cancelled'
        };
        dbUpdates.current_state = dbStateMap[dispatch_status] || 'price_locked_10';
      }

      // Check if logistics metadata should be updated in Supabase buyer_notes
      const hasLogisticsUpdates = [
        'delivery_option', 'arrival_date', 'delivery_date', 'delivery_address',
        'receiver_name', 'receiver_phone', 'vehicle_number', 'p1_name', 'p1_phone',
        'p1_aadhar', 'p2_name', 'p2_phone', 'p2_aadhar', 'transporter_name', 'visitor_count', 'tracking_number'
      ].some(k => body[k] !== undefined);

      if (hasLogisticsUpdates || notes !== undefined || tracking_number !== undefined || dispatch_status !== undefined) {
        const { data: existingTradeOrder } = await supabaseAdmin
          .from('trade_orders')
          .select('buyer_notes, qr_payment_reference')
          .eq('id', id)
          .maybeSingle();

        if (tracking_number && !existingTradeOrder?.qr_payment_reference) {
          dbUpdates.qr_payment_reference = tracking_number;
        }

        if (existingTradeOrder) {
          let currentNotes = existingTradeOrder?.buyer_notes || '';
          let meta = {};
          if (currentNotes.includes('<!--LOGISTICS_META:')) {
            try {
              const match = currentNotes.match(/<!--LOGISTICS_META:(.*?)-->/s);
              if (match && match[1]) meta = JSON.parse(match[1]);
            } catch (e) {}
          }

          [
            'delivery_option', 'arrival_date', 'delivery_date', 'delivery_address',
            'receiver_name', 'receiver_phone', 'vehicle_number', 'p1_name', 'p1_phone',
            'p1_aadhar', 'p2_name', 'p2_phone', 'p2_aadhar', 'transporter_name', 'visitor_count', 'tracking_number'
          ].forEach(k => {
            if (body[k] !== undefined) meta[k] = body[k];
          });

          if (dispatch_status !== undefined) {
            meta.dispatch_status = dispatch_status;
            meta.order_status = dispatch_status;
          }

          const incomingNotes = notes !== undefined ? notes : currentNotes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
          const cleanNotes = incomingNotes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
          dbUpdates.buyer_notes = `<!--LOGISTICS_META:${JSON.stringify(meta)}-->\n${cleanNotes}`.trim();
        }
      }

      if (Object.keys(dbUpdates).length > 0) {
        dbUpdates.updated_at = new Date().toISOString();
        await supabaseAdmin
          .from('trade_orders')
          .update(dbUpdates)
          .eq('id', id);
      }

      // Also update in logistics_arrangements table
      if (dispatch_status) {
        await supabaseAdmin
          .from('logistics_arrangements')
          .update({ dispatch_status, updated_at: new Date().toISOString() })
          .eq('order_id', id);
      }
    } catch (e) {
      console.warn('Could not sync status or logistics to trade_orders:', e.message);
    }

    // Automatically email total invoice directly to buyer if status is collected or warehouse_loading
    const dispatchNormalized = (dispatch_status || '').toLowerCase();
    if (dispatchNormalized === 'collected' || dispatchNormalized === 'warehouse_loading') {
      try {
        const orderToEmail = orderIndex !== -1 ? orders[orderIndex] : { id };
        const buyerEmailTarget = (orderToEmail?.buyer_email || orderToEmail?.email || '').trim();
        if (buyerEmailTarget && buyerEmailTarget.includes('@')) {
          sendTotalInvoiceEmail(orderToEmail, { buyerEmail: buyerEmailTarget }).catch(e => {
            console.warn('Auto invoice email on logistics status change notice:', e.message);
          });
        }
      } catch(e) {}
    }

    return NextResponse.json({
      success: true,
      message: 'Logistics details updated successfully',
      updated: { id, delivery_option, tracking_number, dispatch_status, vehicle_number, transporter_name }
    });
  } catch (error) {
    console.error('Error updating admin logistics:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
