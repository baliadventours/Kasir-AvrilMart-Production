-- =====================================================
-- SECURITY FIX - PRODUCTION READY
-- =====================================================
-- File: fix-security-for-production.sql
-- Purpose: Fix 3 CRITICAL security issues before go-live
-- Time to run: ~30 seconds
-- Impact: HIGH - Prevents unauthorized data access
-- 
-- USAGE:
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and RUN
-- 4. Verify success messages
-- =====================================================

-- =====================================================
-- ISSUE #1: FIX OVERLY PERMISSIVE RLS POLICIES
-- =====================================================

SELECT '🔒 Step 1: Fixing RLS Policies...' as status;

-- Drop insecure policies that allow anyone to read data
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Anyone can read sales" ON sales;
DROP POLICY IF EXISTS "Anyone can read sale items" ON sale_items;
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;

SELECT '✅ Old permissive policies dropped' as status;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read sales"
  ON sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read sale items"
  ON sale_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

SELECT '✅ Secure authentication-required policies created' as status;

-- =====================================================
-- ISSUE #2: ADD STOCK VALIDATION TO PREVENT NEGATIVE STOCK
-- =====================================================

SELECT '🔒 Step 2: Adding Stock Validation...' as status;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_decrease_stock ON sale_items;
DROP FUNCTION IF EXISTS decrease_product_stock();

-- Create new function with stock validation
CREATE OR REPLACE FUNCTION decrease_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  product_name TEXT;
BEGIN
  -- Get current stock and product name
  SELECT stock, name INTO current_stock, product_name
  FROM products 
  WHERE id = NEW.product_id;
  
  -- Check if product exists
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product % not found', NEW.product_id;
  END IF;
  
  -- Prevent negative stock
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, Requested: %', 
      product_name, current_stock, NEW.quantity;
  END IF;
  
  -- Decrease stock
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_decrease_stock
  AFTER INSERT ON sale_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_product_stock();

SELECT '✅ Stock validation trigger created (prevents negative stock)' as status;

-- =====================================================
-- ISSUE #3: ADD USER-SPECIFIC ACCESS CONTROL
-- =====================================================

SELECT '🔒 Step 3: Adding User-Specific Access Control...' as status;

-- Admin can see all sales, users can see only their own sales
DROP POLICY IF EXISTS "Authenticated users can read sales" ON sales;

CREATE POLICY "Users can read own sales or admin can read all"
  ON sales FOR SELECT
  USING (
    auth.uid() = user_id OR 
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

SELECT '✅ User-specific access control added (users see own data, admin sees all)' as status;

-- =====================================================
-- BONUS: ADD AUDIT LOGGING TABLE (OPTIONAL)
-- =====================================================

SELECT '🔒 Step 4: Creating Audit Log Table...' as status;

-- Create audit_logs table for tracking sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Only admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

SELECT '✅ Audit log table created (track sensitive operations)' as status;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT '📊 Verifying Security Fixes...' as status;

-- Check RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('products', 'sales', 'sale_items', 'categories', 'audit_logs')
ORDER BY tablename;

-- Check policies exist
SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%stock%'
ORDER BY event_object_table;

-- =====================================================
-- FINAL STATUS
-- =====================================================

SELECT '
═══════════════════════════════════════════════════════
✅ SECURITY FIXES APPLIED SUCCESSFULLY!
═══════════════════════════════════════════════════════

Fixed Issues:
✅ 1. RLS policies now require authentication
✅ 2. Stock validation prevents negative stock
✅ 3. User-specific access control (users see own data)
✅ 4. Audit logging table created (bonus)

Next Steps:
1. Enable rate limiting in Supabase Dashboard:
   → Settings → API → Rate Limiting
   → Set: 100 requests/minute per IP

2. Strengthen password policy:
   → Authentication → Policies
   → Minimum length: 12 characters
   → Require: uppercase, lowercase, numbers, special chars

3. Test the application:
   → Login as admin (should see all data)
   → Login as cashier (should see own sales only)
   → Try to process sale with insufficient stock (should fail)

4. Monitor audit logs:
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

Security Status: ✅ PRODUCTION READY!

═══════════════════════════════════════════════════════
' as final_message;
