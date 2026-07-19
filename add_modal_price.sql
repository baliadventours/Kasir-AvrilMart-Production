-- ========================================
-- ADD MODAL_PRICE COLUMN TO PRODUCTS TABLE
-- ========================================
-- 
-- Run this SQL in Supabase SQL Editor:
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to: SQL Editor
-- 4. Click: + New query
-- 5. Copy & paste this entire file
-- 6. Click: RUN (or press Ctrl + Enter)
--
-- ========================================

-- Add modal_price column
ALTER TABLE products 
ADD COLUMN modal_price NUMERIC(10,2);

-- Add column comment
COMMENT ON COLUMN products.modal_price 
IS 'Modal/cost price of the product (Harga Pokok Penjualan - HPP)';

-- Optional: Set default value for existing products
-- This calculates modal_price as 90% of wholesale_price
-- for products that don't have modal_price yet
UPDATE products 
SET modal_price = wholesale_price * 0.9
WHERE modal_price IS NULL;

-- ========================================
-- VERIFICATION
-- ========================================

-- Check if column was added successfully
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Expected output should include:
-- column_name  | data_type | numeric_precision | numeric_scale | is_nullable
-- -------------+-----------+-------------------+---------------+-------------
-- ...
-- modal_price  | numeric   | 10                | 2             | YES
-- ...

-- ========================================
-- SUCCESS!
-- ========================================
-- 
-- If you see modal_price in the results above,
-- the migration was successful!
--
-- Next steps:
-- 1. Hard refresh browser (Ctrl + Shift + R)
-- 2. Clear service worker cache
-- 3. Import CSV with modal_price column
--
-- CSV Format (8 columns):
-- name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
--
-- ========================================
