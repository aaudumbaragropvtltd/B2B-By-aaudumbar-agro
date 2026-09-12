-- ============================================================================
-- LEGACY SETTLEMENT RPC (DEPRECATED)
-- ============================================================================
-- This function is superseded by settle_order() in migration_settlement.sql
-- Kept for backwards compatibility but should not be called directly.
-- Use settle_order() for new settlement flows.
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_order_settlement(
  p_order_id UUID,
  p_gross DECIMAL(12,2),
  p_fee DECIMAL(12,2),
  p_payout DECIMAL(12,2),
  p_accommodation BOOLEAN,
  p_signature VARCHAR
) RETURNS VOID AS $$
BEGIN
  -- 1. Update order status to settled using correct column name
  UPDATE trade_orders
  SET 
    current_state = 'settled',
    settled_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_order_id;

  -- 2. Insert dock payment ledger entry
  INSERT INTO platform_ledger (order_id, entry_type, amount, from_entity_id, to_entity_id, payment_reference, description)
  SELECT
    p_order_id,
    'dock_final_90_percent',
    p_gross,
    buyer_id,
    NULL,
    p_signature,
    'Final dock payment (legacy RPC)'
  FROM trade_orders WHERE id = p_order_id;

  -- 3. Insert platform commission
  INSERT INTO platform_ledger (order_id, entry_type, amount, description)
  VALUES (p_order_id, 'platform_commission', p_fee, 'Platform commission (legacy RPC)');

  -- 4. Insert supplier payout
  INSERT INTO platform_ledger (order_id, entry_type, amount, from_entity_id, to_entity_id, description)
  SELECT
    p_order_id,
    'supplier_payout',
    p_payout,
    NULL,
    supplier_id,
    'Supplier net payout (legacy RPC)'
  FROM trade_orders WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
