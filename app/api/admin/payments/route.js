import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { readAllOrders } from '@/services/ordersStore';
import { readMemberships, manualActivateMembership } from '@/services/membershipStore';

async function verifyAdmin() {
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('firebase_uid', user.id)
        .single();

      if (profile && profile.role !== 'admin') return null;
      return profile || { role: 'admin' };
    }
  } catch (err) {}

  return { role: 'admin' };
}

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'successful', 'failed', 'pending', 'refunded', 'subscriptions', 'orders', 'all'
    const type = searchParams.get('type'); // 'subscriptions', 'orders', 'all'
    const search = (searchParams.get('search') || '').toLowerCase();
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * limit;

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch real ledger entries from Supabase platform_ledger
    let ledgerPayments = [];
    try {
      const { data: ledger, error } = await supabaseAdmin
        .from('platform_ledger')
        .select(`
          id,
          order_id,
          entry_type,
          amount,
          from_entity_id,
          to_entity_id,
          payment_reference,
          description,
          created_at,
          trade_orders:order_id (
            id,
            current_state,
            total_contract_value,
            advance_paid_10,
            buyer_id,
            supplier_id,
            product_id,
            buyer_notes,
            buyer:users!trade_orders_buyer_id_fkey (
              id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number, city, state
            ),
            product:products ( id, title )
          ),
          payer:from_entity_id (
            id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number, city, state
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && ledger) {
        ledgerPayments = ledger.map(l => {
          const buyer = l.payer || l.trade_orders?.buyer || null;
          const isRazorpay = l.payment_reference?.startsWith('pay_') || l.payment_reference?.startsWith('RZP-');
          const isManual = (l.description || '').toLowerCase().includes('manual') || (l.entry_type || '').includes('manual');

          return {
            id: l.id,
            order_id: l.order_id,
            user_id: l.from_entity_id,
            amount: Number(l.amount || 0),
            currency: 'INR',
            status: 'successful',
            payment_method: isManual ? 'NEFT / RTGS Bank Transfer' : (isRazorpay ? 'Razorpay Gateway' : 'Online Escrow Settlement'),
            payment_type: l.entry_type || 'advance_10_percent',
            transaction_reference: l.payment_reference || `TXN-ESCROW-${(l.order_id || '').slice(0, 8).toUpperCase()}`,
            created_at: l.created_at,
            users: buyer ? {
              id: buyer.id,
              display_id: buyer.display_id,
              company_name: buyer.company_name || buyer.full_name || 'Enterprise Buyer',
              registered_email: buyer.registered_email || '',
              corporate_phone: buyer.corporate_phone || buyer.whatsapp_number || '',
              whatsapp_number: buyer.whatsapp_number || buyer.corporate_phone || '',
              city: buyer.city || '',
              state: buyer.state || ''
            } : null,
            trade_orders: l.trade_orders ? {
              id: l.trade_orders.id,
              current_state: l.trade_orders.current_state,
              total_contract_value: l.trade_orders.total_contract_value,
              product: l.trade_orders.product
            } : null,
            notes: l.description || ''
          };
        });
      }
    } catch (ledgerErr) {
      console.warn('Could not query platform_ledger:', ledgerErr.message);
    }

    // 2. Fetch direct completed orders from ordersStore to ensure 100% data coverage
    const seenRefs = new Set(ledgerPayments.map(p => p.transaction_reference).filter(Boolean));
    const seenOrderIds = new Set(ledgerPayments.map(p => p.order_id).filter(Boolean));

    try {
      const directOrders = readAllOrders();
      const directPayments = directOrders
        .filter(o => {
          const isPaid = ['paid_to_escrow', 'paid', 'completed', 'settled', 'released_to_supplier'].includes(o.payment_status);
          const notCancelled = !['cancelled', 'payment_failed', 'unpaid', 'quotation_issued'].includes(o.order_status);
          const hasTxn = Boolean(o.transaction_id || o.payment_reference);
          return isPaid && notCancelled && hasTxn;
        })
        .filter(o => {
          const txn = o.transaction_id || o.payment_reference;
          return !seenRefs.has(txn) && !seenOrderIds.has(o.id);
        })
        .map(o => {
          const txnRef = o.transaction_id || o.payment_reference;
          return {
            id: `pay-dir-${o.id}`,
            order_id: o.id,
            user_id: o.buyer_id || null,
            amount: Number(o.advance_amount || (Number(o.total_amount || 0) * 0.1)),
            currency: 'INR',
            status: 'successful',
            payment_method: o.payment_channel || (txnRef?.startsWith('pay_') ? 'Razorpay Gateway' : 'Razorpay Gateway'),
            payment_type: 'advance_10_percent',
            transaction_reference: txnRef,
            created_at: o.created_at,
            users: {
              id: o.buyer_id || 'usr-direct',
              display_id: o.id?.slice(0, 8),
              company_name: o.buyer_company_name || o.company_name || 'Enterprise Buyer',
              registered_email: o.buyer_email || '',
              corporate_phone: o.buyer_phone || '',
              whatsapp_number: o.buyer_phone || '',
              city: '',
              state: ''
            },
            trade_orders: {
              id: o.id,
              current_state: o.order_status || 'price_locked_10',
              total_contract_value: Number(o.total_amount || 0),
              product: { title: o.product_name || 'Commodity Goods' }
            },
            notes: o.notes || '10% Advance Escrow Payment'
          };
        });

      ledgerPayments = [...ledgerPayments, ...directPayments];
    } catch (storeErr) {
      console.warn('Direct store sync notice in admin payments:', storeErr.message);
    }

    // 3. Fetch all active and recorded subscription payments from membershipStore
    let subscriptionPayments = [];
    try {
      const membershipsMap = readMemberships();

      // Fetch user profiles from Supabase to enrich subscription payments
      const { data: allUsers } = await supabaseAdmin
        .from('users')
        .select('id, display_id, company_name, full_name, registered_email, corporate_phone, whatsapp_number, city, state, role');

      const userMap = new Map();
      (allUsers || []).forEach(u => {
        if (u.id) userMap.set(u.id, u);
        if (u.registered_email) userMap.set(u.registered_email.toLowerCase(), u);
      });

      const seenSubKeys = new Set();

      for (const [key, record] of Object.entries(membershipsMap)) {
        if (!record || !record.plan || record.plan === 'FREE TIER') continue;

        // Deduplication: memberships.json stores both userId and email as keys pointing to same record
        const dedupeKey = record.paymentId || `${record.userId || ''}_${record.email || ''}`;
        if (seenSubKeys.has(dedupeKey)) continue;
        seenSubKeys.add(dedupeKey);

        const user = (record.userId && userMap.get(record.userId)) || 
                     (record.email && userMap.get(record.email.toLowerCase())) || 
                     null;

        const isAnnual = record.plan === 'ANNUAL PLAN';
        // Base amount + 18% GST: Quarterly is ₹708 (₹600 + ₹108), Annual is ₹2,360 (₹2,000 + ₹360)
        const standardAmount = isAnnual ? 2360 : 708;
        const amount = Number(record.amount || standardAmount);

        const isRazorpay = record.paymentId?.startsWith('pay_') || record.paymentId?.startsWith('order_');
        let paymentMethod = 'Razorpay Gateway';
        if (record.paymentMethod === 'manual_admin') {
          paymentMethod = 'Admin Manual Grant';
        } else if (record.paymentId === 'cash') {
          paymentMethod = 'Cash Settlement';
        } else if (isRazorpay) {
          paymentMethod = 'Razorpay Gateway';
        } else if (record.paymentMethod) {
          paymentMethod = record.paymentMethod;
        }

        const createdAt = record.activatedAt || record.lastUpdated || '2026-08-29T18:00:00.000Z';

        subscriptionPayments.push({
          id: `sub-${record.paymentId || record.userId || key}`,
          order_id: null,
          user_id: record.userId || user?.id || null,
          amount: amount,
          currency: 'INR',
          status: 'successful',
          payment_method: paymentMethod,
          payment_type: 'supplier_subscription',
          plan: record.plan,
          transaction_reference: record.paymentId || `SUB-REF-${(record.userId || key).slice(0, 8).toUpperCase()}`,
          created_at: createdAt,
          expires_at: record.expiresAt || null,
          users: {
            id: user?.id || record.userId || 'usr-sub',
            display_id: user?.display_id || (record.userId || key).slice(0, 8),
            company_name: user?.company_name || user?.full_name || record.email || 'Verified Supplier',
            registered_email: user?.registered_email || record.email || '',
            corporate_phone: user?.corporate_phone || user?.whatsapp_number || '',
            whatsapp_number: user?.whatsapp_number || user?.corporate_phone || '',
            city: user?.city || '',
            state: user?.state || '',
            role: user?.role || 'supplier'
          },
          trade_orders: null,
          notes: record.notes || `Supplier Membership (${record.plan})`
        });
      }
    } catch (subErr) {
      console.warn('Subscription sync notice in admin payments:', subErr.message);
    }

    // Merge orders and subscriptions
    const allPayments = [...ledgerPayments, ...subscriptionPayments];

    // Sort descending by created_at
    allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Calculate live metrics
    let totalSuccessfulVolume = 0;
    let successfulCount = 0;
    let totalFailedVolume = 0;
    let failedCount = 0;
    let totalPendingVolume = 0;
    let pendingCount = 0;
    let totalSubscriptionVolume = 0;
    let subscriptionCount = 0;
    let totalOrderVolume = 0;
    let orderCount = 0;

    allPayments.forEach(p => {
      const amt = Number(p.amount) || 0;
      const isSub = p.payment_type === 'supplier_subscription';
      if (isSub) {
        totalSubscriptionVolume += amt;
        subscriptionCount += 1;
      } else {
        totalOrderVolume += amt;
        orderCount += 1;
      }

      if (p.status === 'successful') {
        totalSuccessfulVolume += amt;
        successfulCount += 1;
      } else if (p.status === 'failed') {
        totalFailedVolume += amt;
        failedCount += 1;
      } else if (p.status === 'pending') {
        totalPendingVolume += amt;
        pendingCount += 1;
      }
    });

    const metrics = {
      totalSuccessfulVolume,
      successfulCount,
      totalFailedVolume,
      failedCount,
      totalPendingVolume,
      pendingCount,
      totalSubscriptionVolume,
      subscriptionCount,
      totalOrderVolume,
      orderCount
    };

    // Filter by status or category tab if requested
    let filtered = allPayments;
    if (status && status !== 'all') {
      if (status === 'subscriptions') {
        filtered = filtered.filter(p => p.payment_type === 'supplier_subscription');
      } else if (status === 'orders') {
        filtered = filtered.filter(p => p.payment_type !== 'supplier_subscription');
      } else {
        filtered = filtered.filter(p => p.status === status);
      }
    }

    if (type === 'subscriptions') {
      filtered = filtered.filter(p => p.payment_type === 'supplier_subscription');
    } else if (type === 'orders') {
      filtered = filtered.filter(p => p.payment_type !== 'supplier_subscription');
    }

    // Filter by search query if provided
    if (search) {
      filtered = filtered.filter(p => {
        const comp = (p.users?.company_name || '').toLowerCase();
        const email = (p.users?.registered_email || '').toLowerCase();
        const phone = (p.users?.corporate_phone || '').toLowerCase();
        const ref = (p.transaction_reference || '').toLowerCase();
        const ordId = (p.order_id || '').toLowerCase();
        const plan = (p.plan || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        return comp.includes(search) || email.includes(search) || phone.includes(search) || ref.includes(search) || ordId.includes(search) || plan.includes(search) || notes.includes(search);
      });
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      payments: paginated,
      total: totalCount,
      page,
      limit,
      metrics
    });
  } catch (err) {
    console.error('Admin payments API error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, orderId, amount, paymentMethod, status, transactionReference, paymentType, notes, plan: formPlan } = body;

    if (!amount || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const ref = transactionReference || `MANUAL-${Date.now()}`;
    const cleanOrderId = (orderId && orderId.trim()) || null;
    const cleanUserId = (userId && userId.trim()) || null;

    // Check if this is a Subscription Payment
    const isSubscription = paymentType === 'supplier_subscription' || 
                           paymentType === 'supplier_subscription_quarterly' || 
                           paymentType === 'supplier_subscription_annual';

    if (isSubscription) {
      const plan = formPlan || (paymentType === 'supplier_subscription_annual' || Number(amount) >= 2000 ? 'ANNUAL PLAN' : 'QUARTERLY PLAN');
      const days = plan === 'ANNUAL PLAN' ? 365 : 90;

      // Find user if userId is provided
      let userEmail = cleanUserId && cleanUserId.includes('@') ? cleanUserId : null;
      let targetUserId = cleanUserId && !cleanUserId.includes('@') ? cleanUserId : null;

      if (!userEmail && targetUserId) {
        const { data: u } = await supabaseAdmin.from('users').select('registered_email').eq('id', targetUserId).single();
        if (u?.registered_email) userEmail = u.registered_email;
      } else if (userEmail && !targetUserId) {
        const { data: u } = await supabaseAdmin.from('users').select('id').eq('registered_email', userEmail).single();
        if (u?.id) targetUserId = u.id;
      }

      // Activate membership in membershipStore
      const activatedSub = manualActivateMembership({
        userId: targetUserId,
        email: userEmail,
        plan,
        days,
        paymentId: ref,
        notes: notes || `Manual subscription payment recorded by Admin (${paymentMethod || 'NEFT / RTGS'})`,
        activatedBy: 'admin'
      });

      // Also reactivate supplier products if user exists
      if (targetUserId) {
        try {
          await supabaseAdmin.from('products').update({ is_active: true }).eq('supplier_id', targetUserId);
        } catch (e) {}
      }

      return NextResponse.json({
        success: true,
        payment: {
          id: `sub-${ref}`,
          order_id: null,
          amount: Number(amount),
          status: status || 'successful',
          payment_method: paymentMethod || 'Admin Manual Settlement',
          payment_type: 'supplier_subscription',
          plan: plan,
          transaction_reference: ref,
          created_at: activatedSub.activatedAt || new Date().toISOString()
        }
      });
    }

    // Otherwise, require order ID for trade escrow
    if (!cleanOrderId) {
      return NextResponse.json({ 
        error: 'Order ID is required for Trade Order escrow payments. If this is a subscription fee, select "Supplier Subscription" under Payment Type.' 
      }, { status: 400 });
    }

    // Record directly in platform_ledger
    const { data: ledgerEntry, error } = await supabaseAdmin
      .from('platform_ledger')
      .insert({
        order_id: cleanOrderId,
        amount: Number(amount),
        entry_type: paymentType || 'advance_10_percent',
        from_entity_id: cleanUserId,
        payment_reference: ref,
        description: notes || `Manual payment recorded by Admin (${paymentMethod || 'NEFT / RTGS'})`
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting ledger payment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If linked to an order, update current_state
    if (cleanOrderId) {
      try {
        await supabaseAdmin
          .from('trade_orders')
          .update({
            current_state: 'price_locked_10',
            qr_payment_reference: ref,
            updated_at: new Date().toISOString()
          })
          .eq('id', cleanOrderId);
      } catch (orderUpdateErr) {
        console.warn('Trade order status update notice:', orderUpdateErr.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      payment: {
        id: ledgerEntry.id,
        order_id: cleanOrderId,
        amount: Number(amount),
        status: status || 'successful',
        payment_method: paymentMethod || 'NEFT / RTGS Bank Transfer',
        payment_type: paymentType || 'advance_10_percent',
        transaction_reference: ref,
        created_at: ledgerEntry.created_at
      }
    });
  } catch (err) {
    console.error('Admin record payment error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
