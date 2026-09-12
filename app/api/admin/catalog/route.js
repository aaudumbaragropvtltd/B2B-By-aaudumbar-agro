import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCategoryFeePercent } from '@/utils/platformSettings';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all products with supplier info and sector info
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('*, users!products_supplier_id_fkey(company_name, registered_email, corporate_phone), sector_id(id, name, slug)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const enrichedProducts = (products || []).map(p => {
      let specs = p.technical_specifications || {};
      if (typeof specs === 'string') {
        try { specs = JSON.parse(specs); } catch { specs = {}; }
      }
      return {
        ...p,
        approval_status: specs.approval_status || (p.is_active ? 'approved' : 'pending'),
        rejection_reason: specs.rejection_reason || null
      };
    });

    return NextResponse.json(enrichedProducts);
  } catch (error) {
    console.error('Error fetching catalog for admin:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', products: [] }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { 
      productId, 
      status, 
      reason, 
      title, 
      description, 
      base_price_per_unit, 
      unit_label, 
      unit_type,
      bulk_minimum_order,
      inventory_count,
      quality_grade,
      hsn_code,
      hero_image_url,
      sector_id,
      brand_name,
      model_no,
      packaging_type,
      form_state,
      lead_time_days,
      sample_available,
      location,
      custom_specs,
      gst_percentage,
      technical_specifications: incomingSpecs
    } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // Fetch existing product to preserve fields if not provided
    const { data: existingProduct, error: fetchErr } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchErr || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updateData = {};

    // Status updates (is_active on products table, status/reason in technical_specifications)
    if (status !== undefined) {
      updateData.is_active = (status === 'approved' || status === true);
    }
    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    // Commercial & Basic details
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (unit_label !== undefined) updateData.unit_label = unit_label;
    if (unit_type !== undefined && !unit_label) updateData.unit_label = unit_type;
    if (bulk_minimum_order !== undefined) updateData.bulk_minimum_order = Number(bulk_minimum_order);
    if (inventory_count !== undefined) updateData.inventory_count = Number(inventory_count);
    if (quality_grade !== undefined) updateData.quality_grade = quality_grade;
    if (hsn_code !== undefined) updateData.hsn_code = hsn_code || null;
    if (hero_image_url !== undefined) updateData.hero_image_url = hero_image_url || null;

    // Sector resolution if changed
    if (sector_id !== undefined && sector_id !== null) {
      if (typeof sector_id === 'string' && !sector_id.includes('-') && sector_id.length > 20) {
        updateData.sector_id = sector_id;
      } else if (typeof sector_id === 'string') {
        const { data: sectorRecord } = await supabaseAdmin
          .from('industry_sectors')
          .select('id')
          .eq('slug', sector_id)
          .maybeSingle();
        if (sectorRecord) updateData.sector_id = sectorRecord.id;
      }
    }

    // Price Calculation: Add dynamic category platform fee to base price
    let rawSupplierPrice = existingProduct.base_price_per_unit;
    const resolvedSectorSlug = sector_id || existingProduct.sector_id || 'food-agriculture';
    const dynamicCategoryFeePercent = await getCategoryFeePercent(resolvedSectorSlug);

    if (base_price_per_unit !== undefined) {
      rawSupplierPrice = parseFloat(base_price_per_unit) || 0;
      const platformFee = parseFloat((rawSupplierPrice * (dynamicCategoryFeePercent / 100)).toFixed(2));
      const listedPriceWithCommission = parseFloat((rawSupplierPrice + platformFee).toFixed(2));
      updateData.base_price_per_unit = listedPriceWithCommission;
    }

    // Technical Specifications merging
    let currentSpecs = existingProduct.technical_specifications || {};
    if (typeof currentSpecs === 'string') {
      try { currentSpecs = JSON.parse(currentSpecs); } catch { currentSpecs = {}; }
    }

    const platformFeeAmount = parseFloat((rawSupplierPrice * (dynamicCategoryFeePercent / 100)).toFixed(2));

    const mergedSpecs = {
      ...currentSpecs,
      ...(incomingSpecs || {}),
      supplier_net_price: rawSupplierPrice,
      platform_commission_percent: dynamicCategoryFeePercent,
      platform_fee_per_unit: platformFeeAmount,
      gst_percentage: gst_percentage || currentSpecs.gst_percentage || '18',
    };

    if (status !== undefined) mergedSpecs.approval_status = status;
    if (reason !== undefined) mergedSpecs.rejection_reason = reason || null;
    if (location) mergedSpecs.stock_yard_location = location;
    if (brand_name?.trim()) mergedSpecs['Brand Name'] = brand_name.trim();
    if (model_no?.trim()) mergedSpecs['Model / Style No'] = model_no.trim();
    if (quality_grade?.trim()) mergedSpecs['Quality / Grade'] = quality_grade.trim();
    if (packaging_type?.trim()) mergedSpecs['Packaging Type'] = packaging_type.trim();
    if (form_state?.trim()) mergedSpecs['Physical Form'] = form_state.trim();
    if (lead_time_days) mergedSpecs['Fulfillment Lead Time'] = `${lead_time_days} Days`;
    if (sample_available) mergedSpecs['Sample Offered'] = sample_available;

    // Merge custom dynamic specs
    if (Array.isArray(custom_specs)) {
      custom_specs.forEach(item => {
        if (item.key?.trim() && item.value?.trim()) {
          mergedSpecs[item.key.trim()] = item.value.trim();
        }
      });
    }

    updateData.technical_specifications = mergedSpecs;

    const { data: updatedProduct, error: updateErr } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select('*, users!products_supplier_id_fkey(company_name, registered_email), sector_id(id, name, slug)')
      .single();

    if (updateErr) {
      console.error('Error updating product in admin catalog:', updateErr);
      throw updateErr;
    }
    
    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error in PATCH /api/admin/catalog:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const body = await request.json();
    const { 
      title, 
      description, 
      base_price_per_unit, 
      unit_label, 
      unit_type,
      bulk_minimum_order,
      inventory_count,
      quality_grade,
      hsn_code,
      hero_image_url,
      sector_id,
      supplier_id,
      brand_name,
      model_no,
      packaging_type,
      form_state,
      lead_time_days,
      sample_available,
      location,
      custom_specs,
      gst_percentage,
      category_fee_percent,
    } = body;

    if (!title || !base_price_per_unit) {
      return NextResponse.json({ error: 'Title and base price are required' }, { status: 400 });
    }

    // Resolve supplier_id (fallback to admin user if not provided)
    let resolvedSupplierId = supplier_id;
    if (!resolvedSupplierId) {
      const { data: firstAdmin } = await supabaseAdmin.from('users').select('id').eq('role', 'admin').limit(1).maybeSingle();
      resolvedSupplierId = firstAdmin?.id;
    }

    // Resolve sector_id
    let resolvedSectorId = sector_id;
    if (typeof sector_id === 'string' && !sector_id.includes('-') && sector_id.length > 20) {
      resolvedSectorId = sector_id;
    } else if (typeof sector_id === 'string') {
      const { data: sectorRecord } = await supabaseAdmin
        .from('industry_sectors')
        .select('id')
        .eq('slug', sector_id)
        .maybeSingle();
      if (sectorRecord) resolvedSectorId = sectorRecord.id;
    }

    // Pricing calculation with dynamic category platform fee
    const rawPrice = parseFloat(base_price_per_unit) || 0;
    const feePercent = parseFloat(category_fee_percent) || (await getCategoryFeePercent(sector_id));
    const platformFee = parseFloat((rawPrice * (feePercent / 100)).toFixed(2));
    const listedPrice = parseFloat((rawPrice + platformFee).toFixed(2));

    const specs = {
      brand_name: brand_name || '',
      model_no: model_no || '',
      packaging_type: packaging_type || 'Bulk Packaging',
      form_state: form_state || 'Solid',
      lead_time_days: lead_time_days || '5',
      sample_available: sample_available || 'Yes',
      location: location || {},
      supplier_net_price: rawPrice,
      platform_commission_percent: feePercent,
      platform_fee_per_unit: platformFee,
      gst_percentage: gst_percentage || '18',
      approval_status: 'approved'
    };

    if (Array.isArray(custom_specs)) {
      custom_specs.forEach(item => {
        if (item.key?.trim() && item.value?.trim()) {
          specs[item.key.trim()] = item.value.trim();
        }
      });
    }

    const { data: newProduct, error: insertErr } = await supabaseAdmin
      .from('products')
      .insert({
        title,
        description: description || '',
        base_price_per_unit: listedPrice,
        unit_label: unit_label || unit_type || 'kg',
        bulk_minimum_order: Number(bulk_minimum_order) || 100,
        inventory_count: Number(inventory_count) || 1000,
        quality_grade: quality_grade || 'Standard / A-Grade',
        hsn_code: hsn_code || null,
        hero_image_url: hero_image_url || null,
        supplier_id: resolvedSupplierId,
        sector_id: resolvedSectorId,
        is_active: true,
        technical_specifications: specs
      })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Error in POST /api/admin/catalog:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    let productId = searchParams.get('id') || searchParams.get('productId');

    if (!productId) {
      try {
        const body = await request.json();
        productId = body.id || body.productId;
      } catch (e) {}
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Clean up referencing tables if present
    try {
      await supabaseAdmin.from('product_reviews').delete().eq('product_id', productId);
      await supabaseAdmin.from('cart_items').delete().eq('product_id', productId);
      await supabaseAdmin.from('favorite_products').delete().eq('product_id', productId);
    } catch (relErr) {}

    // 2. Delete product
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product from Supabase:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Product successfully deleted from catalog' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/catalog:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
