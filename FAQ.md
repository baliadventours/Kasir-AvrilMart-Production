# ❓ Frequently Asked Questions (FAQ)

Pertanyaan yang sering ditanyakan tentang aplikasi POS & Inventory Management.

---

## 📋 General Questions

### Apa itu aplikasi ini?

Aplikasi Point of Sale (POS) dan Inventory Management berbasis web untuk membantu bisnis retail mengelola:
- Penjualan (checkout & cart)
- Inventory/stok produk
- History transaksi
- User management (kasir & admin)
- Dual pricing (harga eceran & grosir)

### Berapa biaya aplikasi ini?

Aplikasi ini **gratis** dan open source. Biaya yang mungkin muncul:

**Free tier (cukup untuk UMKM):**
- ✅ Vercel: Gratis untuk 100GB bandwidth/bulan
- ✅ Supabase: Gratis untuk 500MB database, 2GB bandwidth

**Paid jika butuh lebih:**
- Vercel Pro: $20/bulan (unlimited bandwidth)
- Supabase Pro: $25/bulan (8GB database, 50GB bandwidth)

### Apakah bisa digunakan offline?

Tidak. Aplikasi memerlukan koneksi internet untuk:
- Load products dari database
- Save transactions
- Sync data antar device

**Workaround**: Gunakan hotspot HP jika WiFi mati.

### Apakah data aman?

Ya! Keamanan data dijaga dengan:
- ✅ HTTPS encryption (automatic)
- ✅ Row Level Security (RLS) di database
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Password hashing (automatic)
- ✅ Backup otomatis (Supabase)

---

## 👥 User Management

### Bagaimana cara bikin user pertama kali?

**Admin pertama** harus dibuat via Supabase Dashboard:

1. Supabase → Authentication → Users
2. Add user (email + password)
3. ✅ Check "Auto Confirm User"
4. Click user → Scroll to **"Raw User Meta Data"**
5. Click Edit icon (pencil)
6. Set metadata: 
   ```json
   {
     "email_verified": true,
     "name": "Administrator",
     "role": "admin"
   }
   ```
7. Save

**🔧 Alternative via SQL** (if UI doesn't work):
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'email_verified', true,
  'name', 'Administrator',
  'role', 'admin'
)
WHERE email = 'your-email@example.com';
```

Run in Supabase → SQL Editor

Setelah itu, admin bisa create user via aplikasi.

### Kasir bisa lihat laporan penjualan?

Tidak. Hanya admin yang bisa:
- View sales history
- View reports
- Manage inventory
- Manage users

Kasir hanya bisa akses Point of Sale.

### Bagaimana reset password user?

**Option 1: Via Supabase Dashboard**
1. Authentication → Users
2. Click user
3. "Send password recovery email"

**Option 2: Admin create new password**
1. Delete old user
2. Create new user dengan password baru

### Berapa banyak user yang bisa dibuat?

Unlimited! Free tier Supabase support sampai 50,000+ users.

### Bisa track aktivitas kasir?

Ya! Setiap transaksi menyimpan `user_id`:
- Admin bisa lihat siapa yang proses transaksi
- Filter by kasir (feature coming soon)

---

## 🛒 Point of Sale

### Bagaimana cara scan barcode?

1. Connect barcode scanner (USB/Bluetooth)
2. Di POS tab, click barcode input field
3. Scan produk
4. Auto-added ke cart

**Scanner yang support**: Any yang emulate keyboard input.

### Bisa scan barcode dari kamera HP?

Belum. Saat ini hanya support barcode scanner fisik.

**Coming soon**: Camera barcode scanner.

### Perbedaan Harga Eceran vs Grosir?

- **Harga Eceran**: Untuk customer biasa, harga normal
- **Harga Grosir**: Untuk reseller/pembelian banyak, harga lebih murah

Pilih tipe harga sebelum add product ke cart.

### Bisa ganti tipe harga di tengah transaksi?

Tidak. Satu transaksi hanya bisa pakai 1 tipe harga.

**Workaround**: Process 2 transaksi terpisah.

### Bagaimana cara batal transaksi?

1. Click **"Batal"** di checkout modal, ATAU
2. Remove semua items dari cart (trash icon)

### Bisa refund/return?

Belum ada fitur return built-in.

**Manual workaround:**
1. Admin adjust stock manually di Inventory
2. Note di catatan terpisah
3. Adjust cash register

### Bisa print receipt?

Ya! Setelah checkout success:
1. Click print icon, ATAU
2. Press `Ctrl+P`
3. Pilih printer
4. Print

**Note**: Format receipt basic HTML, bisa customize.

### Bagaimana tracking kembalian?

Sistem otomatis calculate:
- Input: Jumlah bayar customer
- System hitung: Kembalian = Bayar - Total
- Display di screen
- Print di receipt

---

## 📦 Inventory Management

### Bagaimana tambah produk baru?

1. Login as admin
2. Tab "Inventory"
3. "Tambah Produk"
4. Isi semua field
5. Save

**Required fields:**
- Nama produk
- SKU (kode barcode)
- Kategori
- Harga eceran
- Harga grosir
- Stok

### Stok otomatis berkurang setelah penjualan?

Ya! Automatic via database trigger.

Contoh:
- Product A stock: 10
- Customer beli 2
- Stock otomatis jadi: 8

### Bagaimana update stok masuk barang baru?

1. Inventory → Find product
2. Click Edit
3. Update stock number (tambahkan stok baru)
4. Save

**Example**: 
- Stock lama: 5
- Barang masuk: 20
- Update stock jadi: 25

### Alert stok habis?

Ya! Di Inventory tab:
- 🔴 **Red badge**: Stock ≤ 5 (bahaya!)
- 🟡 **Yellow badge**: Stock ≤ 10 (perhatian)
- 🟢 **Green**: Stock > 10 (aman)

### Bisa import produk dari Excel?

Belum ada fitur import.

**Manual workaround**: 
1. Copy data dari Excel
2. Add manual satu per satu
3. Atau hire developer untuk bulk import

### Bisa upload foto produk?

Ya! Field "Image URL":
1. Upload foto ke hosting (Imgur, Google Drive, dll)
2. Copy URL foto
3. Paste di field Image URL
4. Save

**Note**: URL harus public accessible.

### Bagaimana hapus produk?

1. Inventory → Find product
2. Click Delete icon (trash)
3. Confirm

⚠️ **Warning**: Tidak bisa delete produk yang sudah ada di transaksi history!

---

## 📊 Sales & Reports

### Bagaimana lihat laporan penjualan?

1. Login as admin
2. Tab "Sales History"
3. View all transactions

Lihat:
- Total transaksi
- Total revenue
- Revenue by type
- Transaction details

### Bisa filter by tanggal?

Coming soon! Saat ini show all transactions.

### Bisa export ke Excel?

Coming soon!

**Manual workaround**: Copy data dari screen.

### Bagaimana hitung untung rugi?

Belum ada fitur profit calculation.

**Manual**:
- Revenue: Lihat di Sales History
- Cost: Calculate manual (harga beli produk)
- Profit = Revenue - Cost

### Bisa lihat best selling products?

Coming soon!

**Manual**: Check Sales History, count manually.

### Data hilang kalau logout?

Tidak! Data tersimpan di Supabase database.

Logout/login tidak affect data.

### Berapa lama data disimpan?

**Forever** (selama subscription active).

Supabase free tier: Data tidak expire.

---

## 🔧 Technical Issues

### Aplikasi loading terus / tidak muncul produk

**Solutions:**

1. **Check internet connection**
2. **Refresh page** (F5 atau Ctrl+F5)
3. **Check browser console** (F12 → Console)
   - Look for error messages
4. **Verify database setup**:
   - Supabase → Table Editor
   - Check products table has data
5. **Check environment variables**:
   - Vercel → Settings → Environment Variables
   - Verify VITE_SUPABASE_URL & KEY are set

### Error: "Failed to fetch"

**Causes:**
- Internet down
- Supabase down
- Edge function not deployed

**Solutions:**
1. Check internet
2. Check Supabase status: https://status.supabase.com
3. Re-deploy edge function:
   ```bash
   supabase functions deploy server
   ```

### Error: "Unauthorized" atau "Forbidden"

**Causes:**
- Token expired
- Wrong credentials
- User role incorrect

**Solutions:**
1. Logout & login again
2. Check user metadata di Supabase
3. Verify role = "admin" or "cashier"

### Vercel deploy failed

**Solutions:**
1. Check build logs
2. Verify package.json correct
3. Check environment variables set
4. Try local build: `npm run build`
5. Check Node version (need 18+)

### Database error saat save

**Solutions:**
1. Check RLS policies active
2. Verify user authenticated
3. Check Supabase logs
4. Try re-run schema: `supabase-schema.sql`

---

## 💳 Payment & Pricing

### Support payment gateway?

Belum. Saat ini hanya cash transaction.

**Coming soon**: Integration dengan payment gateway (Midtrans, etc).

### Bisa set discount/promo?

Belum ada fitur discount built-in.

**Manual workaround**:
- Buat product baru dengan harga diskon
- Atau adjust harga manual saat checkout

### Bisa set tax custom?

Saat ini fixed 10% tax.

**Customize**:
Edit file `/src/app/components/pos-interface.tsx`:
```javascript
const tax = subtotal * 0.10; // Change to your tax rate
```

### Support multi-currency?

Tidak. Saat ini hanya IDR (Rupiah).

---

## 🔄 Updates & Maintenance

### Bagaimana cara update aplikasi?

**Auto-update** via Vercel:

1. Developer push update ke GitHub
2. Vercel auto-detect & deploy
3. Refresh browser (Ctrl+F5)
4. Done!

**No manual update needed.**

### Berapa sering ada update?

Tergantung development cycle. Biasanya:
- Bug fixes: Segera
- Features: Monthly
- Security: Immediate

### Downtime saat update?

**No downtime!** Vercel zero-downtime deployment.

Update di background, user tidak terpengaruh.

### Bagaimana backup data?

**Automatic**: Supabase backup daily (Pro plan).

**Manual**:
```bash
# Via Supabase CLI
supabase db dump -f backup.sql
```

Or: Database → Backups (dashboard)

---

## 📱 Device & Browser

### Browser apa yang support?

**Support:**
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari

**Minimum version**: Last 2 years.

### Bisa pakai di HP/tablet?

Ya! Responsive design.

**Best experience**: Tablet atau laptop.

**HP**: Works tapi layar kecil, kurang nyaman.

### Bisa pakai di iPad?

Ya! iPad recommended untuk kasir mobile.

### Support Internet Explorer?

Tidak. IE sudah deprecated.

Use modern browser.

### Butuh install aplikasi?

Tidak! Pure web app, buka di browser.

**PWA (Progressive Web App)**:
- Add to Home Screen
- Works like native app
- No App Store needed

---

## 🌐 Deployment & Hosting

### Apa itu Vercel?

Platform hosting untuk web app. Features:
- Auto SSL/HTTPS
- Global CDN
- Zero-downtime deploy
- Free tier generous

### Bisa hosting di tempat lain?

Ya! Bisa deploy ke:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Self-host (VPS)

Tapi panduan ini untuk Vercel.

### Butuh domain sendiri?

Tidak wajib. Vercel kasih subdomain gratis:
```
https://your-app.vercel.app
```

**Optional**: Connect custom domain (e.g., `pos.tokosaya.com`).

### Bagaimana ganti domain?

Vercel Dashboard:
1. Project → Settings
2. Domains
3. Add domain
4. Follow DNS instructions

---

## 🆘 Support & Help

### Dimana bisa minta bantuan?

1. **Documentation** (baca ini dulu!)
   - INSTALLATION.md
   - DEPLOYMENT.md
   - SECURITY.md
   - ADMIN_GUIDE.md

2. **Platform Support**:
   - Supabase: https://supabase.com/docs
   - Vercel: https://vercel.com/docs

3. **Community**:
   - GitHub Issues (for bugs)
   - Discord/Slack (if available)

### Ada biaya support?

Documentation gratis.

Paid support: Contact developer jika ada.

### Bisa request fitur baru?

Ya! 

**Process**:
1. Check roadmap (if exists)
2. Create GitHub Issue
3. Describe use case
4. Community vote
5. Developer prioritize

Popular requests implemented first.

### Butuh customize lebih?

Hire developer untuk:
- Custom features
- UI/UX changes
- Integration dengan sistem lain
- Migration dari sistem lama

---

## 🎓 Training & Onboarding

### Berapa lama training kasir?

**Typical**: 1-2 jam

**Coverage**:
- Login/logout
- Add to cart
- Checkout process
- Barcode scanning
- Common issues

### Ada video tutorial?

Belum tersedia.

**Alternative**: Screenshot guide di ADMIN_GUIDE.md

### Bisa demo dulu?

Ya! Setup di environment test:
- Supabase free project
- Vercel preview deployment
- Test tanpa affect production

---

**Tidak menemukan jawaban? Create issue di GitHub!** 🚀

Last updated: February 2026