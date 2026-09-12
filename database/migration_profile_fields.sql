-- ============================================================================
-- MIGRATION: EXTENDED PROFILE FIELDS (Alibaba-Style Profile)
-- ============================================================================
-- Adds additional profile fields to the users table for the enhanced
-- buyer/supplier profile page: job title, website, about us, platforms,
-- employee count, sourcing frequency, and annual spending.
-- ============================================================================

-- Extended profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS about_us TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS platforms_sold_on TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_employees VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sourcing_frequency VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_spending VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Indexes for new fields (optional, for admin queries)
CREATE INDEX IF NOT EXISTS idx_users_job_title ON users(job_title);
