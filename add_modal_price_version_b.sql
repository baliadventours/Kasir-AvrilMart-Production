-- ========================================
-- ADD MODAL PRICE COLUMN - VERSION B
-- ========================================
-- Use this if your database has:
-- ✓ price_retail
-- ✓ price_wholesale
-- (Alternative format)
-- ========================================

-- Add price_modal column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS price_modal NUMERIC(10,2);

-- Add column comment
COMMENT ON COLUMN products.price_modal 
IS 'Modal/cost price of the product (Harga Pokok Penjualan - HPP)';

-- Set default value for existing products
UPDATE products 
SET price_modal = price_wholesale * 0.9
WHERE price_modal IS NULL;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'products' ORDER BY ordinal_position;
