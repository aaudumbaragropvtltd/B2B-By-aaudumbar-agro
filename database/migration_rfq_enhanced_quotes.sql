-- ============================================================================
-- RFQ ENHANCED QUOTATION SYSTEM MIGRATION
-- ============================================================================
-- Adds buyer_email to rfqs table and enhanced fields to rfq_quotes.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- 1. Add buyer_email to rfqs
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);

-- 2. Add enhanced fields to rfq_quotes
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5, 2) DEFAULT 18;
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS price_before_gst NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS supplier_location VARCHAR(255);
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS delivery_days INT DEFAULT 7;
ALTER TABLE rfq_quotes ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(12, 2) DEFAULT 0;
