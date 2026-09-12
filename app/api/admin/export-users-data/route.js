// ============================================================================
// B2B INDIA — COMMERCIAL LEADS & USER DATA MONETIZATION EXCEL / CSV EXPORT
// ============================================================================
// Exports high-value commercial lead intelligence dossiers including:
// - Contact details: Person full name, company name, phone, WhatsApp, email
// - Location & Tax KYC: City, state, pincode, full address, GSTIN, PAN
// - Intent Signals: Exact search queries, products viewed without order
// - Commercial status: Hot Lead (Abandoned Discovery), Converted, RFQ Active
// ============================================================================

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readAllOrders } from '@/services/ordersStore';

export const dynamic = 'force-dynamic';

function escapeCsv(field) {
  if (field === null || field === undefined) return '""';
  let str = String(field);
  str = str.replace(/"/g, '""');
  str = str.replace(/[\r\n]+/g, ' ');
  return `"${str}"`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('type') || 'commercial_leads'; // 'commercial_leads' | 'searches' | 'products' | 'master'

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Parallel fetch from all relevant database tables
    const [usersRes, productsRes, searchesRes, ordersRes, rfqsRes, viewsRes, activityRes] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('search_logs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('trade_orders').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('rfqs').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('user_product_views').select('*').order('viewed_at', { ascending: false }).limit(1000),
      supabaseAdmin.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500)
    ]);

    const users = usersRes.data || [];
    const products = productsRes.data || [];
    const searches = searchesRes.data || [];
    const dbOrders = ordersRes.data || [];
    const rfqs = rfqsRes.data || [];
    const views = viewsRes?.data || [];
    const activities = activityRes?.data || [];
    const localOrders = readAllOrders();

    // Map Products by Supplier ID and by Product ID
    const productsMap = {};
    const productById = {};
    products.forEach(p => {
      productById[p.id] = p;
      if (p.supplier_id) {
        if (!productsMap[p.supplier_id]) productsMap[p.supplier_id] = [];
        productsMap[p.supplier_id].push(p);
      }
    });

    // Map Searches by User ID
    const searchesMap = {};
    searches.forEach(s => {
      if (s.user_id) {
        if (!searchesMap[s.user_id]) searchesMap[s.user_id] = [];
        searchesMap[s.user_id].push(s);
      }
    });

    // Map Views by User ID
    const viewsMap = {};
    views.forEach(v => {
      if (v.user_id) {
        if (!viewsMap[v.user_id]) viewsMap[v.user_id] = [];
        const prod = productById[v.product_id] || {};
        viewsMap[v.user_id].push({
          id: v.product_id,
          title: prod.title || 'Product Item',
          category: prod.sector_id?.name || prod.sector_id?.slug || 'General',
          date: v.viewed_at
        });
      }
    });

    // Add activity_logs views
    activities.forEach(a => {
      if (a.user_id && a.action === 'viewed_product' && a.details?.product_id) {
        if (!viewsMap[a.user_id]) viewsMap[a.user_id] = [];
        const exists = viewsMap[a.user_id].some(v => v.id === a.details.product_id);
        if (!exists) {
          viewsMap[a.user_id].push({
            id: a.details.product_id,
            title: a.details.product_title || 'Product Item',
            category: a.details.category || 'General',
            date: a.created_at
          });
        }
      }
    });

    // Map Orders by User (Buyer & Supplier)
    const ordersMap = {};
    const allOrdersList = [...dbOrders, ...localOrders];
    allOrdersList.forEach(o => {
      const bKey = o.buyer_id || o.buyer_email?.toLowerCase();
      if (bKey) {
        if (!ordersMap[bKey]) ordersMap[bKey] = [];
        ordersMap[bKey].push(o);
      }
    });

    // Map RFQs by Buyer
    const rfqsMap = {};
    rfqs.forEach(r => {
      const bKey = r.buyer_id || r.buyer_email?.toLowerCase();
      if (bKey) {
        if (!rfqsMap[bKey]) rfqsMap[bKey] = [];
        rfqsMap[bKey].push(r);
      }
    });

    const userById = {};
    users.forEach(u => { userById[u.id] = u; });

    let csvContent = '';
    let filename = '';
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === 'searches') {
      // 1. Searches-Centric Feed
      filename = `B2B_INDIA_Live_Search_Queries_${dateStr}.csv`;
      const headers = [
        'Search Log ID',
        'Contact Person Full Name',
        'Company Name',
        'Contact Phone / Mobile',
        'WhatsApp Number',
        'Email Address',
        'Role',
        'City',
        'State',
        'GSTIN',
        'Search Query Keyword',
        'Sector Category Filter',
        'Results Found Count',
        'IP Address',
        'Search Timestamp'
      ];
      csvContent += headers.map(escapeCsv).join(',') + '\n';

      searches.forEach(s => {
        const u = userById[s.user_id] || {};
        const row = [
          s.id,
          u.full_name || 'Anonymous Visitor',
          u.company_name || 'Guest / Unlinked',
          u.corporate_phone || u.phone_number || 'N/A',
          u.whatsapp_number || 'N/A',
          u.registered_email || 'N/A',
          (u.role || 'visitor').toUpperCase(),
          u.city || 'N/A',
          u.state || 'N/A',
          u.gst_number || 'N/A',
          s.query,
          s.sector_slug || 'All Sectors',
          s.results_count || 0,
          s.ip_address || 'N/A',
          s.created_at
        ];
        csvContent += row.map(escapeCsv).join(',') + '\n';
      });

    } else if (format === 'products') {
      // 2. Products-Centric Export
      filename = `B2B_INDIA_User_Added_Products_${dateStr}.csv`;
      const headers = [
        'Product ID',
        'Product Title',
        'Supplier User ID',
        'Supplier Full Name',
        'Supplier Company Name',
        'Supplier Registered Email',
        'Supplier Corporate Phone',
        'Supplier WhatsApp',
        'Supplier City',
        'Supplier State',
        'Sector / Category ID',
        'Base Price (INR)',
        'Unit Label',
        'Bulk Minimum Order (MOQ)',
        'Inventory Count',
        'Quality Grade',
        'HSN Code',
        'Is Active',
        'Date Product Added',
        'Last Price Update'
      ];
      csvContent += headers.map(escapeCsv).join(',') + '\n';

      products.forEach(p => {
        const u = userById[p.supplier_id] || {};
        const row = [
          p.id,
          p.title,
          p.supplier_id || 'N/A',
          u.full_name || 'N/A',
          u.company_name || 'N/A',
          u.registered_email || 'N/A',
          u.corporate_phone || u.phone_number || 'N/A',
          u.whatsapp_number || 'N/A',
          u.city || 'N/A',
          u.state || 'N/A',
          p.sector_id || 'General',
          p.base_price_per_unit,
          p.unit_label || 'Unit',
          p.bulk_minimum_order || 1,
          p.inventory_count || 0,
          p.quality_grade || 'Standard Grade',
          p.hsn_code || 'N/A',
          p.is_active ? 'Active' : 'Inactive',
          p.created_at,
          p.last_price_update || p.updated_at
        ];
        csvContent += row.map(escapeCsv).join(',') + '\n';
      });

    } else {
      // 3. Commercial Leads Monetization Master Dossier (format === 'commercial_leads' or 'master')
      filename = `B2B_INDIA_COMMERCIAL_LEADS_MONETIZATION_${dateStr}.csv`;
      const headers = [
        'Lead Display ID',
        'User UUID',
        'Contact Person Full Name',
        'Company Name',
        'Job Title',
        'Role (Buyer/Supplier/Both)',
        'Account Status',
        'Contact Phone / Mobile',
        'Personal Phone',
        'WhatsApp Number',
        'Registered Email',
        'City',
        'State',
        'Pincode',
        'Full Warehouse Address',
        'GSTIN Number',
        'GST Legal Name',
        'GST Verification Status',
        'PAN Number',
        'Intent Status Level',
        'Intent Summary Description',
        'Total Search Queries Count',
        'All Searched Keywords History',
        'Total Products Viewed Count',
        'Products & Categories Viewed (No Order)',
        'Total Trade Orders Placed',
        'Total Sourcing Spend (INR)',
        'Total RFQs Broadcasted',
        'Total Products Listed (Supplier)',
        'Annual Turnover (Lakhs INR)',
        'Business Categories',
        'Website URL',
        'Registration Date',
        'Last Active Timestamp'
      ];
      csvContent += headers.map(escapeCsv).join(',') + '\n';

      users.forEach(u => {
        const userProds = productsMap[u.id] || [];
        const userSearches = searchesMap[u.id] || [];
        const userViews = viewsMap[u.id] || [];
        const userOrders = ordersMap[u.id] || (u.registered_email ? ordersMap[u.registered_email.toLowerCase()] : []) || [];
        const userRfqs = rfqsMap[u.id] || (u.registered_email ? rfqsMap[u.registered_email.toLowerCase()] : []) || [];

        // Intent calculations
        const hasOrders = userOrders.length > 0;
        const hasSearches = userSearches.length > 0;
        const hasViews = userViews.length > 0;
        const isAbandonedLead = (hasSearches || hasViews) && !hasOrders;

        let intentLevel = 'INACTIVE';
        let intentDescription = 'No recorded searches or orders';

        if (isAbandonedLead) {
          intentLevel = 'HOT_LEAD (ABANDONED INTENT)';
          const topQueries = userSearches.slice(0, 3).map(s => s.query).join(', ');
          intentDescription = `High Intent: Searched [${topQueries || 'Products'}] and viewed catalog with 0 orders placed! Immediate sales outreach recommended.`;
        } else if (hasOrders) {
          intentLevel = 'ACTIVE_CUSTOMER';
          intentDescription = `Converted: Placed ${userOrders.length} confirmed orders`;
        } else if (userRfqs.length > 0) {
          intentLevel = 'RFQ_ACTIVE';
          intentDescription = `Active RFQ: Broadcasted ${userRfqs.length} requirements awaiting quotes`;
        } else if (hasSearches) {
          intentLevel = 'WARM_LEAD';
          intentDescription = `Logged ${userSearches.length} search queries`;
        }

        // Search keywords history
        const searchesSummary = userSearches.length > 0
          ? userSearches.map((s, idx) => `[${idx + 1}] "${s.query}" (${s.created_at ? s.created_at.slice(0, 10) : 'N/A'})`).join(' | ')
          : 'None';

        // Products viewed history
        const viewsSummary = userViews.length > 0
          ? userViews.map((v, idx) => `[${idx + 1}] ${v.title} [${v.category}]`).join(' | ')
          : 'None';

        // Spend calculation
        const totalSpend = userOrders.reduce((sum, o) => sum + Number(o.total_contract_value || o.total_amount || 0), 0);

        // Last active calculation
        const allTimestamps = [
          u.updated_at,
          u.created_at,
          userSearches[0]?.created_at,
          userViews[0]?.date,
          userOrders[0]?.created_at
        ].filter(Boolean).map(t => new Date(t).getTime()).filter(t => !isNaN(t));
        const lastActive = allTimestamps.length > 0 ? new Date(Math.max(...allTimestamps)).toISOString() : (u.created_at || 'N/A');

        const row = [
          u.display_id || u.id?.slice(0, 8) || 'N/A',
          u.id,
          u.full_name || 'N/A',
          u.company_name || 'N/A',
          u.job_title || 'N/A',
          (u.role || 'buyer').toUpperCase(),
          (u.status || 'active').toUpperCase(),
          u.corporate_phone || u.phone_number || 'N/A',
          u.phone_number || 'N/A',
          u.whatsapp_number || 'N/A',
          u.registered_email || 'N/A',
          u.city || 'N/A',
          u.state || 'N/A',
          u.pincode || 'N/A',
          u.warehouse_address || 'N/A',
          u.gst_number || 'PENDING',
          u.gst_legal_name || 'N/A',
          u.gst_verified ? 'VERIFIED' : 'UNVERIFIED',
          u.pan_number || 'N/A',
          intentLevel,
          intentDescription,
          userSearches.length,
          searchesSummary,
          userViews.length,
          viewsSummary,
          userOrders.length,
          totalSpend,
          userRfqs.length,
          userProds.length,
          u.annual_turnover_lakhs || 'N/A',
          Array.isArray(u.categories) ? u.categories.join('; ') : (u.categories || 'N/A'),
          u.website || 'N/A',
          u.created_at,
          lastActive
        ];
        csvContent += row.map(escapeCsv).join(',') + '\n';
      });
    }

    // Add UTF-8 Byte Order Mark (BOM) for seamless Microsoft Excel rendering
    const bomCsv = '\uFEFF' + csvContent;

    return new Response(bomCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating commercial leads CSV export:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
