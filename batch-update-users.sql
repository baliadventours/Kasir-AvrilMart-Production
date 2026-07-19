-- Batch Update User Metadata
-- Jalankan di Supabase Dashboard → SQL Editor

-- Option 1: Update specific user jadi admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'email_verified', true,
  'name', 'Administrator',
  'role', 'admin'
)
WHERE email = 'admin@toko.com';

-- Option 2: Update specific user jadi kasir
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'email_verified', true,
  'name', 'Kasir Toko',
  'role', 'cashier'
)
WHERE email = 'kasir@toko.com';

-- Option 3: Update ALL existing users jadi admin (HATI-HATI!)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || 
--   jsonb_build_object('name', email, 'role', 'admin')
-- WHERE raw_user_meta_data->>'role' IS NULL;

-- Verify: Show all users with metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC;
