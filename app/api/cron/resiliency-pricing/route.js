// ============================================================================
// 7-DAY RESILIENCY PRICING ENGINE (CRON)
// ============================================================================
// Autonomous multi-supplier pricing recovery engine.
// Runs on a 7-day schedule via external cron trigger (Cron-Job.org).
//
// Process:
// 1. Identify products with last_price_update > 7 days ago
// 2. Flag them as stale
// 3. Search for alternative active suppliers with matching products
// 4. Map verified spot-rates from responsive suppliers
// 5. Log all operations for audit
//
// Authorization: Bearer token (CRON_SECRET) required.
// ============================================================================

import { NextResponse } from 'next/server';
import { sendWhatsAppMessage, WhatsAppTemplates } from '@/services/whatsapp';

export async function GET(request) {
  try {
    // ── Authorization Check ──
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_TOKEN}`) {
      return new NextResponse('Unauthorized: Invalid cron secret', { status: 401 });
    }

    // ── Check Supabase availability ──
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        message: 'Supabase not configured. Resiliency engine skipped.',
        mode: 'demo',
      });
    }

    const { createAdminClient } = await import('@/services/supabaseServer');
    const supabase = createAdminClient();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── Step 1: Fetch products not updated in 7+ days ──
    const { data: staleProducts, error: fetchError } = await supabase
      .from('products')
      .select('id, supplier_id, sector_id, title, base_price_per_unit, unit_label')
      .lt('last_price_update', sevenDaysAgo.toISOString())
      .eq('is_stale', false)
      .eq('is_active', true);

    if (fetchError) throw fetchError;

    if (!staleProducts || staleProducts.length === 0) {
      return NextResponse.json({
        message: 'System catalog resilient. Zero stale records detected.',
        productsScanned: 0,
        timestamp: new Date().toISOString(),
      });
    }

    const processingLog = [];

    for (const product of staleProducts) {
      // ── Step 2: Flag as stale ──
      await supabase
        .from('products')
        .update({ is_stale: true })
        .eq('id', product.id);

      // ── Step 3: Search for fallback suppliers ──
      // Match by: same sector, same product title, not stale, different supplier
      const { data: fallbackProduct, error: fallbackError } = await supabase
        .from('products')
        .select('id, base_price_per_unit, supplier_id, last_price_update')
        .eq('sector_id', product.sector_id)
        .eq('title', product.title)
        .eq('is_stale', false)
        .eq('is_active', true)
        .neq('supplier_id', product.supplier_id)
        .order('last_price_update', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!fallbackError && fallbackProduct) {
        // ── Step 4: Apply fallback spot-rate ──
        await supabase
          .from('products')
          .update({
            base_price_per_unit: fallbackProduct.base_price_per_unit,
            last_price_update: new Date().toISOString(),
            is_stale: false, // Re-activate with fallback price
            stale_fallback_supplier_id: fallbackProduct.supplier_id,
          })
          .eq('id', product.id);

        processingLog.push({
          productId: product.id,
          productTitle: product.title,
          originalPrice: product.base_price_per_unit,
          fallbackPrice: fallbackProduct.base_price_per_unit,
          fallbackSupplierId: fallbackProduct.supplier_id,
          status: 'FALLBACK_APPLIED',
          message: `Price updated from ₹${product.base_price_per_unit}/${product.unit_label} to ₹${fallbackProduct.base_price_per_unit}/${product.unit_label} via fallback supplier`,
        });

        // Send WhatsApp notification to original supplier requesting price update
        const { data: origSupplier } = await supabase.from('users').select('company_name, whatsapp_number').eq('id', product.supplier_id).single();
        if (origSupplier?.whatsapp_number) {
          await sendWhatsAppMessage(
            origSupplier.whatsapp_number,
            WhatsAppTemplates.SUPPLIER_PRICE_ALERT(origSupplier.company_name, product.title, product.base_price_per_unit, fallbackProduct.base_price_per_unit)
          );
        }
        
        // Send WhatsApp notification to fallback supplier confirming rate usage
        const { data: fallSupplier } = await supabase.from('users').select('company_name, whatsapp_number').eq('id', fallbackProduct.supplier_id).single();
        if (fallSupplier?.whatsapp_number) {
          await sendWhatsAppMessage(
            fallSupplier.whatsapp_number,
            WhatsAppTemplates.FALLBACK_SUPPLIER_ALERT(fallSupplier.company_name, product.title, 1000, fallbackProduct.base_price_per_unit)
          );
        }

      } else {
        // No fallback available — product stays stale
        processingLog.push({
          productId: product.id,
          productTitle: product.title,
          status: 'FLAGGED_STALE_NO_FALLBACK',
          message: 'No alternative active supplier found matching product constraints. Product remains stale.',
        });

        // Send WhatsApp alert to admin for manual intervention
        await sendWhatsAppMessage(
          process.env.ADMIN_WHATSAPP_NUMBER || '+91-9999999999',
          WhatsAppTemplates.ADMIN_MANUAL_INTERVENTION(`PROD-${product.id}`, 'Stale product with no fallback supplier')
        );
      }
    }

    // ── Summary ──
    const summary = {
      timestamp: new Date().toISOString(),
      totalScanned: staleProducts.length,
      fallbacksApplied: processingLog.filter((l) => l.status === 'FALLBACK_APPLIED').length,
      remainingStale: processingLog.filter((l) => l.status === 'FLAGGED_STALE_NO_FALLBACK').length,
      processingLog: processingLog,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Resiliency pricing engine critical failure:', error);
    return NextResponse.json(
      { error: error.message || 'Resiliency engine execution failed' },
      { status: 500 }
    );
  }
}
