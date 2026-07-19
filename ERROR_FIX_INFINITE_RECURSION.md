# 🔧 ERROR FIX - INFINITE RECURSION

## ❌ **ERROR:**
```
Error creating user
infinite recursion detected in policy for relation "users"
```

---

## 🔍 **PENYEBAB:**

Error ini terjadi karena ada **RLS (Row Level Security) policies** di table `auth.users` yang menyebabkan infinite loop.

**Root Cause:**
- Supabase `auth.users` adalah **internal table** milik Supabase Auth
- Table ini **TIDAK BOLEH** punya custom RLS policies
- Jika ada RLS policies custom, akan terjadi infinite recursion

---

## ✅ **SOLUSI:**

### **STEP 1: Fix RLS - Disable RLS di auth.users**

**Run query ini di Supabase SQL Editor:**

```sql
-- Disable RLS di auth.users
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Drop semua policies yang mungkin ada
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

-- Verify: Check RLS status (harus FALSE)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';
-- Expected: rowsecurity = false

-- Verify: Check policies (harus EMPTY)
SELECT * FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';
-- Expected: no rows returned
```

**✅ Error fixed!**

---

### **STEP 2: Create Admin User - Cara Benar**

**⚠️ JANGAN signup via aplikasi! Use Supabase Dashboard:**

**A. Create User via Dashboard:**

1. Buka **Supabase Dashboard**
2. Go to **Authentication → Users**
3. Klik **Add User** → **Create new user**
4. Isi form:
   ```
   Email: admin@avrilmart.com
   Password: admin123
   Auto Confirm User: ✅ HARUS ON!
   ```
5. Klik **Create User**
6. User muncul di list ✅

---

**B. Set Role via SQL:**

1. Buka **SQL Editor**
2. Run query ini:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
     'name', 'Admin AvrilMart',
     'role', 'admin'
   )
   WHERE email = 'admin@avrilmart.com';
   ```

3. Verify:
   ```sql
   SELECT 
     email, 
     raw_user_meta_data->>'name' as name,
     raw_user_meta_data->>'role' as role
   FROM auth.users 
   WHERE email = 'admin@avrilmart.com';
   ```

   Expected result:
   ```
   email: admin@avrilmart.com
   name: Admin AvrilMart
   role: admin
   ```

**✅ Admin user ready!**

---

**C. Login & Test:**

1. Go to aplikasi
2. Login dengan:
   ```
   Email: admin@avrilmart.com
   Password: admin123
   ```
3. Verify menu muncul:
   ```
   ✅ Kasir
   ✅ Inventori
   ✅ Kategori
   ✅ Riwayat Penjualan
   ✅ Laporan
   ✅ Pengguna
   ```

**✅ All working!**

---

## 📝 **VERIFICATION CHECKLIST**

Run queries ini untuk pastikan semuanya OK:

```sql
-- ✅ Check 1: RLS disabled di auth.users
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';
-- Expected: rowsecurity = false

-- ✅ Check 2: No policies di auth.users
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'users';
-- Expected: policy_count = 0

-- ✅ Check 3: Admin user exists
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users 
WHERE email = 'admin@avrilmart.com';
-- Expected: role = 'admin', is_confirmed = true

-- ✅ Check 4: Products table OK
SELECT COUNT(*) as product_count FROM products;
-- Expected: product_count = 10

-- ✅ Check 5: RLS enabled di public tables (not auth)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('products', 'sales', 'categories', 'sale_items');
-- Expected: All rowsecurity = true
```

---

## 🔄 **UNTUK USER SELANJUTNYA (KASIR):**

**Create Cashier User:**

1. **Via Dashboard:**
   ```
   Supabase → Authentication → Users
   Add User → Create new user
   Email: kasir1@avrilmart.com
   Password: kasir123
   Auto Confirm: ✅ ON
   ```

2. **Set Role via SQL:**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
     'name', 'Kasir 1',
     'role', 'cashier'
   )
   WHERE email = 'kasir1@avrilmart.com';
   ```

3. **Verify:**
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'kasir1@avrilmart.com';
   ```

**✅ Kasir user ready!**

---

## 🐛 **TROUBLESHOOTING LAIN:**

### **Error: "Failed to fetch"**
```
1. Check Supabase credentials
2. Verify /.supabase/info.json
3. Hard refresh (Ctrl+Shift+R)
```

### **Error: "Invalid login credentials"**
```
1. Check password benar
2. Check email confirmed (email_confirmed_at not null)
3. Try password reset di Supabase Dashboard
```

### **Error: "Row level security policy violation"**
```
1. Check RLS policies:
   SELECT * FROM pg_policies WHERE schemaname = 'public';
2. Verify user authenticated:
   SELECT auth.uid();
3. Re-run database-schema.sql untuk recreate policies
```

---

## 📚 **FILES TERKAIT:**

```
✅ /src/sql/fix-auth-error.sql - Fix script lengkap
✅ /src/sql/create-admin-user.sql - Create user queries
✅ /QUICK_START.md - Quick setup guide
✅ /DATABASE_SETUP.md - Full setup guide
```

---

## ✅ **SUMMARY:**

**Problem:**
- ❌ RLS policies di auth.users causing infinite recursion
- ❌ Signup via aplikasi error

**Solution:**
- ✅ Disable RLS di auth.users
- ✅ Drop all policies di auth.users
- ✅ Create user via Supabase Dashboard
- ✅ Set role via SQL UPDATE

**Result:**
- ✅ No more errors
- ✅ Admin user working
- ✅ All menus accessible
- ✅ POS functioning

---

## 🎉 **DONE!**

Error fixed! Aplikasi siap digunakan! 🚀

**Next:** Follow `/QUICK_START.md` untuk complete setup.

---

Last Updated: February 27, 2026
