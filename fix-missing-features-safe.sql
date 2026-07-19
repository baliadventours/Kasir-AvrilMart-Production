-- =====================================================
-- IDEMPOTENT SQL - SAFE TO RUN MULTIPLE TIMES
-- =====================================================
-- This script is safe to run multiple times.
-- It will skip existing objects and only create missing ones.
-- =====================================================

-- =====================================================
-- 1. CREATE OR UPDATE USERS TABLE
-- =====================================================

-- Create users table (skip if exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies (drop first to avoid "already exists" errors)
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR auth.uid() = id);

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can delete users"
  ON users FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Indexes (skip if exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. SYNC AUTH USERS TO USERS TABLE
-- =====================================================

-- Insert missing users from auth.users
INSERT INTO users (id, name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  COALESCE(raw_user_meta_data->>'role', 'cashier')
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. ADD RECEIPT NUMBER TO SALES
-- =====================================================

-- Add receipt_number column (skip if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'receipt_number'
  ) THEN
    -- Add column
    ALTER TABLE sales ADD COLUMN receipt_number TEXT;
    
    -- Generate receipt numbers for existing sales using subquery
    WITH numbered_sales AS (
      SELECT 
        id,
        'INV-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 5, '0') as new_receipt_number
      FROM sales
      WHERE receipt_number IS NULL
    )
    UPDATE sales
    SET receipt_number = numbered_sales.new_receipt_number
    FROM numbered_sales
    WHERE sales.id = numbered_sales.id;
    
    -- Make it NOT NULL and add unique index
    ALTER TABLE sales ALTER COLUMN receipt_number SET NOT NULL;
    CREATE UNIQUE INDEX idx_sales_receipt_number ON sales(receipt_number);
  END IF;
END $$;

-- =====================================================
-- 4. AUTO-GENERATE RECEIPT NUMBER FUNCTION
-- =====================================================

-- Function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(receipt_number FROM 'INV-\d{8}-(\d{5})') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM sales
  WHERE receipt_number LIKE 'INV-' || today_date || '%';
  
  NEW.receipt_number := 'INV-' || today_date || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new sales
DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON sales;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check users table
SELECT 'Users in database:' as info, COUNT(*) as count FROM users;

-- Check sales with receipt numbers
SELECT 'Sales with receipt numbers:' as info, COUNT(*) as count 
FROM sales WHERE receipt_number IS NOT NULL;

-- Show sample data
SELECT 'Sample users:' as info;
SELECT id, name, email, role FROM users LIMIT 5;

SELECT 'Sample receipts:' as info;
SELECT id, receipt_number, total, created_at FROM sales 
ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- ✅ DONE! Script completed successfully.
-- =====================================================