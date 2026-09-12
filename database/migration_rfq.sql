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
