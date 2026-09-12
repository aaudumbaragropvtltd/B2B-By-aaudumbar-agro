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
