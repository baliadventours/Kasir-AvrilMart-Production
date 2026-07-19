# Setup Database Categories

## Cara Setup Tabel Categories di Supabase

### 1. **Login ke Supabase Dashboard**
   - Buka https://supabase.com/dashboard
   - Pilih project Anda

### 2. **Buka SQL Editor**
   - Di sidebar kiri, klik **SQL Editor**
   - Klik **New Query**

### 3. **Copy & Paste SQL Script**
   - Copy semua isi file `/src/sql/create_categories_table.sql`
   - Paste ke SQL Editor
   - Klik **Run** atau tekan `Ctrl+Enter`

### 4. **Verifikasi Table Berhasil Dibuat**
   - Buka **Table Editor** di sidebar
   - Cari table `categories`
   - Seharusnya sudah ada dengan kolom:
     - `id` (UUID, Primary Key)
     - `name` (TEXT, UNIQUE)
     - `description` (TEXT, nullable)
     - `created_at` (TIMESTAMP)
     - `updated_at` (TIMESTAMP)

### 5. **Test di Aplikasi**
   - Login sebagai Admin
   - Klik menu **Kategori** di sidebar
   - Klik **Tambah Kategori**
   - Isi nama kategori dan deskripsi
   - Klik **Tambah**

## Fitur Categories

### ✅ **CRUD Lengkap:**
- ✅ Create (Tambah Kategori)
- ✅ Read (Lihat Daftar Kategori)
- ✅ Update (Edit Kategori)
- ✅ Delete (Hapus Kategori)

### ✅ **Form Field:**
- **Nama Kategori** (Required)
- **Deskripsi** (Optional)

### ✅ **Tampilan:**
- Grid cards dengan icon
- Tombol Edit & Hapus per card
- Modal form untuk tambah/edit
- Success/error messages

### ✅ **Security:**
- Row Level Security (RLS) enabled
- Hanya Admin yang bisa CRUD
- Authenticated users bisa read

## Catatan

Jika Anda sudah punya data kategori di product table, categories ini berfungsi sebagai master data yang terpisah. Anda bisa:
1. Tetap menggunakan text input untuk category di product form (manual)
2. Atau upgrade nanti dengan dropdown yang ambil dari table categories

## Default Categories

Script SQL sudah include 4 kategori default:
- Elektronik
- Makanan  
- Pakaian
- Peralatan

Anda bisa hapus atau tambah sesuai kebutuhan bisnis Anda.
