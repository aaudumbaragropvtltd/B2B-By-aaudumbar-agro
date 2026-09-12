-- ============================================================================
-- B2B INDIA — PRIORITY 1 & 2 DYNAMIC GOVERNANCE MIGRATION
-- ============================================================================
-- 1. platform_settings: Dynamic Key-Value store for commercial fees, GST, guardrails
-- 2. platform_banners: Dynamic CMS banner management for Homepage & Sector Promos
-- 3. platform_logs: System health, API audit, and webhook error logs
-- ============================================================================

-- ── 1. PLATFORM SETTINGS TABLE ──
CREATE TABLE IF NOT EXISTS platform_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'commercial', -- 'commercial', 'tax', 'system', 'guardrails', 'payment'
    label VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial default settings
INSERT INTO platform_settings (key, value, category, label, description)
VALUES
    ('high_value_threshold', '1000000'::jsonb, 'commercial', 'High Value Deal Threshold (₹)', 'Contract value above or equal to which flat-rate advance applies'),
    ('high_value_advance_base', '97640'::jsonb, 'commercial', 'High Value Base Advance (₹)', 'Base advance locked for deals >= 10 Lakhs'),
    ('high_value_upi_fee', '2360'::jsonb, 'commercial', 'High Value UPI Platform Fee (₹)', 'Flat UPI surcharge making total ₹1,00,000 for high-value deals'),
    ('cards_surcharge_rate_percent', '2.5'::jsonb, 'commercial', 'Cards & NetBanking Surcharge (%)', 'Processing fee for credit/debit cards and NetBanking'),
    ('standard_advance_percent', '10'::jsonb, 'commercial', 'Standard Deal Advance Rate (%)', 'Advance percentage for orders below 10 Lakhs'),
    ('default_gst_percent', '18'::jsonb, 'tax', 'Default GST Rate (%)', 'Standard Goods and Services Tax rate applicable across general commodities'),
    ('default_min_order_qty', '1000'::jsonb, 'guardrails', 'Default Minimum Order Quantity', 'Fallback minimum wholesale unit quantity for new listings'),
    ('platform_maintenance_mode', 'false'::jsonb, 'system', 'Platform Maintenance Mode', 'When enabled, displays maintenance banner to non-admin visitors'),
    ('escrow_hold_hours', '72'::jsonb, 'system', 'Escrow Price Lock Duration (Hours)', 'Duration for which supplier price and allocation is guaranteed')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ── 2. PLATFORM BANNERS (DYNAMIC CMS) ──
CREATE TABLE IF NOT EXISTS platform_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    badge_text VARCHAR(100) DEFAULT 'Featured Wholesale Trade',
    hero_image_url TEXT NOT NULL,
    cta_text VARCHAR(100) DEFAULT 'Explore Wholesale Deals',
    cta_link VARCHAR(255) DEFAULT '/directory',
    sector_slug VARCHAR(100), -- Optional filter for sector-specific banners
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial banners
INSERT INTO platform_banners (title, subtitle, badge_text, hero_image_url, cta_text, cta_link, display_order, is_active)
VALUES
    (
        'India’s Verified B2B Wholesale Marketplace',
        'Direct ex-factory bulk procurement with 100% Escrow Price Protection, dock inspections, and automated GST billing.',
        '100% Escrow Price Protected',
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=80',
        'Explore 38+ Wholesale Sectors',
        '/directory',
        1,
        TRUE
    ),
    (
        'APMC Mandi Direct Agro & Spice Sourcing',
        'Connect directly with certified agricultural aggregators in Nashik, Erode, Unjha, and Guntur with daily live mandi rates.',
        'Direct Mandi Procurement',
        'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&w=2000&q=80',
        'View Live Mandi Rates',
        '/market-rates',
        2,
        TRUE
    ),
    (
        'Heavy Industrial & Raw Materials Exchange',
        'Bulk TMT steel, polymers, textile fabrics, and chemicals with verified factory lab certificates and dock logistics.',
        'Verified Industrial Hub',
        'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=2000&q=80',
        'Post Enterprise RFQ',
        '/#rfq-form',
        3,
        TRUE
    )
ON CONFLICT DO NOTHING;

-- ── 3. PLATFORM AUDIT & HEALTH LOGS ──
CREATE TABLE IF NOT EXISTS platform_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    service VARCHAR(100) NOT NULL, -- 'razorpay', 'escrow', 'auth', 'gemini_agent', 'api'
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed sample system log
INSERT INTO platform_logs (level, service, message, metadata)
VALUES
    ('INFO', 'system', 'Platform dynamic settings & CMS governance initialized', '{"version": "2.0.0"}'::jsonb)
ON CONFLICT DO NOTHING;
