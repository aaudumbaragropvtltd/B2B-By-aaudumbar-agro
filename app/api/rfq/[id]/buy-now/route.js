import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { resolveAuthenticatedUser } from '@/utils/userResolver';

export async function POST(request, { params }) {
  try {
    const { id: rfqId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: { get(name) { return cookieStore.get(name)?.value; } }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please log in to purchase.' }, { status: 401 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const profile = await resolveAuthenticatedUser(supabaseAdmin, user, 'both');

    if (!profile) return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });

    const body = await request.json();
    const { quoteId, deliveryAddress } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required.' }, { status: 400 });
    }

    // 1. Fetch RFQ & Quote
    const { data: rfq, error: rfqError } = await supabaseAdmin
      .from('rfqs')
      .select('*')
      .eq('id', rfqId)
      .single();

    if (rfqError || !rfq) {
      return NextResponse.json({ error: 'RFQ not found.' }, { status: 404 });
    }

    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('rfq_quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 });
    }

    // 2. Check if an order has already been placed for this RFQ or Quote
    const { data: existingOrders } = await supabaseAdmin
      .from('trade_orders')
      .select('id, total_contract_value, advance_paid_10, balance_due_90, current_state')
      .or(`buyer_notes.ilike.%[RFQ:${rfqId}]%,buyer_notes.ilike.%[QUOTE:${quoteId}]%`)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      const existingOrder = existingOrders[0];
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'Order contract already exists for this quotation.',
        orderId: existingOrder.id,
        orderNumber: existingOrder.id.slice(0, 8).toUpperCase(),
        productName: rfq.product_name,
        totalContractValue: Number(existingOrder.total_contract_value),
        advancePaid: Number(existingOrder.advance_paid_10),
        balanceDue: Number(existingOrder.balance_due_90),
        deliveryDays: quote.delivery_days || 7,
        supplierLocation: quote.supplier_location
      });
    }

    // 3. Resolve best matching product_id for the trade_orders foreign key
    let resolvedProductId = null;
    try {
      const firstWord = rfq.product_name.split(' ')[0];
      const { data: matchedProds } = await supabaseAdmin
        .from('products')
        .select('id')
        .or(`title.ilike.%${rfq.product_name}%,title.ilike.%${firstWord}%`)
        .limit(1);
      if (matchedProds && matchedProds.length > 0) {
        resolvedProductId = matchedProds[0].id;
      }
    } catch (e) {
      // ignore
    }

    if (!resolvedProductId) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id')
        .limit(1);
      resolvedProductId = products && products.length > 0 ? products[0].id : null;
    }

    const quantity = Number(rfq.quantity) || 1;
    const totalContractValue = Number(quote.quoted_price || 0) > 0
      ? Number(quote.quoted_price)
      : (Number(quote.price_before_gst || 0) * quantity) + Number(quote.gst_amount || 0);

    const unitPrice = quantity > 0 ? (totalContractValue / quantity) : totalContractValue;
    const taxRate = Number(quote.gst_rate) || 18;
    const taxAmount = Number(quote.gst_amount || 0) > 0
      ? Number(quote.gst_amount)
      : Math.round((totalContractValue * taxRate) / (100 + taxRate));
    const subtotal = totalContractValue - taxAmount;
    const advance10 = Math.round(totalContractValue * 0.10);

    // 4. Create Trade Order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('trade_orders')
      .insert([{
        buyer_id: profile.id,
        supplier_id: quote.supplier_id,
        product_id: resolvedProductId,
        quantity: quantity,
        unit_label: rfq.unit || 'units',
        agreed_unit_price: unitPrice,
        logistics_cost: 0,
        tax_rate_percent: taxRate,
        tax_amount: taxAmount,
        subtotal: subtotal,
        total_contract_value: totalContractValue,
        current_state: 'price_locked_10',
        estimated_delivery_days: Number(quote.delivery_days) || 7,
        buyer_notes: `Accepted RFQ: ${rfq.product_name}. [RFQ:${rfqId}] [QUOTE:${quoteId}]. Delivery to: ${deliveryAddress || rfq.destination || 'Pending'}`
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create trade order:', orderError);
      throw new Error(orderError.message || 'Failed to generate escrow trade contract.');
    }

    // 5. Record 10% advance in platform financial ledger
    try {
      await supabaseAdmin
        .from('platform_ledger')
        .insert([{
          order_id: order.id,
          entry_type: 'advance_10_percent',
          amount: advance10,
          from_entity_id: profile.id,
          description: `10% Escrow Advance locked for ${rfq.product_name} (Order #${order.id.slice(0, 8)})`
        }]);
    } catch (ledgerErr) {
      console.warn('Ledger recording notice:', ledgerErr.message);
    }

    // 6. Update quote status to accepted and rfq to fulfilled
    await supabaseAdmin
      .from('rfq_quotes')
      .update({ status: 'accepted' })
      .eq('id', quoteId);

    await supabaseAdmin
      .from('rfqs')
      .update({ status: 'fulfilled' })
      .eq('id', rfqId);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      productName: rfq.product_name,
      totalContractValue,
      advancePaid: advance10,
      balanceDue: Math.round(totalContractValue * 0.90),
      deliveryDays: quote.delivery_days || 7,
      supplierLocation: quote.supplier_location
    });
  } catch (error) {
    console.error('Error processing RFQ Buy Now:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
