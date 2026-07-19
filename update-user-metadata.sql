-- Update User Metadata untuk Admin
-- Jalankan di Supabase Dashboard → SQL Editor

-- Replace 'avrilmart.com@gmail.com' dengan email Anda
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'email_verified', true,
  'name', 'Administrator',
  'role', 'admin'
)
WHERE email = 'avrilmart.com@gmail.com';

-- Verify the update
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'avrilmart.com@gmail.com';
