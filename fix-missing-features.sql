-- =====================================================
-- FIX MISSING FEATURES - AVRIL MART POS
-- =====================================================
-- Purpose: Add users table for User Management dashboard
-- Date: 27 February 2026
-- 
-- USAGE:
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and RUN
-- =====================================================

-- =====================================================
-- FEATURE 1: CREATE USERS TABLE
-- =====================================================

SELECT '🔧 Creating users table...' as status;

-- Create users table for User Management dashboard
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admin can read all users" ON users;
DROP POLICY IF EXISTS "Admin can insert users" ON users;
DROP POLICY IF EXISTS "Admin can update users" ON users;
DROP POLICY IF EXISTS "Admin can delete users" ON users;

-- Create policies
CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
    auth.uid() = id
  );

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Admin can delete users"
  ON users FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create update_updated_at function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update trigger (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT '✅ Users table created with RLS policies' as status;

-- =====================================================
-- SYNC EXISTING AUTH USERS TO USERS TABLE
-- =====================================================

SELECT '🔧 Syncing existing auth users...' as status;

-- Insert existing auth users into users table
INSERT INTO users (id, name, email, role)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  COALESCE(raw_user_meta_data->>'role', 'cashier')
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO NOTHING;

SELECT '✅ Existing users synced' as status;

-- =====================================================
-- ADD RECEIPT NUMBER TO SALES TABLE (for search feature)
-- =====================================================

SELECT '🔧 Adding receipt_number to sales table...' as status;

-- Add receipt_number column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' 
    AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE sales ADD COLUMN receipt_number TEXT;
    
    -- Generate receipt numbers for existing sales
    UPDATE sales 
    SET receipt_number = 'INV-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 5, '0')
    WHERE receipt_number IS NULL;
    
    -- Make it NOT NULL and UNIQUE
    ALTER TABLE sales ALTER COLUMN receipt_number SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);
  END IF;
END $$;

SELECT '✅ Receipt number added to sales' as status;

-- =====================================================
-- CREATE FUNCTION TO AUTO-GENERATE RECEIPT NUMBER
-- =====================================================

SELECT '🔧 Creating auto-generate receipt number function...' as status;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get the next sequence number for today
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(receipt_number FROM 'INV-\d{8}-(\d{5})') 
      AS INTEGER
    )
  ), 0) + 1
  INTO sequence_num
  FROM sales
  WHERE receipt_number LIKE 'INV-' || today_date || '%';
  
  -- Generate receipt number: INV-20260227-00001
  NEW.receipt_number := 'INV-' || today_date || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating receipt number
DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON sales;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();

SELECT '✅ Auto-generate receipt number enabled' as status;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT '📊 Verifying changes...' as status;

-- Check users table
SELECT 
  'users table' as table_name,
  COUNT(*) as record_count
FROM users;

-- Check sales receipt numbers
SELECT 
  'sales with receipt numbers' as info,
  COUNT(*) as count,
  MIN(receipt_number) as first_receipt,
  MAX(receipt_number) as last_receipt
FROM sales
WHERE receipt_number IS NOT NULL;

-- Check table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'sales')
  AND column_name IN ('receipt_number', 'role', 'name', 'email')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- FINAL STATUS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ ALL FEATURES FIXED SUCCESSFULLY!
═══════════════════════════════════════════════════════

Fixed Issues:
✅ 1. Users table created - User Management akan show user list
✅ 2. Existing auth users synced to users table
✅ 3. Receipt number added to sales table
✅ 4. Auto-generate receipt number for new sales

Next Steps:
1. Refresh User Management page → User list akan muncul
2. Sales History akan punya receipt number untuk search
3. Filter by day/month/year akan di-implement di frontend

Test:
1. Go to User Management → Should see users list
2. Create new sale → Should have receipt number
3. Check sales table → All sales should have receipt_number

Status: ✅ DATABASE READY!

═══════════════════════════════════════════════════════
' as final_message;