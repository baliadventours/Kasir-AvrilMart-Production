-- =====================================================
-- AVRILMART POS - DATABASE SCHEMA
-- =====================================================
-- Version: 21 (Simple & Clean)
-- Description: Setup database untuk AvrilMart POS
-- 
-- CARA SETUP:
-- 1. Buka Supabase Dashboard → SQL Editor
-- 2. Copy semua SQL di bawah ini
-- 3. Paste dan RUN
-- 4. Done! Database siap digunakan
-- =====================================================

-- =====================================================
-- STEP 1: DROP EXISTING TABLES (Clean Start)
-- =====================================================

DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT NOT NULL,
  price_retail DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_wholesale DECIMAL(10, 2) NOT NULL DEFAULT 0,
  price_modal DECIMAL(10, 2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  price_type TEXT NOT NULL CHECK (price_type IN ('retail', 'wholesale')),
  payment_amount DECIMAL(10, 2),
  change_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sale Items Table
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-decrease stock trigger
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrease_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- Categories: Everyone can read, only authenticated can modify
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Products: Everyone can read, only authenticated can modify
CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Sales: Everyone can read and create
CREATE POLICY "Anyone can read sales"
  ON sales FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sales"
  ON sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Sale Items: Everyone can read and create
CREATE POLICY "Anyone can read sale items"
  ON sale_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create sale items"
  ON sale_items FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- STEP 7: INSERT SAMPLE DATA
-- =====================================================

-- Sample Categories
INSERT INTO categories (name, description) VALUES
('Makanan & Minuman', 'Produk makanan dan minuman'),
('Elektronik', 'Produk elektronik'),
('Pakaian', 'Produk pakaian'),
('Kesehatan & Kecantikan', 'Produk kesehatan dan kecantikan'),
('Rumah Tangga', 'Keperluan rumah tangga'),
('Alat Tulis', 'Alat tulis dan kantor'),
('Mainan', 'Mainan dan hobi'),
('Olahraga', 'Perlengkapan olahraga'),
('Otomotif', 'Aksesoris kendaraan'),
('Lain-lain', 'Produk lainnya')
ON CONFLICT (name) DO NOTHING;

-- Sample Products (10 produk dengan barcode)
INSERT INTO products (name, sku, barcode, category, price_retail, price_wholesale, price_modal, stock) VALUES
('Aqua Botol 600ml', 'BRG-001', '8991001010211', 'Makanan & Minuman', 5000, 4500, 4000, 100),
('Indomie Goreng', 'BRG-002', '8992388101015', 'Makanan & Minuman', 3500, 3000, 2500, 200),
('Kopi Kapal Api', 'BRG-003', '8992745060154', 'Makanan & Minuman', 2000, 1800, 1500, 150),
('Teh Pucuk Harum', 'BRG-004', '8886008101114', 'Makanan & Minuman', 4000, 3500, 3000, 120),
('Biskuit Roma', 'BRG-005', '8992741101516', 'Makanan & Minuman', 5500, 5000, 4500, 80),
('Charger USB Type-C', 'ELK-001', '6942334300111', 'Elektronik', 35000, 32000, 28000, 50),
('Kabel Data Type-C', 'ELK-002', '6942334300128', 'Elektronik', 15000, 13000, 11000, 60),
('Sabun Lifebuoy', 'KSH-001', '8999999037819', 'Kesehatan & Kecantikan', 4500, 4000, 3500, 150),
('Pasta Gigi Pepsodent', 'KSH-002', '8999999038014', 'Kesehatan & Kecantikan', 12000, 11000, 10000, 100),
('Pulpen Standard', 'ATK-001', '8992908120115', 'Alat Tulis', 3000, 2500, 2000, 200)
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables created
SELECT 'Tables Status:' as info;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'products', 'sales', 'sale_items')
ORDER BY table_name;

-- Check data inserted
SELECT 'Data Status:' as info;
SELECT 
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM products) as products_count;

-- Show sample data
SELECT 'Sample Categories:' as info;
SELECT name FROM categories LIMIT 5;

SELECT 'Sample Products:' as info;
SELECT name, sku, barcode, category, price_retail, stock FROM products LIMIT 5;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

SELECT '
✅ DATABASE SETUP BERHASIL!

Tables Created:
- categories (10 sample data)
- products (10 sample data with barcodes)
- sales
- sale_items

RLS Policies: ✅ Enabled
Triggers: ✅ Active (auto-decrease stock)
Indexes: ✅ Created

Next Steps:
1. Setup admin user di Supabase Dashboard
2. Login ke aplikasi
3. Test POS functionality
4. Add more products via CSV import atau manual

Happy Selling! 🛒
' as message;
