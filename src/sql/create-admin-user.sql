-- =====================================================
-- CREATE ADMIN USER - SIMPLE METHOD
-- =====================================================
-- IMPORTANT: Jangan signup via aplikasi (bisa error RLS)
-- Cara pakai:
-- 1. Create user via Supabase Dashboard (lihat STEP 0)
-- 2. Run script ini untuk set role
-- =====================================================

-- =====================================================
-- STEP 0: Create User via Supabase Dashboard
-- =====================================================
-- 1. Buka Supabase Dashboard → Authentication → Users
-- 2. Klik "Add User" → "Create new user"
-- 3. Isi:
--    - Email: admin@avrilmart.com
--    - Password: admin123 (atau password lain)
--    - Auto Confirm User: ✅ HARUS ON!
-- 4. Klik "Create User"
-- 5. User akan muncul di list
-- 6. Lanjut ke OPTION 2 di bawah
-- =====================================================

-- =====================================================
-- OPTION 1: Update Existing User to Admin
-- =====================================================
-- Ganti 'USER_ID_HERE' dengan User ID dari dashboard
-- Ganti 'Nama Admin' sesuai keinginan

UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Admin AvrilMart',
  'role', 'admin'
)
WHERE id = 'USER_ID_HERE';

-- Verification: Check user metadata
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE id = 'USER_ID_HERE';

-- =====================================================
-- OPTION 2: Update by Email (Lebih Mudah)
-- =====================================================
-- Ganti 'admin@avrilmart.com' dengan email yang sudah signup

UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Admin AvrilMart',
  'role', 'admin'
)
WHERE email = 'admin@avrilmart.com';

-- Verification: Check all users
SELECT id, email, raw_user_meta_data->>'role' as role, raw_user_meta_data->>'name' as name
FROM auth.users;

-- =====================================================
-- OPTION 3: Create Multiple Users at Once
-- =====================================================
-- Update semua user yang sudah signup sekaligus

-- User 1: Set as Admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Admin AvrilMart',
  'role', 'admin'
)
WHERE email = 'admin@avrilmart.com';

-- User 2: Set as Cashier (optional)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Kasir 1',
  'role', 'cashier'
)
WHERE email = 'kasir@avrilmart.com';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check all users with roles
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as is_confirmed,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check specific user
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@avrilmart.com';

-- =====================================================
-- NOTES
-- =====================================================
-- 
-- Role options:
-- - 'admin' = Full access (semua menu)
-- - 'cashier' = POS only (kasir only)
--
-- Setelah update, user harus logout dan login lagi
-- untuk refresh role di aplikasi
--
-- =====================================================