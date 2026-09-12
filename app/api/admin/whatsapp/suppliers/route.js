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

        return {
          id: u.id,
          company_name: u.company_name || u.full_name || 'Verified Supplier',
          contact_name: u.full_name || u.company_name || 'Partner',
          phone,
          raw_phone: rawPhone,
          has_valid_whatsapp: phone.length === 12 && phone.startsWith('91'),
          email: u.registered_email || '',
          location: [u.city, u.state].filter(Boolean).join(', ') || 'India',
          categories: u.categories || [],
          onboarding_complete: !!u.onboarding_complete,
          product_count: supplierProducts.length,
          last_price_update: latestUpdateMs > 0 ? new Date(latestUpdateMs).toISOString() : null,
          has_updated_this_month: hasUpdatedThisMonth,
          has_products: hasProducts,
        };
      });

    return NextResponse.json({
      success: true,
      current_month: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      total_suppliers: suppliers.length,
      suppliers_with_whatsapp: suppliers.filter((s) => s.has_valid_whatsapp).length,
      outdated_suppliers: suppliers.filter((s) => !s.has_updated_this_month).length,
      updated_suppliers: suppliers.filter((s) => s.has_updated_this_month).length,
      suppliers,
    });
  } catch (error) {
    console.error('WhatsApp suppliers endpoint error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
