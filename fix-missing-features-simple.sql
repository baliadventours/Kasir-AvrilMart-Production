-- =====================================================
-- SUPER SIMPLE VERSION - NO WINDOW FUNCTIONS
-- =====================================================
-- Use this if the main script still has issues
-- This version generates simple sequential receipt numbers
-- =====================================================

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cashier')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- 2. SYNC AUTH USERS
-- =====================================================

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
-- 3. ADD RECEIPT NUMBER TO SALES (SIMPLE WAY)
-- =====================================================

-- Add column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'receipt_number'
  ) THEN
    ALTER TABLE sales ADD COLUMN receipt_number TEXT;
  END IF;
END $$;

-- Generate simple receipt numbers for existing sales
-- Using a simple loop instead of window function
DO $$
DECLARE
  sale_record RECORD;
  counter INTEGER := 1;
BEGIN
  FOR sale_record IN 
    SELECT id, created_at 
    FROM sales 
    WHERE receipt_number IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE sales 
    SET receipt_number = 'INV-' || TO_CHAR(sale_record.created_at, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 5, '0')
    WHERE id = sale_record.id;
    
    counter := counter + 1;
  END LOOP;
END $$;

-- Make NOT NULL if all records have receipt numbers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sales WHERE receipt_number IS NULL) THEN
    ALTER TABLE sales ALTER COLUMN receipt_number SET NOT NULL;
  END IF;
END $$;

-- Create index
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_receipt_number ON sales(receipt_number);

-- =====================================================
-- 4. AUTO-GENERATE FUNCTION FOR NEW SALES
-- =====================================================

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
BEGIN
  today_date := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for today
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

DROP TRIGGER IF EXISTS trigger_generate_receipt_number ON sales;
CREATE TRIGGER trigger_generate_receipt_number
  BEFORE INSERT ON sales
  FOR EACH ROW
  WHEN (NEW.receipt_number IS NULL)
  EXECUTE FUNCTION generate_receipt_number();

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Users:' as info, COUNT(*) FROM users;
SELECT 'Sales with receipts:' as info, COUNT(*) FROM sales WHERE receipt_number IS NOT NULL;
SELECT 'Sample receipts:' as info;
SELECT id, receipt_number, total FROM sales ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- ✅ DONE!
-- =====================================================

SELECT '
✅ All features installed successfully!

What was fixed:
1. Users table created
2. Auth users synced
3. Receipt numbers added to all sales
4. Auto-generate function for new sales

Test it:
- Go to User Management → Should see users
- Go to Sales → Should see receipt numbers
- Create new sale → Auto-generates receipt number

' as success_message;
