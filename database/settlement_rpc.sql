CREATE OR REPLACE FUNCTION execute_order_settlement(
  p_order_id UUID,
  p_gross DECIMAL(12,2),
  p_fee DECIMAL(12,2),
  p_payout DECIMAL(12,2),
  p_accommodation BOOLEAN,
  p_signature VARCHAR
) RETURNS VOID AS $$
BEGIN
  -- 1. Mutate primary order record status to settled
  UPDATE trade_orders
  SET 
    stage = 'settled',
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb), 
      '{final_settlement}', 
      jsonb_build_object('tx', p_signature, 'accommodation_granted', p_accommodation)
    )
  WHERE id = p_order_id;

  -- 2. Insert explicit balance audit records inside platform ledger logs
  INSERT INTO platform_ledger (order_id, gross_amount, platform_fee, supplier_payout)
  VALUES (p_order_id, p_gross, p_fee, p_payout);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
