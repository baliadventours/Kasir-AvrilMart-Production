# 🚀 Deploy Guide: POS & Inventory Management System

Panduan lengkap untuk deploy aplikasi POS ke Vercel dengan Supabase database.

---

## 📋 Prerequisites

- Akun [Vercel](https://vercel.com) (gratis)
- Akun [Supabase](https://supabase.com) (gratis)
- Node.js 18+ terinstall
- Git terinstall

---

## 🗄️ Step 1: Setup Supabase Database

### 1.1 Buat Project Supabase

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Klik **"New Project"**
3. Isi informasi:
   - **Name**: `pos-inventory` (atau nama lain)
   - **Database Password**: Buat password yang kuat (SIMPAN INI!)
   - **Region**: Pilih yang terdekat (e.g., Singapore)
4. Klik **"Create new project"**
5. Tunggu 2-3 menit sampai project selesai dibuat

### 1.2 Jalankan Database Schema

⚠️ **PENTING**: Langkah ini WAJIB dilakukan sebelum menggunakan aplikasi!

1. Di Supabase Dashboard, buka **SQL Editor** (sidebar kiri)
2. Klik **"New Query"**
3. Copy semua isi file `supabase-schema.sql` dari root project
4. Paste ke SQL Editor
5. Klik **"Run"** atau tekan `Ctrl+Enter`
6. ✅ Pastikan muncul pesan "Success. No rows returned"

**Yang dibuat oleh schema:**
- ✅ Tabel products, sales, sale_items
- ✅ Triggers untuk auto-update stock
- ✅ Row Level Security policies
- ✅ Views untuk reporting
- ✅ Sample data produk (6 produk contoh)

### 1.3 Setup Authentication

1. Di sidebar, klik **Authentication** → **Providers**
2. **Email** provider sudah aktif secara default
3. (Opsional) Aktifkan **Email Confirmations** jika ingin email verification:
   - Scroll ke **Auth Providers** → **Email**
   - Toggle **"Enable email confirmations"**
   - Konfigurasi SMTP settings (atau gunakan default Supabase)

### 1.4 Catat API Credentials

1. Di sidebar, klik **Project Settings** (icon gear) → **API**
2. Catat informasi berikut:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (key yang panjang)
   - **service_role key**: `eyJhbGc...` (key secret, JANGAN share!)

---

## 🔧 Step 2: Setup Supabase Edge Function (untuk Signup)

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Login ke Supabase

```bash
supabase login
```

### 2.3 Link Project

```bash
# Di root folder project
supabase link --project-ref xxxxx
# Ganti xxxxx dengan Project ID dari dashboard
```

### 2.4 Deploy Edge Function

```bash
# Deploy fungsi signup
supabase functions deploy server

# Set environment variables
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🌐 Step 3: Setup Environment Variables

### 3.1 Buat File .env.local

Di root project, buat file `.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

⚠️ **PENTING**: 
- Ganti `xxxxx` dengan project ID Anda
- Ganti `eyJhbGc...` dengan anon key Anda
- File `.env.local` sudah ada di `.gitignore` (tidak akan di-commit)

### 3.2 Update `/utils/supabase/info.tsx`

Edit file `/utils/supabase/info.tsx`:

```typescript
export const projectId = "xxxxx" // Project ID Anda
export const publicAnonKey = "eyJhbGc..." // Anon key Anda
```

---

## 🚀 Step 4: Deploy ke Vercel

### 4.1 Push ke GitHub

```bash
# Initialize git (jika belum)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - POS App"

# Create GitHub repo dan push
git remote add origin https://github.com/username/pos-app.git
git push -u origin main
```

### 4.2 Deploy di Vercel

1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Klik **"Add New"** → **"Project"**
3. Import GitHub repository Anda
4. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables** - Tambahkan:
   ```
   VITE_SUPABASE_URL = https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGc...
   ```
6. Klik **"Deploy"**
7. Tunggu 2-3 menit
8. ✅ Aplikasi sekarang live!

---

## 👤 Step 5: Buat Admin Pertama

⚠️ **PENTING**: Tidak ada fitur sign-up publik. Admin pertama HARUS dibuat via Supabase Dashboard. Setelah itu, admin dapat membuat user lain (admin atau kasir) melalui aplikasi.

### Cara Membuat Admin Pertama - Via Supabase Dashboard

1. Buka **Authentication** → **Users** di Supabase Dashboard
2. Klik **"Add user"** → **"Create new user"**
3. Isi:
   - Email: `admin@toko.com`
   - Password: `admin123456`
   - Auto Confirm User: ✅ (centang)
4. Klik **"Create user"**
5. Klik user yang baru dibuat
6. Scroll ke **"User Metadata"**
7. Klik **"Edit"** dan tambahkan JSON:
   ```json
   {
     "name": "Administrator",
     "role": "admin"
   }
   ```
8. Klik **"Save"**

### ✅ Sekarang Anda Bisa Login!

Login dengan:
- **Email**: `admin@toko.com`
- **Password**: `admin123456`

---

## 🔐 Step 6: Login & Test

1. Buka aplikasi Anda
2. Login dengan:
   - **Email**: `admin@toko.com`
   - **Password**: `admin123456`
3. ✅ Sekarang Anda bisa:
   - Menambah produk
   - Proses transaksi
   - Lihat sales history
   - Tambah user kasir

---

## 📱 Step 7: Tambah Kasir

1. Login sebagai admin
2. Klik tab **"Users"**
3. Klik **"Tambah User"**
4. Isi data kasir:
   - Nama: `Kasir 1`
   - Email: `kasir1@toko.com`
   - Password: `kasir123`
   - Role: **Kasir**
5. Klik **"Tambah User"**

---

## 🔄 Update & Redeploy

Setiap kali ada perubahan code:

```bash
# Commit changes
git add .
git commit -m "Update feature"

# Push to GitHub
git push

# Vercel akan auto-deploy!
```

---

## 🐛 Troubleshooting

### ❌ "Failed to fetch" error saat signup

**Penyebab**: Edge function belum deployed atau URL salah

**Solusi**:
1. Cek apakah edge function sudah deployed:
   ```bash
   supabase functions list
   ```
2. Deploy ulang:
   ```bash
   supabase functions deploy server
   ```

### ❌ "Invalid JWT" error

**Penyebab**: Anon key tidak valid atau environment variable salah

**Solusi**:
1. Verifikasi anon key di Supabase Dashboard
2. Update environment variables di Vercel
3. Redeploy aplikasi

### ❌ "Row Level Security" error

**Penyebab**: RLS policies belum di-setup dengan benar

**Solusi**:
1. Jalankan ulang `supabase-schema.sql`
2. Atau disable RLS sementara untuk testing (TIDAK untuk production!)

### ❌ Database error saat create product

**Penyebab**: Schema tidak lengkap atau RLS policies

**Solusi**:
1. Cek di **SQL Editor**:
   ```sql
   SELECT * FROM products LIMIT 1;
   ```
2. Jika error, jalankan ulang schema

---

## 📊 Monitoring

### Supabase Dashboard

- **Database**: Monitor queries dan performance
- **Authentication**: Lihat user yang login
- **Storage**: Jika pakai upload gambar
- **Logs**: Debug errors

### Vercel Dashboard

- **Analytics**: Traffic aplikasi
- **Logs**: Runtime errors
- **Deployments**: History deployment

---

## 🔒 Security Checklist

✅ **Service Role Key** tidak ada di frontend code
✅ **RLS Policies** sudah aktif
✅ **Environment variables** tidak di-commit ke git
✅ **HTTPS** otomatis dari Vercel
✅ **Admin role** hanya untuk user terpercaya

---

## 🎉 Selesai!

Aplikasi POS Anda sekarang live dan production-ready!

**URL Aplikasi**: `https://your-app.vercel.app`

### Next Steps (Optional):

1. **Custom Domain**: Hubungkan domain sendiri di Vercel
2. **Email SMTP**: Setup email sendiri di Supabase untuk password reset
3. **Backup**: Setup automatic database backup
4. **Analytics**: Integrasikan Google Analytics
5. **PWA**: Tambahkan service worker untuk offline mode

---

## 📞 Support

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **GitHub Issues**: Buat issue untuk bug reports

---

**Happy Selling! 🛒💰**