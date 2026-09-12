-- ============================================================================
-- MARKET INTELLIGENCE MIGRATION
-- ============================================================================
-- Adds tables to track scraped market rates and vendor comparisons.
-- Run this in Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    commodity_name VARCHAR(255) NOT NULL,
    min_price NUMERIC(12, 2) NOT NULL,
    max_price NUMERIC(12, 2) NOT NULL,
    average_price NUMERIC(12, 2) NOT NULL,
    source_url TEXT,
    vendor_name VARCHAR(255),
    is_competitor BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE market_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view market rates"
    ON market_rates FOR SELECT
    USING (
        (SELECT role FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)) = 'admin'
    );

CREATE POLICY "Admins can insert market rates"
    ON market_rates FOR INSERT
    WITH CHECK (
        (SELECT role FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)) = 'admin'
    );
