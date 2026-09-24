import { NextResponse } from 'next/server';
import { createClient } from '@/services/supabaseServer';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getUserMembership, readMemberships } from '@/services/membershipStore';
import { getProductSlug } from '@/utils/catalogResolver';
import { uploadBase64OrUrlToCloudinary, isCloudinaryConfigured } from '@/services/cloudinary';
import { triggerProductSeoAutomation } from '@/services/seoAutomationService';

// Helper to resolve user profile across firebase_uid, id, and registered_email
async function resolveUserProfile(supabaseAdmin, user) {
  if (!user?.id) return null;

  // 1. By firebase_uid
  const { data: p1 } = await supabaseAdmin
    .from('users')
    .select('id, role, company_name, registered_email')
    .eq('firebase_uid', user.id)
    .maybeSingle();
  if (p1) return p1;

  // 2. By primary UUID id
  const { data: p2 } = await supabaseAdmin
    .from('users')
    .select('id, role, company_name, registered_email')
    .eq('id', user.id)
    .maybeSingle();
  if (p2) {
    await supabaseAdmin.from('users').update({ firebase_uid: user.id }).eq('id', p2.id);
    return p2;
  }

  // 3. By registered_email
  if (user.email) {
    const { data: p3 } = await supabaseAdmin
      .from('users')
      .select('id, role, company_name, registered_email')
      .eq('registered_email', user.email)
      .maybeSingle();
    if (p3) {
      await supabaseAdmin.from('users').update({ firebase_uid: user.id }).eq('id', p3.id);
      return p3;
    }
  }

  // 4. Auto-create fallback profile
  const emailName = user.email ? user.email.split('@')[0] : 'Enterprise';
  const { data: newProfile, error: createErr } = await supabaseAdmin
    .from('users')
    .insert([{
      firebase_uid: user.id,
      registered_email: user.email || 'supplier@b2bindia.site',
      company_name: `${emailName.charAt(0).toUpperCase() + emailName.slice(1)} Trading Co`,
      role: 'both',
      verification_level: 'VERIFIED'
    }])
    .select('id, role, company_name, registered_email')
    .single();

  if (!createErr && newProfile) {
    return newProfile;
  }

  return null;
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supplierProfile = await resolveUserProfile(supabaseAdmin, user);

    if (!supplierProfile) {
      console.error('Failed to resolve supplier profile for User:', user.id);
      return NextResponse.json({ error: 'User profile not found. Please log in again.' }, { status: 404 });
    }

    // Role Permission Handling:
    // Allow 'supplier', 'both', and 'admin'.
    // If user has role 'buyer' and adds a product, auto-upgrade to 'both' so they can seamlessly trade both ways!
    if (supplierProfile.role === 'buyer') {
      await supabaseAdmin
        .from('users')
        .update({ role: 'both' })
        .eq('id', supplierProfile.id);
      supplierProfile.role = 'both';
    }

    // Enforce Active Membership Validation (Non-admin users)
    if (supplierProfile.role !== 'admin') {
      const membership = getUserMembership(user.id, user.email || supplierProfile.registered_email);
      if (membership.isExpired || membership.plan === 'FREE TIER' || !membership.canUpload) {
        return NextResponse.json({
          error: membership.isExpired 
            ? 'Your supplier subscription has expired. Please renew your membership plan to list new products and restore your catalog.'
            : 'Active Supplier Membership (Annual Plan) is required to list products on B2B India.',
          requiresUpgrade: true,
          plan: membership.plan,
          isExpired: membership.isExpired,
        }, { status: 403 });
      }
    }

    const supplierId = supplierProfile.id;
    
    // Parse the request body
    const body = await request.json();
    const {
      title,
      description,
      sector_id: sector_slug,
      base_price_per_unit,
      gst_percentage,
      unit_label,
      hsn_code,
      hero_image_url,
      gallery_image_urls,
      location,
      brand_name,
      model_no,
      bulk_minimum_order,
      inventory_count,
      quality_grade,
      packaging_type,
      form_state,
      lead_time_days,
      sample_available,
      custom_specs,
    } = body;

    // Validate required fields
    if (!title || !sector_slug || !base_price_per_unit || !unit_label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Process image gallery (up to 5 images max)
    let finalGalleryImages = [];
    if (Array.isArray(gallery_image_urls)) {
      finalGalleryImages = gallery_image_urls
        .filter(url => typeof url === 'string' && url.trim().length > 0)
        .slice(0, 5);
    }

    let finalHeroImageUrl = typeof hero_image_url === 'string' && hero_image_url.trim()
      ? hero_image_url.trim()
      : (finalGalleryImages.length > 0 ? finalGalleryImages[0] : null);

    // Strict Cloudinary Offloading Guard: Guarantee that raw Base64 is NEVER written to Supabase
    if (isCloudinaryConfigured()) {
      if (finalHeroImageUrl && finalHeroImageUrl.startsWith('data:image')) {
        try {
          const cdnRes = await uploadBase64OrUrlToCloudinary(finalHeroImageUrl, { folder: 'b2b-bharat/products' });
          finalHeroImageUrl = cdnRes.secure_url;
        } catch (e) {
          console.error('Error offloading hero base64 to Cloudinary:', e.message);
        }
      }
      for (let i = 0; i < finalGalleryImages.length; i++) {
        if (finalGalleryImages[i]?.startsWith('data:image')) {
          try {
            const cdnRes = await uploadBase64OrUrlToCloudinary(finalGalleryImages[i], { folder: 'b2b-bharat/products' });
            finalGalleryImages[i] = cdnRes.secure_url;
          } catch (e) {
            console.error('Error offloading gallery base64 to Cloudinary:', e.message);
          }
        }
      }
    }

    if (finalHeroImageUrl && !finalGalleryImages.includes(finalHeroImageUrl)) {
      finalGalleryImages = [finalHeroImageUrl, ...finalGalleryImages].slice(0, 5);
    }

    // Resolve sector slug to real UUID
    let realSectorId = null;
    const { data: sectorData } = await supabase
      .from('industry_sectors')
      .select('id')
      .eq('slug', sector_slug === 'others' ? 'waste-recycling' : sector_slug)
      .single();

    if (sectorData) {
      realSectorId = sectorData.id;
    } else {
      const { data: fallback } = await supabase.from('industry_sectors').select('id').limit(1).single();
      if (!fallback) {
        return NextResponse.json({ error: 'No sectors exist in the database' }, { status: 500 });
      }
      realSectorId = fallback.id;
    }

    // Build comprehensive technical specifications object
    const technical_specifications = {
      stock_yard_location: location || {},
      gst_percentage: gst_percentage || '18',
    };

    if (brand_name?.trim()) technical_specifications['Brand Name'] = brand_name.trim();
    if (model_no?.trim()) technical_specifications['Model / Style No'] = model_no.trim();
    if (quality_grade?.trim()) technical_specifications['Quality / Grade'] = quality_grade.trim();
    if (packaging_type?.trim()) technical_specifications['Packaging Type'] = packaging_type.trim();
    if (form_state?.trim()) technical_specifications['Physical Form'] = form_state.trim();
    if (lead_time_days) technical_specifications['Fulfillment Lead Time'] = `${lead_time_days} Days`;
    if (sample_available) technical_specifications['Sample Offered'] = sample_available;

    // Merge dynamic custom specs
    if (Array.isArray(custom_specs)) {
      custom_specs.forEach(item => {
        if (item.key?.trim() && item.value?.trim()) {
          technical_specifications[item.key.trim()] = item.value.trim();
        }
      });
    }

    // Commercial Calculation:
    // Base Price + 3% Platform Commission = Listed Catalog Base Price
    const rawSupplierPrice = parseFloat(base_price_per_unit) || 0;
    const platformFee = parseFloat((rawSupplierPrice * 0.03).toFixed(2));
    const listedPriceWithCommission = parseFloat((rawSupplierPrice + platformFee).toFixed(2));

    technical_specifications.supplier_net_price = rawSupplierPrice;
    technical_specifications.platform_commission_percent = 3;
    technical_specifications.platform_fee_per_unit = platformFee;

    // Insert into products table using Admin client
    const { data: product, error: insertError } = await supabaseAdmin
      .from('products')
      .insert([
        {
          supplier_id: supplierId,
          sector_id: realSectorId,
          title,
          description,
          base_price_per_unit: listedPriceWithCommission,
          unit_label: unit_label || 'kg',
          bulk_minimum_order: parseInt(bulk_minimum_order, 10) || 1000,
          inventory_count: parseInt(inventory_count, 10) || 5000,
          quality_grade: quality_grade || 'A Grade',
          hsn_code: hsn_code || null,
          hero_image_url: finalHeroImageUrl,
          gallery_image_urls: finalGalleryImages.length > 0 ? finalGalleryImages : null,
          technical_specifications,
          is_active: true
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting product:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Automated Realtime SEO & Google Sitemap Notification
    triggerProductSeoAutomation(product, 'created').catch(e => console.warn('[SEO] Automation ping error:', e));

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const myProductsOnly = searchParams.get('my') === 'true';

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (myProductsOnly) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const supplierProfile = await resolveUserProfile(supabaseAdmin, user);

      if (!supplierProfile) {
        return NextResponse.json({ products: [] });
      }

      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          sector_id (id, name, slug)
        `)
        .eq('supplier_id', supplierProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ products: products || [] });
    }

    // Public list of active products
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        supplier_id (id, company_name, city, state, registered_email),
        sector_id (name, slug)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allMemberships = readMemberships();
    const now = new Date();

    // Filter out products from suppliers whose membership is expired
    const activeProducts = (products || []).filter(p => {
      const supp = p.supplier_id;
      const suppId = typeof supp === 'object' ? supp?.id : supp;
      const suppEmail = typeof supp === 'object' ? supp?.registered_email : null;

      const sub = (suppId && allMemberships[suppId]) || (suppEmail && allMemberships[suppEmail.toLowerCase()]);
      if (sub && sub.expiresAt && new Date(sub.expiresAt) < now) {
        return false; // Automatically hidden from website because subscription expired
      }
      return true;
    });

    const enriched = activeProducts.map(p => ({ ...p, slug: getProductSlug(p) }));
    return NextResponse.json({ products: enriched });
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const supplierProfile = await resolveUserProfile(supabaseAdmin, user);
    if (!supplierProfile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    const body = await request.json();
    const {
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
      gallery_image_urls,
      sector_id,
      brand_name,
      model_no,
      packaging_type,
      form_state,
      lead_time_days,
      sample_available,
      location,
      custom_specs,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }

    const isUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    // Resolve sector UUID safely
    let realSectorId = null;
    if (isUUID(sector_id)) {
      realSectorId = sector_id;
    } else if (sector_id) {
      // 1. Try industry_sectors table
      try {
        const { data: indSec } = await supabaseAdmin
          .from('industry_sectors')
          .select('id')
          .or(`slug.eq.${sector_id},name.ilike.%${sector_id}%`)
          .maybeSingle();
        if (indSec?.id && isUUID(indSec.id)) {
          realSectorId = indSec.id;
        }
      } catch (e) {}

      // 2. Try sectors table
      if (!realSectorId) {
        try {
          const { data: sec } = await supabaseAdmin
            .from('sectors')
            .select('id')
            .or(`slug.eq.${sector_id},name.ilike.%${sector_id}%`)
            .maybeSingle();
          if (sec?.id && isUUID(sec.id)) {
            realSectorId = sec.id;
          }
        } catch (e) {}
      }
    }

    // Build technical specifications
    const technical_specifications = {};
    if (brand_name) technical_specifications.brand_name = brand_name;
    if (model_no) technical_specifications.model_no = model_no;
    if (packaging_type) technical_specifications.packaging_type = packaging_type;
    if (form_state) technical_specifications.form_state = form_state;
    if (lead_time_days) technical_specifications.lead_time_days = lead_time_days;
    if (sample_available) technical_specifications.sample_available = sample_available;
    if (location) technical_specifications.location = location;

    if (Array.isArray(custom_specs)) {
      custom_specs.forEach(spec => {
        if (spec && spec.key && spec.key.trim() && spec.value !== undefined) {
          const cleanKey = spec.key.trim().toLowerCase().replace(/\s+/g, '_');
          technical_specifications[cleanKey] = spec.value;
        }
      });
    }

    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (description !== undefined) updatePayload.description = description;
    if (base_price_per_unit !== undefined) updatePayload.base_price_per_unit = parseFloat(base_price_per_unit);
    if (unit_label !== undefined) updatePayload.unit_label = unit_label;
    if (bulk_minimum_order !== undefined) updatePayload.bulk_minimum_order = parseInt(bulk_minimum_order, 10);
    if (inventory_count !== undefined) updatePayload.inventory_count = parseInt(inventory_count, 10);
    if (quality_grade !== undefined) updatePayload.quality_grade = quality_grade;
    if (hsn_code !== undefined) updatePayload.hsn_code = hsn_code || null;
    if (hero_image_url !== undefined) {
      if (typeof hero_image_url === 'string' && hero_image_url.startsWith('data:image') && isCloudinaryConfigured()) {
        try {
          const cdnRes = await uploadBase64OrUrlToCloudinary(hero_image_url, { folder: 'b2b-bharat/products' });
          updatePayload.hero_image_url = cdnRes.secure_url;
        } catch (e) {
          updatePayload.hero_image_url = hero_image_url;
        }
      } else {
        updatePayload.hero_image_url = hero_image_url;
      }
    }
    if (gallery_image_urls !== undefined) {
      let cleanGallery = Array.isArray(gallery_image_urls) ? [...gallery_image_urls] : [];
      if (isCloudinaryConfigured()) {
        for (let i = 0; i < cleanGallery.length; i++) {
          if (cleanGallery[i]?.startsWith('data:image')) {
            try {
              const cdnRes = await uploadBase64OrUrlToCloudinary(cleanGallery[i], { folder: 'b2b-bharat/products' });
              cleanGallery[i] = cdnRes.secure_url;
            } catch (e) {}
          }
        }
      }
      updatePayload.gallery_image_urls = cleanGallery.length > 0 ? cleanGallery : null;
    }
    if (realSectorId && isUUID(realSectorId)) updatePayload.sector_id = realSectorId;
    if (Object.keys(technical_specifications).length > 0) updatePayload.technical_specifications = technical_specifications;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    let updateQuery = supabaseAdmin
      .from('products')
      .update(updatePayload)
      .eq('id', id);

    // If not admin, ensure product belongs to supplier
    if (supplierProfile.role !== 'admin') {
      updateQuery = updateQuery.eq('supplier_id', supplierProfile.id);
    }

    const { data: updatedProduct, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.error('Error updating product:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error in PUT /api/products:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
