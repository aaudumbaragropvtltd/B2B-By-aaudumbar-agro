-- ============================================================================
-- B2B BHARAT — SUPABASE POSTGRESQL SCHEMA
-- ============================================================================
-- Execute this script in Supabase SQL Editor to provision the core relational
-- matrix handling 38+ industry configurations, dynamic price indexing,
-- contract lifecycle parameters, and platform financial ledgers.
-- ============================================================================

-- Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "cube";       -- Required for POINT/distance operations
CREATE EXTENSION IF NOT EXISTS "earthdistance"; -- Geo-distance calculations

-- ============================================================================
-- CUSTOM ENUM TYPES
-- Rigorous lifecycle control for users, orders, and verification
-- ============================================================================

CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');
CREATE TYPE verification_status AS ENUM ('pending_verification', 'active', 'suspended');
CREATE TYPE order_status AS ENUM (
  'quotation_issued',
  'price_locked_10',
  'warehouse_loading',
  'settled',
  'cancelled',
  'rerouted'           -- When AI Contract Agent re-routes to fallback supplier
);
CREATE TYPE ledger_entry_type AS ENUM (
  'advance_10_percent',
  'dock_final_90_percent',
  'platform_commission',
  'supplier_payout',
  'refund_buyer'
);

-- ============================================================================
-- TABLE 1: HIGH-TRUST USER IDENTITY PROFILES
-- Stores company-level registration with GST, geo-coordinates, and
-- verification status. References Supabase auth.users for SSO linkage.
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) UNIQUE,          -- Links to Firebase Auth UID
    company_name VARCHAR(255) NOT NULL,
    registered_email VARCHAR(255) UNIQUE NOT NULL,
    corporate_phone VARCHAR(50) NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    status verification_status NOT NULL DEFAULT 'pending_verification',
    gst_number VARCHAR(15) UNIQUE NOT NULL,
    pan_number VARCHAR(10),                    -- Optional PAN for additional verification
    warehouse_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    geo_lat NUMERIC(10, 7) NOT NULL,           -- Latitude coordinate
    geo_lng NUMERIC(10, 7) NOT NULL,           -- Longitude coordinate
    company_logo_url TEXT,
    annual_turnover_lakhs NUMERIC(12, 2),      -- Self-declared turnover in lakhs
    year_established INT,
    whatsapp_number VARCHAR(20),               -- For WhatsApp Business API notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 2: RECURSIVE INDUSTRY / SECTOR CATEGORIZATION SYSTEM
-- Supports a hierarchical tree of 38+ sectors with parent-child nesting.
-- Top-level sectors have parent_id = NULL.
-- ============================================================================

CREATE TABLE industry_sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES industry_sectors(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon_identifier VARCHAR(100),              -- Frontend icon reference key
    hero_image_url TEXT,                        -- Unsplash/CDN hero image for sector page
    display_order INT DEFAULT 0,               -- Controls rendering sequence on frontend
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 3: DYNAMIC GLOBAL COMMODITY & PRODUCT MASTER TABLE
-- Each product is owned by a supplier and categorized into a sector.
-- Supports JSONB for flexible technical specification matrices.
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sector_id UUID NOT NULL REFERENCES industry_sectors(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    base_price_per_unit NUMERIC(12, 2) NOT NULL,
    unit_label VARCHAR(50) NOT NULL DEFAULT 'kg', -- kg, piece, lot, meter, litre, etc.
    bulk_minimum_order INT NOT NULL DEFAULT 1000,
    technical_specifications JSONB NOT NULL DEFAULT '{}',  -- Flexible spec matrix
    quality_grade VARCHAR(50),                              -- A, B, C, Premium, Industrial
    hsn_code VARCHAR(20),                                   -- Harmonized System Nomenclature
    certifications TEXT[],                                   -- ISO, BIS, FSSAI array
    hero_image_url TEXT,
    gallery_image_urls TEXT[],
    last_price_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_stale BOOLEAN DEFAULT FALSE,
    stale_fallback_supplier_id UUID REFERENCES users(id),   -- Tracks which supplier provided fallback price
    inventory_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 4: B2B BHARAT TRANSACTIONAL ORDER & ESCROW MATRIX
-- Full lifecycle tracking from quotation issuance through escrow settlement.
-- The advance_paid_10 is a generated column computed from total_contract_value.
-- ============================================================================

CREATE TABLE trade_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_label VARCHAR(50) NOT NULL DEFAULT 'kg',
    agreed_unit_price NUMERIC(12, 2) NOT NULL,
    logistics_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 18.00,  -- GST rate
    tax_amount NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    total_contract_value NUMERIC(12, 2) NOT NULL,
    advance_paid_10 NUMERIC(12, 2) GENERATED ALWAYS AS (total_contract_value * 0.10) STORED,
    balance_due_90 NUMERIC(12, 2) GENERATED ALWAYS AS (total_contract_value * 0.90) STORED,
    current_state order_status NOT NULL DEFAULT 'quotation_issued',
    qr_payment_reference VARCHAR(255),         -- Dynamic QR reference for dock payment
    rerouted_from_supplier_id UUID REFERENCES users(id),  -- If AI re-routed the order
    reroute_reason TEXT,
    buyer_notes TEXT,
    supplier_notes TEXT,
    estimated_delivery_days INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE 5: PLATFORM FINANCIAL LEDGER
-- Immutable audit trail for all capital movements — advances, payouts,
-- commissions, and refunds. Each trade_order generates multiple ledger entries.
-- ============================================================================

CREATE TABLE platform_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES trade_orders(id) ON DELETE RESTRICT,
    entry_type ledger_entry_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    from_entity_id UUID REFERENCES users(id),  -- NULL for platform-originated entries
    to_entity_id UUID REFERENCES users(id),    -- NULL for platform-received entries
    payment_reference VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- Optimized for the most frequent query patterns: sector browsing,
-- active product lookup, order state filtering, and ledger auditing.
-- ============================================================================

-- Products: sector browsing and active non-stale product search
CREATE INDEX idx_products_sector ON products(sector_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_active_lookup ON products(title, base_price_per_unit)
    WHERE is_stale = FALSE AND is_active = TRUE;
CREATE INDEX idx_products_staleness_check ON products(last_price_update)
    WHERE is_stale = FALSE;

-- Orders: state-based filtering and buyer/supplier dashboards
CREATE INDEX idx_orders_state ON trade_orders(current_state);
CREATE INDEX idx_orders_buyer ON trade_orders(buyer_id);
CREATE INDEX idx_orders_supplier ON trade_orders(supplier_id);

-- Ledger: order-based audit trail
CREATE INDEX idx_ledger_order ON platform_ledger(order_id);
CREATE INDEX idx_ledger_type ON platform_ledger(entry_type);

-- Users: role and status filtering
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Sectors: hierarchical navigation
CREATE INDEX idx_sectors_parent ON industry_sectors(parent_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforce data access boundaries at the database level.
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_sectors ENABLE ROW LEVEL SECURITY;

-- Industry sectors are publicly readable (catalog browsing)
CREATE POLICY "Sectors are publicly readable"
    ON industry_sectors FOR SELECT
    USING (true);

-- Products are publicly readable when active
CREATE POLICY "Active products are publicly readable"
    ON products FOR SELECT
    USING (is_active = TRUE);

-- Suppliers can manage their own products
CREATE POLICY "Suppliers manage own products"
    ON products FOR ALL
    USING (supplier_id = (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

-- Users can read their own profile
CREATE POLICY "Users read own profile"
    ON users FOR SELECT
    USING (firebase_uid = current_setting('request.jwt.claim.sub', true));

-- Orders visible to buyer or supplier involved
CREATE POLICY "Order parties can view their orders"
    ON trade_orders FOR SELECT
    USING (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

-- Ledger entries visible to order parties
CREATE POLICY "Ledger visible to order parties"
    ON platform_ledger FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM trade_orders
            WHERE buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
               OR supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

-- ============================================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON trade_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
