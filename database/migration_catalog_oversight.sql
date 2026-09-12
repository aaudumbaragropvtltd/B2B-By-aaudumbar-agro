-- ============================================================================
-- CATALOG OVERSIGHT & GLOBAL APPROVALS
-- ============================================================================

CREATE TYPE product_approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval_status to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS approval_status product_approval_status NOT NULL DEFAULT 'pending';
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Automatically approve existing active products (assuming they were already vetted)
UPDATE products SET approval_status = 'approved' WHERE is_active = TRUE;

-- Add created_by to track which subaccount created the product
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by_subaccount_id UUID REFERENCES users(id) ON DELETE SET NULL;
