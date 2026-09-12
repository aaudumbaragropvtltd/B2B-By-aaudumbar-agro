// ============================================================================
// SETTLEMENT SERVICE
// ============================================================================
// Orchestrates the full escrow settlement flow:
// 1. Compute commission based on sector (2%/5%/7%)
// 2. Calculate supplier net payout
// 3. Execute atomic settlement via Supabase RPC
// 4. Trigger notifications to buyer + supplier
// ============================================================================

import { getCommissionRate } from '@/utils/commissionUtils';

/**
 * Compute the full settlement breakdown for an order.
 *
 * @param {Object} order - The trade_order record (with product + sector info)
 * @param {string} sectorSlug - The sector slug for commission rate lookup
 * @returns {Object} Settlement breakdown
 */
export function computeSettlement(order, sectorSlug) {
  const totalContractValue = Number(order.total_contract_value);
  const advancePaid = Number(order.advance_paid_10) || totalContractValue * 0.10;
  const dockPaymentDue = Number(order.balance_due_90) || totalContractValue * 0.90;

  // Commission is calculated on the TOTAL contract value
  const commissionRate = getCommissionRate(sectorSlug);
  const commissionRatePercent = commissionRate * 100;
  const commissionAmount = Math.round(totalContractValue * commissionRate * 100) / 100;

  // Supplier receives: total - commission
  const supplierPayout = Math.round((totalContractValue - commissionAmount) * 100) / 100;

  return {
    totalContractValue,
    advancePaid,
    dockPaymentDue,
    commissionRate,
    commissionRatePercent,
    commissionAmount,
    supplierPayout,
    platformRevenue: commissionAmount,
    // Breakdown for invoice
    breakdown: {
      subtotal: Number(order.subtotal) || 0,
      logistics: Number(order.logistics_cost) || 0,
      tax: Number(order.tax_amount) || 0,
      total: totalContractValue,
      advance: advancePaid,
      dockBalance: dockPaymentDue,
      commission: commissionAmount,
      supplierNet: supplierPayout,
    },
  };
}

/**
 * Execute the full settlement via Supabase RPC.
 * This atomically updates the order, creates 3 ledger entries, and records the settlement.
 *
 * @param {Object} supabaseAdmin - Supabase admin client (bypasses RLS)
 * @param {Object} params
 * @param {string} params.orderId - Trade order UUID
 * @param {number} params.dockPaymentAmount - 90% dock payment amount
 * @param {number} params.commissionRate - Commission rate percent (e.g., 5.00)
 * @param {number} params.commissionAmount - Computed commission amount
 * @param {number} params.supplierPayout - Net supplier payout
 * @param {string} params.razorpayPaymentId - Razorpay payment ID for the dock payment
 * @param {string} params.buyerId - Buyer UUID
 * @param {string} params.supplierId - Supplier UUID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function executeSettlement(supabaseAdmin, {
  orderId,
  dockPaymentAmount,
  commissionRate,
  commissionAmount,
  supplierPayout,
  razorpayPaymentId,
  buyerId,
  supplierId,
}) {
  try {
    const { error } = await supabaseAdmin.rpc('settle_order', {
      p_order_id: orderId,
      p_dock_payment_amount: dockPaymentAmount,
      p_commission_rate: commissionRate,
      p_commission_amount: commissionAmount,
      p_supplier_payout: supplierPayout,
      p_razorpay_payment_id: razorpayPaymentId,
      p_buyer_id: buyerId,
      p_supplier_id: supplierId,
    });

    if (error) {
      console.error('Settlement RPC error:', error);
      return { success: false, error: error.message };
    }

    // Record in order_timeline
    await supabaseAdmin.from('order_timeline').insert({
      order_id: orderId,
      from_state: 'warehouse_loading',
      to_state: 'settled',
      action: 'dock_payment_settled',
      notes: `Order settled. Commission: ${commissionRate}% (₹${commissionAmount}). Supplier payout: ₹${supplierPayout}`,
      metadata: {
        razorpay_payment_id: razorpayPaymentId,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        supplier_payout: supplierPayout,
      },
    });

    return { success: true };
  } catch (err) {
    console.error('Settlement execution error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Record an order state change in the timeline.
 *
 * @param {Object} supabaseAdmin - Supabase admin client
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.fromState
 * @param {string} params.toState
 * @param {string} params.action
 * @param {string} params.performedBy - User UUID
 * @param {string} params.performedByRole
 * @param {string} [params.notes]
 * @param {Object} [params.metadata]
 */
export async function recordTimelineEvent(supabaseAdmin, {
  orderId,
  fromState,
  toState,
  action,
  performedBy,
  performedByRole,
  notes = '',
  metadata = {},
}) {
  try {
    await supabaseAdmin.from('order_timeline').insert({
      order_id: orderId,
      from_state: fromState,
      to_state: toState,
      action,
      performed_by: performedBy,
      performed_by_role: performedByRole,
      notes,
      metadata,
    });
  } catch (err) {
    console.error('Failed to record timeline event:', err);
    // Non-critical — don't throw
  }
}
