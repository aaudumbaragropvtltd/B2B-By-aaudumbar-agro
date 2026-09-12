import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { readAllOrders } from '@/services/ordersStore';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email')?.toLowerCase()?.trim();
    const searchParam = searchParams.get('search')?.toLowerCase()?.trim();

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let sessionUser = null;
    let userProfile = null;

    // 1. Authenticate with Priority:
    // Priority 1: Bearer Token in Authorization header (actively synced with client session)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: { user: tokenUser }, error: tokenErr } = await supabaseAdmin.auth.getUser(token);
          if (!tokenErr && tokenUser) {
            sessionUser = tokenUser;
            userProfile = await resolveAuthenticatedUser(supabaseAdmin, tokenUser, 'both');
          }
        } catch (e) {
          console.warn('Bearer auth check in orders list:', e.message);
        }
      }
    }

    // Priority 2: Server cookies via createServerSupabase()
    if (!sessionUser) {
      try {
        const supabaseServer = await createServerSupabase();
        const { data: { user: cookieUser } } = await supabaseServer.auth.getUser();
        if (cookieUser) {
          sessionUser = cookieUser;
          userProfile = await resolveAuthenticatedUser(supabaseAdmin, cookieUser, 'both');
        }
      } catch (e) {
        // Guest mode
      }
    }

    // STRICT MULTI-TENANT ISOLATION POLICY:
    // Only the person who ordered can see their own order information.
    // An authenticated user can NEVER query or view another user's orders.
    const verifiedEmail = (sessionUser?.email || userProfile?.registered_email || '')?.toLowerCase()?.trim() || null;
    const verifiedBuyerId = userProfile?.id || sessionUser?.id || null;

    // If an authenticated user passed an emailParam, verify it matches their own identity
    // If not matching, strictly override it with the verified user's email
    const effectiveEmail = verifiedEmail || (emailParam ? emailParam.toLowerCase().trim() : null);

    // 1. Fetch direct checkout orders from store
    const allDirectOrders = readAllOrders();

    // 2. Fetch Supabase trade_orders strictly scoped to verified buyer
    let supabaseOrders = [];
    try {
      let query = supabaseAdmin
        .from('trade_orders')
        .select(`
          *,
          buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state ),
          supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, warehouse_address ),
          product:products ( id, title, hero_image_url, base_price_per_unit, unit_label )
        `)
        .order('created_at', { ascending: false });

      if (verifiedBuyerId) {
        // Logged in: fetch ONLY orders placed BY this verified user (as buyer)
        query = query.eq('buyer_id', verifiedBuyerId);
      } else {
        // Unauthenticated guest: trade_orders are private and cannot be listed without credentials
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: tradeData, error: tradeErr } = await query;

      if (!tradeErr && tradeData) {
        supabaseOrders = tradeData.map(so => {
          // Extract product name from buyer_notes if created from RFQ
          let resolvedTitle = so.product?.title || 'Contract Commodity';
          if (so.buyer_notes && so.buyer_notes.includes('Accepted RFQ:')) {
            const match = so.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
            if (match && match[1]) {
              resolvedTitle = match[1].trim();
            }
          }

          let parsedLogistics = {};
          if (so.buyer_notes && so.buyer_notes.includes('<!--LOGISTICS_META:')) {
            try {
              const metaMatch = so.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/s);
              if (metaMatch && metaMatch[1]) {
                parsedLogistics = JSON.parse(metaMatch[1]);
              }
            } catch (e) {}
          }

          let deliveryAddr = parsedLogistics.delivery_address || null;
          if (!deliveryAddr && so.buyer_notes && so.buyer_notes.includes('Delivery to:')) {
            const match = so.buyer_notes.match(/Delivery to:\s*([^.\n]+)/i);
            if (match && match[1]) {
              deliveryAddr = match[1].trim();
            }
          }

          const totalAmt = Number(so.total_contract_value || 0);
          const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);
          const balanceAmt = Number(so.balance_due_90 || totalAmt * 0.90);
          const buyerPhone = so.buyer?.corporate_phone || so.buyer?.phone_number || '';
          const supplierPhone = so.supplier?.corporate_phone || so.supplier?.phone_number || '';

          let resolvedStatus = parsedLogistics.dispatch_status || parsedLogistics.order_status;
          if (!resolvedStatus) {
            if (so.current_state === 'price_locked_10') resolvedStatus = 'confirmed';
            else if (so.current_state === 'warehouse_loading') resolvedStatus = 'warehouse_loading';
            else if (so.current_state === 'settled') resolvedStatus = parsedLogistics.delivery_option === 'pickup' ? 'collected' : 'delivered';
            else if (so.current_state === 'cancelled') resolvedStatus = 'cancelled';
            else resolvedStatus = so.current_state || 'quotation_issued';
          }

          return {
              id: so.id,
              transaction_id: so.qr_payment_reference || `TXN-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
              created_at: so.created_at,
              buyer_id: so.buyer_id,
              buyer_email: so.buyer?.registered_email || sessionUser?.email || 'buyer@b2bindia.site',
              buyer_name: so.buyer?.company_name || so.buyer?.full_name || 'Registered Buyer',
              buyer_contact_person: so.buyer?.full_name || '',
              buyer_phone: buyerPhone,
              buyer_whatsapp: so.buyer?.whatsapp_number || buyerPhone,
              buyer_location: [so.buyer?.city, so.buyer?.state].filter(Boolean).join(', '),
              supplier_id: so.supplier_id,
              supplier_name: so.supplier?.company_name || 'Verified Supplier',
              supplier_phone: supplierPhone,
              supplier_email: so.supplier?.registered_email || '',
              supplier_godown: so.supplier?.warehouse_address || [so.supplier?.city, so.supplier?.state].filter(Boolean).join(', ') || 'Warehouse on file',
              product_name: resolvedTitle,
              quantity: so.quantity || 1,
              unit: so.unit_label || 'Units',
              price_per_unit: so.agreed_unit_price,
              total_amount: totalAmt,
              advance_amount: advanceAmt,
              balance_amount: balanceAmt,
              subtotal: so.subtotal || (totalAmt - Number(so.tax_amount || 0)),
              tax_amount: so.tax_amount || 0,
              payment_status: so.current_state === 'price_locked_10' || so.current_state === 'warehouse_loading' || so.current_state === 'in_transit' || so.current_state === 'dispatched' || so.current_state === 'delivered' 
                ? 'paid_to_escrow' 
                : so.current_state === 'settled' 
                ? 'settled' 
                : so.current_state === 'cancelled' 
                ? 'payment_failed' 
                : 'unpaid',
              order_status: resolvedStatus,
              delivery_status: resolvedStatus,
              dispatch_status: resolvedStatus,
              delivery_option: parsedLogistics.delivery_option || (deliveryAddr ? 'deliver' : null),
              delivery_address: deliveryAddr || null,
              delivery_date: parsedLogistics.delivery_date || (so.estimated_delivery_days ? `${so.estimated_delivery_days} Days Dispatch` : '7 Days Dispatch'),
              receiver_name: parsedLogistics.receiver_name || so.buyer?.full_name || so.buyer?.company_name || 'Authorized Receiver',
              receiver_phone: parsedLogistics.receiver_phone || buyerPhone,
              transporter_name: parsedLogistics.transporter_name || null,
              arrival_date: parsedLogistics.arrival_date || null,
              visitor_count: parsedLogistics.visitor_count || 1,
              vehicle_number: parsedLogistics.vehicle_number || null,
              p1_name: parsedLogistics.p1_name || null,
              p1_phone: parsedLogistics.p1_phone || null,
              p1_aadhar: parsedLogistics.p1_aadhar || null,
              p2_name: parsedLogistics.p2_name || null,
              p2_phone: parsedLogistics.p2_phone || null,
              p2_aadhar: parsedLogistics.p2_aadhar || null,
              tracking_number: parsedLogistics.tracking_number || `B2B-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
              notes: so.buyer_notes || 'Trade Escrow Order'
            };
          });
        }
      } catch (e) {
        console.warn('Error fetching Supabase trade orders for user:', e.message);
      }

      // Filter direct orders strictly for the user
      let userDirectOrders = [];
      if (verifiedEmail) {
        userDirectOrders = allDirectOrders.filter(o => 
          o.buyer_email && o.buyer_email.toLowerCase() === verifiedEmail
        );
      } else if (searchParam && searchParam.length >= 4) {
        // Specific guest lookup by exact transaction_id, tracking_number, or id
        userDirectOrders = allDirectOrders.filter(o =>
          (o.transaction_id && o.transaction_id.toLowerCase() === searchParam) ||
          (o.tracking_number && o.tracking_number.toLowerCase() === searchParam) ||
          (o.id && o.id.toLowerCase() === searchParam)
        );
      } else {
        // Unauthenticated with no specific search -> return empty array (STRICT ISOLATION)
        userDirectOrders = [];
      }

      // Merge user orders prioritizing admin-updated lifecycle status
      const getStatusWeight = (st) => {
        if (!st) return 0;
        if (st === 'settled' || st === 'delivered' || st === 'collected' || st === 'completed') return 5;
        if (st === 'ready_for_pickup' || st === 'in_transit' || st === 'dispatched' || st === 'out_for_delivery') return 4;
        if (st === 'warehouse_loading' || st === 'processing') return 3;
        if (st === 'confirmed' || st === 'price_locked_10') return 2;
        if (st === 'cancelled' || st === 'payment_failed') return 0;
        return 1;
      };

      const userOrdersMap = new Map();
      supabaseOrders.forEach(o => userOrdersMap.set(o.id, o));
      
      userDirectOrders.forEach(o => {
        const existing = userOrdersMap.get(o.id) || 
          Array.from(userOrdersMap.values()).find(ex => ex.transaction_id && o.transaction_id && ex.transaction_id.toLowerCase() === o.transaction_id.toLowerCase());

        if (existing) {
          const existingWeight = getStatusWeight(existing.order_status);
          const localWeight = getStatusWeight(o.order_status);
          const bestStatus = localWeight >= existingWeight ? (o.order_status || existing.order_status) : (existing.order_status || o.order_status);

          userOrdersMap.set(existing.id, {
            ...existing,
            ...o,
            id: existing.id,
            order_status: bestStatus,
            dispatch_status: bestStatus,
            delivery_status: bestStatus,
            payment_status: (o.payment_status === 'paid_to_escrow' || o.payment_status === 'settled' || existing.payment_status === 'paid_to_escrow' || existing.payment_status === 'settled')
              ? (bestStatus === 'delivered' || bestStatus === 'collected' || bestStatus === 'settled' ? 'settled' : 'paid_to_escrow')
              : (existing.payment_status || o.payment_status),
            transaction_id: o.transaction_id || existing.transaction_id,
            tracking_number: o.tracking_number || existing.tracking_number,
            total_amount: o.total_amount || existing.total_amount,
            advance_amount: o.advance_amount || existing.advance_amount,
            balance_amount: o.balance_amount || existing.balance_amount,
            delivery_address: o.delivery_address || existing.delivery_address,
            delivery_option: o.delivery_option || existing.delivery_option,
            delivery_date: o.delivery_date || existing.delivery_date,
            receiver_name: o.receiver_name || existing.receiver_name,
            receiver_phone: o.receiver_phone || existing.receiver_phone,
            arrival_date: o.arrival_date || existing.arrival_date,
            vehicle_number: o.vehicle_number || existing.vehicle_number,
            p1_name: o.p1_name || existing.p1_name,
            p1_phone: o.p1_phone || existing.p1_phone,
            p1_aadhar: o.p1_aadhar || existing.p1_aadhar,
            p2_name: o.p2_name || existing.p2_name,
            p2_phone: o.p2_phone || existing.p2_phone,
            p2_aadhar: o.p2_aadhar || existing.p2_aadhar,
          });
        } else {
          userOrdersMap.set(o.id, o);
        }
      });

    let combined = Array.from(userOrdersMap.values());

    // Sort descending by date
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Strict multi-tenant isolation guard:
    // When an authenticated user is requesting orders, NEVER allow any other account's order to leak!
    if (verifiedEmail) {
      combined = combined.filter(o => {
        const orderEmail = o.buyer_email?.toLowerCase();
        const orderBuyerId = o.buyer_id;
        return (orderEmail && orderEmail === verifiedEmail) || (orderBuyerId && orderBuyerId === verifiedBuyerId);
      });
    } else if (!searchParam) {
      // Unauthenticated caller with no search query gets zero orders
      combined = [];
    }

    // Search filter if provided
    if (searchParam) {
      combined = combined.filter(o =>
        (o.transaction_id && o.transaction_id.toLowerCase().includes(searchParam)) ||
        (o.id && o.id.toLowerCase().includes(searchParam)) ||
        (o.product_name && o.product_name.toLowerCase().includes(searchParam)) ||
        (o.receiver_name && o.receiver_name.toLowerCase().includes(searchParam)) ||
        (o.p1_name && o.p1_name.toLowerCase().includes(searchParam))
      );
    }

    // 3. Fetch buyer's RFQs and received quotations
    let quotations = [];
    try {
      let rfqQuery = supabaseAdmin
        .from('rfqs')
        .select(`
          id,
          product_name,
          quantity,
          unit,
          target_price,
          destination,
          deadline,
          status,
          created_at,
          quotes:rfq_quotes (
            id,
            rfq_id,
            supplier_id,
            quoted_price,
            price_before_gst,
            gst_rate,
            gst_amount,
            delivery_days,
            supplier_location,
            notes,
            status,
            created_at,
            supplier:users!rfq_quotes_supplier_id_fkey (
              id,
              display_id,
              company_name,
              full_name,
              registered_email,
              corporate_phone,
              phone_number,
              city,
              state,
              warehouse_address
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Collect all quote IDs and RFQ IDs that already have orders placed
      const bookedQuoteIds = new Set();
      const bookedRfqIds = new Set();

      combined.forEach(o => {
        const text = `${o.notes || ''} ${o.buyer_notes || ''}`;
        const quoteMatch = text.match(/\[QUOTE:([^\]]+)\]/i);
        if (quoteMatch && quoteMatch[1]) bookedQuoteIds.add(quoteMatch[1].trim());
        const rfqMatch = text.match(/\[RFQ:([^\]]+)\]/i);
        if (rfqMatch && rfqMatch[1]) bookedRfqIds.add(rfqMatch[1].trim());
        if (o.quote_id) bookedQuoteIds.add(o.quote_id);
        if (o.rfq_id) bookedRfqIds.add(o.rfq_id);
      });

      if (verifiedBuyerId && verifiedEmail) {
        rfqQuery = rfqQuery.or(`buyer_id.eq.${verifiedBuyerId},buyer_email.ilike.${verifiedEmail}`);
      } else {
        // Unauthenticated or guest: NEVER expose active RFQs or quotations of other users
        rfqQuery = rfqQuery.eq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: rfqData, error: rfqErr } = await rfqQuery;

      if (!rfqErr && rfqData) {
        rfqData.forEach(rfq => {
          // If RFQ itself is fulfilled, closed, or already booked into an order, skip it
          if (['fulfilled', 'closed', 'ordered', 'accepted'].includes(rfq.status?.toLowerCase()) || bookedRfqIds.has(rfq.id)) {
            return;
          }

          (rfq.quotes || []).forEach((q, idx) => {
            // If quote status is accepted, fulfilled, ordered, closed, or already booked into an order, skip it!
            if (['accepted', 'ordered', 'fulfilled', 'closed', 'rejected'].includes(q.status?.toLowerCase()) || bookedQuoteIds.has(q.id)) {
              return;
            }

            const qty = Number(rfq.quantity || 1);
            const totalDealValue = Number(q.quoted_price || 0) > 0
              ? Number(q.quoted_price)
              : (Number(q.price_before_gst || 0) * qty) + Number(q.gst_amount || 0);

            const advance10 = Math.round(totalDealValue * 0.10);
            const balance90 = totalDealValue - advance10;
            const unitRate = qty > 0 ? Math.round(totalDealValue / qty) : totalDealValue;

            quotations.push({
              quote_id: q.id,
              rfq_id: rfq.id,
              bid_number: idx + 1,
              product_name: rfq.product_name,
              quantity: rfq.quantity,
              unit: rfq.unit || 'units',
              target_price: rfq.target_price,
              destination: rfq.destination || 'Delivery Hub',
              supplier_name: q.supplier?.company_name || 'Verified Supplier',
              supplier_phone: q.supplier?.corporate_phone || q.supplier?.phone_number || '',
              supplier_email: q.supplier?.registered_email || '',
              supplier_location: q.supplier_location || q.supplier?.city || 'Jintur Hub',
              delivery_days: q.delivery_days || 7,
              price_before_gst: Number(q.price_before_gst || 0),
              gst_rate: Number(q.gst_rate || 18),
              gst_amount: Number(q.gst_amount || 0),
              unit_rate: unitRate,
              total_deal_value: totalDealValue,
              advance_10_percent: advance10,
              balance_90_percent: balance90,
              status: q.status,
              notes: q.notes,
              created_at: q.created_at
            });
          });
        });
      }
    } catch (qErr) {
      console.warn('Error fetching quotations for user:', qErr.message);
    }

    return NextResponse.json({
      success: true,
      orders: combined,
      quotations: quotations,
      count: combined.length,
      quotationsCount: quotations.length,
      sessionEmail: sessionUser?.email || null
    });

  } catch (err) {
    console.error('Error in /api/orders/list:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
