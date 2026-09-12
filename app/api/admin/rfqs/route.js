import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // 1. Fetch RFQs
    const { data: rfqs, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select(`
        *,
        users!rfqs_buyer_id_fkey ( id, company_name, registered_email, corporate_phone, phone_number, whatsapp_number, gst_number, city, state, warehouse_address )
      `)
      .order('created_at', { ascending: false });

    if (rfqError) {
      console.warn('Admin RFQs query with join failed, falling back to basic query:', rfqError.message);
      const { data: basicRfqs, error: bErr } = await supabaseAdmin
        .from('rfqs')
        .select('*')
        .order('created_at', { ascending: false });
      if (bErr) throw bErr;
    }

    const rfqList = rfqs || [];
    const rfqIds = rfqList.map(r => r.id);

    // 2. Fetch all quotes for these RFQs
    let quotesByRfq = new Map();
    if (rfqIds.length > 0) {
      const { data: quotes, error: quotesError } = await supabaseAdmin
        .from('rfq_quotes')
        .select('*')
        .in('rfq_id', rfqIds)
        .order('created_at', { ascending: false });

      if (!quotesError && quotes && quotes.length > 0) {
        const supplierIds = [...new Set(quotes.map(q => q.supplier_id).filter(Boolean))];
        const { data: suppliers } = await supabaseAdmin
          .from('users')
          .select('id, company_name, registered_email, corporate_phone, phone, gst_number, pan_number, warehouse_address, city, state, pincode, verification_level, status')
          .in('id', supplierIds);

        const supplierMap = new Map((suppliers || []).map(s => [s.id, s]));

        quotes.forEach(q => {
          const supp = supplierMap.get(q.supplier_id) || {};
          const enrichedQuote = {
            ...q,
            supplier_name: supp.company_name || 'Verified Supplier',
            contact_person: supp.company_name || 'Authorized Signatory',
            phone: supp.corporate_phone || supp.phone || q.supplier_phone || 'Contact on file',
            email: supp.registered_email || q.supplier_email || 'Email on file',
            godown_address: supp.warehouse_address || q.supplier_location || 'Warehouse on file',
            city: supp.city || q.supplier_location || '',
            state: supp.state || '',
            pincode: supp.pincode || '',
            gstin: supp.gst_number || q.supplier_gst || 'GST Verified',
            pan: supp.pan_number || 'N/A',
            verification_level: supp.verification_level || 'Gold',
            verification_status: supp.status || 'active'
          };

          if (!quotesByRfq.has(q.rfq_id)) {
            quotesByRfq.set(q.rfq_id, []);
          }
          quotesByRfq.get(q.rfq_id).push(enrichedQuote);
        });
      }
    }

    // 3. Attach quotes array, quote count, and extract buyer phone/alt phone/GST
    const enrichedRfqs = rfqList.map(rfq => {
      const quotes = quotesByRfq.get(rfq.id) || [];
      
      let parsedPhone = rfq.buyer_phone || rfq.users?.corporate_phone || rfq.users?.phone_number || '';
      let parsedAltPhone = rfq.buyer_alternate_phone || rfq.users?.phone_number || rfq.users?.whatsapp_number || '';
      let parsedEmail = rfq.buyer_email || rfq.users?.registered_email || '';
      let parsedGst = rfq.users?.gst_number || '';
      let parsedGstRate = rfq.gst_rate !== undefined && rfq.gst_rate !== null ? Number(rfq.gst_rate) : 18;
      let cleanNotes = rfq.notes || '';

      let parsedSector = rfq.sector || rfq.category || null;

      if (rfq.notes && rfq.notes.includes('<!--CONTACT_META:')) {
        try {
          const match = rfq.notes.match(/<!--CONTACT_META:(.*?)-->/);
          if (match && match[1]) {
            const meta = JSON.parse(match[1]);
            if (meta.phone) parsedPhone = meta.phone;
            if (meta.alt_phone) parsedAltPhone = meta.alt_phone;
            if (meta.email) parsedEmail = meta.email;
            if (meta.gst) parsedGst = meta.gst;
            if (meta.gst_rate !== undefined) parsedGstRate = Number(meta.gst_rate);
            if (meta.sector || meta.category) parsedSector = meta.sector || meta.category;
            cleanNotes = rfq.notes.replace(/<!--CONTACT_META:.*?-->/, '').trim();
          }
        } catch (e) {
          console.warn('Error parsing CONTACT_META from notes:', e);
        }
      }

      if (!parsedSector) {
        const pName = (rfq.product_name || '').toLowerCase();
        if (pName.includes('rice') || pName.includes('wheat') || pName.includes('sugar') || pName.includes('cardamom') || pName.includes('onion') || pName.includes('spice')) {
          parsedSector = 'food-agriculture';
        } else if (pName.includes('bolt') || pName.includes('fastener') || pName.includes('motor') || pName.includes('lathe') || pName.includes('machinery')) {
          parsedSector = 'industrial-machinery';
        } else if (pName.includes('cement') || pName.includes('tmt') || pName.includes('steel') || pName.includes('brick')) {
          parsedSector = 'building-construction';
        } else if (pName.includes('yarn') || pName.includes('fabric') || pName.includes('cotton') || pName.includes('garment')) {
          parsedSector = 'textiles-fabrics';
        } else if (pName.includes('solar') || pName.includes('inverter')) {
          parsedSector = 'solar-renewable';
        } else if (pName.includes('hdpe') || pName.includes('polymer') || pName.includes('plastic')) {
          parsedSector = 'plastic-products';
        } else if (pName.includes('pharma') || pName.includes('drug') || pName.includes('intermediate') || pName.includes('tablet')) {
          parsedSector = 'pharma-drugs';
        } else {
          parsedSector = 'food-agriculture';
        }
      }

      if (parsedAltPhone === parsedPhone) {
        parsedAltPhone = '';
      }

      return {
        ...rfq,
        sector: parsedSector,
        category: parsedSector,
        gst_rate: parsedGstRate,
        buyer_phone: parsedPhone,
        buyer_alternate_phone: parsedAltPhone,
        buyer_email: parsedEmail,
        buyer_gst: parsedGst,
        notes: cleanNotes,
        quotes: quotes,
        quote_count: quotes.length
      };
    });

    let filtered = enrichedRfqs;
    if (search) {
      const q = search.toLowerCase();
      filtered = enrichedRfqs.filter(rfq => 
        (rfq.product_name || '').toLowerCase().includes(q) ||
        (rfq.status || '').toLowerCase().includes(q) ||
        (rfq.sector || '').toLowerCase().includes(q) ||
        (rfq.users?.company_name || '').toLowerCase().includes(q) ||
        rfq.quotes.some(quote => (quote.supplier_name || '').toLowerCase().includes(q))
      );
    }

    return NextResponse.json({ rfqs: filtered });
  } catch (error) {
    console.error('Error in Admin RFQs GET:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error', rfqs: [] }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { rfqId, updates } = await request.json();

    if (!rfqId || !updates) {
      return NextResponse.json({ error: 'Missing rfqId or updates' }, { status: 400 });
    }

    // Real RFQ table columns whitelist
    const RFQ_COLUMNS = new Set([
      'product_name', 'quantity', 'unit', 'target_price', 'destination',
      'deadline', 'notes', 'buyer_email', 'status'
    ]);

    const sanitizedUpdates = {};

    // 1. Fetch existing notes to maintain metadata
    const { data: existing } = await supabaseAdmin.from('rfqs').select('notes').eq('id', rfqId).single();
    let notes = existing?.notes || '';
    let meta = {};
    if (notes.includes('<!--CONTACT_META:')) {
      try {
        const match = notes.match(/<!--CONTACT_META:(.*?)-->/);
        if (match && match[1]) meta = JSON.parse(match[1]);
      } catch(e) {}
    }

    // 2. Update metadata fields (sector, category, gst_rate, buyer info)
    if (updates.gst_rate !== undefined) meta.gst_rate = Number(updates.gst_rate);
    if (updates.sector) { meta.sector = updates.sector; meta.category = updates.sector; }
    if (updates.category) { meta.category = updates.category; meta.sector = updates.category; }
    if (updates.buyer_phone) meta.phone = updates.buyer_phone;
    if (updates.buyer_alternate_phone) meta.alt_phone = updates.buyer_alternate_phone;
    if (updates.buyer_gst) meta.gst = updates.buyer_gst;

    // Clean notes body
    const incomingNotes = updates.notes !== undefined ? updates.notes : notes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
    const cleanNotes = incomingNotes.replace(/<!--CONTACT_META:.*?-->/g, '').trim();
    
    sanitizedUpdates.notes = `<!--CONTACT_META:${JSON.stringify(meta)}-->${cleanNotes ? `\n${cleanNotes}` : ''}`.trim();

    // 3. Map sanitized top-level columns
    if (updates.product_name !== undefined) sanitizedUpdates.product_name = updates.product_name;
    if (updates.quantity !== undefined) sanitizedUpdates.quantity = parseInt(updates.quantity, 10) || 1;
    if (updates.unit !== undefined) sanitizedUpdates.unit = updates.unit;
    if (updates.target_price !== undefined) sanitizedUpdates.target_price = parseFloat(updates.target_price) || 0;
    if (updates.destination !== undefined) sanitizedUpdates.destination = updates.destination;
    if (updates.deadline !== undefined) sanitizedUpdates.deadline = updates.deadline || null;
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.buyer_email !== undefined) sanitizedUpdates.buyer_email = updates.buyer_email;

    const { data, error } = await supabaseAdmin
      .from('rfqs')
      .update(sanitizedUpdates)
      .eq('id', rfqId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, rfq: data });
  } catch (error) {
    console.error('Error in Admin RFQs PATCH:', error);
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
    let id = searchParams.get('id') || searchParams.get('rfqId');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id || body.rfqId;
      } catch (e) {}
    }

    if (!id) return NextResponse.json({ error: 'RFQ ID is required' }, { status: 400 });

    // 1. Delete all quotes referencing this RFQ first to prevent FK constraint failure
    try {
      await supabaseAdmin
        .from('rfq_quotes')
        .delete()
        .eq('rfq_id', id);
    } catch (qErr) {
      console.warn('rfq_quotes delete notice:', qErr.message);
    }

    // 2. Delete the RFQ itself
    const { error } = await supabaseAdmin
      .from('rfqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting RFQ from Supabase:', error);
      throw error;
    }

    return NextResponse.json({ success: true, message: 'RFQ and associated quotations successfully deleted' });
  } catch (error) {
    console.error('Error in Admin RFQs DELETE:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
