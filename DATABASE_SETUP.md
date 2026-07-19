# 🚀 SETUP DATABASE - VERSION 21

## ✅ LANGKAH MUDAH SETUP DATABASE

### **STEP 1: Run Database Schema**

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda

2. **Buka SQL Editor**
   - Klik menu "SQL Editor" di sidebar
   - Klik "New query"

3. **Copy & Paste Script**
   - Buka file: `/src/sql/database-schema.sql`
   - Copy SEMUA isi file
   - Paste ke SQL Editor
   - Klik "Run" atau Ctrl+Enter

4. **Tunggu selesai** - Success message akan muncul

---

### **STEP 2: Setup Admin User**

### **🔧 FIX DULU: Jika Error "Infinite Recursion"**

**Run query ini di SQL Editor:**

```sql
-- Fix RLS error di auth.users table
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
```

**📝 Full fix:** `/src/sql/fix-auth-error.sql`

---

**⭐ CARA MUDAH (RECOMMENDED) ⭐**

**A. Create User via Supabase Dashboard:**

**⚠️ JANGAN signup via aplikasi (bisa error)!**

1. Buka **Supabase Dashboard → Authentication → Users**
2. Klik **Add User** → **Create new user**
3. Isi:
   ```
   Email: admin@avrilmart.com
   Password: admin123
   Auto Confirm User: ✅ HARUS ON!
   ```
4. Klik **Create User**
5. User akan muncul di list

**B. Set Role via SQL:**

1. Buka **Supabase Dashboard → SQL Editor**
2. Copy query **OPTION 2** (Update by Email):
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = jsonb_build_object(
     'name', 'Admin AvrilMart',
     'role', 'admin'
   )
   WHERE email = 'admin@avrilmart.com';
   ```
3. Paste ke SQL Editor dan **RUN**
4. **Verify** dengan query ini:
   ```sql
   SELECT email, raw_user_meta_data 
   FROM auth.users 
   WHERE email = 'admin@avrilmart.com';
   ```

**C. Login:**

1. Kembali ke aplikasi
2. Login dengan `admin@avrilmart.com`
3. Semua menu admin harus muncul ✅

---

**📝 File lengkap:** `/src/sql/create-admin-user.sql`

---

### **STEP 3: Login & Test**

1. **Login** dengan admin credentials
2. **Verify menu:**
   - ✅ Kasir (POS)
   - ✅ Inventori
   - ✅ Kategori
   - ✅ Riwayat Penjualan
   - ✅ Laporan
   - ✅ Pengguna

3. **Test products:**
   - Klik menu "Inventori"
   - Harus ada 10 sample products
   - Test search, filter, edit, delete

4. **Test POS:**
   - Klik menu "Kasir"
   - Add product to cart
   - Process sale
   - Check stock berkurang otomatis

---

## 📊 YANG SUDAH DIBUAT

### **Tables:**
```
✅ categories (10 sample data)
✅ products (10 sample products dengan barcode)
✅ sales
✅ sale_items
```

### **Sample Products:**
```
1. Aqua Botol 600ml - 8991001010211
2. Indomie Goreng - 8992388101015
3. Kopi Kapal Api - 8992745060154
4. Teh Pucuk Harum - 8886008101114
5. Biskuit Roma - 8992741101516
6. Charger USB Type-C - 6942334300111
7. Kabel Data Type-C - 6942334300128
8. Sabun Lifebuoy - 8999999037819
9. Pasta Gigi Pepsodent - 8999999038014
10. Pulpen Standard - 8992908120115
```

### **Features Active:**
```
✅ Auto-decrease stock saat penjualan
✅ Auto-calculate total & tax
✅ Barcode scanning ready
✅ Search by name/SKU/barcode
✅ Filter by category
✅ Role-based access (admin/cashier)
✅ Thermal receipt printing (80mm)
✅ CSV bulk import
```

---

## 🔧 VERIFICATION QUERIES

Untuk verify setup berhasil, run queries ini di SQL Editor:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'products', 'sales', 'sale_items');

-- Check categories
SELECT COUNT(*) FROM categories;
SELECT name FROM categories;

-- Check products
SELECT COUNT(*) FROM products;
SELECT name, sku, barcode, stock FROM products;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('categories', 'products', 'sales', 'sale_items');
```

---

## 🎯 USER ROLES

### **Admin:**
- ✅ Full access ke semua menu
- ✅ Manage products, categories, users
- ✅ View sales & reports
- ✅ Process POS transactions

### **Cashier:**
- ✅ POS interface
- ✅ View sales history (own sales only)
- ❌ No access to inventory, categories, users, reports

---

## 🐛 TROUBLESHOOTING

### **Products tidak muncul:**
```
1. Check console (F12) untuk error
2. Verify RLS policies:
   SELECT * FROM products LIMIT 1;
3. Clear cache (Ctrl+F5)
```

### **Tidak bisa login:**
```
1. Check email confirmed di Supabase Dashboard
2. Check user_metadata ada "role" field
3. Try reset password
```

### **Menu admin tidak muncul:**
```
1. Check user_metadata di Supabase:
   {
     "name": "Admin",
     "role": "admin"  ← Must be "admin"
   }
2. Logout dan login lagi
3. Clear browser cache
```

---

## 📝 NEXT STEPS

### **Before Production:**
```
☐ Replace sample products dengan produk real
☐ Update harga sesuai market
☐ Update stock sesuai inventory
☐ Upload foto produk (optional)
☐ Setup barcode scanner hardware
☐ Test thermal printer
☐ Create kasir users
☐ Train staff
☐ Backup database
```

### **Optional Enhancements:**
```
☐ Add more categories
☐ Setup restock alerts
☐ Setup daily reports
☐ Add customer management
☐ Add supplier management
```

---

## 🎉 DONE!

Database siap digunakan! 

**File yang Diperlukan:**
- ✅ `/src/sql/database-schema.sql` - Database setup script
- ✅ `/src/app/App.tsx` - Main application (clean version)
- ✅ `/src/services/supabase.ts` - API services (clean version)

**Status:**
- ✅ Version 21 Clean
- ✅ No extra files
- ✅ No getUserProfile complexity
- ✅ Simple & works!

---

Last Updated: February 27, 2026
Version: 21 (Clean & Simple)