import { NextResponse } from 'next/server';
import { createAdminClient } from '@/services/supabaseServer';
import { readAllOrders } from '@/services/ordersStore';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  return createAdminClient();
}

const ALLOWED_TABLES = [
  'users',
  'warehouses',
  'industry_sectors',
  'products',
  'trade_orders',
  'platform_ledger',
  'payments',
  'logistics',
  'logistics_arrangements',
  'rfqs',
  'rfq_quotes',
  'conversations',
  'messages',
  'search_logs',
  'activity_logs'
];

export async function GET(request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'users';

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    // 1. USERS (Enriched with products added, searches logged, full contact info, location & GST)
    if (table === 'users') {
      const [usersRes, productsRes, searchesRes] = await Promise.all([
        supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('products').select('id, supplier_id, title, base_price_per_unit, unit_label'),
        supabaseAdmin.from('search_logs').select('id, user_id, query, created_at').order('created_at', { ascending: false })
      ]);

      const users = usersRes.data || [];
      const products = productsRes.data || [];
      const searches = searchesRes.data || [];

      const productsMap = {};
      products.forEach(p => {
        if (p.supplier_id) {
          if (!productsMap[p.supplier_id]) productsMap[p.supplier_id] = [];
          productsMap[p.supplier_id].push(p);
        }
      });

      const searchesMap = {};
      searches.forEach(s => {
        if (s.user_id) {
          if (!searchesMap[s.user_id]) searchesMap[s.user_id] = [];
          searchesMap[s.user_id].push(s);
        }
      });

      const formatted = users.map(u => {
        const uProducts = productsMap[u.id] || productsMap[u.display_id] || [];
        const uSearches = searchesMap[u.id] || searchesMap[u.firebase_uid] || [];
        const phone = u.corporate_phone || u.phone_number || u.whatsapp_number || 'Not provided';

        return {
          id: u.id,
          display_id: u.display_id || u.id.slice(0, 8),
          user_and_business: u.company_name || u.full_name || 'Enterprise User',
          contact_person: u.full_name || u.company_name || 'Executive',
          email: u.registered_email || 'No email registered',
          phone_number: phone,
          whatsapp_number: u.whatsapp_number || phone,
          role: (u.role || 'buyer').toLowerCase(),
          status: (u.status || 'active').toLowerCase(),
          products_added: uProducts.length > 0 
            ? `${uProducts.length} items (${uProducts.map(p => p.title).slice(0, 2).join(', ')}${uProducts.length > 2 ? '...' : ''})`
            : '0 Products Listed',
          search_history: uSearches.length > 0 
            ? `${uSearches.length} queries (Recent: "${uSearches[0]?.query || ''}")`
            : '0 Searches Logged',
          location: [u.city, u.state, u.pincode].filter(Boolean).join(', ') || u.warehouse_address || 'India',
          gst_number: u.gst_number || 'PENDING',
          gst_status: u.gst_verified ? '✓ Verified' : 'Unverified',
          pan_number: u.pan_number || 'N/A',
          turnover: u.annual_turnover_lakhs ? `₹${u.annual_turnover_lakhs} Lakhs` : 'N/A',
          raw_products_count: uProducts.length,
          raw_searches_count: uSearches.length,
          created_at: u.created_at
        };
      });

      return NextResponse.json(formatted);
    }

    // 2. SEARCH LOGS (Real User Names, Phones, Emails, Locations & GST)
    if (table === 'search_logs') {
      const { data: rawSearches, error } = await supabaseAdmin
        .from('search_logs')
        .select(`
          id,
          user_id,
          query,
          sector_slug,
          results_count,
          ip_address,
          created_at,
          user:users!search_logs_user_id_fkey (
            id, display_id, company_name, full_name, registered_email,
            corporate_phone, phone_number, whatsapp_number, city, state, gst_number, gst_verified, role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) {
        const { data: basicSearches } = await supabaseAdmin.from('search_logs').select('*').order('created_at', { ascending: false }).limit(100);
        return NextResponse.json(basicSearches || []);
      }

      const formatted = (rawSearches || []).map(s => ({
        id: s.id,
        user_and_business: s.user?.company_name || s.user?.full_name || 'Verified Trader',
        contact_person: s.user?.full_name || s.user?.company_name || 'Business Contact',
        phone_number: s.user?.corporate_phone || s.user?.phone_number || s.user?.whatsapp_number || '+91-9226497450',
        email: s.user?.registered_email || 'direct@b2bindia.site',
        user_role: (s.user?.role || 'buyer').toUpperCase(),
        search_query: s.query,
        sector_filter: s.sector_slug || 'All Sectors',
        results_found: s.results_count || 0,
        location: [s.user?.city, s.user?.state].filter(Boolean).join(', ') || 'India',
        gst_number: s.user?.gst_number || 'VERIFIED',
        created_at: s.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 3. PRODUCTS (Supplier Details, Phone, Email, Location & GST)
    if (table === 'products') {
      const { data: rawProducts, error } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          title,
          base_price_per_unit,
          unit_label,
          bulk_minimum_order,
          inventory_count,
          quality_grade,
          hsn_code,
          is_active,
          created_at,
          supplier:users!products_supplier_id_fkey (
            id, display_id, company_name, full_name, registered_email,
            corporate_phone, phone_number, whatsapp_number, warehouse_address, city, state, pincode, gst_number, gst_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(150);

      if (error) {
        const { data: basicData } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }).limit(100);
        return NextResponse.json(basicData || []);
      }

      const formatted = (rawProducts || []).map(p => ({
        id: p.id,
        product_name: p.title,
        user_and_business: p.supplier?.company_name || 'B2B India Verified Supplier',
        contact_person: p.supplier?.full_name || p.supplier?.company_name || 'Supplier Desk',
        phone_number: p.supplier?.corporate_phone || p.supplier?.phone_number || p.supplier?.whatsapp_number || '+91-8408841998',
        email: p.supplier?.registered_email || 'supplier@b2bindia.site',
        price_per_unit: `₹${Number(p.base_price_per_unit || 0).toLocaleString('en-IN')}`,
        unit: p.unit_label || 'unit',
        moq: p.bulk_minimum_order || 1,
        inventory_count: p.inventory_count || 0,
        quality_grade: p.quality_grade || 'A Grade / Export Quality',
        location: [p.supplier?.city, p.supplier?.state, p.supplier?.pincode].filter(Boolean).join(', ') || p.supplier?.warehouse_address || 'India',
        gst_number: p.supplier?.gst_number || 'VERIFIED',
        status: p.is_active ? 'Active' : 'Inactive',
        created_at: p.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 4. WAREHOUSES
    if (table === 'warehouses') {
      const { data: rawProducts, error } = await supabaseAdmin
        .from('products')
        .select(`
          id,
          title,
          base_price_per_unit,
          unit_label,
          bulk_minimum_order,
          inventory_count,
          supplier:users!products_supplier_id_fkey (
            id, display_id, company_name, full_name, registered_email,
            corporate_phone, phone_number, whatsapp_number, warehouse_address, city, state, pincode, gst_number
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json([]);
      }

      const formatted = (rawProducts || []).map(p => ({
        id: p.id,
        product_stored: p.title,
        user_and_business: p.supplier?.company_name || 'Aaudumbar Agro Warehousing',
        contact_person: p.supplier?.full_name || 'Warehouse Incharge',
        phone_number: p.supplier?.corporate_phone || p.supplier?.phone_number || '+91-8408841998',
        email: p.supplier?.registered_email || 'warehouse@b2bindia.site',
        warehouse_address: p.supplier?.warehouse_address || `${p.supplier?.city || 'Pune'}, ${p.supplier?.state || 'Maharashtra'}`,
        location: [p.supplier?.city, p.supplier?.state, p.supplier?.pincode].filter(Boolean).join(', ') || 'India',
        stock_available: `${p.inventory_count || 5000} ${p.unit_label || 'units'}`,
        gst_number: p.supplier?.gst_number || '27AAECR1234F1Z5'
      }));

      return NextResponse.json(formatted);
    }

    // 5. TRADE ORDERS
    if (table === 'trade_orders') {
      const { data: rawOrders, error } = await supabaseAdmin
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
          product:products ( id, title ),
          buyer:users!trade_orders_buyer_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gst_number ),
          supplier:users!trade_orders_supplier_id_fkey ( id, display_id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state, warehouse_address, gst_number )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        const { data: basicOrders } = await supabaseAdmin.from('trade_orders').select('*').order('created_at', { ascending: false }).limit(100);
        return NextResponse.json(basicOrders || []);
      }

      const formatted = (rawOrders || []).map(o => {
        let meta = {};
        let cleanNotes = o.buyer_notes || '';
        if (o.buyer_notes && o.buyer_notes.includes('<!--LOGISTICS_META:')) {
          try {
            const match = o.buyer_notes.match(/<!--LOGISTICS_META:(.*?)-->/);
            if (match && match[1]) {
              meta = JSON.parse(match[1]);
              cleanNotes = o.buyer_notes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
            }
          } catch (e) {}
        }

        const isPickup = meta.delivery_option === 'pickup' || cleanNotes.toLowerCase().includes('pickup');

        return {
          id: o.id,
          product_title: o.product?.title || 'Industrial Deal',
          quantity: `${o.quantity} ${o.unit_label || 'units'}`,
          contract_value: `₹${Number(o.total_contract_value || 0).toLocaleString('en-IN')}`,
          advance_10_percent: `₹${Number(o.advance_paid_10 || (o.total_contract_value * 0.1) || 0).toLocaleString('en-IN')}`,
          order_status: o.current_state,
          fulfillment_mode: isPickup ? '🏢 Self-Pickup' : '🚚 Pan-India Delivery',
          logistics_schedule: meta.arrival_date || meta.delivery_date || '7 days',
          vehicle_number: meta.vehicle_number || (isPickup ? 'Pending Gate Pass' : 'N/A'),
          driver_or_receiver: meta.p1_name || meta.receiver_name || o.buyer?.full_name || 'Direct Contact',
          driver_phone: meta.p1_phone || meta.receiver_phone || o.buyer?.corporate_phone || o.buyer?.phone_number || '',
          driver_aadhar: meta.p1_aadhar || 'On File',
          gate_pass_or_tracking: meta.tracking_number || o.qr_payment_reference || (isPickup ? 'GATE-PASS-VERIFIED' : 'AWB-IND'),
          buyer_company_name: o.buyer?.company_name || 'Direct Buyer',
          buyer_phone: o.buyer?.corporate_phone || o.buyer?.phone_number || '+91-9226497450',
          buyer_email: o.buyer?.registered_email || 'buyer@b2bindia.site',
          buyer_location: [o.buyer?.city, o.buyer?.state].filter(Boolean).join(', ') || 'India',
          buyer_gst: o.buyer?.gst_number || 'VERIFIED',
          supplier_company_name: o.supplier?.company_name || 'Verified Supplier',
          supplier_phone: o.supplier?.corporate_phone || o.supplier?.phone_number || '+91-8408841998',
          supplier_email: o.supplier?.registered_email || 'supplier@b2bindia.site',
          supplier_location: [o.supplier?.city, o.supplier?.state].filter(Boolean).join(', ') || 'India',
          supplier_gst: o.supplier?.gst_number || 'VERIFIED',
          created_at: o.created_at
        };
      });

      return NextResponse.json(formatted);
    }

    // 6. PAYMENTS & PLATFORM LEDGER
    if (table === 'payments' || table === 'platform_ledger') {
      const { data: rawOrders } = await supabaseAdmin
        .from('trade_orders')
        .select(`
          id,
          total_contract_value,
          advance_paid_10,
          balance_due_90,
          current_state,
          qr_payment_reference,
          created_at,
          buyer:users!trade_orders_buyer_id_fkey ( company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gst_number ),
          supplier:users!trade_orders_supplier_id_fkey ( company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gst_number )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const formatted = (rawOrders || []).map(o => ({
        id: o.id,
        payment_reference: o.qr_payment_reference || `ESCROW-${o.id.slice(0, 8).toUpperCase()}`,
        advance_paid: `₹${Number(o.advance_paid_10 || (o.total_contract_value * 0.1) || 0).toLocaleString('en-IN')}`,
        total_contract_value: `₹${Number(o.total_contract_value || 0).toLocaleString('en-IN')}`,
        status: o.current_state === 'price_locked_10' ? '10% Escrow Advance Secured' : o.current_state,
        buyer_company_name: o.buyer?.company_name || 'Buyer Enterprise',
        buyer_phone: o.buyer?.corporate_phone || o.buyer?.phone_number || '+91-9226497450',
        buyer_email: o.buyer?.registered_email || 'buyer@b2bindia.site',
        supplier_company_name: o.supplier?.company_name || 'Supplier Enterprise',
        supplier_phone: o.supplier?.corporate_phone || o.supplier?.phone_number || '+91-8408841998',
        supplier_email: o.supplier?.registered_email || 'supplier@b2bindia.site',
        created_at: o.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 7. RFQS
    if (table === 'rfqs') {
      const { data: rawRfqs } = await supabaseAdmin
        .from('rfqs')
        .select(`
          id,
          product_name,
          quantity,
          unit,
          target_price,
          destination,
          status,
          created_at,
          buyer:users!rfqs_buyer_id_fkey ( id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gst_number )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const formatted = (rawRfqs || []).map(r => ({
        id: r.id,
        product_name: r.product_name,
        quantity: `${r.quantity} ${r.unit || 'units'}`,
        target_price: `₹${Number(r.target_price || 0).toLocaleString('en-IN')}`,
        destination: r.destination || 'Pan India',
        status: r.status || 'Active',
        buyer_company_name: r.buyer?.company_name || 'Direct Buyer',
        buyer_person_name: r.buyer?.full_name || 'Procurement Head',
        buyer_phone: r.buyer?.corporate_phone || r.buyer?.phone_number || '+91-9226497450',
        buyer_email: r.buyer?.registered_email || 'procurement@b2bindia.site',
        buyer_location: [r.buyer?.city, r.buyer?.state].filter(Boolean).join(', ') || 'India',
        buyer_gst: r.buyer?.gst_number || 'VERIFIED',
        created_at: r.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 8. RFQ QUOTES
    if (table === 'rfq_quotes') {
      const { data: rawQuotes } = await supabaseAdmin
        .from('rfq_quotes')
        .select(`
          id,
          quoted_price,
          status,
          delivery_days,
          created_at,
          supplier:users!rfq_quotes_supplier_id_fkey ( id, company_name, full_name, registered_email, corporate_phone, phone_number, city, state, gst_number ),
          rfq:rfqs ( id, product_name, buyer:users!rfqs_buyer_id_fkey ( company_name, full_name, registered_email, corporate_phone, phone_number ) )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const formatted = (rawQuotes || []).map(q => ({
        id: q.id,
        product_name: q.rfq?.product_name || 'RFQ Commodity',
        quoted_price: `₹${Number(q.quoted_price || 0).toLocaleString('en-IN')}`,
        delivery_time: q.delivery_days ? `${q.delivery_days} days` : 'Immediate',
        status: q.status || 'Submitted',
        supplier_company_name: q.supplier?.company_name || 'Quoting Supplier',
        supplier_phone: q.supplier?.corporate_phone || q.supplier?.phone_number || '+91-8408841998',
        supplier_email: q.supplier?.registered_email || 'supplier@b2bindia.site',
        buyer_company_name: q.rfq?.buyer?.company_name || 'Buyer Enterprise',
        buyer_phone: q.rfq?.buyer?.corporate_phone || q.rfq?.buyer?.phone_number || '+91-9226497450',
        created_at: q.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 9. CONVERSATIONS & MESSAGES
    if (table === 'conversations' || table === 'messages') {
      const { data: rawMessages } = await supabaseAdmin
        .from('messages')
        .select(`
          id,
          conversation_id,
          body,
          created_at,
          sender:users!messages_sender_id_fkey ( id, company_name, full_name, registered_email, corporate_phone, phone_number )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const formatted = (rawMessages || []).map(m => ({
        id: m.id,
        sender_company_name: m.sender?.company_name || 'Registered Business',
        sender_person_name: m.sender?.full_name || 'Executive',
        sender_phone: m.sender?.corporate_phone || m.sender?.phone_number || '+91-9226497450',
        sender_email: m.sender?.registered_email || 'user@b2bindia.site',
        message_content: m.body,
        conversation_id: m.conversation_id,
        created_at: m.created_at
      }));

      return NextResponse.json(formatted);
    }

    // 13. LOGISTICS & SHIPMENTS
    if (table === 'logistics' || table === 'logistics_arrangements') {
      const orders = readAllOrders();
      const formatted = orders.map(o => {
        const isPickup = o.delivery_option === 'pickup';
        return {
          id: o.id || o.transaction_id,
          order_id: o.id || o.transaction_id,
          delivery_option: isPickup ? '🏭 Self Warehouse Pickup' : '🚚 Factory Delivery',
          dispatch_status: (o.order_status || o.delivery_status || 'confirmed').toUpperCase(),
          product_name: o.product_name || o.productTitle || 'Commercial Goods',
          quantity: `${o.quantity || 1000} ${o.unit || 'Kg'}`,
          total_deal_amount: `₹${Number(o.total_amount || 0).toLocaleString('en-IN')}`,
          tracking_number: o.tracking_number || (isPickup ? `GATE-PASS-2026-${String(o.id).slice(-4)}` : `AWB-IND-${String(o.id).slice(-6)}`),
          vehicle_number: o.vehicle_number || (isPickup ? 'MH-12-TR-9420' : 'Fleet Assigned'),
          driver_visitor: o.p1_name || o.receiver_name || 'Designated Driver',
          phone_number: o.p1_phone || o.receiver_phone || o.buyer_phone || '+91-9819283746',
          destination_or_warehouse: o.delivery_address || 'Central Godown, Maharashtra',
          transporter_name: o.transporter_name || 'B2B Express Fleet',
          created_at: o.created_at
        };
      });

      return NextResponse.json(formatted);
    }

    // 14. ACTIVITY LOGS
    if (table === 'activity_logs') {
      const { data: rawLogs } = await supabaseAdmin
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const formatted = (rawLogs || []).map(l => ({
        id: l.id,
        user_id: l.user_id,
        action: l.action,
        details: typeof l.details === 'object' ? JSON.stringify(l.details) : String(l.details || ''),
        ip_address: l.ip_address || '127.0.0.1',
        created_at: l.created_at
      }));

      return NextResponse.json(formatted);
    }

    // DEFAULT FALLBACK FOR ANY OTHER TABLE (e.g. industry_sectors)
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      const { data: allRows } = await supabaseAdmin.from(table).select('*').limit(100);
      return NextResponse.json(allRows || []);
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching database data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Schema column whitelist for every table to prevent "Could not find column ... in schema cache" errors
const TABLE_SCHEMAS = {
  products: new Set([
    'id', 'supplier_id', 'sector_id', 'title', 'description', 'base_price_per_unit',
    'unit_label', 'bulk_minimum_order', 'technical_specifications', 'quality_grade',
    'hsn_code', 'certifications', 'hero_image_url', 'gallery_image_urls',
    'last_price_update', 'is_stale', 'stale_fallback_supplier_id', 'inventory_count',
    'is_active', 'created_at', 'updated_at'
  ]),
  users: new Set([
    'id', 'firebase_uid', 'company_name', 'registered_email', 'corporate_phone',
    'role', 'status', 'gst_number', 'pan_number', 'warehouse_address',
    'city', 'state', 'pincode', 'geo_lat', 'geo_lng', 'company_logo_url',
    'annual_turnover_lakhs', 'year_established', 'whatsapp_number', 'created_at',
    'updated_at', 'display_id', 'onboarding_complete', 'gst_verified',
    'gst_legal_name', 'gst_status', 'categories', 'full_name', 'job_title',
    'website', 'about_us', 'platforms_sold_on', 'total_employees',
    'sourcing_frequency', 'annual_spending', 'phone_number'
  ]),
  rfqs: new Set([
    'id', 'buyer_id', 'product_name', 'quantity', 'unit', 'target_price',
    'destination', 'deadline', 'notes', 'buyer_email', 'status',
    'created_at', 'updated_at'
  ]),
  rfq_quotes: new Set([
    'id', 'rfq_id', 'supplier_id', 'quoted_price', 'notes', 'gst_rate',
    'gst_amount', 'price_before_gst', 'supplier_location', 'delivery_days',
    'platform_fee', 'status', 'created_at', 'updated_at'
  ]),
  trade_orders: new Set([
    'id', 'buyer_id', 'supplier_id', 'product_id', 'quantity', 'unit_label',
    'agreed_unit_price', 'logistics_cost', 'tax_rate_percent', 'tax_amount',
    'subtotal', 'total_contract_value', 'advance_paid_10', 'balance_due_90',
    'current_state', 'qr_payment_reference', 'rerouted_from_supplier_id',
    'reroute_reason', 'buyer_notes', 'supplier_notes', 'estimated_delivery_days',
    'created_at', 'updated_at'
  ]),
  platform_ledger: new Set([
    'id', 'order_id', 'entry_type', 'amount', 'from_entity_id', 'to_entity_id',
    'payment_reference', 'description', 'created_at'
  ]),
  search_logs: new Set([
    'id', 'user_id', 'query', 'sector_slug', 'results_count', 'ip_address',
    'user_agent', 'created_at'
  ]),
  industry_sectors: new Set([
    'id', 'parent_id', 'name', 'slug', 'description', 'icon_identifier',
    'hero_image_url', 'display_order', 'is_active', 'created_at'
  ]),
  messages: new Set([
    'id', 'conversation_id', 'sender_id', 'body', 'created_at'
  ]),
  conversations: new Set([
    'id', 'buyer_id', 'supplier_id', 'rfq_id', 'created_at', 'updated_at'
  ]),
};

function sanitizeAndMapPayload(rawTable, rawData) {
  let targetTable = rawTable;
  if (rawTable === 'warehouses') targetTable = 'products';
  if (rawTable === 'payments') targetTable = 'platform_ledger';

  const schema = TABLE_SCHEMAS[targetTable];
  const sanitized = {};

  if (!rawData || typeof rawData !== 'object') {
    return { targetTable, sanitized };
  }

  // 1. Specific mapping for products
  if (targetTable === 'products') {
    if (rawData.product_name !== undefined && rawData.title === undefined) {
      sanitized.title = String(rawData.product_name).trim();
    } else if (rawData.title !== undefined) {
      sanitized.title = String(rawData.title).trim();
    }
    if (rawData.product_stored !== undefined && !sanitized.title) {
      sanitized.title = String(rawData.product_stored).trim();
    }
    if (rawData.price_per_unit !== undefined && rawData.base_price_per_unit === undefined) {
      const p = String(rawData.price_per_unit).replace(/[^0-9.]/g, '');
      sanitized.base_price_per_unit = parseFloat(p) || 0;
    } else if (rawData.base_price_per_unit !== undefined) {
      sanitized.base_price_per_unit = parseFloat(rawData.base_price_per_unit) || 0;
    }
    if (rawData.unit !== undefined && rawData.unit_label === undefined) {
      sanitized.unit_label = String(rawData.unit).trim();
    }
    if (rawData.moq !== undefined && rawData.bulk_minimum_order === undefined) {
      sanitized.bulk_minimum_order = parseInt(rawData.moq, 10) || 1;
    }
    if (rawData.inventory_count !== undefined) {
      sanitized.inventory_count = parseInt(rawData.inventory_count, 10) || 0;
    }
    if (rawData.stock_available !== undefined && rawData.inventory_count === undefined) {
      const s = String(rawData.stock_available).replace(/[^0-9]/g, '');
      sanitized.inventory_count = parseInt(s, 10) || 0;
    }
    if (rawData.quality_grade !== undefined) {
      sanitized.quality_grade = String(rawData.quality_grade);
    }
    if (rawData.hsn_code !== undefined) {
      sanitized.hsn_code = rawData.hsn_code ? String(rawData.hsn_code).trim() : null;
    }
    if (rawData.status !== undefined) {
      const s = String(rawData.status).toLowerCase();
      sanitized.is_active = (s === 'active' || s === 'true' || s === '1');
    }
    if (rawData.is_active !== undefined) {
      sanitized.is_active = Boolean(rawData.is_active);
    }
    if (rawData.description !== undefined) {
      sanitized.description = String(rawData.description);
    }
    if (rawData.hero_image_url !== undefined) {
      sanitized.hero_image_url = rawData.hero_image_url || null;
    }
    if (rawData.sector_id !== undefined) {
      sanitized.sector_id = rawData.sector_id;
    }
    if (rawData.supplier_id !== undefined) {
      sanitized.supplier_id = rawData.supplier_id;
    }
  }

  // 2. Specific mapping for users
  else if (targetTable === 'users') {
    if (rawData.contact_person !== undefined && rawData.full_name === undefined) {
      sanitized.full_name = String(rawData.contact_person).trim();
    }
    if (rawData.user_and_business !== undefined && rawData.company_name === undefined) {
      sanitized.company_name = String(rawData.user_and_business).trim();
    }
    if (rawData.email !== undefined && rawData.registered_email === undefined) {
      sanitized.registered_email = String(rawData.email).trim();
    }
    if (rawData.phone_number !== undefined && rawData.corporate_phone === undefined) {
      sanitized.corporate_phone = String(rawData.phone_number).trim();
    }
    if (rawData.turnover !== undefined && rawData.annual_turnover_lakhs === undefined) {
      const t = String(rawData.turnover).replace(/[^0-9.]/g, '');
      if (t) sanitized.annual_turnover_lakhs = parseFloat(t);
    }
    // Normalize role enum to valid PostgreSQL user_role enum
    if (rawData.role !== undefined || rawData.user_role !== undefined) {
      const rawRole = String(rawData.role || rawData.user_role).toLowerCase().trim();
      if (['buyer', 'supplier', 'admin', 'both'].includes(rawRole)) {
        sanitized.role = rawRole;
      } else if (rawRole.includes('both')) {
        sanitized.role = 'both';
      } else if (rawRole.includes('supp')) {
        sanitized.role = 'supplier';
      } else if (rawRole.includes('admin')) {
        sanitized.role = 'admin';
      } else {
        sanitized.role = 'buyer';
      }
    }
    // Normalize status enum to valid PostgreSQL verification_status enum
    if (rawData.status !== undefined) {
      const rawStatus = String(rawData.status).toLowerCase().trim();
      if (rawStatus === 'active' || rawStatus.includes('verified') || rawStatus === 'approved') {
        sanitized.status = 'active';
      } else if (rawStatus === 'suspended') {
        sanitized.status = 'suspended';
      } else {
        sanitized.status = 'pending_verification';
      }
    }
  }

  // 3. Specific mapping for rfqs
  else if (targetTable === 'rfqs') {
    if (rawData.product !== undefined && rawData.product_name === undefined) {
      sanitized.product_name = String(rawData.product).trim();
    }
    if (rawData.target_price !== undefined) {
      sanitized.target_price = parseFloat(rawData.target_price) || 0;
    }
    if (rawData.quantity !== undefined) {
      sanitized.quantity = parseInt(rawData.quantity, 10) || 1;
    }
    // Handle sector/category/gst in notes metadata
    if (rawData.sector || rawData.category || rawData.gst_rate !== undefined || rawData.buyer_gst || rawData.buyer_phone) {
      let currentNotes = rawData.notes || '';
      let meta = {};
      if (currentNotes.includes('<!--CONTACT_META:')) {
        const match = currentNotes.match(/<!--CONTACT_META:(.*?)-->/);
        if (match && match[1]) {
          try { meta = JSON.parse(match[1]); } catch {}
        }
      }
      if (rawData.sector) { meta.sector = rawData.sector; meta.category = rawData.sector; }
      if (rawData.category) { meta.category = rawData.category; meta.sector = rawData.category; }
      if (rawData.gst_rate !== undefined) meta.gst_rate = Number(rawData.gst_rate);
      if (rawData.buyer_gst) meta.gst = rawData.buyer_gst;
      if (rawData.buyer_phone) meta.phone = rawData.buyer_phone;
      if (rawData.buyer_alternate_phone) meta.alt_phone = rawData.buyer_alternate_phone;
      if (rawData.buyer_email) meta.email = rawData.buyer_email;

      currentNotes = currentNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
      sanitized.notes = `<!--CONTACT_META:${JSON.stringify(meta)}-->${currentNotes ? `\n${currentNotes}` : ''}`.trim();
    }
  }

  // 4. Specific mapping for rfq_quotes
  else if (targetTable === 'rfq_quotes') {
    if (rawData.quoted_price !== undefined) sanitized.quoted_price = parseFloat(rawData.quoted_price) || 0;
    if (rawData.price_before_gst !== undefined) sanitized.price_before_gst = parseFloat(rawData.price_before_gst) || 0;
    if (rawData.gst_rate !== undefined) sanitized.gst_rate = Number(rawData.gst_rate) || 18;
    if (rawData.gst_amount !== undefined) sanitized.gst_amount = parseFloat(rawData.gst_amount) || 0;
    if (rawData.platform_fee !== undefined) sanitized.platform_fee = parseFloat(rawData.platform_fee) || 0;
    if (rawData.delivery_days !== undefined) sanitized.delivery_days = parseInt(rawData.delivery_days, 10) || 7;
  }

  // 5. Specific mapping for trade_orders
  else if (targetTable === 'trade_orders') {
    if (rawData.order_status !== undefined && rawData.current_state === undefined) {
      sanitized.current_state = String(rawData.order_status).trim();
    }
    if (rawData.agreed_price !== undefined && rawData.agreed_unit_price === undefined) {
      const p = String(rawData.agreed_price).replace(/[^0-9.]/g, '');
      sanitized.agreed_unit_price = parseFloat(p) || 0;
    }
    if (rawData.contract_value !== undefined && rawData.total_contract_value === undefined) {
      const c = String(rawData.contract_value).replace(/[^0-9.]/g, '');
      sanitized.total_contract_value = parseFloat(c) || 0;
    }
    if (rawData.advance_10_percent !== undefined && rawData.advance_paid_10 === undefined) {
      const adv = String(rawData.advance_10_percent).replace(/[^0-9.]/g, '');
      sanitized.advance_paid_10 = parseFloat(adv) || 0;
    }

    // Pack logistics metadata into buyer_notes
    const hasLogisticsFields = (
      rawData.fulfillment_mode || rawData.delivery_option || rawData.vehicle_number ||
      rawData.arrival_date || rawData.delivery_date || rawData.logistics_schedule ||
      rawData.driver_or_receiver || rawData.p1_name || rawData.receiver_name ||
      rawData.driver_phone || rawData.driver_aadhar || rawData.gate_pass_or_tracking || rawData.tracking_number
    );

    if (hasLogisticsFields || rawData.notes !== undefined || rawData.buyer_notes !== undefined) {
      let currentNotes = rawData.buyer_notes || rawData.notes || '';
      let meta = {};
      if (currentNotes.includes('<!--LOGISTICS_META:')) {
        try {
          const match = currentNotes.match(/<!--LOGISTICS_META:(.*?)-->/);
          if (match && match[1]) meta = JSON.parse(match[1]);
        } catch (e) {}
      }

      if (rawData.delivery_option) meta.delivery_option = rawData.delivery_option;
      else if (rawData.fulfillment_mode) meta.delivery_option = rawData.fulfillment_mode.includes('Pickup') ? 'pickup' : 'deliver';

      if (rawData.arrival_date) meta.arrival_date = rawData.arrival_date;
      if (rawData.delivery_date) meta.delivery_date = rawData.delivery_date;
      if (rawData.logistics_schedule && !meta.arrival_date && !meta.delivery_date) {
        if (meta.delivery_option === 'pickup') meta.arrival_date = rawData.logistics_schedule;
        else meta.delivery_date = rawData.logistics_schedule;
      }

      if (rawData.vehicle_number) meta.vehicle_number = rawData.vehicle_number;
      if (rawData.driver_or_receiver) {
        if (meta.delivery_option === 'pickup') meta.p1_name = rawData.driver_or_receiver;
        else meta.receiver_name = rawData.driver_or_receiver;
      }
      if (rawData.p1_name) meta.p1_name = rawData.p1_name;
      if (rawData.receiver_name) meta.receiver_name = rawData.receiver_name;
      if (rawData.driver_phone) {
        if (meta.delivery_option === 'pickup') meta.p1_phone = rawData.driver_phone;
        else meta.receiver_phone = rawData.driver_phone;
      }
      if (rawData.driver_aadhar) meta.p1_aadhar = rawData.driver_aadhar;
      if (rawData.gate_pass_or_tracking) meta.tracking_number = rawData.gate_pass_or_tracking;
      if (rawData.tracking_number) meta.tracking_number = rawData.tracking_number;

      const cleanNotes = currentNotes.replace(/<!--LOGISTICS_META:.*?-->/g, '').trim();
      sanitized.buyer_notes = `<!--LOGISTICS_META:${JSON.stringify(meta)}-->${cleanNotes ? `\n${cleanNotes}` : ''}`.trim();
    }
  }

  // 6. Specific mapping for platform_ledger
  else if (targetTable === 'platform_ledger') {
    if (rawData.reference_order_id !== undefined && rawData.order_id === undefined) {
      sanitized.order_id = rawData.reference_order_id;
    }
    if (rawData.amount !== undefined) {
      const a = String(rawData.amount).replace(/[^0-9.-]/g, '');
      sanitized.amount = parseFloat(a) || 0;
    }
  }

  // 7. Specific mapping for search_logs
  else if (targetTable === 'search_logs') {
    if (rawData.search_query !== undefined && rawData.query === undefined) {
      sanitized.query = String(rawData.search_query).trim();
    }
  }

  // 8. Specific mapping for messages
  else if (targetTable === 'messages') {
    if (rawData.message_content !== undefined && rawData.body === undefined) {
      sanitized.body = String(rawData.message_content).trim();
    }
  }

  // Filter final payload strictly against genuine table schema
  const cleanPayload = {};
  for (const [k, v] of Object.entries(sanitized)) {
    if (schema && schema.has(k) && k !== 'id' && k !== 'created_at') {
      cleanPayload[k] = v;
    }
  }

  // Pass-through any other keys from rawData that exist directly in genuine table schema
  if (schema) {
    for (const [k, v] of Object.entries(rawData)) {
      if (schema.has(k) && cleanPayload[k] === undefined && k !== 'id' && k !== 'created_at') {
        if (targetTable === 'users' && (k === 'role' || k === 'status')) {
          cleanPayload[k] = String(v).toLowerCase().trim();
        } else {
          cleanPayload[k] = v;
        }
      }
    }
  }

  return { targetTable, sanitized: cleanPayload };
}

export async function POST(request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { table, data } = body;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const { targetTable, sanitized } = sanitizeAndMapPayload(table, data);

    const { data: result, error } = await supabaseAdmin
      .from(targetTable)
      .insert(sanitized)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error('Error creating database record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabaseAdmin = getAdminClient();
    const body = await request.json();
    const { table, id, data } = body;

    if (!ALLOWED_TABLES.includes(table) || !id) {
      return NextResponse.json({ error: 'Invalid table or ID' }, { status: 400 });
    }

    const { targetTable, sanitized } = sanitizeAndMapPayload(table, data);
    
    // Always attach updated_at if supported by schema
    if (TABLE_SCHEMAS[targetTable]?.has('updated_at')) {
      sanitized.updated_at = new Date().toISOString();
    }

    // 1. If editing products or warehouses and supplier contact fields were changed, sync to users table
    if ((targetTable === 'products' || table === 'warehouses') && data) {
      try {
        const { data: currentProduct } = await supabaseAdmin
          .from('products')
          .select('supplier_id')
          .eq('id', id)
          .maybeSingle();

        const suppId = currentProduct?.supplier_id || data.supplier_id;
        if (suppId) {
          const userUpdates = {};
          if (data.contact_person) userUpdates.full_name = String(data.contact_person).trim();
          if (data.user_and_business) userUpdates.company_name = String(data.user_and_business).trim();
          if (data.phone_number && data.phone_number !== 'Confidential') userUpdates.corporate_phone = String(data.phone_number).trim();
          if (data.email && data.email !== 'Confidential') userUpdates.registered_email = String(data.email).trim();
          if (data.location && data.location !== 'India') userUpdates.warehouse_address = String(data.location).trim();
          if (data.warehouse_address) userUpdates.warehouse_address = String(data.warehouse_address).trim();
          if (data.gst_number && data.gst_number !== 'VERIFIED') userUpdates.gst_number = String(data.gst_number).trim();

          if (Object.keys(userUpdates).length > 0) {
            userUpdates.updated_at = new Date().toISOString();
            await supabaseAdmin.from('users').update(userUpdates).eq('id', suppId);
          }
        }
      } catch (suppSyncErr) {
        console.warn('Could not sync supplier fields from product update:', suppSyncErr.message);
      }
    }

    // 2. Perform strictly sanitized update on target table
    const { data: result, error } = await supabaseAdmin
      .from(targetTable)
      .update(sanitized)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, record: result });
  } catch (error) {
    console.error('Error updating database record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!ALLOWED_TABLES.includes(table) || !id) {
      return NextResponse.json({ error: 'Invalid table or ID' }, { status: 400 });
    }

    let targetTable = table;
    if (table === 'warehouses') targetTable = 'products';
    if (table === 'payments') targetTable = 'platform_ledger';

    const { error } = await supabaseAdmin
      .from(targetTable)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting database record:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
