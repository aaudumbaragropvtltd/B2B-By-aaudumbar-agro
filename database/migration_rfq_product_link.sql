-- ============================================================================
-- MIGRATION: Link RFQs to Catalog Products
-- ============================================================================
-- This migration adds a catalog_product_id column to the rfqs table.
-- It links a user's requirement directly to a specific catalog product.
-- ============================================================================

ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS catalog_product_id UUID REFERENCES products(id) ON DELETE SET NULL;
