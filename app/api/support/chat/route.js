import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { readAllOrders } from '@/services/ordersStore';
import { resolveAuthenticatedUser } from '@/utils/userResolver';
import { askGeminiSupport } from '@/services/geminiSupportService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, messages, orderId, userEmail: clientEmail, userId: clientUserId } = body;

    // Build standard conversation history
    let history = [];
    if (Array.isArray(messages) && messages.length > 0) {
      history = messages.map(m => ({
        role: m.role || (m.sender === 'user' ? 'user' : 'model'),
        text: m.text || m.content || ''
      }));
    } else if (message) {
      history = [{ role: 'user', text: message }];
    } else {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    // 1. Resolve Authenticated User Profile
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let sessionUser = null;
    let userProfile = null;

    // Check Bearer Token in Authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        try {
          const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
          if (tokenUser) {
            sessionUser = tokenUser;
            userProfile = await resolveAuthenticatedUser(supabaseAdmin, tokenUser, 'both');
          }
        } catch (e) {
          console.warn('Bearer auth check in support chat:', e.message);
        }
      }
    }

    // Fallback: Supabase cookies
    if (!sessionUser) {
      try {
        const supabaseServer = await createServerSupabase();
        const { data: { user: cookieUser } } = await supabaseServer.auth.getUser();
        if (cookieUser) {
          sessionUser = cookieUser;
          userProfile = await resolveAuthenticatedUser(supabaseAdmin, cookieUser, 'both');
        }
      } catch (e) {}
    }

    // Fallback: lookup by client-provided email or user ID if authenticated session wasn't captured
    const targetEmail = (userProfile?.registered_email || sessionUser?.email || clientEmail || '')?.toLowerCase()?.trim();
    const targetId = userProfile?.id || sessionUser?.id || clientUserId || null;

    if (!userProfile && (targetId || targetEmail)) {
      try {
        let query = supabaseAdmin.from('users').select('*');
        if (targetId) query = query.eq('id', targetId);
        else if (targetEmail) query = query.ilike('registered_email', targetEmail);
        const { data: p } = await query.maybeSingle();
        if (p) userProfile = p;
      } catch (e) {}
    }

    // 2. Fetch User's Orders from Supabase and Local Store
    let userOrders = [];

    // A. Query Supabase trade_orders
    if (targetId || targetEmail) {
      try {
        let tradeQuery = supabaseAdmin
          .from('trade_orders')
          .select(`
            *,
            product:products ( id, title, base_price_per_unit, unit_label )
          `)
          .order('created_at', { ascending: false });

        if (targetId) {
          tradeQuery = tradeQuery.eq('buyer_id', targetId);
        } else {
          tradeQuery = tradeQuery.ilike('buyer_notes', `%${targetEmail}%`);
        }

        const { data: tradeData } = await tradeQuery;

        if (tradeData && tradeData.length > 0) {
          const parsedTradeOrders = tradeData.map(so => {
            let resolvedTitle = so.product?.title || 'Contract Commodity';
            if (so.buyer_notes && so.buyer_notes.includes('Accepted RFQ:')) {
              const match = so.buyer_notes.match(/Accepted RFQ:\s*([^.\n[]+)/i);
              if (match && match[1]) resolvedTitle = match[1].trim();
            }

            let parsedLogistics = {};
            if (so.buyer_notes && so.buyer_notes.includes('<!--LOGISTICS_META:')) {
              try {
                const metaMatch = so.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/s);
                if (metaMatch && metaMatch[1]) parsedLogistics = JSON.parse(metaMatch[1]);
              } catch (e) {}
            }

            let deliveryAddr = parsedLogistics.delivery_address || null;
            if (!deliveryAddr && so.buyer_notes && so.buyer_notes.includes('Delivery to:')) {
              const match = so.buyer_notes.match(/Delivery to:\s*([^.\n]+)/i);
              if (match && match[1]) deliveryAddr = match[1].trim();
            }

            const totalAmt = Number(so.total_contract_value || 0);
            const advanceAmt = Number(so.advance_paid_10 || totalAmt * 0.10);
            const balanceAmt = Number(so.balance_due_90 || totalAmt * 0.90);

            let resolvedStatus = parsedLogistics.dispatch_status || parsedLogistics.order_status;
            if (!resolvedStatus) {
              if (so.current_state === 'price_locked_10') resolvedStatus = 'confirmed';
              else if (so.current_state === 'warehouse_loading') resolvedStatus = 'warehouse_loading';
              else if (so.current_state === 'settled') resolvedStatus = parsedLogistics.delivery_option === 'pickup' ? 'collected' : 'delivered';
              else if (so.current_state === 'cancelled') resolvedStatus = 'cancelled';
              else resolvedStatus = so.current_state || 'confirmed';
            }

            return {
              id: so.id,
              transaction_id: so.qr_payment_reference || `TXN-ESCROW-${so.id.slice(0, 8).toUpperCase()}`,
              product_name: resolvedTitle,
              quantity: so.quantity || 1,
              unit: so.unit_label || 'Units',
              total_amount: totalAmt,
              advance_amount: advanceAmt,
              balance_amount: balanceAmt,
              payment_status: so.current_state === 'settled' ? 'settled' : 'paid_to_escrow',
              order_status: resolvedStatus,
              delivery_option: parsedLogistics.delivery_option || (deliveryAddr ? 'deliver' : 'pickup'),
              delivery_address: deliveryAddr,
              tracking_number: parsedLogistics.tracking_number || `TRK-IND-${so.id.slice(0, 6).toUpperCase()}`,
              p1_name: parsedLogistics.p1_name || null,
              arrival_date: parsedLogistics.arrival_date || null,
              created_at: so.created_at,
              notes: so.buyer_notes || null
            };
          });

          userOrders = userOrders.concat(parsedTradeOrders);
        }
      } catch (err) {
        console.warn('Trade orders query in chat error:', err.message);
      }
    }

    // B. Query Direct Orders store
    try {
      const allDirect = readAllOrders();
      let matchedDirect = [];

      if (targetEmail) {
        matchedDirect = allDirect.filter(o => o.buyer_email && o.buyer_email.toLowerCase() === targetEmail);
      } else if (orderId) {
        matchedDirect = allDirect.filter(o => 
          (o.transaction_id && o.transaction_id.toLowerCase() === orderId.toLowerCase()) ||
          (o.id && o.id.toLowerCase() === orderId.toLowerCase())
        );
      }

      if (matchedDirect.length > 0) {
        matchedDirect.forEach(d => {
          if (!userOrders.some(existing => existing.transaction_id === d.transaction_id || existing.id === d.id)) {
            userOrders.push({
              id: d.id,
              transaction_id: d.transaction_id || d.id,
              product_name: d.product_name || 'Bulk Commodity',
              quantity: d.quantity || 1,
              unit: d.unit || 'Kg',
              total_amount: Number(d.total_amount || 0),
              advance_amount: Number(d.advance_amount || d.total_amount * 0.10),
              balance_amount: Number(d.balance_amount || d.total_amount * 0.90),
              payment_status: d.payment_status || 'paid_to_escrow',
              order_status: d.order_status || 'confirmed',
              delivery_option: d.delivery_option || 'deliver',
              delivery_address: d.delivery_address || null,
              tracking_number: d.tracking_number || d.transaction_id,
              p1_name: d.p1_name || null,
              arrival_date: d.arrival_date || null,
              created_at: d.created_at,
              notes: d.notes || null
            });
          }
        });
      }
    } catch (err) {
      console.warn('Direct orders reading in chat error:', err.message);
    }

    // 3. Construct Unified User & Order Context
    const userContext = {
      user: targetEmail || userProfile ? {
        name: userProfile?.full_name || sessionUser?.user_metadata?.full_name || 'Verified Buyer',
        company: userProfile?.company_name || sessionUser?.user_metadata?.company_name || 'Enterprise Account',
        email: targetEmail,
        phone: userProfile?.corporate_phone || userProfile?.phone_number || 'On file',
        location: [userProfile?.city, userProfile?.state].filter(Boolean).join(', ') || 'India',
        role: userProfile?.role || 'buyer'
      } : null,
      orders: userOrders
    };

    // 4. Call Gemini Support Engine with User Context
    const result = await askGeminiSupport(history, userContext);

    return NextResponse.json({
      success: true,
      reply: result.reply,
      model: result.model,
      userOrders: userOrders.slice(0, 5).map(o => ({
        id: o.id,
        transaction_id: o.transaction_id,
        product_name: o.product_name,
        order_status: o.order_status,
        total_amount: o.total_amount
      })),
      userInfo: userContext.user
    });

  } catch (error) {
    console.error("Support Chat API Exception:", error);
    return NextResponse.json({
      success: false,
      error: "Support agent temporary delay.",
      reply: "Thank you for contacting B2B India Support. Our support desk can also be reached immediately via WhatsApp at **+91 84088 41998** or email **b2bbharat.in@gmail.com**."
    }, { status: 500 });
  }
}
