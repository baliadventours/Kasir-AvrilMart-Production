# ⚠️ IMPORTANT: Database Setup Required

## Status Aplikasi

Aplikasi POS sekarang sudah terintegrasi dengan **Supabase Database** untuk penyimpanan data yang persistent dan aman.

## 🚨 Before Using This App

**Database schema HARUS disetup terlebih dahulu** di Supabase sebelum aplikasi bisa berfungsi!

### Quick Setup (5 menit):

1. **Buka Supabase Dashboard**
   - Login ke: https://app.supabase.com
   - Project ID: `ybvbnfoahysmkigqamqp`

2. **Jalankan Database Schema**
   - Buka **SQL Editor** (sidebar kiri)
   - Klik **"New Query"**
   - Copy semua isi dari file `supabase-schema.sql`
   - Paste ke SQL Editor
   - Klik **"Run"**

3. **Verify Setup**
   - Jika berhasil, akan muncul: "Success. No rows returned"
   - Cek di **Table Editor** - harus ada 3 tabel:
     - ✅ products
     - ✅ sales
     - ✅ sale_items

4. **Test Aplikasi**
   - Refresh aplikasi ini
   - Login dengan admin yang sudah dibuat
   - Seharusnya muncul 6 sample products

## ❓ What Does the Schema Create?

### Tables:
- **products** - Menyimpan data produk dengan harga retail & wholesale
- **sales** - Menyimpan transaksi penjualan
- **sale_items** - Menyimpan detail item per transaksi

### Security:
- Row Level Security (RLS) policies untuk proteksi data
- Authenticated users only access
- Admin dapat akses semua data, Kasir hanya data sendiri

### Automation:
- Auto-update stock setelah penjualan
- Auto-timestamp untuk created_at dan updated_at
- Validation untuk price types (retail/wholesale)

### Sample Data:
6 produk contoh sudah termasuk:
- Wireless Headphones
- Smart Watch
- Coffee Mug
- Notebook Set
- Desk Lamp
- Water Bottle

## 🔄 Migration from localStorage

Jika Anda sebelumnya menggunakan localStorage:
- Data lama tidak akan otomatis ter-migrate
- Anda perlu input ulang data produk
- Atau export localStorage → import ke database secara manual

## 📚 Documentation

Untuk panduan lengkap deployment ke production:
- **DEPLOYMENT.md** - Panduan deploy ke Vercel + Supabase
- **QUICKSTART.md** - Quick setup guide
- **supabase-schema.sql** - Database schema lengkap

## 🆘 Help

Jika mengalami error:
1. Pastikan schema sudah dijalankan di Supabase
2. Cek console browser (F12) untuk error messages
3. Verify credentials di `/utils/supabase/info.tsx`

---

**Status**: ⚠️ Menunggu database setup di Supabase
