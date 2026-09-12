import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function cleanIndianPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

function isDummyPhoneNumber(phone) {
  if (!phone) return true;
  const digits = String(phone).replace(/\D/g, '');
  const pure10 = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;
  if (pure10.length !== 10) return true;
  if (/^(\d)\1{9}$/.test(pure10)) return true; // e.g. 9999999999, 0000000000, 1111111111
  if (pure10 === '9876543210' || pure10 === '1234567890' || pure10 === '0123456789') return true;
  return false;
}

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch all suppliers with real columns from Supabase users table
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, categories, created_at, onboarding_complete, role')
      .order('created_at', { ascending: false });

    if (userError) {
      console.error('Error fetching users for WhatsApp:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 2. Fetch products to check last updated prices
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, supplier_id, title, base_price_per_unit, updated_at, created_at');

    const productsBySupplier = {};
    if (!productError && products) {
      products.forEach((p) => {
        if (!p.supplier_id) return;
        if (!productsBySupplier[p.supplier_id]) {
          productsBySupplier[p.supplier_id] = [];
        }
        productsBySupplier[p.supplier_id].push(p);
      });
    }

    // Determine current month start for "Updated This Month" logic
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Filter suppliers (role is supplier or has products listed)
    const suppliers = (users || [])
      .filter((u) => u.role === 'supplier' || (productsBySupplier[u.id] && productsBySupplier[u.id].length > 0))
      .map((u) => {
        const supplierProducts = productsBySupplier[u.id] || [];
        let latestUpdateMs = 0;

        supplierProducts.forEach((p) => {
          const t = new Date(p.updated_at || p.created_at || 0).getTime();
          if (t > latestUpdateMs) latestUpdateMs = t;
        });

        const hasProducts = supplierProducts.length > 0;
        const hasUpdatedThisMonth = latestUpdateMs >= currentMonthStart;
        const rawPhone = u.whatsapp_number || u.corporate_phone || u.phone_number || '';
        const phone = cleanIndianPhone(rawPhone);
        const isDummy = isDummyPhoneNumber(phone);
        const isValid = phone.length === 12 && phone.startsWith('91') && !isDummy;

        return {
          id: u.id,
          company_name: u.company_name || u.full_name || 'Verified Supplier',
          contact_name: u.full_name || u.company_name || 'Partner',
          phone,
          raw_phone: rawPhone,
          is_dummy: isDummy,
          has_valid_whatsapp: isValid,
          email: u.registered_email || '',
          location: [u.city, u.state].filter(Boolean).join(', ') || 'India',
          categories: u.categories || [],
          onboarding_complete: !!u.onboarding_complete,
          product_count: supplierProducts.length,
          last_price_update: latestUpdateMs > 0 ? new Date(latestUpdateMs).toISOString() : null,
          has_updated_this_month: hasUpdatedThisMonth,
          has_products: hasProducts,
        };
      })
      // Sort: Real verified phones first, then dummy phones, then alphabetical
      .sort((a, b) => {
        if (a.has_valid_whatsapp && !b.has_valid_whatsapp) return -1;
        if (!a.has_valid_whatsapp && b.has_valid_whatsapp) return 1;
        return a.company_name.localeCompare(b.company_name);
      });

    return NextResponse.json({
      success: true,
      current_month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      total_suppliers: suppliers.length,
      suppliers_with_real_whatsapp: suppliers.filter((s) => s.has_valid_whatsapp).length,
      suppliers_with_dummy_numbers: suppliers.filter((s) => s.is_dummy).length,
      outdated_suppliers: suppliers.filter((s) => !s.has_updated_this_month).length,
      updated_suppliers: suppliers.filter((s) => s.has_updated_this_month).length,
      suppliers,
    });
  } catch (error) {
    console.error('WhatsApp suppliers endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Update supplier phone numbers or replace dummy numbers with a designated test number
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, supplierId, newPhone, testPhone } = body;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (action === 'update_single') {
      if (!supplierId || !newPhone) {
        return NextResponse.json({ error: 'supplierId and newPhone are required' }, { status: 400 });
      }
      const cleaned = cleanIndianPhone(newPhone);
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          corporate_phone: cleaned,
          whatsapp_number: cleaned,
          phone_number: cleaned.startsWith('91') ? cleaned.slice(2) : cleaned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supplierId);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Supplier phone updated successfully', phone: cleaned });
    }

    if (action === 'replace_dummy_with_test') {
      const targetPhone = cleanIndianPhone(testPhone || '9226497450');
      if (!targetPhone || targetPhone.length !== 12) {
        return NextResponse.json({ error: 'Valid 10-digit Indian test phone number required' }, { status: 400 });
      }

      // Fetch all users to identify dummy phone records
      const { data: users, error: fetchErr } = await supabaseAdmin
        .from('users')
        .select('id, corporate_phone, whatsapp_number, phone_number');

      if (fetchErr) throw fetchErr;

      const dummyUserIds = (users || [])
        .filter((u) => {
          const raw = u.whatsapp_number || u.corporate_phone || u.phone_number;
          return isDummyPhoneNumber(cleanIndianPhone(raw));
        })
        .map((u) => u.id);

      if (dummyUserIds.length > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from('users')
          .update({
            corporate_phone: targetPhone,
            whatsapp_number: targetPhone,
            phone_number: targetPhone.slice(2),
            updated_at: new Date().toISOString(),
          })
          .in('id', dummyUserIds);

        if (updateErr) throw updateErr;
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${dummyUserIds.length} dummy suppliers to test phone +${targetPhone}`,
        updated_count: dummyUserIds.length,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating supplier phone for WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

