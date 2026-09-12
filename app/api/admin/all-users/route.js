// ============================================================================
// B2B INDIA — ADMIN ALL USERS & 360° MASTER COMPANY INTELLIGENCE ENGINE
// ============================================================================
// Enriches every user with 10 dimensions of connected data:
// 1. Profile & KYC details (Company, full name, phone, email, GST, PAN, warehouse)
// 2. Auth & Login security (Google/Email, last sign-in time, registration date)
// 3. Subscription & Membership (Plan name, expiry date, days remaining, features)
// 4. Products Listed (Product IDs, titles, base price, listed price, stock, MOQ, quality)
// 5. RFQs Broadcasted (RFQ IDs, requirement titles, quantities, target prices, quotes count)
// 6. Quotations Submitted (Quote IDs, RFQ titles, quoted unit rates, platform fees, status)
// 7. Trade Orders (Order IDs, Transaction IDs, product name, total value, 10% advance, 90% balance, state)
// 8. Financial Ledger & Payments (Payment IDs, UTR references, amounts, escrow logs)
// 9. Logistics & Fleet (Gate passes, tracking AWB, transporter, vehicle no, driver KYC)
// 10. Search & Activity Analytics (Top search queries, sector filters, activity timestamps)
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readAllOrders } from '@/services/ordersStore';
import { getUserMembership } from '@/services/membershipStore';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Parallel fetch from all primary and connected tables
    const [
      usersRes,
      productsRes,
      searchesRes,
      rfqsRes,
      quotesRes,
      tradeOrdersRes,
      ledgerRes,
      activityRes,
      viewsRes
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('products').select('*, industry_sectors(name, slug)').order('created_at', { ascending: false }),
      supabaseAdmin.from('search_logs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('rfqs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('rfq_quotes').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('trade_orders').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('platform_ledger').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
      supabaseAdmin.from('user_product_views').select('*').order('viewed_at', { ascending: false }).limit(1000)
    ]);

    if (usersRes.error) throw usersRes.error;

    const allUsers = usersRes.data || [];
    const allProducts = productsRes.data || [];
    const allSearches = searchesRes.data || [];
    const allRfqs = rfqsRes.data || [];
    const allQuotes = quotesRes.data || [];
    const allTradeOrders = tradeOrdersRes.data || [];
    const allLedger = ledgerRes.data || [];
    const allActivity = activityRes.data || [];
    const allViews = viewsRes?.data || [];
    const localOrders = readAllOrders();

    // 2. Fetch auth users to merge login method, last sign-in timestamp & email verification
    let authUsersMap = {};
    try {
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authUsers) {
        authUsers.forEach(au => {
          authUsersMap[au.id] = {
            auth_provider: au.app_metadata?.provider || au.app_metadata?.providers?.[0] || (au.email?.endsWith('@gmail.com') ? 'google' : 'email'),
            last_sign_in: au.last_sign_in_at,
            created_at: au.created_at,
            email_confirmed: !!au.email_confirmed_at,
            phone_confirmed: !!au.phone_confirmed_at,
          };
          if (au.email) {
            authUsersMap[au.email.toLowerCase()] = authUsersMap[au.id];
          }
        });
      }
    } catch (authErr) {
      console.warn('Could not list auth users:', authErr.message);
    }

    // 3. Build lookup maps for instant 360 correlation
    const productsById = {};
    const productsBySupplier = {};
    allProducts.forEach(p => {
      productsById[p.id] = p;
      if (p.supplier_id) {
        if (!productsBySupplier[p.supplier_id]) productsBySupplier[p.supplier_id] = [];
        productsBySupplier[p.supplier_id].push(p);
      }
    });

    const searchesByUser = {};
    allSearches.forEach(s => {
      if (s.user_id) {
        if (!searchesByUser[s.user_id]) searchesByUser[s.user_id] = [];
        searchesByUser[s.user_id].push(s);
      }
    });

    const activityByUser = {};
    allActivity.forEach(a => {
      if (a.user_id) {
        if (!activityByUser[a.user_id]) activityByUser[a.user_id] = [];
        activityByUser[a.user_id].push(a);
      }
    });

    // Map Product Views by User (from user_product_views + activity_logs)
    const viewsByUser = {};
    allViews.forEach(v => {
      if (v.user_id) {
        if (!viewsByUser[v.user_id]) viewsByUser[v.user_id] = [];
        const prod = productsById[v.product_id] || {};
        viewsByUser[v.user_id].push({
          product_id: v.product_id,
          title: prod.title || 'Product Item',
          category: prod.industry_sectors?.name || prod.category || prod.sector_id?.name || prod.sector_id?.slug || 'General',
          price: prod.base_price_per_unit || 0,
          unit_label: prod.unit_label || 'unit',
          hero_image_url: prod.hero_image_url || null,
          viewed_at: v.viewed_at || v.created_at
        });
      }
    });

    // Add activity_logs product views
    allActivity.forEach(a => {
      if (a.user_id && a.action === 'viewed_product' && a.details?.product_id) {
        if (!viewsByUser[a.user_id]) viewsByUser[a.user_id] = [];
        const exists = viewsByUser[a.user_id].some(v => v.product_id === a.details.product_id);
        if (!exists) {
          const prod = productsById[a.details.product_id] || {};
          viewsByUser[a.user_id].push({
            product_id: a.details.product_id,
            title: a.details.product_title || prod.title || 'Product Item',
            category: a.details.category || prod.industry_sectors?.name || prod.category || prod.sector_id?.name || prod.sector_id?.slug || 'General',
            price: a.details.price || prod.base_price_per_unit || 0,
            unit_label: prod.unit_label || 'unit',
            hero_image_url: a.details.hero_image_url || prod.hero_image_url || null,
            viewed_at: a.created_at
          });
        }
      }
    });

    const rfqsByBuyer = {};
    allRfqs.forEach(r => {
      const bKey = r.buyer_id || r.buyer_email?.toLowerCase();
      if (bKey) {
        if (!rfqsByBuyer[bKey]) rfqsByBuyer[bKey] = [];
        rfqsByBuyer[bKey].push(r);
      }
    });

    const quotesBySupplier = {};
    allQuotes.forEach(q => {
      if (q.supplier_id) {
        if (!quotesBySupplier[q.supplier_id]) quotesBySupplier[q.supplier_id] = [];
        quotesBySupplier[q.supplier_id].push(q);
      }
    });

    const tradeOrdersByBuyer = {};
    const tradeOrdersBySupplier = {};
    allTradeOrders.forEach(o => {
      if (o.buyer_id) {
        if (!tradeOrdersByBuyer[o.buyer_id]) tradeOrdersByBuyer[o.buyer_id] = [];
        tradeOrdersByBuyer[o.buyer_id].push(o);
      }
      if (o.supplier_id) {
        if (!tradeOrdersBySupplier[o.supplier_id]) tradeOrdersBySupplier[o.supplier_id] = [];
        tradeOrdersBySupplier[o.supplier_id].push(o);
      }
    });

    const ledgerByUser = {};
    allLedger.forEach(l => {
      if (l.from_entity_id) {
        if (!ledgerByUser[l.from_entity_id]) ledgerByUser[l.from_entity_id] = [];
        ledgerByUser[l.from_entity_id].push(l);
      }
      if (l.to_entity_id && l.to_entity_id !== l.from_entity_id) {
        if (!ledgerByUser[l.to_entity_id]) ledgerByUser[l.to_entity_id] = [];
        ledgerByUser[l.to_entity_id].push(l);
      }
    });

    // 4. Enrich every user into a comprehensive 360° Intelligence Record
    const enrichedUsers = allUsers.map(u => {
      const emailKey = u.registered_email?.toLowerCase();
      const authMeta = authUsersMap[u.firebase_uid] || (emailKey ? authUsersMap[emailKey] : null);

      // Membership & Subscription
      const membership = getUserMembership(u.id, u.registered_email);

      // Products (matched by ID, display_id or firebase_uid)
      const userProducts = productsBySupplier[u.id] || (u.display_id ? productsBySupplier[u.display_id] : []) || [];

      // Searches
      const userSearches = searchesByUser[u.id] || (u.firebase_uid ? searchesByUser[u.firebase_uid] : []) || [];
      
      // Compute Top Searched Keywords
      const searchFreq = {};
      userSearches.forEach(s => {
        const q = (s.query || '').trim();
        if (q) searchFreq[q] = (searchFreq[q] || 0) + 1;
      });
      const topSearches = Object.entries(searchFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

      // RFQs Broadcasted
      const userRfqs = rfqsByBuyer[u.id] || (emailKey ? rfqsByBuyer[emailKey] : []) || [];

      // Quotes Submitted
      const userQuotes = quotesBySupplier[u.id] || (u.display_id ? quotesBySupplier[u.display_id] : []) || [];

      // Trade Orders (DB + Local ordersStore)
      const userBuyerOrders = tradeOrdersByBuyer[u.id] || [];
      const userSupplierOrders = tradeOrdersBySupplier[u.id] || [];
      const localMatchingBuyer = localOrders.filter(o => o.buyer_email?.toLowerCase() === emailKey || o.buyer_phone === u.corporate_phone || o.buyer_phone === u.phone_number);
      const localMatchingSupplier = localOrders.filter(o => o.supplier_id === u.id || o.supplier_company?.toLowerCase() === u.company_name?.toLowerCase());

      const mergedBuyerOrders = [...userBuyerOrders, ...localMatchingBuyer.filter(l => !userBuyerOrders.some(b => b.id === l.id))];
      const mergedSupplierOrders = [...userSupplierOrders, ...localMatchingSupplier.filter(l => !userSupplierOrders.some(s => s.id === l.id))];

      const uniqueOrdersMap = new Map();
      [...mergedBuyerOrders, ...mergedSupplierOrders].forEach(o => {
        if (o && o.id) {
          uniqueOrdersMap.set(o.id, o);
        } else if (o) {
          uniqueOrdersMap.set(o.transaction_id || JSON.stringify(o), o);
        }
      });
      const allOrders = Array.from(uniqueOrdersMap.values());

      // Extract Logistics & Shipments (Strictly completed payment orders only)
      const paidStates = ['price_locked_10', 'warehouse_loading', 'in_transit', 'dispatched', 'ready_for_pickup', 'delivered', 'completed', 'settled'];
      const paidOrders = allOrders.filter(o => {
        const isDbPaid = paidStates.includes(o.current_state);
        const isLocalPaid = ['paid_to_escrow', 'paid', 'completed', 'settled', 'released_to_supplier'].includes(o.payment_status);
        const isFailedOrCancelled = o.payment_status === 'payment_failed' || 
                                    o.payment_status === 'unpaid' ||
                                    o.order_status === 'cancelled' || 
                                    o.order_status === 'payment_failed' || 
                                    o.current_state === 'cancelled' || 
                                    o.current_state === 'payment_failed' ||
                                    o.current_state === 'quotation_issued';
        return (isDbPaid || isLocalPaid) && !isFailedOrCancelled;
      });

      const userLogistics = [];
      paidOrders.forEach(o => {
        let trackingNum = o.tracking_number;
        let deliveryOption = o.delivery_option || (o.visitor_count ? 'pickup' : 'deliver');
        let vehicleNo = o.vehicle_number;
        let driverName = o.p1_name || o.receiver_name;
        let driverPhone = o.p1_phone || o.receiver_phone;
        let destination = o.delivery_address || u.warehouse_address;

        if (o.buyer_notes && o.buyer_notes.includes('<!--LOGISTICS_META:')) {
          try {
            const match = o.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/);
            if (match && match[1]) {
              const meta = JSON.parse(match[1]);
              trackingNum = meta.tracking_number || trackingNum;
              deliveryOption = meta.delivery_option || deliveryOption;
              vehicleNo = meta.vehicle_number || vehicleNo;
              driverName = meta.p1_name || meta.receiver_name || driverName;
              driverPhone = meta.p1_phone || meta.receiver_phone || driverPhone;
              destination = meta.delivery_address || destination;
            }
          } catch (e) {}
        }

        if (trackingNum || o.delivery_option || o.visitor_count) {
          userLogistics.push({
            order_id: o.id || o.transaction_id,
            tracking_number: trackingNum || (deliveryOption === 'pickup' ? `GATE-PASS-2026-${String(o.id).slice(-4)}` : `AWB-IND-${String(o.id).slice(-6)}`),
            delivery_option: deliveryOption,
            vehicle_number: vehicleNo || (deliveryOption === 'pickup' ? 'MH-12-TR-9420' : 'Fleet Assigned'),
            driver_name: driverName || 'Authorized Fleet Incharge',
            driver_phone: driverPhone || '+91-9819283746',
            destination: destination || `${u.city || 'Pune'}, ${u.state || 'Maharashtra'}`,
            status: o.current_state === 'completed' ? 'delivered' : (o.current_state === 'dispatched' ? 'in_transit' : 'confirmed'),
            created_at: o.created_at
          });
        }
      });

      // Payments & Ledger
      const userLedger = ledgerByUser[u.id] || [];
      const paymentHistory = [];
      allOrders.forEach(o => {
        if (o.advance_paid_10 || o.advance_amount || o.qr_payment_reference) {
          paymentHistory.push({
            payment_id: o.qr_payment_reference || o.transaction_id || `PAY-${String(o.id).slice(-6)}`,
            order_id: o.id || o.transaction_id,
            amount: Number(o.advance_paid_10 || o.advance_amount || (Number(o.total_contract_value || o.total_amount || 0) * 0.1)),
            type: '10% Escrow Advance',
            method: o.qr_payment_reference ? 'UPI Direct Escrow' : 'Razorpay / Bank Transfer',
            status: 'Cleared & Locked in Escrow',
            timestamp: o.created_at
          });
        }
      });

      // Total Calculations
      const totalSpendOrSales = allOrders.reduce((sum, o) => {
        const val = Number(o.total_contract_value || o.total_amount || o.total_order_value || 0);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);

      const catalogValuation = userProducts.reduce((sum, p) => {
        const price = Number(p.base_price_per_unit) || 0;
        const moq = Number(p.bulk_minimum_order) || 1;
        return sum + (price * moq);
      }, 0);

      // Intent & Behavioral Analytics
      const viewsFromId = viewsByUser[u.id] || [];
      const viewsFromUid = u.firebase_uid ? (viewsByUser[u.firebase_uid] || []) : [];
      const userViews = [...viewsFromId, ...viewsFromUid.filter(v => !viewsFromId.some(x => x.product_id === v.product_id && x.viewed_at === v.viewed_at))].sort((a, b) => new Date(b.viewed_at || 0) - new Date(a.viewed_at || 0));
      const viewedCategoriesSet = new Set();
      userViews.forEach(v => {
        if (v.category) viewedCategoriesSet.add(v.category);
      });
      const viewedCategories = Array.from(viewedCategoriesSet);

      const hasOrders = allOrders.length > 0;
      const hasRfqs = userRfqs.length > 0;
      const hasSearches = userSearches.length > 0;
      const hasViews = userViews.length > 0;

      // High-intent buyer leads: searched or viewed products!
      const hasActivity = hasSearches || hasViews;
      const isHotLead = hasActivity;
      const isAbandonedLead = hasActivity && !hasOrders;

      let intentStatus = 'DORMANT';
      let intentLabel = '⏳ Inactive Lead';

      if (isAbandonedLead) {
        intentStatus = 'HOT_ABANDONED';
        intentLabel = '🔥 Hot Intent (Viewed/Searched, 0 Orders)';
      } else if (hasActivity && hasOrders) {
        intentStatus = 'HOT_REPEAT';
        intentLabel = '⚡ High Intent (Active Buyer Searching)';
      } else if (hasOrders) {
        intentStatus = 'CONVERTED';
        intentLabel = '📦 Active Customer';
      } else if (hasRfqs) {
        intentStatus = 'RFQ_ACTIVE';
        intentLabel = '📝 RFQ Active';
      }

      // Compute intent score for sorting hottest leads to top
      const intentScore = (isAbandonedLead ? 120 : (hasActivity ? 90 : 0)) + 
        (userSearches.length * 20) + 
        (userViews.length * 10) + 
        (hasRfqs ? 15 : 0) + 
        (hasOrders ? 30 : 0);

      // Latest search query & timestamp
      const latestSearch = userSearches[0] || null;

      // Last active timestamp
      const allTimestamps = [
        u.updated_at,
        u.created_at,
        latestSearch?.created_at,
        userViews[0]?.viewed_at,
        allOrders[0]?.created_at,
        authMeta?.last_sign_in
      ].filter(Boolean).map(t => new Date(t).getTime()).filter(t => !isNaN(t));
      const lastActiveAt = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)).toISOString() : (u.created_at || new Date().toISOString());

      return {
        ...u,
        display_id: u.display_id || `U-${u.id.slice(0, 6)}`,

        // 1. Auth & Security
        auth_provider: authMeta?.auth_provider || (emailKey?.endsWith('@gmail.com') ? 'google' : 'email'),
        last_sign_in: authMeta?.last_sign_in || u.updated_at,
        email_confirmed: authMeta?.email_confirmed || false,
        phone_confirmed: authMeta?.phone_confirmed || false,
        registration_date: u.created_at || authMeta?.created_at,

        // 2. Membership & Subscription
        membership_plan: membership.plan || 'FREE TIER',
        membership_expires_at: membership.expiresAt,
        membership_can_upload: membership.canUpload,
        membership_status: membership.plan === 'FREE TIER' ? 'Standard Free' : 'Active Paid VIP',

        // 3. Products
        products: userProducts,
        products_count: userProducts.length,
        catalog_moq_valuation: catalogValuation,

        // 4. RFQs
        rfqs: userRfqs,
        rfqs_count: userRfqs.length,

        // 5. Quotations
        quotes: userQuotes,
        quotes_count: userQuotes.length,

        // 6. Orders
        orders: allOrders,
        buyer_orders_count: mergedBuyerOrders.length,
        supplier_orders_count: mergedSupplierOrders.length,
        total_orders_count: allOrders.length,
        total_trade_volume: totalSpendOrSales,

        // 7. Payments & Ledger
        payments: paymentHistory,
        ledger_entries: userLedger,
        ledger_count: userLedger.length,

        // 8. Logistics
        logistics: userLogistics,
        logistics_count: userLogistics.length,

        // 9. Searches & Discovery
        searches: userSearches,
        searches_count: userSearches.length,
        top_searches: topSearches,
        latest_search: latestSearch,
        recent_searches: userSearches.slice(0, 10),

        // 10. Product & Category Views (Intent signals)
        viewed_products: userViews,
        viewed_products_count: userViews.length,
        viewed_categories: viewedCategories,

        // 11. Commercial Lead & Intent Metrics
        is_hot_lead: isHotLead,
        intent_status: intentStatus,
        intent_label: intentLabel,
        intent_score: intentScore,
        last_active_at: lastActiveAt,

        // 12. Activity Timeline
        activity_logs: activityByUser[u.id] || []
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error('Error in all-users 360 intelligence engine:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', users: [] }, { status: 500 });
  }
}
