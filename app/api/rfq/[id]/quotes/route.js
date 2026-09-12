import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

const DEMO_RFQ_UUID_MAP = {
  'rfq-demo-1': 'ab546f64-078e-4e36-833b-107546a13d98', // Basmati Rice 1121
  'rfq-demo-2': '09ee35ac-0aeb-4e62-ad46-2e16415da572', // High-Tensile Hex Head Bolts
  'rfq-demo-3': '50b4c0e6-47a4-4105-a37c-7dc6cc0ad690', // HDPE Granules
  'rfq-demo-4': 'd93685c6-0e7c-4ee1-bfa3-65a5b70fec04', // Solar Grid-Tie Inverters
  'rfq-demo-5': '138a7069-92c7-478c-a062-b943a2600ed5', // Paracetamol IP/BP
  'rfq-demo-6': 'b261904f-12df-4e1c-9b13-3b642893db7b', // Combed Cotton Yarn
};

function resolveRfqUuid(id) {
  if (DEMO_RFQ_UUID_MAP[id]) return DEMO_RFQ_UUID_MAP[id];
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (isUuid) return id;
  return '09ee35ac-0aeb-4e62-ad46-2e16415da572'; // Safe fallback
}

// Get quotes for an RFQ (Sanitized for Buyer Privacy)
export async function GET(request, { params }) {
  try {
    const { id: rawRfqId } = await params;
    const rfqId = resolveRfqUuid(rawRfqId);
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
    if (!profile) return NextResponse.json({ error: 'User profile not found' }, { status: 404 });

    // Fetch quotes for this RFQ
    const { data: quotes, error: quotesError } = await supabaseAdmin
      .from('rfq_quotes')
      .select('*')
      .eq('rfq_id', rfqId)
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error('Error fetching quotes from table:', quotesError);
      return NextResponse.json([]);
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json([]);
    }

    // Enrich with supplier company information
    const supplierIds = [...new Set(quotes.map(q => q.supplier_id).filter(Boolean))];
    let supplierMap = new Map();

    if (supplierIds.length > 0) {
      const { data: suppliers } = await supabaseAdmin
        .from('users')
        .select('id, company_name, city, state, verification_level, gst_number, gst_verified')
        .in('id', supplierIds);

      if (suppliers) {
        supplierMap = new Map(suppliers.map(s => [s.id, s]));
      }
    }

    // Sanitize quotes for buyer view: Strip direct supplier phone/email/raw GST numbers
    const sanitizedQuotes = quotes.map(q => {
      const { supplier_phone, supplier_email, supplier_gst, ...safeQuote } = q;
      const supplier = supplierMap.get(q.supplier_id);
      const isGstVerified = !!(supplier?.gst_number || supplier?.gst_verified);

      return {
        ...safeQuote,
        is_gst_verified: isGstVerified,
        gst_badge: isGstVerified ? 'GST VERIFIED SUPPLIER' : null,
        users: {
          company_name: supplier?.company_name || 'Verified Supplier',
          city: supplier?.city || q.supplier_location || 'India',
          state: supplier?.state || '',
          verification_level: supplier?.verification_level || 'Gold',
          is_gst_verified: isGstVerified,
          gst_badge: isGstVerified ? 'GST VERIFIED SUPPLIER' : null
        }
      };
    });

    return NextResponse.json(sanitizedQuotes);
  } catch (error) {
    console.error('Error in GET /api/rfq/[id]/quotes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Submit a quote for an RFQ
export async function POST(request, { params }) {
  try {
    const { id: rawRfqId } = await params;
    const rfqId = resolveRfqUuid(rawRfqId);
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please log in to submit a quotation.' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    let profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return NextResponse.json({ error: 'User profile not found. Please log in again.' }, { status: 404 });

    // Dual Role Support: If currently 'buyer', upgrade to 'both'
    if (profile.role === 'buyer') {
      await supabaseAdmin.from('users').update({ role: 'both' }).eq('id', profile.id);
      profile.role = 'both';
    }

    const body = await request.json();
    const { 
      priceBeforeGst, 
      rawSupplierPrice,
      gstRate, 
      gstAmount, 
      quotedPrice, 
      platformFee, 
      supplierLocation, 
      deliveryDays, 
      notes,
      supplierPhone,
      supplierEmail,
      supplierGst,
      sector,
      category
    } = body;

    // Sync supplier contact & GST details into their profile in the database
    try {
      const suppUpdates = {};
      if (supplierPhone) suppUpdates.corporate_phone = supplierPhone;
      if (supplierEmail) suppUpdates.registered_email = supplierEmail;
      if (supplierGst) {
        suppUpdates.gst_number = supplierGst.trim().toUpperCase();
        suppUpdates.gst_verified = true;
      }
      if (Object.keys(suppUpdates).length > 0) {
        await supabaseAdmin
          .from('users')
          .update(suppUpdates)
          .eq('id', profile.id);
      }
    } catch (suppErr) {
      console.warn('Could not sync supplier GST/contact info to users table:', suppErr.message);
    }

    const activeGst = (supplierGst || profile.gst_number || '').trim().toUpperCase();

    // 0. Strict Validation: Person who posted the RFQ cannot give quotation on their own requirement
    const { data: targetRfq } = await supabaseAdmin
      .from('rfqs')
      .select('id, buyer_id, buyer_email, product_name')
      .eq('id', rfqId)
      .maybeSingle();

    if (targetRfq) {
      const isCreator = (
        (targetRfq.buyer_id && (targetRfq.buyer_id === profile.id || targetRfq.buyer_id === profile.firebase_uid)) ||
        (targetRfq.buyer_email && profile.registered_email && targetRfq.buyer_email.toLowerCase().trim() === profile.registered_email.toLowerCase().trim()) ||
        (targetRfq.buyer_email && user.email && targetRfq.buyer_email.toLowerCase().trim() === user.email.toLowerCase().trim())
      );

      if (isCreator) {
        return NextResponse.json({
          error: 'You cannot submit a quotation for your own RFQ requirement. Only verified third-party suppliers can submit quotes.'
        }, { status: 403 });
      }
    }

    // 1. Strict Validation: Only 1 quotation per supplier / same GST is permitted per RFQ order
    const { data: existingSupplierQuotes } = await supabaseAdmin
      .from('rfq_quotes')
      .select('id, quoted_price, status, created_at')
      .eq('rfq_id', rfqId)
      .eq('supplier_id', profile.id)
      .limit(1);

    if (existingSupplierQuotes && existingSupplierQuotes.length > 0) {
      return NextResponse.json({
        error: `You have already submitted a quotation for this RFQ (Quote #${existingSupplierQuotes[0].id.slice(0, 8).toUpperCase()}). Only 1 quotation per supplier/order is permitted.`
      }, { status: 400 });
    }

    // Check if any user with the same GST number has already quoted on this RFQ
    if (activeGst && activeGst !== 'N/A' && activeGst.length >= 10) {
      const { data: sameGstUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('gst_number', activeGst);

      if (sameGstUsers && sameGstUsers.length > 0) {
        const sameGstIds = sameGstUsers.map(u => u.id);
        const { data: gstQuotes } = await supabaseAdmin
          .from('rfq_quotes')
          .select('id')
          .eq('rfq_id', rfqId)
          .in('supplier_id', sameGstIds)
          .limit(1);

        if (gstQuotes && gstQuotes.length > 0) {
          return NextResponse.json({
            error: `A quotation with GSTIN ${activeGst} has already been submitted for this RFQ. Only 1 quotation per GST number is acceptable.`
          }, { status: 400 });
        }
      }
    }

    const quotePayload = {
      rfq_id: rfqId,
      supplier_id: profile.id,
      price_before_gst: Number(priceBeforeGst) || 0,
      gst_rate: Number(gstRate) || 18,
      gst_amount: Number(gstAmount) || 0,
      quoted_price: Number(quotedPrice) || 0,
      platform_fee: Number(platformFee) || 0,
      supplier_location: supplierLocation || 'India Warehouse',
      delivery_days: Number(deliveryDays) || 7,
      notes: notes || '',
      status: 'pending'
    };

    const { data: insertedQuote, error: quoteError } = await supabaseAdmin
      .from('rfq_quotes')
      .insert([quotePayload])
      .select()
      .single();

    if (quoteError) {
      console.error('Quote insert failed:', quoteError);
      return NextResponse.json({ error: quoteError.message }, { status: 500 });
    }

    // Sync sector/category to RFQ notes if provided
    if (sector || category) {
      const finalSector = sector || category;
      try {
        const { data: rfqRow } = await supabaseAdmin.from('rfqs').select('notes').eq('id', rfqId).single();
        if (rfqRow) {
          let currentNotes = rfqRow.notes || '';
          let meta = {};
          if (currentNotes.includes('<!--CONTACT_META:')) {
            const match = currentNotes.match(/<!--CONTACT_META:(.*?)-->/);
            if (match && match[1]) {
              try { meta = JSON.parse(match[1]); } catch {}
            }
          }
          if (!meta.sector || meta.sector !== finalSector) {
            meta.sector = finalSector;
            meta.category = finalSector;
            currentNotes = currentNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
            currentNotes = `<!--CONTACT_META:${JSON.stringify(meta)}-->${currentNotes ? `\n${currentNotes}` : ''}`.trim();
            await supabaseAdmin.from('rfqs').update({ notes: currentNotes }).eq('id', rfqId);
          }
        }
      } catch (catErr) {
        console.warn('Could not sync sector to RFQ on quote submission:', catErr.message);
      }
    }

    // Step 2: Auto-send Instant Quotation Notification Email to the RFQ Buyer
    try {
      const { data: rfq } = await supabaseAdmin
        .from('rfqs')
        .select(`
          *,
          users!rfqs_buyer_id_fkey(company_name, registered_email, corporate_phone)
        `)
        .eq('id', rfqId)
        .single();

      if (rfq) {
        const buyerEmailAddr = rfq.users?.registered_email || rfq.notes?.match(/Email:\s*([^\s,;]+)/i)?.[1];
        const buyerName = rfq.users?.company_name || 'Valued Buyer';
        const supplierName = profile.company_name || 'Verified Supplier';

        if (buyerEmailAddr) {
          const emailSubject = `⚡ New Verified Quote Received: ${rfq.title || rfq.product_name} - B2B India`;
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background: #0f172a; padding: 24px; color: white;">
                  <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #ffffff;">B2B India Trade Quotation</h1>
                  <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">New Competitive Offer for Your RFQ</p>
                </div>
                
                <div style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5;">
                    Dear <strong>${buyerName}</strong>,
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                    A verified supplier has submitted a direct deal quotation for your requirement <strong>${rfq.title || rfq.product_name}</strong>.
                  </p>

                  <div style="background: #f1f5f9; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Supplier:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${supplierName} (✓ GST VERIFIED)</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Quoted Rate:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #059669; font-size: 16px;">₹${(Number(quotedPrice) / (Number(rfq.quantity) || 1)).toFixed(2)} / ${rfq.unit || 'unit'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Total Value:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a; font-size: 16px;">₹${Number(quotedPrice).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Estimated Delivery:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${deliveryDays} Days</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; color: #64748b;">Dispatch City:</td>
                        <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">${supplierLocation}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="text-align: center; margin: 28px 0;">
                    <a href="https://b2bindia.site/dashboard/rfqs" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                      Review & Secure Deal with 10% Escrow
                    </a>
                  </div>

                  <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                    B2B India Trust Core: 100% Escrow Protected • Mediation Monitored
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

          console.log(`[RFQ Quote Alert] Sending email to buyer ${buyerEmailAddr} for RFQ ${rfqId}`);
        }
      }
    } catch (emailErr) {
      console.warn('Could not complete buyer notification email dispatch:', emailErr.message);
    }

    return NextResponse.json({ success: true, quote: insertedQuote }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/rfq/[id]/quotes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Update / Edit an existing quotation
export async function PUT(request, { params }) {
  try {
    const { id: rawRfqId } = await params;
    const rfqId = resolveRfqUuid(rawRfqId);
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
    if (!profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const body = await request.json();
    const {
      quoteId,
      priceBeforeGst,
      rawSupplierPrice,
      gstRate,
      gstAmount,
      quotedPrice,
      platformFee,
      supplierLocation,
      deliveryDays,
      notes,
      sector,
      category
    } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required for update.' }, { status: 400 });
    }

    const updatePayload = {
      price_before_gst: Number(priceBeforeGst) || 0,
      gst_rate: Number(gstRate) || 18,
      gst_amount: Number(gstAmount) || 0,
      quoted_price: Number(quotedPrice) || 0,
      platform_fee: Number(platformFee) || 0,
      supplier_location: supplierLocation || 'India Warehouse',
      delivery_days: Number(deliveryDays) || 7,
      notes: notes || ''
    };

    let query = supabaseAdmin
      .from('rfq_quotes')
      .update(updatePayload)
      .eq('id', quoteId);

    if (profile.role !== 'admin') {
      query = query.eq('supplier_id', profile.id);
    }

    const { data: updatedQuote, error: updateErr } = await query.select().single();

    if (updateErr) {
      console.error('Quote update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // If category/sector was updated, update RFQ metadata if needed
    if (sector || category) {
      const finalSector = sector || category;
      try {
        const { data: rfqRow } = await supabaseAdmin.from('rfqs').select('notes').eq('id', rfqId).single();
        if (rfqRow) {
          let currentNotes = rfqRow.notes || '';
          let meta = {};
          if (currentNotes.includes('<!--CONTACT_META:')) {
            const match = currentNotes.match(/<!--CONTACT_META:(.*?)-->/);
            if (match && match[1]) {
              try { meta = JSON.parse(match[1]); } catch {}
            }
          }
          meta.sector = finalSector;
          meta.category = finalSector;
          currentNotes = currentNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
          currentNotes = `${currentNotes}\n<!--CONTACT_META:${JSON.stringify(meta)}-->`.trim();
          await supabaseAdmin.from('rfqs').update({ notes: currentNotes }).eq('id', rfqId);
        }
      } catch (catErr) {
        console.warn('Could not sync sector to RFQ notes:', catErr.message);
      }
    }

    return NextResponse.json({ success: true, quote: updatedQuote });
  } catch (error) {
    console.error('Error in PUT /api/rfq/[id]/quotes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Delete a quotation
export async function DELETE(request, { params }) {
  try {
    const { id: rawRfqId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');
    if (!profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const url = new URL(request.url);
    const quoteId = url.searchParams.get('quoteId');

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required.' }, { status: 400 });
    }

    let delQuery = supabaseAdmin
      .from('rfq_quotes')
      .delete()
      .eq('id', quoteId);

    if (profile.role !== 'admin') {
      delQuery = delQuery.eq('supplier_id', profile.id);
    }

    const { error: delErr } = await delQuery;
    if (delErr) throw delErr;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/rfq/[id]/quotes:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
