-- ============================================================================
-- MISSING CORE TABLES (RFQs and Conversations)
-- Please run this script in your Supabase SQL Editor.
-- ============================================================================

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE rfq_status AS ENUM ('open', 'closed', 'fulfilled', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected', 'negotiating');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. RFQs Table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    unit VARCHAR(50) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    deadline DATE,
    notes TEXT,
    buyer_email VARCHAR(255),
    status rfq_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. RFQ Quotes Table
CREATE TABLE IF NOT EXISTS rfq_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quoted_price NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    gst_rate NUMERIC(5, 2) DEFAULT 18,
    gst_amount NUMERIC(12, 2) DEFAULT 0,
    price_before_gst NUMERIC(12, 2) DEFAULT 0,
    supplier_location VARCHAR(255),
    delivery_days INT DEFAULT 7,
    platform_fee NUMERIC(12, 2) DEFAULT 0,
    status quote_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, 
    rfq_id UUID REFERENCES rfqs(id) ON DELETE SET NULL, 
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_id, supplier_id, product_id)
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Disable strict policies for Admin override
CREATE POLICY "Admin Override RFQs" ON rfqs USING (true) WITH CHECK (true);
CREATE POLICY "Admin Override Quotes" ON rfq_quotes USING (true) WITH CHECK (true);
CREATE POLICY "Admin Override Convs" ON conversations USING (true) WITH CHECK (true);
CREATE POLICY "Admin Override Messages" ON messages USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rfqs_updated_at ON rfqs;
CREATE TRIGGER update_rfqs_updated_at
    BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rfq_quotes_updated_at ON rfq_quotes;
CREATE TRIGGER update_rfq_quotes_updated_at
    BEFORE UPDATE ON rfq_quotes
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

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Ensure schema cache gets updated
NOTIFY pgrst, 'reload schema';
