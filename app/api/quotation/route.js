// ============================================================================
// QUOTATION API ROUTE
// ============================================================================
// Generates instant quotations with logistics cost calculation,
// GST computation, and commission-adjusted pricing.
// Commission rates: Agriculture 2%, Textile 7%, Others 5%.
// ============================================================================

import { NextResponse } from 'next/server';


/**
 * Calculate logistics cost based on weight.
 * Calculation: cost = weightKg * 2.3
 */
function calculateLogisticsCost(weightKg) {
  const cost = weightKg * 2.3;
  return Math.round(cost);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      productId,
      quantity,
      weightKg,
      distanceKm: inputDistanceKm,
    } = body;

    // Validate required fields
    if (!productId || !quantity || weightKg === undefined || inputDistanceKm === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, quantity, weightKg, distanceKm' },
        { status: 400 }
      );
    }

    // Attempt to fetch product and supplier from Supabase
    let product = null;
    let supplier = null;

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createAdminClient } = await import('@/services/supabaseServer');
        const supabase = createAdminClient();

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, supplier_id(*)')
          .eq('id', productId)
          .single();

        if (!productError && productData) {
          product = productData;
          supplier = productData.supplier_id;
        }
      }
    } catch (e) {
      // Supabase not configured
    }

    // Fallback demo calculation if Supabase isn't configured
    if (!product) {
      const demoPrice = 121; // ₹/kg (HDPE with 5% commission baked in)
      const subtotal = quantity * demoPrice;
      const distanceKm = inputDistanceKm;
      const logisticsCost = calculateLogisticsCost(weightKg);
      const taxRate = 18;
      const taxAmount = (subtotal + logisticsCost) * (taxRate / 100);
      
      const baseTotal = subtotal + logisticsCost + taxAmount;
      const platformFee = 0; // Commission baked into base price
      const total = baseTotal + platformFee;

      return NextResponse.json({
        quotation: {
          productId: productId,
          unitPrice: demoPrice,
          unitLabel: 'unit',
          quantity: quantity,
          weightKg: weightKg,
          subtotal: subtotal,
          logisticsCost: logisticsCost,
          distanceKm: distanceKm,
          taxRatePercent: taxRate,
          taxAmount: Math.round(taxAmount),
          platformFee: platformFee,
          totalContractValue: Math.round(total),
          advanceRequired10: Math.round(total * 0.1),
          balanceDue90: Math.round(total * 0.9),
          estimatedDeliveryDays: 7,
          validForHours: 48,
          mode: 'demo',
        },
      });
    }

    // Real calculation with Supabase data
    // Commission is already baked into base_price_per_unit in the database
    const unitPrice = Number(product.base_price_per_unit);
    const subtotal = quantity * unitPrice;
    const distanceKm = inputDistanceKm;

    const logisticsCost = calculateLogisticsCost(weightKg);
    const taxRate = body.taxRate || 18;
    const taxableAmount = subtotal + logisticsCost;
    const taxAmount = taxableAmount * (taxRate / 100);
    const totalContractValue = taxableAmount + taxAmount;
    const platformFee = 0; // Commission baked into base price

    // Estimate delivery based on distance
    const estimatedDeliveryDays = distanceKm < 200 ? 3 : distanceKm < 500 ? 5 : distanceKm < 1000 ? 7 : 10;

    const quotation = {
      productId: product.id,
      productTitle: product.title,
      supplierId: supplier.id,
      supplierName: supplier.company_name,
      unitPrice: unitPrice,
      unitLabel: product.unit_label,
      quantity: quantity,
      weightKg: weightKg,
      subtotal: subtotal,
      logisticsCost: logisticsCost,
      distanceKm: Math.round(distanceKm),
      taxRatePercent: taxRate,
      taxAmount: Math.round(taxAmount),
      platformFee: platformFee,
      totalContractValue: Math.round(totalContractValue),
      advanceRequired10: Math.round(totalContractValue * 0.1),
      balanceDue90: Math.round(totalContractValue * 0.9),
      estimatedDeliveryDays: estimatedDeliveryDays,
      validForHours: 48,
      isStale: product.is_stale,
      mode: 'live',
    };

    return NextResponse.json({ quotation });
  } catch (error) {
    console.error('Quotation generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quotation' },
      { status: 500 }
    );
  }
}
