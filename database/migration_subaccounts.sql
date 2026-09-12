-- ============================================================================
-- SUBACCOUNTS & TEAM MANAGEMENT MIGRATION
-- ============================================================================
-- Adds parent-child hierarchy to the users table for enterprise accounts.
-- ============================================================================

-- Create enum for subaccount roles
CREATE TYPE subaccount_role AS ENUM ('owner', 'sales_manager', 'sales_rep', 'catalog_manager');

-- Add parent_id to support organization hierarchies
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add subaccount_role to define what permissions the user has
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_role subaccount_role NOT NULL DEFAULT 'owner';

-- Ensure subaccounts don't need their own unique GST number if they inherit from parent
ALTER TABLE users ALTER COLUMN gst_number DROP NOT NULL;
ALTER TABLE users ALTER COLUMN warehouse_address DROP NOT NULL;
ALTER TABLE users ALTER COLUMN city DROP NOT NULL;
ALTER TABLE users ALTER COLUMN state DROP NOT NULL;
ALTER TABLE users ALTER COLUMN pincode DROP NOT NULL;
ALTER TABLE users ALTER COLUMN geo_lat DROP NOT NULL;
ALTER TABLE users ALTER COLUMN geo_lng DROP NOT NULL;

-- Update existing users to be owners
UPDATE users SET team_role = 'owner' WHERE parent_id IS NULL AND team_role IS NULL;

-- RLS Updates:
-- Allow owners to select their own subaccounts
CREATE POLICY "Owners can view their subaccounts"
    ON users FOR SELECT
    USING (
        parent_id IN (SELECT id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );

-- Allow subaccounts to view their parent account
CREATE POLICY "Subaccounts can view their parent"
    ON users FOR SELECT
    USING (
        id IN (SELECT parent_id FROM users WHERE firebase_uid = current_setting('request.jwt.claim.sub', true))
    );
