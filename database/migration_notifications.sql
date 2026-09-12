-- ============================================================================
-- MIGRATION: IN-APP NOTIFICATION SYSTEM
-- ============================================================================
-- Creates the notifications table for order updates, RFQ responses,
-- messages, price alerts, and verification updates.
-- ============================================================================

-- Notification types enum
CREATE TYPE notification_type AS ENUM (
    'order_update',
    'rfq_response',
    'message_received',
    'price_alert',
    'verification_update',
    'payment_received',
    'payment_failed',
    'system_alert'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users read own notifications"
    ON notifications FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
        )
    );

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users update own notifications"
    ON notifications FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
        )
    );

-- Service role can insert notifications (via API)
CREATE POLICY "Service can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Admins can read all notifications
CREATE POLICY "Admins read all notifications"
    ON notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND role = 'admin'
        )
    );
