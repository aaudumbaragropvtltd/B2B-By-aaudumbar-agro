import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

// Get all RFQs
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const url = new URL(request.url);
    const view = url.searchParams.get('view');

    // Marketplace view is public for open broadcasted buy leads
    if (view === 'marketplace') {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      const { data, error } = await supabaseAdmin
        .from('rfqs')
        .select('id, product_name, quantity, unit, target_price, destination, deadline, notes, status, created_at, users:buyer_id(company_name, city, state, verification_level)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return NextResponse.json([], { status: 200 });
      return NextResponse.json(data || [], { status: 200 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    let query = supabaseAdmin
      .from('rfqs')
      .select('*, users:buyer_id(company_name, city, state, verification_level, registered_email)')
      .order('created_at', { ascending: false });

    if (view === 'buyer' || view === 'my') {
      query = query.eq('buyer_id', profile.id);
    } else if (view === 'supplier' || view === 'marketplace') {
      query = query.eq('status', 'open');
    } else if (profile.role === 'buyer') {
      query = query.eq('buyer_id', profile.id);
    } else {
      // Suppliers or others default to marketplace open RFQs
      query = query.eq('status', 'open');
    }

    let { data, error } = await query;
    if (error) {
      console.warn('First RFQ select with join failed, running basic select:', error.message);
      let basicQuery = supabaseAdmin
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });

      if (view === 'buyer' || view === 'my') {
        basicQuery = basicQuery.eq('buyer_id', profile.id);
      } else if (view === 'supplier' || view === 'marketplace') {
        basicQuery = basicQuery.eq('status', 'open');
      } else if (profile.role === 'buyer' && !view) {
        basicQuery = basicQuery.eq('buyer_id', profile.id);
      } else {
        basicQuery = basicQuery.eq('status', 'open');
      }

      const { data: basicData, error: basicError } = await basicQuery;
      if (basicError) throw basicError;
      data = basicData;
    }

    if (data && data.length > 0) {
      try {
        const rfqIds = data.map(r => r.id);
        const { data: quoteRows } = await supabaseAdmin
          .from('rfq_quotes')
          .select('id, rfq_id, quoted_price')
          .in('rfq_id', rfqIds);

        const quoteCountMap = new Map();
        const minPriceMap = new Map();

        (quoteRows || []).forEach(q => {
          quoteCountMap.set(q.rfq_id, (quoteCountMap.get(q.rfq_id) || 0) + 1);
          const currMin = minPriceMap.get(q.rfq_id);
          if (currMin === undefined || (q.quoted_price && q.quoted_price < currMin)) {
            minPriceMap.set(q.rfq_id, q.quoted_price);
          }
        });

        data = data.map(r => {
          let cleanNotes = r.notes || '';
          let isGstVerified = !!(r.users?.gst_number || r.users?.gst_verified);
          let parsedGstRate = r.gst_rate !== undefined && r.gst_rate !== null ? Number(r.gst_rate) : 18;

          let parsedSector = r.sector || r.category || r.sector_slug || null;

          if (cleanNotes.includes('<!--CONTACT_META:')) {
            try {
              const match = cleanNotes.match(/<!--CONTACT_META:(.*?)-->/);
              if (match && match[1]) {
                const meta = JSON.parse(match[1]);
                if (meta.gst) isGstVerified = true;
                if (meta.gst_rate !== undefined) parsedGstRate = Number(meta.gst_rate);
                if (meta.sector || meta.category) parsedSector = meta.sector || meta.category;
              }
              cleanNotes = cleanNotes.replace(/<!--CONTACT_META:.*?-->/, '').trim();
            } catch {
              // Ignore parse error
            }
          }

          if (!parsedSector) {
            // Auto-detect from product name if possible
            const pName = (r.product_name || '').toLowerCase();
            if (pName.includes('rice') || pName.includes('wheat') || pName.includes('sugar') || pName.includes('cardamom') || pName.includes('pepper') || pName.includes('onion') || pName.includes('potato') || pName.includes('dal') || pName.includes('spice')) {
              parsedSector = 'food-agriculture';
            } else if (pName.includes('bolt') || pName.includes('nut') || pName.includes('bearing') || pName.includes('motor') || pName.includes('lathe') || pName.includes('cnc') || pName.includes('machinery')) {
              parsedSector = 'industrial-machinery';
            } else if (pName.includes('cement') || pName.includes('tmt') || pName.includes('brick') || pName.includes('tile')) {
              parsedSector = 'building-construction';
            } else if (pName.includes('yarn') || pName.includes('fabric') || pName.includes('cotton') || pName.includes('denim') || pName.includes('garment')) {
              parsedSector = 'textiles-fabrics';
            } else if (pName.includes('solar') || pName.includes('inverter') || pName.includes('pv')) {
              parsedSector = 'solar-renewable';
            } else if (pName.includes('hdpe') || pName.includes('polymer') || pName.includes('plastic')) {
              parsedSector = 'plastic-products';
            } else if (pName.includes('paracetamol') || pName.includes('pharma') || pName.includes('drug') || pName.includes('tablet')) {
              parsedSector = 'pharma-drugs';
            } else {
              parsedSector = 'food-agriculture';
            }
          }

          return {
            ...r,
            notes: cleanNotes,
            sector: parsedSector,
            category: parsedSector,
            sector_slug: parsedSector,
            gst_rate: parsedGstRate,
            is_gst_verified: isGstVerified,
            gst_badge: isGstVerified ? 'GST VERIFIED BUYER' : null,
            quotes_count: quoteCountMap.get(r.id) || 0,
            lowest_quote: minPriceMap.get(r.id) || null,
            users: r.users ? {
              company_name: r.users.company_name,
              city: r.users.city,
              state: r.users.state,
              verification_level: r.users.verification_level,
              is_gst_verified: isGstVerified,
              gst_badge: isGstVerified ? 'GST VERIFIED BUYER' : null
            } : null
          };
        });
      } catch (err) {
        console.warn('Could not aggregate quotes count:', err.message);
      }
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching RFQs:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Create a new RFQ
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please log in to post a requirement' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found. Please log in again.' }, { status: 404 });
    }

    // Dual Role Support: If currently 'supplier' and posting an RFQ, auto-upgrade to 'both'
    if (profile.role === 'supplier') {
      await supabaseAdmin.from('users').update({ role: 'both' }).eq('id', profile.id);
      profile.role = 'both';
    }

    const body = await request.json();
    const { 
      productName, 
      category, 
      targetPrice, 
      quantity, 
      destination, 
      deadline, 
      notes, 
      unit, 
      catalogProductId, 
      buyerEmail, 
      buyerPhone, 
      buyerAlternatePhone,
      buyerGst 
    } = body;

    const finalGstRate = body.gstRate !== undefined ? Number(body.gstRate) : (body.gst_rate !== undefined ? Number(body.gst_rate) : 18);
    const finalSector = body.sector || body.category || body.sectorSlug || 'food-agriculture';

    // Pack contact & GST metadata into notes to guarantee persistence across all database schemas
    const contactMeta = {
      phone: buyerPhone || '',
      alt_phone: buyerAlternatePhone || '',
      email: buyerEmail || '',
      gst: buyerGst || '',
      gst_rate: finalGstRate,
      sector: finalSector,
      category: finalSector
    };
    
    let combinedNotes = notes || '';
    if (contactMeta.phone || contactMeta.alt_phone || contactMeta.email || contactMeta.gst || contactMeta.gst_rate || contactMeta.sector) {
      combinedNotes = `<!--CONTACT_META:${JSON.stringify(contactMeta)}-->${combinedNotes}`;
    }

    // Update buyer's user record in users table if phone, alt phone, or GST number were provided
    try {
      const userUpdates = {};
      if (buyerPhone) userUpdates.corporate_phone = buyerPhone;
      if (buyerAlternatePhone) userUpdates.phone_number = buyerAlternatePhone;
      if (buyerEmail) userUpdates.registered_email = buyerEmail;
      if (buyerGst) {
        userUpdates.gst_number = buyerGst.trim().toUpperCase();
        userUpdates.gst_verified = true;
      }

      if (Object.keys(userUpdates).length > 0) {
        await supabaseAdmin
          .from('users')
          .update(userUpdates)
          .eq('id', profile.id);
      }
    } catch (userErr) {
      console.warn('Could not sync contact/GST info to users table:', userErr.message);
    }

    const insertPayload = {
      buyer_id: profile.id,
      product_name: productName,
      target_price: targetPrice,
      quantity: quantity,
      destination: destination,
      deadline: deadline || null,
      notes: combinedNotes,
      unit: unit || 'units',
      buyer_email: buyerEmail || null,
      buyer_phone: buyerPhone || null,
      buyer_alternate_phone: buyerAlternatePhone || null,
      catalog_product_id: catalogProductId || null
    };

    let { data, error } = await supabaseAdmin
      .from('rfqs')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.warn('First RFQ insert attempt with full contact columns failed, trying fallback with metadata notes:', error.message);
      // Fallback with basic contact columns and metadata notes
      const fallbackPayload = {
        buyer_id: profile.id,
        product_name: productName,
        target_price: targetPrice,
        quantity: quantity,
        destination: destination,
        deadline: deadline || null,
        notes: combinedNotes,
        unit: unit || 'units',
        buyer_email: buyerEmail || null
      };
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from('rfqs')
        .insert([fallbackPayload])
        .select()
        .single();
        
      if (fallbackError) {
        // Minimal insert
        const { data: minData, error: minErr } = await supabaseAdmin
          .from('rfqs')
          .insert([{
            buyer_id: profile.id,
            product_name: productName,
            target_price: targetPrice,
            quantity: quantity,
            destination: destination,
            deadline: deadline || null,
            notes: combinedNotes,
            unit: unit || 'units'
          }])
          .select()
          .single();
        if (minErr) throw minErr;
        data = minData;
      } else {
        data = fallbackData;
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating RFQ:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse('Unauthorized', { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
    if (!profile) return new NextResponse('User profile not found', { status: 404 });

    const body = await request.json();
    const {
      id,
      productName,
      product_name,
      quantity,
      unit,
      targetPrice,
      target_price,
      destination,
      deadline,
      notes,
      buyerEmail,
      buyer_email,
      buyerPhone,
      buyer_phone,
      buyerAlternatePhone,
      buyer_alternate_phone,
      buyerGst,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'RFQ ID is required for update.' }, { status: 400 });
    }

    const finalProductName = productName || product_name;
    const finalTargetPrice = targetPrice !== undefined ? targetPrice : target_price;
    const finalEmail = buyerEmail || buyer_email;
    const finalPhone = buyerPhone || buyer_phone;
    const finalAltPhone = buyerAlternatePhone || buyer_alternate_phone;

    // Sync contact info and GST to users table
    try {
      const userUpdates = {};
      if (finalPhone) userUpdates.corporate_phone = finalPhone;
      if (finalAltPhone) userUpdates.phone_number = finalAltPhone;
      if (finalEmail) userUpdates.registered_email = finalEmail;
      if (buyerGst) {
        userUpdates.gst_number = buyerGst.trim().toUpperCase();
        userUpdates.gst_verified = true;
      }
      if (Object.keys(userUpdates).length > 0) {
        await supabaseAdmin.from('users').update(userUpdates).eq('id', profile.id);
      }
    } catch (userErr) {
      console.warn('Could not sync user updates:', userErr.message);
    }

    const finalGstRate = body.gstRate !== undefined ? Number(body.gstRate) : (body.gst_rate !== undefined ? Number(body.gst_rate) : undefined);
    const finalSector = body.sector || body.category || body.sectorSlug || undefined;

    let combinedNotes = notes || '';
    if (finalPhone || finalEmail || buyerGst || finalGstRate !== undefined || finalSector) {
      const contactMeta = {
        phone: finalPhone || null,
        alt_phone: finalAltPhone || null,
        email: finalEmail || null,
        gst: buyerGst ? buyerGst.trim().toUpperCase() : null,
        gst_rate: finalGstRate !== undefined ? finalGstRate : 18,
        sector: finalSector || 'food-agriculture',
        category: finalSector || 'food-agriculture'
      };
      // Strip old meta if present
      combinedNotes = combinedNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
      combinedNotes = `${combinedNotes}\n<!--CONTACT_META:${JSON.stringify(contactMeta)}-->`.trim();
    }

    const updatePayload = {};
    if (finalProductName !== undefined) updatePayload.product_name = finalProductName;
    if (finalTargetPrice !== undefined) updatePayload.target_price = parseFloat(finalTargetPrice);
    if (quantity !== undefined) updatePayload.quantity = parseInt(quantity, 10);
    if (unit !== undefined) updatePayload.unit = unit;
    if (destination !== undefined) updatePayload.destination = destination;
    if (deadline !== undefined) updatePayload.deadline = deadline || null;
    if (combinedNotes) updatePayload.notes = combinedNotes;
    if (status !== undefined) updatePayload.status = status;

    let updateQuery = supabaseAdmin
      .from('rfqs')
      .update(updatePayload)
      .eq('id', id);

    // If not admin, verify ownership
    if (profile.role !== 'admin') {
      updateQuery = updateQuery.eq('buyer_id', profile.id);
    }

    let { data: updatedRfq, error: updateError } = await updateQuery.select().single();

    if (updateError) {
      console.warn('First RFQ update attempt notice:', updateError.message);
      // Minimal update fallback
      const minPayload = {
        product_name: finalProductName,
        target_price: parseFloat(finalTargetPrice) || 0,
        quantity: parseInt(quantity, 10) || 1,
        unit: unit || 'units',
        destination: destination || '',
        notes: combinedNotes
      };
      let minQuery = supabaseAdmin.from('rfqs').update(minPayload).eq('id', id);
      if (profile.role !== 'admin') minQuery = minQuery.eq('buyer_id', profile.id);
      const { data: minData, error: minErr } = await minQuery.select().single();
      if (minErr) {
        throw minErr;
      }
      updatedRfq = minData;
    }

    return NextResponse.json({ success: true, rfq: updatedRfq });
  } catch (error) {
    console.error('Error in PUT /api/rfq:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
