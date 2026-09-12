-- ============================================================================
-- B2B INDIA — ADMIN PRICING REFERENCE TABLE MIGRATION
-- ============================================================================
-- Stores the full pricing breakdown for each product including:
-- base (supplier) price, commission rate, commission amount,
-- GST rate, GST amount, final displayed price, and logistics info.
-- This table is for ADMIN REFERENCE ONLY — not exposed to buyers/suppliers.
-- ============================================================================

-- Admin pricing reference table
CREATE TABLE IF NOT EXISTS admin_product_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Supplier's original base price (before commission)
    supplier_base_price NUMERIC(12, 2) NOT NULL,
    
    -- Commission details
    commission_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    commission_amount NUMERIC(12, 2) NOT NULL,
    
    -- Final displayed price (supplier_base_price + commission_amount)
    displayed_price NUMERIC(12, 2) NOT NULL,
    
    -- GST details
    gst_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    gst_on_displayed_price NUMERIC(12, 2) NOT NULL,
    
    -- Total price with GST (displayed_price + gst)
    total_price_with_gst NUMERIC(12, 2) NOT NULL,
    
    -- Unit and sector info (denormalized for quick admin lookup)
    unit_label VARCHAR(50) NOT NULL DEFAULT 'kg',
    sector_slug VARCHAR(255),
    sector_name VARCHAR(255),
    
    -- Logistics info
    logistics_eligible BOOLEAN DEFAULT FALSE,
    logistics_rate_per_kg NUMERIC(6, 2) DEFAULT 0.00,
    
    -- Product title (denormalized for quick admin lookup)
    product_title VARCHAR(255) NOT NULL,
    supplier_name VARCHAR(255),
    
    -- Audit fields
    last_computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one pricing record per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_pricing_product 
    ON admin_product_pricing(product_id);

-- Index for quick lookups by sector
CREATE INDEX IF NOT EXISTS idx_admin_pricing_sector 
    ON admin_product_pricing(sector_slug);

-- Index for commission rate filtering
CREATE INDEX IF NOT EXISTS idx_admin_pricing_commission 
    ON admin_product_pricing(commission_rate_percent);

-- ============================================================================
-- SEED: Compute pricing breakdown for all existing products
-- ============================================================================
-- Commission Rates:
--   Agriculture (agriculture, food-beverage): 2%
--   Textile/Apparel (apparel-fashion, textile-machinery): 7%
--   All other sectors: 5%
-- ============================================================================

INSERT INTO admin_product_pricing (
    product_id, supplier_base_price, commission_rate_percent, commission_amount,
    displayed_price, gst_rate_percent, gst_on_displayed_price, total_price_with_gst,
    unit_label, sector_slug, sector_name, logistics_eligible, logistics_rate_per_kg,
    product_title, supplier_name
)
SELECT
    p.id AS product_id,
    -- Reverse-engineer the supplier base price from displayed price
    ROUND(p.base_price_per_unit / (1 + 
        CASE 
            WHEN s.slug IN ('agriculture', 'food-beverage') THEN 0.02
            WHEN s.slug IN ('apparel-fashion', 'textile-machinery') THEN 0.07
            ELSE 0.05
        END
    ), 2) AS supplier_base_price,
    -- Commission rate
    CASE 
        WHEN s.slug IN ('agriculture', 'food-beverage') THEN 2.00
        WHEN s.slug IN ('apparel-fashion', 'textile-machinery') THEN 7.00
        ELSE 5.00
    END AS commission_rate_percent,
    -- Commission amount
    p.base_price_per_unit - ROUND(p.base_price_per_unit / (1 + 
        CASE 
            WHEN s.slug IN ('agriculture', 'food-beverage') THEN 0.02
            WHEN s.slug IN ('apparel-fashion', 'textile-machinery') THEN 0.07
            ELSE 0.05
        END
    ), 2) AS commission_amount,
    -- Displayed price (current base_price_per_unit which has commission baked in)
    p.base_price_per_unit AS displayed_price,
    -- GST rate (default 18%, can be overridden per product specs)
    18.00 AS gst_rate_percent,
    -- GST on displayed price
    ROUND(p.base_price_per_unit * 0.18, 2) AS gst_on_displayed_price,
    -- Total with GST
    ROUND(p.base_price_per_unit * 1.18, 2) AS total_price_with_gst,
    -- Unit
    p.unit_label,
    -- Sector info
    s.slug AS sector_slug,
    s.name AS sector_name,
    -- Logistics eligibility
    CASE WHEN s.slug IN ('agriculture', 'food-beverage') THEN TRUE ELSE FALSE END AS logistics_eligible,
    CASE WHEN s.slug IN ('agriculture', 'food-beverage') THEN 2.30 ELSE 0.00 END AS logistics_rate_per_kg,
    -- Denormalized fields
    p.title AS product_title,
    u.company_name AS supplier_name
FROM products p
JOIN industry_sectors s ON p.sector_id = s.id
JOIN users u ON p.supplier_id = u.id
ON CONFLICT (product_id) DO UPDATE SET
    supplier_base_price = EXCLUDED.supplier_base_price,
    commission_rate_percent = EXCLUDED.commission_rate_percent,
    commission_amount = EXCLUDED.commission_amount,
    displayed_price = EXCLUDED.displayed_price,
    gst_rate_percent = EXCLUDED.gst_rate_percent,
    gst_on_displayed_price = EXCLUDED.gst_on_displayed_price,
    total_price_with_gst = EXCLUDED.total_price_with_gst,
    unit_label = EXCLUDED.unit_label,
    sector_slug = EXCLUDED.sector_slug,
    sector_name = EXCLUDED.sector_name,
    logistics_eligible = EXCLUDED.logistics_eligible,
    logistics_rate_per_kg = EXCLUDED.logistics_rate_per_kg,
    product_title = EXCLUDED.product_title,
    supplier_name = EXCLUDED.supplier_name,
    last_computed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- RLS: Admin-only access
-- ============================================================================
ALTER TABLE admin_product_pricing ENABLE ROW LEVEL SECURITY;

-- Only admin role can read
CREATE POLICY admin_pricing_read_policy ON admin_product_pricing
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.firebase_uid = auth.uid()::text 
            AND users.role = 'admin'
        )
    );

-- Only admin role can modify
CREATE POLICY admin_pricing_write_policy ON admin_product_pricing
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.firebase_uid = auth.uid()::text 
            AND users.role = 'admin'
        )
    );
