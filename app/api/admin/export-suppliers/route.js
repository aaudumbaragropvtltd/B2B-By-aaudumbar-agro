import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

function verifyAdminCookie() {
  const ADMIN_PASSPHRASE = process.env.ADMIN_PASSPHRASE || 'b2bindia@admin2024';
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('b2b_admin_token')?.value;
    return token === ADMIN_PASSPHRASE;
  } catch {
    return false;
  }
}

export async function GET(request) {
  try {
    // Check admin cookie first (admin panel login)
    const isAdminViaCookie = verifyAdminCookie();

    if (!isAdminViaCookie) {
      // Fallback: check Supabase auth session
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized. Please login via admin panel.' }, { status: 401 });
      }

      const supabaseAdminCheck = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data: profile } = await supabaseAdminCheck
        .from('users')
        .select('id, role')
        .eq('firebase_uid', user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'supplier')) {
        return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
      }
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all suppliers
    const { data: suppliers, error: fetchError } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        company_name,
        registered_email,
        corporate_phone,
        whatsapp_number,
        gst_number,
        pan_number,
        warehouse_address,
        city,
        state,
        pincode,
        status,
        year_established,
        annual_turnover_lakhs,
        categories,
        display_id,
        onboarding_complete,
        created_at
      `)
      .eq('role', 'supplier')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching suppliers:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch supplier data' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (format === 'csv') {
      // Build CSV
      const headers = [
        'Sr No',
        'Display ID',
        'Company Name',
        'Phone Number',
        'WhatsApp Number',
        'Email Address',
        'GST Number',
        'PAN Number',
        'Warehouse Address',
        'City',
        'State',
        'Pincode',
        'Verification Status',
        'Year Established',
        'Annual Turnover (Lakhs)',
        'Categories',
        'Onboarding Complete',
        'Registered On',
      ];

      const escapeCSV = (val) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = (suppliers || []).map((s, idx) => [
        idx + 1,
        s.display_id || '-',
        s.company_name || '-',
        s.corporate_phone || '-',
        s.whatsapp_number || '-',
        s.registered_email || '-',
        s.gst_number || '-',
        s.pan_number || '-',
        s.warehouse_address || '-',
        s.city || '-',
        s.state || '-',
        s.pincode || '-',
        s.status || 'pending',
        s.year_established || '-',
        s.annual_turnover_lakhs || '-',
        Array.isArray(s.categories) ? s.categories.join('; ') : (s.categories || '-'),
        s.onboarding_complete ? 'Yes' : 'No',
        s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
      ].map(escapeCSV).join(','));

      const csvContent = [headers.join(','), ...rows].join('\n');
      const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

      return new Response(BOM + csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="B2B_India_Suppliers_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default: return JSON
    return NextResponse.json({
      total: suppliers?.length || 0,
      suppliers: suppliers || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/export-suppliers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
