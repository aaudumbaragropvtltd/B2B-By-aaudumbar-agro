import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch all users
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, company_name, full_name, registered_email, corporate_phone, phone_number, whatsapp_number, city, state, role, created_at')
      .order('created_at', { ascending: false });

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // 2. Fetch products to check last updated date
    const { data: products, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, supplier_id, updated_at, created_at');

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

    const formattedUsers = (users || []).map((u) => {
      const email = u.registered_email || (u.company_name?.toLowerCase().replace(/\s+/g, '') + '@demo.b2bindia.site');
      const hasValidEmail = Boolean(u.registered_email && u.registered_email.includes('@'));
      
      const supplierProducts = productsBySupplier[u.id] || [];
      let lastProductUpdate = null;
      let hasUpdatedThisMonth = false;

      if (supplierProducts.length > 0) {
        supplierProducts.forEach((p) => {
          const updateTime = new Date(p.updated_at || p.created_at).getTime();
          if (!lastProductUpdate || updateTime > lastProductUpdate) {
            lastProductUpdate = updateTime;
          }
          if (updateTime >= currentMonthStart) {
            hasUpdatedThisMonth = true;
          }
        });
      }

      return {
        id: u.id,
        name: u.full_name || u.company_name || 'B2B Partner',
        company_name: u.company_name || u.full_name || 'B2B Enterprise',
        email: u.registered_email || email,
        has_valid_email: hasValidEmail,
        phone: u.whatsapp_number || u.corporate_phone || u.phone_number || '',
        location: [u.city, u.state].filter(Boolean).join(', ') || 'India',
        role: u.role || 'supplier',
        product_count: supplierProducts.length,
        has_updated_this_month: hasUpdatedThisMonth,
        last_updated_at: lastProductUpdate ? new Date(lastProductUpdate).toISOString() : null,
      };
    });

    const stats = {
      total: formattedUsers.length,
      validEmails: formattedUsers.filter((u) => u.has_valid_email).length,
      suppliers: formattedUsers.filter((u) => u.role === 'supplier').length,
      buyers: formattedUsers.filter((u) => u.role === 'buyer').length,
      outdated: formattedUsers.filter((u) => u.role === 'supplier' && !u.has_updated_this_month).length,
      updated: formattedUsers.filter((u) => u.role === 'supplier' && u.has_updated_this_month).length,
    };

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      stats,
    });
  } catch (err) {
    console.error('Failed to fetch users for email broadcast:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
