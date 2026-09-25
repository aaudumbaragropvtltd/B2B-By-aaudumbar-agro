import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/services/supabaseServer';
import { resolveAuthenticatedUser } from '@/utils/userResolver';
import { getProductById } from '@/utils/catalogResolver';
import { getProductSlug } from '@/utils/slugUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productTitle, category, price, unit, image, slug } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    let userId = body.userId || body.user_id || null;
    let matchedProfile = null;

    // 1. Resolve user profile if provided directly (checks both primary UUID and firebase_uid)
    if (userId) {
      try {
        const { data: p } = await supabaseAdmin
          .from('users')
          .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
          .or(`id.eq.${userId},firebase_uid.eq.${userId}`)
          .maybeSingle();
        if (p) {
          matchedProfile = p;
          userId = p.id;
        }
      } catch (e) {
        // Continue to fallback resolvers
      }
    }

    // 2. Try resolving via email
    if (!matchedProfile && body.email) {
      try {
        const { data: p } = await supabaseAdmin
          .from('users')
          .select('id, full_name, company_name, registered_email, corporate_phone, phone_number, gst_number, city')
          .ilike('registered_email', body.email.trim())
          .maybeSingle();
        if (p) {
          matchedProfile = p;
          userId = p.id;
        }
      } catch (e) {}
    }

    // 3. Fallback: try session cookie via Universal User Resolver
    if (!matchedProfile) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const resolved = await resolveAuthenticatedUser(supabaseAdmin, user);
          if (resolved) {
            matchedProfile = resolved;
            userId = resolved.id;
          }
        }
      } catch (e) {}
    }

    // 4. Resolve real product details (supports UUID, slug, trade title, or fallback catalog)
    let realProductId = productId;
    let resolvedTitle = productTitle || null;
    let resolvedCategory = category || null;
    let resolvedPrice = Number(price) || 0;
    let resolvedUnit = unit || 'unit';
    let resolvedImage = image || null;
    let resolvedSlug = slug || null;

    const isDirectUuid = UUID_REGEX.test(productId);

    if (isDirectUuid) {
      try {
        const { data: dbProd } = await supabaseAdmin
          .from('products')
          .select('id, title, base_price_per_unit, unit_label, hero_image_url, sector_id(name, slug)')
          .eq('id', productId)
          .maybeSingle();
        if (dbProd) {
          resolvedTitle = dbProd.title || resolvedTitle;
          resolvedCategory = dbProd.sector_id?.name || dbProd.sector_id?.slug || resolvedCategory;
          resolvedPrice = Number(dbProd.base_price_per_unit) || resolvedPrice;
          resolvedUnit = dbProd.unit_label || resolvedUnit;
          resolvedImage = dbProd.hero_image_url || resolvedImage;
          resolvedSlug = getProductSlug(dbProd) || resolvedSlug;
        }
      } catch (e) {}
    } else {
      // Resolve slug or name to actual database product
      try {
        const resolvedProd = await getProductById(productId);
        if (resolvedProd) {
          if (resolvedProd.id && UUID_REGEX.test(resolvedProd.id)) {
            realProductId = resolvedProd.id;
          }
          resolvedTitle = resolvedProd.title || resolvedTitle;
          resolvedCategory = resolvedProd.sector_id?.name || resolvedProd.sector_id?.slug || resolvedCategory;
          resolvedPrice = Number(resolvedProd.base_price_per_unit) || resolvedPrice;
          resolvedUnit = resolvedProd.unit_label || resolvedUnit;
          resolvedImage = resolvedProd.hero_image_url || resolvedProd.image || resolvedImage;
          resolvedSlug = resolvedProd.slug || getProductSlug(resolvedProd) || resolvedSlug;
        }
      } catch (err) {
        // Fallback: wildcard query directly on products table
        try {
          const cleanPattern = productId.replace(/[^a-zA-Z0-9]/g, '%');
          const { data: fuzzyProd } = await supabaseAdmin
            .from('products')
            .select('id, title, base_price_per_unit, unit_label, hero_image_url, sector_id(name, slug)')
            .ilike('title', `%${cleanPattern}%`)
            .limit(1)
            .maybeSingle();
          if (fuzzyProd) {
            realProductId = fuzzyProd.id;
            resolvedTitle = fuzzyProd.title || resolvedTitle;
            resolvedCategory = fuzzyProd.sector_id?.name || fuzzyProd.sector_id?.slug || resolvedCategory;
            resolvedPrice = Number(fuzzyProd.base_price_per_unit) || resolvedPrice;
            resolvedUnit = fuzzyProd.unit_label || resolvedUnit;
            resolvedImage = fuzzyProd.hero_image_url || resolvedImage;
            resolvedSlug = getProductSlug(fuzzyProd) || resolvedSlug;
          }
        } catch (e) {}
      }
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

    // 5. Insert or update user_product_views with 15-minute deduplication window
    const isValidProductUuid = UUID_REGEX.test(realProductId);
    const isValidUserUuid = userId && UUID_REGEX.test(userId);

    if (isValidUserUuid && isValidProductUuid) {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: recentView } = await supabaseAdmin
          .from('user_product_views')
          .select('id')
          .eq('user_id', userId)
          .eq('product_id', realProductId)
          .gte('viewed_at', fifteenMinsAgo)
          .order('viewed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentView?.id) {
          await supabaseAdmin
            .from('user_product_views')
            .update({ viewed_at: new Date().toISOString() })
            .eq('id', recentView.id);
        } else {
          await supabaseAdmin
            .from('user_product_views')
            .insert({
              user_id: userId,
              product_id: realProductId
            });
        }
      } catch (viewErr) {
        console.warn('user_product_views tracking notice:', viewErr.message);
      }
    }

    // 6. Insert into activity_logs with rich commercial intent metadata
    try {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          user_id: isValidUserUuid ? userId : null,
          action: 'viewed_product',
          details: {
            product_id: realProductId,
            product_title: resolvedTitle || productTitle || productId,
            product_slug: resolvedSlug || slug || productId,
            category: resolvedCategory || category || 'General',
            price: resolvedPrice,
            unit_label: resolvedUnit,
            hero_image_url: resolvedImage,
            full_name: matchedProfile?.full_name || null,
            company_name: matchedProfile?.company_name || null,
            phone: matchedProfile?.corporate_phone || matchedProfile?.phone_number || body.phone || null,
            email: matchedProfile?.registered_email || body.email || null,
            has_order: false,
            timestamp: new Date().toISOString()
          },
          ip_address: ip
        });
    } catch (actErr) {
      console.warn('activity_logs product view warning:', actErr.message);
    }

    return NextResponse.json({ 
      success: true, 
      userId: userId || null,
      resolvedProductId: realProductId,
      resolvedTitle: resolvedTitle || productTitle
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json({ success: true });
  }
}

