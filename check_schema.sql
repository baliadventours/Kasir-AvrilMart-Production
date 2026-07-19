-- ========================================
-- CHECK DATABASE SCHEMA FIRST!
-- ========================================
-- 
-- Run this FIRST to see actual column names
--
-- ========================================

-- Get all columns from products table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- This will show you the ACTUAL column names!
-- Look for price-related columns:
-- - Is it "retail_price" or "price_retail"?
-- - Is it "wholesale_price" or "price_wholesale"?
-- - Does "modal_price" or "price_modal" already exist?

-- ========================================
-- AFTER RUNNING ABOVE, SHARE THE OUTPUT!
-- ========================================
