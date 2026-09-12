import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function checkAdminAuth() {
  const supabaseAdmin = createClient(
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
        .select('role')
        .eq('firebase_uid', user.id)
        .single();

      if (profile && profile.role !== 'admin') {
        return { error: 'Forbidden: Admin access required', status: 403 };
      }
    }
  } catch (err) {}

  return { supabaseAdmin };
}

export async function GET(request) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) return new NextResponse(auth.error, { status: auth.status });

    const { supabaseAdmin } = auth;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const state = searchParams.get('state');

    // Fetch all products joined with suppliers and sectors
    let query = supabaseAdmin
      .from('products')
      .select(`
        id,
        title,
        description,
        base_price_per_unit,
        unit_label,
        bulk_minimum_order,
        inventory_count,
        quality_grade,
        hsn_code,
        hero_image_url,
        technical_specifications,
        is_active,
        created_at,
        users!products_supplier_id_fkey (
          id,
          company_name,
          registered_email,
          corporate_phone,
          whatsapp_number,
          warehouse_address,
          city,
          state,
          pincode,
          gst_number
        ),
        industry_sectors!products_sector_id_fkey (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false });

    const { data: rawProducts, error } = await query;
    if (error) throw error;

    // Format into consolidated warehouse inventory records
    let warehouses = (rawProducts || []).map((p) => {
      const supplier = p.users || {};
      const sector = p.industry_sectors || {};
      let specs = {};
      try {
        specs = typeof p.technical_specifications === 'string'
          ? JSON.parse(p.technical_specifications)
          : (p.technical_specifications || {});
      } catch (e) {
        specs = {};
      }

      // Warehouse address fallback to specs if not yet in user record
      const fullWarehouseAddress = supplier.warehouse_address || specs['Supplier Address'] || specs['Warehouse Address'] || `${supplier.city || 'India'}, ${supplier.state || ''}`;

      return {
        product_id: p.id,
        product_name: p.title,
        hero_image_url: p.hero_image_url,
        sector_name: sector.name || 'General Commodity',
        sector_slug: sector.slug || '',
        price_per_unit: Number(p.base_price_per_unit) || 0,
        unit_label: p.unit_label || 'kg',
        moq: Number(p.bulk_minimum_order) || 1,
        inventory_count: Number(p.inventory_count) || 0,
        is_active: p.is_active,
        quality_grade: p.quality_grade || 'Standard',
        hsn_code: p.hsn_code || 'N/A',
        supplier_id: supplier.id,
        company_name: supplier.company_name || specs['Supplier Name'] || 'Verified Supplier',
        registered_email: supplier.registered_email || 'N/A',
        corporate_phone: supplier.corporate_phone || '',
        whatsapp_number: supplier.whatsapp_number || supplier.corporate_phone || '',
        warehouse_address: fullWarehouseAddress,
        city: supplier.city || (specs['Origin Location'] || '').split(',')[0]?.trim() || '-',
        state: supplier.state || '-',
        pincode: supplier.pincode || '',
        gst_number: supplier.gst_number || 'N/A'
      };
    });

    // In-memory filters if specified
    if (search) {
      const q = search.toLowerCase();
      warehouses = warehouses.filter(w => 
        w.product_name?.toLowerCase().includes(q) ||
        w.company_name?.toLowerCase().includes(q) ||
        w.warehouse_address?.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q) ||
        w.state?.toLowerCase().includes(q) ||
        w.registered_email?.toLowerCase().includes(q) ||
        w.corporate_phone?.includes(q)
      );
    }

    if (state && state !== 'all') {
      warehouses = warehouses.filter(w => w.state?.toLowerCase() === state.toLowerCase());
    }

    // Compute Warehouse Metrics
    const uniqueSuppliers = new Set(warehouses.map(w => w.supplier_id || w.company_name)).size;
    const uniqueStates = new Set(warehouses.map(w => w.state).filter(s => s && s !== '-')).size;
    const totalInventoryUnits = warehouses.reduce((acc, w) => acc + (w.inventory_count || 0), 0);

    return NextResponse.json({
      warehouses,
      metrics: {
        totalProducts: warehouses.length,
        totalWarehouses: uniqueSuppliers,
        uniqueStates,
        totalInventoryUnits
      }
    });

  } catch (error) {
    console.error('Error fetching admin warehouses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await checkAdminAuth();
    if (auth.error) return new NextResponse(auth.error, { status: auth.status });

    const { supabaseAdmin } = auth;
    const body = await request.json();
    const { supplier_id, product_id, warehouse_address, city, state, pincode, inventory_count } = body;

    // Update supplier address if supplier_id provided
    if (supplier_id && (warehouse_address !== undefined || city !== undefined || state !== undefined || pincode !== undefined)) {
      const supplierUpdates = {};
      if (warehouse_address !== undefined) supplierUpdates.warehouse_address = warehouse_address;
      if (city !== undefined) supplierUpdates.city = city;
      if (state !== undefined) supplierUpdates.state = state;
      if (pincode !== undefined) supplierUpdates.pincode = pincode;
      supplierUpdates.updated_at = new Date().toISOString();

      const { error: userError } = await supabaseAdmin
        .from('users')
        .update(supplierUpdates)
        .eq('id', supplier_id);

      if (userError) throw userError;
    }

    // Update product inventory if product_id provided
    if (product_id && inventory_count !== undefined) {
      const { error: productError } = await supabaseAdmin
        .from('products')
        .update({ 
          inventory_count: Number(inventory_count),
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id);

      if (productError) throw productError;
    }

    return NextResponse.json({ success: true, message: 'Warehouse and inventory updated successfully' });
  } catch (error) {
    console.error('Error updating warehouse data:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
