-- ============================================================================
-- MIGRATION: ONBOARDING, AUTO-ID, SEARCH TRACKING & ACTIVITY LOGS
-- ============================================================================
-- Run this in Supabase SQL Editor to add onboarding flow support,
-- auto-generated display IDs (S01, B01...), and admin visibility tables.
-- ============================================================================

-- 1. Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_id VARCHAR(10) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_legal_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- 2. Make some columns nullable for Google OAuth users (filled during onboarding)
ALTER TABLE users ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE users ALTER COLUMN corporate_phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN gst_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN warehouse_address DROP NOT NULL;
ALTER TABLE users ALTER COLUMN city DROP NOT NULL;
ALTER TABLE users ALTER COLUMN state DROP NOT NULL;
ALTER TABLE users ALTER COLUMN pincode DROP NOT NULL;
ALTER TABLE users ALTER COLUMN geo_lat DROP NOT NULL;
ALTER TABLE users ALTER COLUMN geo_lng DROP NOT NULL;

-- Drop unique constraint on gst_number to allow NULL/pending values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_gst_number_key;

-- 3. Create search_logs table
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

-- 4. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_display_id ON users(display_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(onboarding_complete);

-- 6. RLS Policies for new tables
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all search logs
CREATE POLICY "Admins read all search logs"
    ON search_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND role = 'admin'
        )
    );

-- Users can read their own search logs
CREATE POLICY "Users read own search logs"
    ON search_logs FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
        )
    );

-- Anyone can insert search logs
CREATE POLICY "Anyone can insert search logs"
    ON search_logs FOR INSERT
    WITH CHECK (true);

-- Admins can read all activity logs
CREATE POLICY "Admins read all activity logs"
    ON activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND role = 'admin'
        )
    );

-- Anyone can insert activity logs
CREATE POLICY "Anyone can insert activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

-- Admins can read all user profiles
CREATE POLICY "Admins read all user profiles"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND u2.role = 'admin'
        )
    );

-- Admins can update all user profiles
CREATE POLICY "Admins update all user profiles"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u2
            WHERE u2.firebase_uid = current_setting('request.jwt.claim.sub', true)
            AND u2.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users update own profile"
    ON users FOR UPDATE
    USING (firebase_uid = current_setting('request.jwt.claim.sub', true));

-- Users can insert their own profile
CREATE POLICY "Users insert own profile"
    ON users FOR INSERT
    WITH CHECK (true);

-- 7. Function to generate next display ID
CREATE OR REPLACE FUNCTION generate_display_id(user_role user_role)
RETURNS VARCHAR(10) AS $$
DECLARE
    prefix CHAR(1);
    max_num INT;
    new_id VARCHAR(10);
BEGIN
    IF user_role = 'supplier' THEN
        prefix := 'S';
    ELSIF user_role = 'buyer' THEN
        prefix := 'B';
    ELSE
        prefix := 'A';
    END IF;

    -- Find the max existing number for this prefix
    SELECT COALESCE(MAX(CAST(SUBSTRING(display_id FROM 2) AS INT)), 0)
    INTO max_num
    FROM users
    WHERE display_id LIKE prefix || '%'
    AND SUBSTRING(display_id FROM 2) ~ '^[0-9]+$';

    -- Generate the new ID with zero-padding
    new_id := prefix || LPAD((max_num + 1)::TEXT, 2, '0');

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;
