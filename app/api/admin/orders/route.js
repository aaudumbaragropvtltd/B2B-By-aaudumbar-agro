import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { readAllOrders, updateOrder, deleteOrder } from '@/services/ordersStore';
import { sendTotalInvoiceEmail } from '@/services/orderInvoiceService';

async function checkAdminAuth() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAdmin: false, isGuestDev: true }; // allow dev preview

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('firebase_uid', user.id)
      .single();

    return { isAdmin: profile?.role === 'admin', isGuestDev: false };
  } catch (err) {
    return { isAdmin: true, isGuestDev: true };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').toLowerCase();
    const typeFilter = searchParams.get('type') || 'all'; // 'all', 'deliver', 'pickup'

    // Completed payment states in PostgreSQL trade_orders enum (strictly: price_locked_10, warehouse_loading, settled)
    const VALID_SUPABASE_PAYMENT_STATES = [
      'price_locked_10',
      'warehouse_loading',
      'settled'
    ];

    const COMPLETED_PAYMENT_STATUSES = [
      'paid_to_escrow',
      'paid',
      'completed',
      'settled',
      'released_to_supplier'
    ];

    // 1. Fetch direct logistics orders from persistent store (strictly completed payments only)
    const directOrders = readAllOrders().filter(o => {
      const isPaid = COMPLETED_PAYMENT_STATUSES.includes(o.payment_status);
      const isFailedOrUnpaid = o.payment_status === 'payment_failed' || 
                               o.payment_status === 'unpaid' ||
                               o.order_status === 'cancelled' || 
                               o.order_status === 'payment_failed' ||
                               o.order_status === 'quotation_issued';
      return isPaid && !isFailedOrUnpaid;
    });

    // 2. Fetch trade_orders from Supabase if connected (strictly completed payments only)
    let supabaseOrders = [];
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      // Fetch transaction references from platform_ledger so transaction_id is 100% unified with payments & receipts
      const ledgerMap = new Map();
      try {
        const { data: ledgerEntries } = await supabaseAdmin
          .from('platform_ledger')
          .select('order_id, payment_reference')
          .not('order_id', 'is', null)
          .order('created_at', { ascending: false });

        (ledgerEntries || []).forEach(l => {
          if (l.order_id && l.payment_reference && !ledgerMap.has(l.order_id)) {
            ledgerMap.set(l.order_id, l.payment_reference);
          }
        });
      } catch (ledgerFetchErr) {
        console.warn('Ledger fetch notice in admin orders:', ledgerFetchErr.message);
      }

      const { data, error } = await supabaseAdmin
        .from('trade_orders')
        .select(`
          *,
          buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state ),
          supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, warehouse_address ),
          product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
        `)
        .in('current_state', VALID_SUPABASE_PAYMENT_STATES)
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseOrders = data
          .filter(so => VALID_SUPABASE_PAYMENT_STATES.includes(so.current_state))
          .map(so => {
            let logisticsMeta = {};
            let cleanNotes = so.buyer_notes || '';

            if (so.buyer_notes && so.buyer_notes.includes('<!--LOGISTICS_META:')) {
              try {
                const match = so.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/s);
                if (match && match[1]) {
                  logisticsMeta = JSON.parse(match[1]);
                  cleanNotes = so.buyer_notes.replace(/<!--LOGISTICS_META:.*?-->/s, '').trim();
                }
              } catch (e) {
                console.warn('Error parsing LOGISTICS_META from buyer_notes:', e);
              }
            }

            // Extract product name from buyer_notes if created from RFQ
            let resolvedTitle = so.product?.title || 'Contract Goods';
            if (cleanNotes && cleanNotes.includes('Accepted RFQ:')) {
              const match = cleanNotes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
              if (match && match[1]) {
                resolvedTitle = match[1].trim();
              }
            }

            let deliveryAddr = null;
            if (cleanNotes && cleanNotes.includes('Delivery to:')) {
              const match = cleanNotes.match(/Delivery to:\s*([^.\n]+)/i);
              if (match && match[1]) {
                deliveryAddr = match[1].trim();
              }
            }

            const totalAmt = Number(so.total_contract_value || 0);
            const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);
            const balanceAmt = Number(so.balance_due_90 || totalAmt * 0.90);
            const buyerPhone = so.buyer?.corporate_phone || so.buyer?.phone_number || '';
            const supplierPhone = so.supplier?.corporate_phone || so.supplier?.phone_number || '';

            const deliveryOption = logisticsMeta.delivery_option || (so.buyer_notes?.toLowerCase().includes('pickup') ? 'pickup' : 'deliver');

            let paymentStatusLabel = '10% Escrow Advance Locked';
            let effectiveAdvanceAmt = advanceAmt;
            let effectiveBalanceAmt = balanceAmt;

            if (so.current_state === 'price_locked_10') {
              paymentStatusLabel = '10% Escrow Advance Locked';
              effectiveAdvanceAmt = advanceAmt;
              effectiveBalanceAmt = balanceAmt;
            } else if (so.current_state === 'warehouse_loading') {
              paymentStatusLabel = '10% Paid (Warehouse Loading)';
              effectiveAdvanceAmt = advanceAmt;
              effectiveBalanceAmt = balanceAmt;
            } else if (so.current_state === 'settled' || logisticsMeta.dispatch_status === 'collected' || logisticsMeta.dispatch_status === 'delivered') {
              paymentStatusLabel = '100% Fully Settled';
              effectiveAdvanceAmt = totalAmt;
              effectiveBalanceAmt = 0;
            }

            const supplierCompany = so.supplier?.company_name || 'Aaudumbar Agro Pvt. Ltd.';
            const supplierContact = so.supplier?.full_name || 'Aditya Patil';
            const supplierPhoneResolved = supplierPhone || '+91 84088 41998';
            const supplierEmailResolved = so.supplier?.registered_email || 'aaudumbaragro@gmail.com';
            const supplierGstResolved = so.supplier?.gst_number || '27ABACA6256A1Z2';
            const supplierLocResolved = [so.supplier?.city, so.supplier?.state].filter(Boolean).join(', ') || 'Chhatrapati Sambhajinagar, Maharashtra';
            const supplierGodownResolved = so.supplier?.warehouse_address || 'Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar, Maharashtra 431007';

            // Resolve exact transaction ID from platform ledger or qr_payment_reference
            const liveTxnId = ledgerMap.get(so.id) || 
              (so.qr_payment_reference && !so.qr_payment_reference.startsWith('RZP-order_') ? so.qr_payment_reference : null) || 
              so.qr_payment_reference || 
              `TXN-ESCROW-${so.id.slice(0, 8).toUpperCase()}`;

            return {
              id: so.id,
              transaction_id: liveTxnId,
              created_at: so.created_at,
              buyer_id: so.buyer_id,
              buyer_email: so.buyer?.registered_email || 'buyer@b2bindia.site',
              buyer_name: so.buyer?.company_name || so.buyer?.full_name || 'Registered Buyer',
              buyer_company_name: so.buyer?.company_name || 'Registered Buyer',
              buyer_contact_person: so.buyer?.full_name || '',
              buyer_phone: buyerPhone,
              buyer_whatsapp: so.buyer?.whatsapp_number || buyerPhone,
              buyer_location: [so.buyer?.city, so.buyer?.state].filter(Boolean).join(', '),
              supplier_id: so.supplier_id || 'sup-aaudumbar-1',
              supplier_name: supplierCompany,
              supplier_company_name: supplierCompany,
              supplier_contact_person: supplierContact,
              supplier_phone: supplierPhoneResolved,
              supplier_email: supplierEmailResolved,
              supplier_gstin: supplierGstResolved,
              supplier_location: supplierLocResolved,
              supplier_godown: supplierGodownResolved,
              product_name: resolvedTitle,
              quantity: so.quantity || 1,
              unit: so.unit_label || 'Units',
              agreed_unit_price: so.agreed_unit_price,
              total_amount: totalAmt,
              advance_amount: effectiveAdvanceAmt,
              balance_amount: effectiveBalanceAmt,
              payment_status: paymentStatusLabel,
              order_status: logisticsMeta.dispatch_status || logisticsMeta.order_status || so.current_state || 'quotation_issued',
              delivery_option: deliveryOption,
              is_paid: true,
            
            // Delivery Specifics
            delivery_address: logisticsMeta.delivery_address || deliveryAddr || [so.buyer?.city, so.buyer?.state].filter(Boolean).join(', ') || 'Delivery Warehouse',
            delivery_date: logisticsMeta.delivery_date || (so.estimated_delivery_days ? `${so.estimated_delivery_days} days` : '7 days'),
            receiver_name: logisticsMeta.receiver_name || so.buyer?.company_name || 'Authorized Receiver',
            receiver_phone: logisticsMeta.receiver_phone || buyerPhone,
            transporter_name: logisticsMeta.transporter_name || null,
            
            // Pickup Specifics
            arrival_date: logisticsMeta.arrival_date || (deliveryOption === 'pickup' ? (so.estimated_delivery_days ? `${so.estimated_delivery_days} days` : '2 days') : null),
            visitor_count: logisticsMeta.visitor_count ? parseInt(logisticsMeta.visitor_count) : 1,
            vehicle_number: logisticsMeta.vehicle_number || null,
            p1_name: logisticsMeta.p1_name || so.buyer?.full_name || 'Authorized Driver',
            p1_phone: logisticsMeta.p1_phone || buyerPhone,
            p1_aadhar: logisticsMeta.p1_aadhar || null,
            p2_name: logisticsMeta.p2_name || null,
            p2_phone: logisticsMeta.p2_phone || null,
            p2_aadhar: logisticsMeta.p2_aadhar || null,
            
            tracking_number: logisticsMeta.tracking_number || (deliveryOption === 'pickup' ? `GATE-PASS-${so.id.slice(0, 8).toUpperCase()}` : `AWB-IND-${so.id.slice(0, 8).toUpperCase()}`),
            notes: cleanNotes || 'Trade Escrow Order'
          };
        });
      }
    } catch (dbErr) {
      console.warn('Supabase trade_orders fetch notice:', dbErr.message);
    }

    // Merge direct orders & Supabase orders, enriching supplier info on direct orders
    const allOrdersMap = new Map();
    const txnToIdMap = new Map();

    directOrders.forEach(o => {
      const enriched = {
        ...o,
        supplier_id: o.supplier_id || 'sup-aaudumbar-1',
        supplier_name: o.supplier_company_name || o.supplier_name || 'Aaudumbar Agro Pvt. Ltd.',
        supplier_company_name: o.supplier_company_name || o.supplier_name || 'Aaudumbar Agro Pvt. Ltd.',
        supplier_contact_person: o.supplier_contact_person || 'Aditya Patil',
        supplier_phone: o.supplier_phone || '+91 84088 41998',
        supplier_email: o.supplier_email || 'aaudumbaragro@gmail.com',
        supplier_gstin: o.supplier_gstin || '27ABACA6256A1Z2',
        supplier_location: o.supplier_location || 'Chhatrapati Sambhajinagar, Maharashtra',
        supplier_godown: o.supplier_godown || 'Central Godown, Plot 14, MIDC Shendra, Chhatrapati Sambhajinagar, Maharashtra 431007'
      };
      allOrdersMap.set(o.id, enriched);
      if (o.transaction_id) txnToIdMap.set(o.transaction_id, o.id);
    });

    supabaseOrders.forEach(so => {
      const existingId = allOrdersMap.has(so.id) ? so.id : (so.transaction_id ? txnToIdMap.get(so.transaction_id) : null);
      if (existingId && allOrdersMap.has(existingId)) {
        const local = allOrdersMap.get(existingId);
        
        const isDummyReceiver = (val) => !val || ['Consignee Manager', 'Authorized Receiver', 'Consignee Executive'].includes(val);
        const isDummyAddress = (val) => !val || ['Delivery Warehouse', 'Address on file', 'Registered Warehouse'].includes(val);
        const isDummyDriver = (val) => !val || ['Designated Driver', 'Authorized Driver', 'Authorized Fleet Driver'].includes(val);
        const isDummyPhone = (val) => !val || ['+91-9819283746', '+91-9226497450', '+91 98765 43210', '+91-9822001122'].includes(val);
        const isDummyAadhar = (val) => !val || ['XXXX-XXXX-4829', 'XXXX-XXXX-9120', 'On File'].includes(val);

        const mergedReceiverName = (!isDummyReceiver(local.receiver_name) ? local.receiver_name : null) || (!isDummyReceiver(so.receiver_name) ? so.receiver_name : null) || local.receiver_name || so.receiver_name;
        const mergedReceiverPhone = (!isDummyPhone(local.receiver_phone) ? local.receiver_phone : null) || (!isDummyPhone(so.receiver_phone) ? so.receiver_phone : null) || local.receiver_phone || so.receiver_phone;
        const mergedAddress = (!isDummyAddress(local.delivery_address) ? local.delivery_address : null) || (!isDummyAddress(so.delivery_address) ? so.delivery_address : null) || local.delivery_address || so.delivery_address;
        const mergedP1Name = (!isDummyDriver(local.p1_name) ? local.p1_name : null) || (!isDummyDriver(so.p1_name) ? so.p1_name : null) || local.p1_name || so.p1_name;
        const mergedP1Phone = (!isDummyPhone(local.p1_phone) ? local.p1_phone : null) || (!isDummyPhone(so.p1_phone) ? so.p1_phone : null) || local.p1_phone || so.p1_phone;
        const mergedP1Aadhar = (!isDummyAadhar(local.p1_aadhar) ? local.p1_aadhar : null) || (!isDummyAadhar(so.p1_aadhar) ? so.p1_aadhar : null) || local.p1_aadhar || so.p1_aadhar;

        allOrdersMap.set(existingId, {
          ...so,
          ...local,
          delivery_option: local.delivery_option || so.delivery_option,
          delivery_address: mergedAddress,
          delivery_date: local.delivery_date || so.delivery_date,
          receiver_name: mergedReceiverName,
          receiver_phone: mergedReceiverPhone,
          transporter_name: local.transporter_name || so.transporter_name,
          arrival_date: local.arrival_date || so.arrival_date,
          visitor_count: local.visitor_count || so.visitor_count || 1,
          vehicle_number: local.vehicle_number || so.vehicle_number,
          p1_name: mergedP1Name,
          p1_phone: mergedP1Phone,
          p1_aadhar: mergedP1Aadhar,
          p2_name: local.p2_name || so.p2_name || null,
          p2_phone: local.p2_phone || so.p2_phone || null,
          p2_aadhar: local.p2_aadhar || so.p2_aadhar || null,
          tracking_number: local.tracking_number || so.tracking_number
        });
      } else {
        allOrdersMap.set(so.id, so);
        if (so.transaction_id) txnToIdMap.set(so.transaction_id, so.id);
      }
    });

    let combined = Array.from(allOrdersMap.values());

    // Sort descending by created_at
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply Delivery Option Filter
    if (typeFilter !== 'all') {
      combined = combined.filter(o => o.delivery_option === typeFilter);
    }

    // Apply Search Filter
    if (search) {
      combined = combined.filter(o => {
        const txn = (o.transaction_id || '').toLowerCase();
        const email = (o.buyer_email || '').toLowerCase();
        const name = (o.buyer_name || '').toLowerCase();
        const receiver = (o.receiver_name || '').toLowerCase();
        const p1 = (o.p1_name || '').toLowerCase();
        const p2 = (o.p2_name || '').toLowerCase();
        const vehicle = (o.vehicle_number || '').toLowerCase();
        const product = (o.product_name || '').toLowerCase();
        const phone = (o.buyer_phone || o.receiver_phone || '').toLowerCase();
        const address = (o.delivery_address || '').toLowerCase();
        const supName = (o.supplier_name || o.supplier_company_name || '').toLowerCase();
        const supContact = (o.supplier_contact_person || '').toLowerCase();
        const supPhone = (o.supplier_phone || '').toLowerCase();
        const supEmail = (o.supplier_email || '').toLowerCase();
        const supGst = (o.supplier_gstin || '').toLowerCase();
        const supLoc = (o.supplier_location || o.supplier_godown || '').toLowerCase();

        return (
          txn.includes(search) ||
          email.includes(search) ||
          name.includes(search) ||
          receiver.includes(search) ||
          supName.includes(search) ||
          supContact.includes(search) ||
          supPhone.includes(search) ||
          supEmail.includes(search) ||
          supGst.includes(search) ||
          supLoc.includes(search) ||
          p1.includes(search) ||
          p2.includes(search) ||
          vehicle.includes(search) ||
          product.includes(search) ||
          phone.includes(search) ||
          address.includes(search)
        );
      });
    }

    // Dynamic Metrics Calculation: Only compute on confirmed paid orders (exclude cancelled/failed/unpaid)
    const allRecords = Array.from(allOrdersMap.values());
    const paidRecords = allRecords.filter(o => !['cancelled', 'payment_failed', 'quotation_issued', 'unpaid'].includes(o.order_status) && o.payment_status !== 'Payment Failed / Cancelled');
    const totalOrders = paidRecords.length;
    const totalVolumeINR = paidRecords.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const deliveryCount = paidRecords.filter(o => o.delivery_option === 'deliver').length;
    const pickupCount = paidRecords.filter(o => o.delivery_option === 'pickup').length;
    const inTransitCount = paidRecords.filter(o => ['in_transit', 'dispatched', 'confirmed', 'warehouse_loading'].includes(o.order_status || o.status)).length;

    return NextResponse.json({
      orders: combined,
      metrics: {
        totalOrders,
        totalVolumeINR,
        deliveryCount,
        pickupCount,
        inTransitCount
      }
    });
  } catch (error) {
    console.error('Error in Admin Orders GET:', error);
    return NextResponse.json({ error: 'Internal Server Error', orders: [] }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { orderId, updates } = body;

    if (!orderId || !updates) {
      return NextResponse.json({ error: 'Missing orderId or updates' }, { status: 400 });
    }

    // 1. Update in-memory / local JSON store if exists
    const updated = updateOrder(orderId, updates);

    // 2. Also update Supabase trade_orders with packed logistics meta if changed
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const dbUpdates = {};
      const statusVal = updates.order_status || updates.status || updates.current_state;
      if (statusVal) {
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
        dbUpdates.current_state = dbStateMap[statusVal] || 'price_locked_10';
      }

      // Check if logistics fields are being updated
      const hasLogisticsUpdates = [
        'delivery_option', 'arrival_date', 'delivery_date', 'delivery_address',
        'receiver_name', 'receiver_phone', 'vehicle_number', 'p1_name', 'p1_phone',
        'p1_aadhar', 'p2_name', 'p2_phone', 'p2_aadhar', 'transporter_name'
      ].some(k => updates[k] !== undefined);

      if (hasLogisticsUpdates || updates.notes !== undefined || updates.tracking_number !== undefined || statusVal) {
        const { data: existingTradeOrder } = await supabaseAdmin
          .from('trade_orders')
          .select('buyer_notes, qr_payment_reference')
          .eq('id', orderId)
          .maybeSingle();

        if (updates.tracking_number && !existingTradeOrder?.qr_payment_reference) {
          dbUpdates.qr_payment_reference = updates.tracking_number;
        }

        let currentNotes = existingTradeOrder?.buyer_notes || '';
        let meta = {};
        if (currentNotes.includes('<!--LOGISTICS_META:')) {
          try {
            const match = currentNotes.match(/<!--LOGISTICS_META:(.*?)-->/s);
            if (match && match[1]) meta = JSON.parse(match[1]);
          } catch(e) {}
        }

        // Apply new logistics updates to metadata
        [
          'delivery_option', 'arrival_date', 'delivery_date', 'delivery_address',
          'receiver_name', 'receiver_phone', 'vehicle_number', 'p1_name', 'p1_phone',
          'p1_aadhar', 'p2_name', 'p2_phone', 'p2_aadhar', 'transporter_name', 'tracking_number'
        ].forEach(k => {
          if (updates[k] !== undefined) meta[k] = updates[k];
        });

        if (statusVal) {
          meta.order_status = statusVal;
          meta.dispatch_status = statusVal;
        }

        const incomingNotes = updates.notes !== undefined ? updates.notes : currentNotes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
        const cleanNotes = incomingNotes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
        dbUpdates.buyer_notes = `<!--LOGISTICS_META:${JSON.stringify(meta)}-->\n${cleanNotes}`.trim();
      }

      if (Object.keys(dbUpdates).length > 0) {
        dbUpdates.updated_at = new Date().toISOString();
        await supabaseAdmin
          .from('trade_orders')
          .update(dbUpdates)
          .eq('id', orderId);
      }

      if (statusVal) {
        await supabaseAdmin
          .from('logistics_arrangements')
          .update({ dispatch_status: statusVal, updated_at: new Date().toISOString() })
          .eq('order_id', orderId);
      }
    } catch (err) {
      console.warn('Could not update trade_orders in Supabase:', err.message);
    }

    // Automatically email total invoice directly to buyer if status is collected or warehouse_loading
    const statusValNormalized = (statusVal || '').toLowerCase();
    if (statusValNormalized === 'collected' || statusValNormalized === 'warehouse_loading') {
      try {
        const buyerEmailTarget = (updated?.buyer_email || updated?.email || '').trim();
        if (buyerEmailTarget && buyerEmailTarget.includes('@')) {
          sendTotalInvoiceEmail(updated, { buyerEmail: buyerEmailTarget }).catch(e => {
            console.warn('Auto invoice email on admin status change notice:', e.message);
          });
        }
      } catch(e) {}
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error in Admin Orders PATCH:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id') || searchParams.get('orderId');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id || body.orderId;
      } catch (e) {}
    }

    // 1. Delete from local JSON persistent store
    deleteOrder(id);

    // 2. Delete from Supabase if connected
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const cleanId = String(id).trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

      let targetUUIDs = isUUID ? [cleanId] : [];

      if (targetUUIDs.length === 0) {
        // Extract 8-character hex from B2B-ESCROW-XXXXXXXX or AWB-IND-XXXXXXXX or TXN-ESCROW-XXXXXXXX
        let hexPart = null;
        const hexMatch = cleanId.match(/([0-9a-f]{8})/i);
        if (hexMatch && hexMatch[1]) {
          hexPart = hexMatch[1].toLowerCase();
        }

        // Search in Supabase by ID prefix, qr_payment_reference, or exact match
        let query = supabaseAdmin.from('trade_orders').select('id');
        if (hexPart) {
          query = query.or(`id.ilike.${hexPart}%,qr_payment_reference.ilike.%${hexPart}%,qr_payment_reference.eq.${cleanId}`);
        } else {
          query = query.eq('qr_payment_reference', cleanId);
        }

        const { data: matchedRows } = await query.limit(10);
        if (matchedRows && matchedRows.length > 0) {
          targetUUIDs = matchedRows.map(r => r.id);
        }
      }

      for (const targetUUID of targetUUIDs) {
        // Clean up all referencing child tables first to prevent foreign key restriction errors
        try {
          await supabaseAdmin.from('platform_ledger').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('order_timeline').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('order_milestones').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('order_inspections').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('order_escrows').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('support_tickets').delete().eq('order_id', targetUUID);
          await supabaseAdmin.from('notifications').delete().eq('order_id', targetUUID);
        } catch (childErr) {
          console.warn('Child cleanup notice:', childErr.message);
        }

        // Delete from trade_orders table
        const { error: delErr } = await supabaseAdmin.from('trade_orders').delete().eq('id', targetUUID);
        if (delErr) {
          console.warn('Supabase trade_orders delete error:', delErr.message);
        }
      }
    } catch (err) {
      console.warn('Supabase order delete notice:', err.message);
    }

    return NextResponse.json({ success: true, message: 'Order record deleted successfully from all stores.' });
  } catch (error) {
    console.error('Error in Admin Orders DELETE:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

