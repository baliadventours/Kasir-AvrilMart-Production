-- =====================================================
-- FIX: Infinite Recursion Error - Auth Users
-- =====================================================
-- Error: "infinite recursion detected in policy for relation 'users'"
-- Cause: Custom RLS policies di auth.users table (TIDAK BOLEH!)
-- Solution: Drop all RLS policies di auth.users
-- =====================================================

-- STEP 1: Drop RLS policies dari auth.users
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop semua policies yang mungkin ada
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'auth' AND tablename = 'users'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- STEP 3: Verify - pastikan tidak ada policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Should return empty (no rows)

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS status (should be FALSE)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';

-- Check policies (should be empty)
SELECT * FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT '✅ RLS policies removed from auth.users
✅ Infinite recursion error fixed
✅ You can now create users via Supabase Dashboard

Next: Create admin user via Dashboard (see guide below)
' as message;
