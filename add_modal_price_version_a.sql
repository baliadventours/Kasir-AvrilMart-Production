-- ========================================
-- ADD MODAL PRICE COLUMN - VERSION A
-- ========================================
-- Use this if your database has:
-- ✓ retail_price
-- ✓ wholesale_price
-- (Standard format)
-- ========================================

-- Add modal_price column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS modal_price NUMERIC(10,2);

-- Add column comment
COMMENT ON COLUMN products.modal_price 
IS 'Modal/cost price of the product (Harga Pokok Penjualan - HPP)';

-- Set default value for existing products
UPDATE products 
SET modal_price = wholesale_price * 0.9
WHERE modal_price IS NULL;

-- Verify
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'products' ORDER BY ordinal_position;
