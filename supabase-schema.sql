-- =====================================================
-- POS & Inventory Management System - Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100),
  price_retail DECIMAL(12, 2) NOT NULL,
  price_wholesale DECIMAL(12, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster SKU lookups (barcode scanning)
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);

-- =====================================================
-- SALES TABLE
-- =====================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
  price_type VARCHAR(20) NOT NULL CHECK (price_type IN ('retail', 'wholesale')),
  payment_amount DECIMAL(12, 2),
  change_amount DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster date-based queries
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_price_type ON sales(price_type);

-- =====================================================
-- SALE ITEMS TABLE (Junction table)
-- =====================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for products table
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update product stock after sale
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update stock when sale item is created
CREATE TRIGGER update_stock_on_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Products Policies
-- Everyone can read products
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT 
  USING (true);

-- Only authenticated users can insert products
CREATE POLICY "Authenticated users can insert products" 
  ON products FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users can update products
CREATE POLICY "Authenticated users can update products" 
  ON products FOR UPDATE 
  USING (auth.role() = 'authenticated');

-- Only authenticated users can delete products
CREATE POLICY "Authenticated users can delete products" 
  ON products FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Sales Policies
-- Users can only view their own sales (admins can see all)
CREATE POLICY "Users can view sales" 
  ON sales FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Authenticated users can create sales
CREATE POLICY "Authenticated users can create sales" 
  ON sales FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Sale Items Policies
-- Users can view sale items for sales they can access
CREATE POLICY "Users can view sale items" 
  ON sale_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM sales 
      WHERE sales.id = sale_items.sale_id 
      AND (sales.user_id = auth.uid() OR (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin')
    )
  );

-- Authenticated users can create sale items
CREATE POLICY "Authenticated users can create sale items" 
  ON sale_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA (Sample Products)
-- =====================================================

INSERT INTO products (name, sku, category, price_retail, price_wholesale, stock, image) VALUES
('Wireless Headphones', 'WH-001', 'Electronics', 150000, 120000, 25, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop'),
('Smart Watch', 'SW-002', 'Electronics', 350000, 300000, 15, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop'),
('Coffee Mug', 'CM-003', 'Home & Kitchen', 25000, 20000, 50, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300&h=300&fit=crop'),
('Notebook Set', 'NB-004', 'Stationery', 35000, 28000, 8, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300&h=300&fit=crop'),
('Desk Lamp', 'DL-005', 'Home & Office', 75000, 60000, 20, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop'),
('Water Bottle', 'WB-006', 'Sports', 45000, 35000, 30, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&h=300&fit=crop');

-- =====================================================
-- USEFUL QUERIES FOR REPORTS
-- =====================================================

-- View: Sales Summary
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  s.id,
  s.created_at,
  s.total,
  s.price_type,
  u.email as cashier_email,
  (u.raw_user_meta_data->>'name') as cashier_name,
  COUNT(si.id) as total_items,
  SUM(si.quantity) as total_quantity
FROM sales s
LEFT JOIN auth.users u ON s.user_id = u.id
LEFT JOIN sale_items si ON s.id = si.sale_id
GROUP BY s.id, s.created_at, s.total, s.price_type, u.email, u.raw_user_meta_data;

-- View: Low Stock Products
CREATE OR REPLACE VIEW low_stock_products AS
SELECT *
FROM products
WHERE stock <= 10
ORDER BY stock ASC;

-- View: Daily Sales Report
CREATE OR REPLACE VIEW daily_sales_report AS
SELECT 
  DATE(created_at) as sale_date,
  COUNT(*) as total_transactions,
  SUM(total) as total_revenue,
  SUM(CASE WHEN price_type = 'retail' THEN total ELSE 0 END) as retail_revenue,
  SUM(CASE WHEN price_type = 'wholesale' THEN total ELSE 0 END) as wholesale_revenue,
  AVG(total) as average_transaction
FROM sales
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE products IS 'Store all product information including pricing and stock';
COMMENT ON TABLE sales IS 'Store sales transactions';
COMMENT ON TABLE sale_items IS 'Store individual items in each sale transaction';
COMMENT ON COLUMN products.price_retail IS 'Retail price in Indonesian Rupiah';
COMMENT ON COLUMN products.price_wholesale IS 'Wholesale price in Indonesian Rupiah';
COMMENT ON COLUMN sales.price_type IS 'Type of pricing used: retail or wholesale';
