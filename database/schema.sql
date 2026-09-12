-- ============================================================================
-- B2B INDIA — SUPABASE POSTGRESQL SCHEMA
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
-- TABLE 4: B2B INDIA TRANSACTIONAL ORDER & ESCROW MATRIX
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
-- ============================================================================
-- RFQ SYSTEM MIGRATION
-- ============================================================================

CREATE TYPE rfq_status AS ENUM ('open', 'closed');
CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    deadline DATE,
    notes TEXT,
    status rfq_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quoted_price NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    status quote_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQs readable by all"
    ON rfqs FOR SELECT
    USING (true);

CREATE POLICY "Buyers can insert RFQs"
    ON rfqs FOR INSERT
    WITH CHECK (buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Buyers can update their RFQs"
    ON rfqs FOR UPDATE
    USING (buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Quotes readable by involved parties"
    ON rfq_quotes FOR SELECT
    USING (
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        rfq_id IN (SELECT id FROM rfqs WHERE buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)))
    );

CREATE POLICY "Suppliers can insert quotes"
    ON rfq_quotes FOR INSERT
    WITH CHECK (supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Suppliers can update their quotes"
    ON rfq_quotes FOR UPDATE
    USING (supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

-- Triggers for updated_at
CREATE TRIGGER update_rfqs_updated_at
    BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfq_quotes_updated_at
    BEFORE UPDATE ON rfq_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- MESSAGING SYSTEM MIGRATION
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- optional reference to specific product
    rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL, -- optional reference to specific RFQ
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, supplier_id, product_id) -- Only one thread per product pair
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations visible to involved parties"
    ON conversations FOR SELECT
    USING (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Conversations updateable by involved parties"
    ON conversations FOR UPDATE
    USING (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Messages visible to conversation participants"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

CREATE POLICY "Users can send messages to their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        AND
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

CREATE POLICY "Users can mark messages as read"
    ON messages FOR UPDATE
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation's last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
-- ============================================================================
-- RFQ SYSTEM MIGRATION
-- ============================================================================

CREATE TYPE rfq_status AS ENUM ('open', 'closed');
CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    deadline DATE,
    notes TEXT,
    status rfq_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quoted_price NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    status quote_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RFQs readable by all"
    ON rfqs FOR SELECT
    USING (true);

CREATE POLICY "Buyers can insert RFQs"
    ON rfqs FOR INSERT
    WITH CHECK (buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Buyers can update their RFQs"
    ON rfqs FOR UPDATE
    USING (buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Quotes readable by involved parties"
    ON rfq_quotes FOR SELECT
    USING (
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        rfq_id IN (SELECT id FROM rfqs WHERE buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)))
    );

CREATE POLICY "Suppliers can insert quotes"
    ON rfq_quotes FOR INSERT
    WITH CHECK (supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Suppliers can update their quotes"
    ON rfq_quotes FOR UPDATE
    USING (supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

-- Triggers for updated_at
CREATE TRIGGER update_rfqs_updated_at
    BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfq_quotes_updated_at
    BEFORE UPDATE ON rfq_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- MESSAGING SYSTEM MIGRATION
-- ============================================================================

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- optional reference to specific product
    rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL, -- optional reference to specific RFQ
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, supplier_id, product_id) -- Only one thread per product pair
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations visible to involved parties"
    ON conversations FOR SELECT
    USING (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Conversations updateable by involved parties"
    ON conversations FOR UPDATE
    USING (
        buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        OR 
        supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

CREATE POLICY "Messages visible to conversation participants"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

CREATE POLICY "Users can send messages to their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        AND
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

CREATE POLICY "Users can mark messages as read"
    ON messages FOR UPDATE
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE 
            buyer_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
            OR 
            supplier_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
        )
    );

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update conversation's last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- USER CRM / ACTIVITY TRACKING
-- ============================================================================

CREATE TABLE user_product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE user_product_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own views"
    ON user_product_views FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Admins can view all"
    ON user_product_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true) 
            AND role = 'admin'
        )
    );

CREATE INDEX idx_user_views_user_id ON user_product_views(user_id, viewed_at DESC);

-- ============================================================================
-- SEARCH LOGS & LEAD INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    sector_slug VARCHAR(255),
    results_count INT DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on search_logs"
    ON search_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can view all search logs"
    ON search_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true) 
            AND role = 'admin'
        )
    );

CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);

-- ============================================================================
-- PAYMENTS TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES trade_orders(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    payment_method VARCHAR(50) DEFAULT 'Razorpay',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'successful', 'failed', 'pending', 'refunded'
    transaction_reference VARCHAR(255),            -- Razorpay payment ID or Bank UTR
    payment_type VARCHAR(50) DEFAULT 'advance_10_percent', -- 'advance_10_percent', 'dock_final_90_percent', 'manual_settlement', 'sample_order'
    failure_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
    ON payments FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users 
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
        )
    );

CREATE POLICY "Admins can view and manage all payments"
    ON payments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true) 
            AND role = 'admin'
        )
    );

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
