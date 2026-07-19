# 👥 CARA TAMBAH USER BARU (KASIR/ADMIN)

## ⚠️ **KENAPA TIDAK BISA CREATE USER OTOMATIS?**

Supabase Auth membatasi pembuatan user dari **client-side (browser)** untuk keamanan.  
User hanya bisa dibuat via:
- **Supabase Dashboard** (admin panel)
- **Server-side API** (tidak tersedia di frontend-only app)
- **SQL Query** (manual)

---

## ✅ **2 METODE CREATE USER**

### **📍 METODE 1: Via Supabase Dashboard (TERMUDAH)**

**STEP 1: Create User**

1. Buka **Supabase Dashboard**
2. Pilih project Anda
3. Go to **Authentication → Users**
4. Klik **Add User** → **Create new user**
5. Isi form:
   ```
   Email: kasir1@avrilmart.com
   Password: kasir123
   Auto Confirm User: ✅ HARUS ON!
   ```
6. Klik **Create User**
7. User akan muncul di list

**STEP 2: Set Role via SQL**

1. Tetap di Supabase Dashboard
2. Klik **SQL Editor** di sidebar
3. Klik **New query**
4. Copy & paste query ini:

```sql
-- Set role untuk user baru
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Kasir 1',
  'role', 'cashier'
)
WHERE email = 'kasir1@avrilmart.com';

-- Tambahkan ke users table
INSERT INTO public.users (id, name, email, role)
SELECT id, 'Kasir 1', email, 'cashier'
FROM auth.users
WHERE email = 'kasir1@avrilmart.com'
ON CONFLICT (id) DO NOTHING;
```

5. **Ganti email dan name** sesuai user yang baru dibuat
6. Klik **RUN** (atau Ctrl+Enter)

**STEP 3: Verify**

```sql
-- Check user berhasil dibuat
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'kasir1@avrilmart.com';

-- Check di users table
SELECT * FROM public.users
WHERE email = 'kasir1@avrilmart.com';
```

**Expected result:**
```
email: kasir1@avrilmart.com
name: Kasir 1
role: cashier
```

**✅ Done! User siap login.**

---

### **📍 METODE 2: Via SQL Only (ADVANCED)**

**Untuk admin yang familiar dengan SQL:**

```sql
-- Option A: Create via SQL (NOT RECOMMENDED - hanya untuk testing)
-- Supabase auth tidak support direct insert ke auth.users

-- Option B: Create via Dashboard lalu run ini
-- (Sama seperti Metode 1 STEP 2)
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Kasir 2',
  'role', 'cashier'
)
WHERE email = 'kasir2@avrilmart.com';

INSERT INTO public.users (id, name, email, role)
SELECT id, 'Kasir 2', email, 'cashier'
FROM auth.users
WHERE email = 'kasir2@avrilmart.com'
ON CONFLICT (id) DO NOTHING;
```

---

## 🎯 **QUICK TEMPLATE: CREATE KASIR**

```sql
-- 1. Create user via Dashboard dengan email & password
-- 2. Run query ini (ganti EMAIL dan NAME)

UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'NAMA_KASIR_DISINI',
  'role', 'cashier'
)
WHERE email = 'EMAIL_KASIR_DISINI';

INSERT INTO public.users (id, name, email, role)
SELECT id, 'NAMA_KASIR_DISINI', email, 'cashier'
FROM auth.users
WHERE email = 'EMAIL_KASIR_DISINI'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'EMAIL_KASIR_DISINI';
```

---

## 🎯 **QUICK TEMPLATE: CREATE ADMIN**

```sql
-- 1. Create user via Dashboard dengan email & password
-- 2. Run query ini (ganti EMAIL dan NAME)

UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'NAMA_ADMIN_DISINI',
  'role', 'admin'
)
WHERE email = 'EMAIL_ADMIN_DISINI';

INSERT INTO public.users (id, name, email, role)
SELECT id, 'NAMA_ADMIN_DISINI', email, 'admin'
FROM auth.users
WHERE email = 'EMAIL_ADMIN_DISINI'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT email, raw_user_meta_data FROM auth.users WHERE email = 'EMAIL_ADMIN_DISINI';
```

---

## 📋 **EXAMPLE: CREATE 3 KASIR SEKALIGUS**

**STEP 1:** Create 3 users via Dashboard:
```
kasir1@avrilmart.com (password: kasir123)
kasir2@avrilmart.com (password: kasir123)
kasir3@avrilmart.com (password: kasir123)
```

**STEP 2:** Run query ini di SQL Editor:

```sql
-- Set roles
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 
  CASE email
    WHEN 'kasir1@avrilmart.com' THEN 'Kasir 1 - Pagi'
    WHEN 'kasir2@avrilmart.com' THEN 'Kasir 2 - Siang'
    WHEN 'kasir3@avrilmart.com' THEN 'Kasir 3 - Malam'
  END,
  'role', 'cashier'
)
WHERE email IN ('kasir1@avrilmart.com', 'kasir2@avrilmart.com', 'kasir3@avrilmart.com');

-- Insert to users table
INSERT INTO public.users (id, name, email, role)
SELECT 
  id, 
  CASE email
    WHEN 'kasir1@avrilmart.com' THEN 'Kasir 1 - Pagi'
    WHEN 'kasir2@avrilmart.com' THEN 'Kasir 2 - Siang'
    WHEN 'kasir3@avrilmart.com' THEN 'Kasir 3 - Malam'
  END as name,
  email,
  'cashier' as role
FROM auth.users
WHERE email IN ('kasir1@avrilmart.com', 'kasir2@avrilmart.com', 'kasir3@avrilmart.com')
ON CONFLICT (id) DO NOTHING;

-- Verify all 3
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email LIKE '%kasir%@avrilmart.com'
ORDER BY email;
```

**✅ 3 kasir ready!**

---

## 🔧 **TROUBLESHOOTING**

### **❌ Error: "duplicate key value violates unique constraint"**

**Solusi:**
```sql
-- User sudah ada di users table, tinggal update metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Kasir 1',
  'role', 'cashier'
)
WHERE email = 'kasir1@avrilmart.com';
```

---

### **❌ User tidak muncul di aplikasi setelah dibuat**

**Solusi:**
1. Refresh halaman User Management
2. Check di SQL:
   ```sql
   SELECT * FROM public.users;
   ```
3. Jika tidak ada, run insert query lagi:
   ```sql
   INSERT INTO public.users (id, name, email, role)
   SELECT id, raw_user_meta_data->>'name', email, raw_user_meta_data->>'role'
   FROM auth.users
   WHERE email = 'kasir1@avrilmart.com'
   ON CONFLICT (id) DO NOTHING;
   ```

---

### **❌ User bisa login tapi menu admin tidak muncul**

**Solusi:**
```sql
-- Check role
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'YOUR_EMAIL';

-- Jika bukan 'admin', update:
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', raw_user_meta_data->>'name',
  'role', 'admin'
)
WHERE email = 'YOUR_EMAIL';

-- Logout dan login lagi
```

---

## ✅ **VERIFICATION CHECKLIST**

Setelah create user, verify dengan queries ini:

```sql
-- ✅ Check 1: User ada di auth.users
SELECT 
  email,
  raw_user_meta_data->>'name' as name,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- ✅ Check 2: User ada di public.users
SELECT * FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- ✅ Check 3: Sync check (harus sama)
SELECT 
  a.email,
  a.raw_user_meta_data->>'name' as auth_name,
  p.name as users_name,
  a.raw_user_meta_data->>'role' as auth_role,
  p.role as users_role
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE a.email LIKE '%@avrilmart.com'
ORDER BY a.created_at DESC;
```

**Expected:** Semua kolom harus match (auth_name = users_name, auth_role = users_role)

---

## 📊 **USER ROLES EXPLAINED**

### **👑 Admin:**
```
Permissions:
✅ Kasir (POS)
✅ Inventori
✅ Kategori
✅ Riwayat Penjualan
✅ Laporan
✅ Pengguna (User Management)

Create Admin:
role = 'admin'
```

### **💰 Kasir:**
```
Permissions:
✅ Kasir (POS)
✅ Riwayat Penjualan (own sales only)
❌ Inventori
❌ Kategori
❌ Laporan
❌ Pengguna

Create Kasir:
role = 'cashier'
```

---

## 🎉 **SUMMARY**

**Untuk create user baru:**

1. **Supabase Dashboard** → Authentication → Users → **Add User**
2. Email, Password, **Auto Confirm ON**
3. **SQL Editor** → Run update query
4. **Verify** dengan SELECT query
5. **User ready** to login!

**Alternative:** Gunakan template SQL di atas untuk create multiple users sekaligus.

---

## 📁 **FILES TERKAIT**

```
✅ /src/sql/add-users-table.sql
   → Setup users table (run once)

✅ /src/sql/create-admin-user.sql
   → Template create admin

✅ /QUICK_START.md
   → Complete setup guide
```

---

Last Updated: February 27, 2026
