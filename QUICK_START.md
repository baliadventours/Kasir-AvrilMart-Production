# ⚡ QUICK START - 3 LANGKAH MUDAH

## 🎯 **SETUP DALAM 5 MENIT**

---

## **STEP 1: Setup Database (2 menit)**

### **A. Run Database Schema:**

1. Buka **Supabase Dashboard**
2. Klik **SQL Editor** (sidebar kiri)
3. Klik **New query**
4. Copy **SEMUA** content dari file:
   ```
   /src/sql/database-schema.sql
   ```
5. Paste ke SQL Editor
6. Klik **RUN** (atau Ctrl+Enter)
7. Tunggu sampai selesai - akan muncul success message

**✅ Done! Database ready dengan 10 products**

---

## **STEP 2: Create Admin User (2 menit)**

### **🔧 FIX: Jika Ada Error "Infinite Recursion"**

**Run ini DULU di SQL Editor:**

```sql
-- Fix RLS error
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Verify fixed
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'auth' AND tablename = 'users';
-- Should show: rowsecurity = false
```

**📝 Full fix script:** `/src/sql/fix-auth-error.sql`

---

### **A. Create User via Supabase Dashboard:**

**⚠️ JANGAN signup via aplikasi (bisa error)! Use Dashboard:**

1. Buka **Supabase Dashboard**
2. Klik **Authentication → Users**
3. Klik **Add User** → **Create new user**
4. Isi form:
   ```
   Email: admin@avrilmart.com
   Password: admin123
   Auto Confirm User: ✅ HARUS ON!
   ```
5. Klik **Create User**
6. User akan muncul di list

**✅ User created**

---

### **B. Set Role Admin via SQL:**

1. Tetap di **Supabase → SQL Editor**
2. Klik **New query**
3. Copy query ini:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
     'name', 'Admin AvrilMart',
     'role', 'admin'
   )
   WHERE email = 'admin@avrilmart.com';
   ```
4. Paste dan **RUN**
5. Verify dengan query ini:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'admin@avrilmart.com';
   ```
6. Pastikan muncul: `{"name": "Admin AvrilMart", "role": "admin"}`

**✅ Done! Admin user ready**

---

## **STEP 3: Login & Test (1 menit)**

### **A. Login:**

1. Kembali ke aplikasi
2. Login dengan:
   ```
   Email: admin@avrilmart.com
   Password: admin123
   ```

---

### **B. Verify Menu:**

Menu yang **HARUS** muncul di sidebar:

```
✅ Kasir
✅ Inventori
✅ Kategori
✅ Riwayat Penjualan
✅ Laporan
✅ Pengguna
```

**Jika hanya muncul "Kasir" dan "Riwayat"** = Role belum admin, ulangi STEP 2B

---

### **C. Test Features:**

**Test 1: Check Products**
```
1. Klik menu "Inventori"
2. Harus muncul 10 products
3. Test search box
4. Test filter category
```

**Test 2: Test POS**
```
1. Klik menu "Kasir"
2. Search "aqua"
3. Klik "Tambah" - harus masuk cart
4. Isi "Jumlah Bayar" (misal: 10000)
5. Klik "Proses Pembayaran"
6. Success! ✅
```

**Test 3: Check Stock**
```
1. Kembali ke "Inventori"
2. Cari "Aqua Botol"
3. Stock harus berkurang (tadinya 100)
4. Auto decrease works! ✅
```

---

## 🎉 **SELESAI!**

Aplikasi sudah siap digunakan!

---

## 🐛 **TROUBLESHOOTING**

### **❌ Menu admin tidak muncul:**

**Solusi:**
```sql
-- Run query ini untuk check role:
SELECT email, raw_user_meta_data 
FROM auth.users;

-- Jika role bukan "admin", run ini:
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'name', 'Admin AvrilMart',
  'role', 'admin'
)
WHERE email = 'admin@avrilmart.com';

-- Logout dan login lagi
```

---

### **❌ Products tidak muncul:**

**Solusi:**
```
1. Buka browser console (F12)
2. Check error messages
3. Verify products di Supabase:
   SELECT * FROM products LIMIT 5;
4. Clear cache (Ctrl+Shift+R)
```

---

### **❌ Email confirmation tidak datang:**

**Solusi:**
```
Option A: Check spam folder

Option B: Create user via Supabase Dashboard
1. Supabase → Authentication → Users
2. Add User → Create new user
3. Email: admin@avrilmart.com
4. Password: admin123
5. Auto Confirm: ✅ ON
6. Create
7. Lalu run SQL untuk set role (STEP 2B)
```

---

### **❌ Error "Failed to fetch":**

**Solusi:**
```
1. Check Supabase credentials di browser console
2. Verify project URL di /.supabase/info.json
3. Clear browser cache
4. Hard refresh (Ctrl+Shift+R)
```

---

## 📞 **NEED HELP?**

**Check Documentation:**
- `/DATABASE_SETUP.md` - Full setup guide
- `/src/sql/create-admin-user.sql` - Admin user queries
- `/RESET_SUMMARY.md` - Complete features list

**Common Queries:**

```sql
-- Check all users
SELECT email, raw_user_meta_data FROM auth.users;

-- Check all products
SELECT name, sku, stock FROM products;

-- Check recent sales
SELECT * FROM sales ORDER BY created_at DESC LIMIT 5;

-- Reset stock (if needed)
UPDATE products SET stock = 100;
```

---

## 🚀 **READY TO SELL!**

Database ✅  
Admin User ✅  
10 Sample Products ✅  
All Features Active ✅  

**Happy Selling! 🛒💰✨**

---

Last Updated: February 27, 2026