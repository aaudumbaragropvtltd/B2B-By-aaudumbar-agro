-- ============================================================================
-- MIGRATION: SETTLEMENT, PAYMENT GATEWAY & ORDER TIMELINE
-- ============================================================================
-- Adds Razorpay payment columns to trade_orders, creates order_timeline
-- audit table, and fixes the settle_order RPC function.
-- ============================================================================

-- 1. Add payment gateway columns to trade_orders
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS razorpay_order_id_advance VARCHAR(255);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id_advance VARCHAR(255);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS razorpay_order_id_dock VARCHAR(255);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id_dock VARCHAR(255);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS scheduled_loading_date DATE;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS actual_loading_date DATE;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS settled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS commission_rate_percent NUMERIC(5, 2);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12, 2);
ALTER TABLE trade_orders ADD COLUMN IF NOT EXISTS supplier_payout_amount NUMERIC(12, 2);

-- Index for Razorpay order lookups
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_advance ON trade_orders(razorpay_order_id_advance);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_dock ON trade_orders(razorpay_order_id_dock);

-- 2. Order Timeline — immutable audit trail for every state change
CREATE TABLE IF NOT EXISTS order_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by_role VARCHAR(20),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_order ON order_timeline(order_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created ON order_timeline(created_at DESC);

-- RLS for order_timeline
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline visible to order parties"
    ON order_timeline FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM trade_orders
            WHERE buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
               OR supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

-- Admins can read all timelines
CREATE POLICY "Admins read all timelines"
    ON order_timeline FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND role = 'admin'
        )
    );

-- Service role can insert timelines
CREATE POLICY "Service can insert timelines"
    ON order_timeline FOR INSERT
    WITH CHECK (true);

-- 3. Fixed settle_order RPC function
-- Atomically settles an order: updates state, inserts 3 ledger entries
CREATE OR REPLACE FUNCTION settle_order(
    p_order_id UUID,
    p_dock_payment_amount NUMERIC(12,2),
    p_commission_rate NUMERIC(5,2),
    p_commission_amount NUMERIC(12,2),
    p_supplier_payout NUMERIC(12,2),
    p_razorpay_payment_id VARCHAR(255),
    p_buyer_id UUID,
    p_supplier_id UUID
) RETURNS VOID AS $$
BEGIN
    -- 1. Update trade_orders to settled
    UPDATE trade_orders
    SET
        current_state = 'settled',
        settled_at = CURRENT_TIMESTAMP,
        razorpay_payment_id_dock = p_razorpay_payment_id,
        commission_rate_percent = p_commission_rate,
        commission_amount = p_commission_amount,
        supplier_payout_amount = p_supplier_payout,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;

    -- 2. Ledger entry: 90% dock payment (buyer → platform)
    INSERT INTO platform_ledger (order_id, entry_type, amount, from_entity_id, to_entity_id, payment_reference, description)
    VALUES (
        p_order_id,
        'dock_final_90_percent',
        p_dock_payment_amount,
        p_buyer_id,
        NULL,
        p_razorpay_payment_id,
        'Final 90% dock payment received from buyer'
    );

    -- 3. Ledger entry: platform commission
    INSERT INTO platform_ledger (order_id, entry_type, amount, from_entity_id, to_entity_id, description)
    VALUES (
        p_order_id,
        'platform_commission',
        p_commission_amount,
        NULL,
        NULL,
        'Platform commission (' || p_commission_rate || '%) deducted from total contract value'
    );

    -- 4. Ledger entry: supplier payout
    INSERT INTO platform_ledger (order_id, entry_type, amount, from_entity_id, to_entity_id, description)
    VALUES (
        p_order_id,
        'supplier_payout',
        p_supplier_payout,
        NULL,
        p_supplier_id,
        'Net supplier payout after commission deduction'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
