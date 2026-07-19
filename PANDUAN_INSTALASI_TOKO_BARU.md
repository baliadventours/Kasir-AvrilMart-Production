# 🚀 PANDUAN INSTALASI TOKO BARU - AVRIL MART POS

**Target**: Instalasi aplikasi POS untuk toko baru dengan setup persis sama  
**Waktu**: ~30 menit  
**Skill Level**: Beginner-friendly

---

## 📋 YANG ANDA BUTUHKAN

### 1. Accounts (Gratis):
- ✅ **Supabase Account** - https://supabase.com (database)
- ✅ **Vercel Account** - https://vercel.com (hosting)
- ✅ **GitHub Account** - https://github.com (code)

### 2. Tools:
- ✅ **Browser** - Chrome/Firefox/Edge
- ✅ **Text Editor** - Notepad++ atau VS Code (optional)
- ⚠️ **TIDAK PERLU** install Node.js, Git, atau terminal!

### 3. Data Toko:
- Nama Toko (contoh: "Avril Mart")
- Alamat Toko (contoh: "Kintamani - Bali")
- Email Admin (contoh: admin@tokoanda.com)
- Password Admin (buat yang kuat!)

---

## 🎯 INSTALASI STEP-BY-STEP

### ⭐ STEP 1: DEPLOY CODE KE VERCEL (5 menit)

#### 1.1 Fork/Clone Repository
1. Buka aplikasi Avril Mart yang sudah jadi di browser
2. Klik tombol **"Deploy"** atau buka: https://vercel.com/new
3. Login dengan akun GitHub Anda
4. Klik **"Import Git Repository"**
5. Paste URL repository ini atau pilih dari GitHub
6. Klik **"Import"**

#### 1.2 Configure Project
```
Project Name: avril-mart-[nama-toko-anda]
Framework Preset: Vite
Root Directory: ./ (default)
Build Command: npm run build (default)
Output Directory: dist (default)
```

#### 1.3 Environment Variables
**JANGAN ISI DULU!** Klik **"Deploy"** tanpa environment variables.

✅ **Deploy** → Tunggu 2-3 menit

**Result**: 
```
✅ Deployment successful!
🌐 URL: https://avril-mart-[nama-toko].vercel.app
```

❗ **CATAT URL INI** - Anda akan butuh nanti!

---

### ⭐ STEP 2: SETUP DATABASE SUPABASE (10 menit)

#### 2.1 Create Project
1. Buka https://supabase.com/dashboard
2. Login dengan akun Anda
3. Klik **"New Project"**
4. Isi form:
   ```
   Name: avril-mart-[nama-toko]
   Database Password: [buat password kuat, CATAT INI!]
   Region: Southeast Asia (Singapore) - paling dekat Indonesia
   Pricing Plan: Free (cukup untuk toko kecil-menengah)
   ```
5. Klik **"Create new project"**
6. ☕ Tunggu ~2 menit (setup database)

#### 2.2 Run Database Schema
1. Klik **"SQL Editor"** di sidebar kiri
2. Klik **"New query"**
3. Buka file `/src/sql/database-schema.sql` dari repository
4. **Copy SEMUA isi file** (Ctrl+A → Ctrl+C)
5. **Paste** di SQL Editor Supabase
6. Klik **"Run"** (atau tekan F5)
7. Tunggu ~10 detik

**Result**:
```
✅ Success! No errors
✅ Tables created: products, sales, sale_items, categories
✅ Sample data inserted: 10 categories, 10 products
✅ RLS policies enabled
✅ Triggers created
```

#### 2.3 Get API Keys
1. Klik **"Settings"** (⚙️ icon) di sidebar
2. Klik **"API"**
3. Lihat section **"Project API keys"**
4. **CATAT 2 KEYS INI**:
   ```
   Project URL: https://[project-id].supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **PENTING**: Jangan share `service_role` key! Hanya pakai `anon` key!

---

### ⭐ STEP 3: CONNECT VERCEL ↔ SUPABASE (3 menit)

#### 3.1 Add Environment Variables to Vercel
1. Buka Vercel Dashboard → Your Project
2. Klik **"Settings"** tab
3. Klik **"Environment Variables"** di sidebar
4. Add 2 variables:

**Variable 1:**
```
Name: VITE_SUPABASE_URL
Value: https://[project-id].supabase.co
```
Klik **"Add"**

**Variable 2:**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paste anon key)
```
Klik **"Add"**

#### 3.2 Redeploy
1. Klik **"Deployments"** tab
2. Klik **3 dots (...)** on latest deployment
3. Klik **"Redeploy"**
4. ✅ Confirm redeploy
5. Tunggu ~2 menit

**Result**:
```
✅ Deployment successful!
✅ Environment variables loaded
✅ App connected to database
```

---

### ⭐ STEP 4: CREATE ADMIN USER (5 menit)

#### 4.1 Create First Admin in Supabase
1. Buka Supabase Dashboard → Your Project
2. Klik **"Authentication"** di sidebar
3. Klik **"Users"**
4. Klik **"Add user"** dropdown
5. Pilih **"Create new user"**

#### 4.2 Fill User Details
```
Email: admin@tokoanda.com (atau email Anda)
Password: [buat password kuat min 12 karakter]
✅ Check: "Auto Confirm User" (penting!)
```
Klik **"Create user"**

#### 4.3 Set User Role to Admin
1. Klik user yang baru dibuat (dari list users)
2. Scroll ke section **"User Metadata"**
3. Klik **"Edit"** (pencil icon)
4. Paste JSON ini:
   ```json
   {
     "name": "Administrator",
     "role": "admin"
   }
   ```
5. Klik **"Save"**

**Result**:
```
✅ Admin user created
✅ Role set to "admin"
✅ Can login and access all features
```

---

### ⭐ STEP 5: FIRST LOGIN & TEST (5 menit)

#### 5.1 Open Application
1. Buka URL Vercel Anda: `https://avril-mart-[nama-toko].vercel.app`
2. Anda akan lihat **Login Page**

#### 5.2 Login as Admin
```
Email: admin@tokoanda.com (yang Anda buat tadi)
Password: [password yang Anda set]
```
Klik **"Login"**

**Result**:
```
✅ Login successful!
✅ Redirected to POS interface
✅ Sidebar shows all menus (POS, Inventory, Sales, Reports, Users, Categories)
```

#### 5.3 Quick Test Checklist
```
Test 1: POS Interface
[ ] Click "POS" in sidebar
[ ] See products list
[ ] Add product to cart
[ ] Process checkout
[ ] Print receipt works
✅ All working!

Test 2: Inventory Management
[ ] Click "Inventory" in sidebar
[ ] See 10 sample products
[ ] Click "Tambah Produk"
[ ] Add new product
[ ] See product in list
✅ All working!

Test 3: User Management
[ ] Click "Users" in sidebar
[ ] See admin user in list
[ ] Click "Tambah User"
[ ] Create cashier user (untuk test)
✅ All working!
```

---

### ⭐ STEP 6: CUSTOMIZE FOR YOUR STORE (5 menit)

#### 6.1 Update Store Name & Address
1. Buka project di Vercel
2. Klik **"Deployments"** → **"Source"** (latest)
3. Find file: `/src/app/components/thermal-receipt.tsx`
4. Edit lines:
   ```tsx
   // Line ~30-35:
   <div className="text-center font-bold text-lg">AVRIL MART</div>
   // Change to:
   <div className="text-center font-bold text-lg">NAMA TOKO ANDA</div>
   
   // Line ~36:
   <div className="text-center text-xs">Kintamani - Bali</div>
   // Change to:
   <div className="text-center text-xs">Alamat Toko Anda</div>
   ```
5. Commit changes → Auto redeploy

**Or simpler**: Use Vercel's online editor:
1. Vercel Dashboard → Your Project
2. Click **"..."** → **"Edit Source Code"**
3. Edit files directly in browser
4. Click **"Commit"** → Auto deploy

#### 6.2 Update App Theme (Optional)
Jika ingin ganti warna dari orange (#E05D43) ke warna lain:

1. Edit file: `/src/app/components/sidebar.tsx`, `pos-interface.tsx`, dll
2. Find & Replace:
   ```
   Find: #E05D43
   Replace: #YOUR_COLOR (contoh: #FF5733 untuk merah)
   ```
3. Commit → Redeploy

---

### ⭐ STEP 7: ADD PRODUCTS (VIA CSV IMPORT)

#### 7.1 Prepare Products CSV
1. Download template: `/products_template.csv`
2. Open with Excel/Google Sheets
3. Fill your products:
   ```csv
   name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
   Aqua 600ml,AQA-001,8991001010211,Minuman,5000,4500,4000,100
   Indomie Goreng,IND-001,8992388101015,Makanan,3500,3000,2500,200
   ```

#### 7.2 Import to Application
1. Login as admin
2. Click **"Inventory"** in sidebar
3. Click **"Import CSV"** button
4. Select your CSV file
5. Click **"Import"**
6. Wait for processing
7. ✅ All products imported!

**Result**:
```
✅ Success: X products imported
⚠️ Partial: X products imported, Y failed (dengan detail)
❌ Failed: Check CSV format
```

---

## ✅ POST-INSTALLATION CHECKLIST

### Security (IMPORTANT!):
```
[✅] Change admin password (use strong one!)
[✅] Enable Supabase rate limiting (see Security Audit)
[✅] Fix RLS policies (see Security Audit Report)
[✅] Test login/logout
[✅] Test offline mode
```

### Data:
```
[✅] Delete sample products (if not needed)
[✅] Import real products via CSV
[✅] Create categories for products
[✅] Test product search
[✅] Test barcode scanning
```

### Users:
```
[✅] Create cashier accounts
[✅] Test cashier login (should only see POS)
[✅] Test admin login (should see all menus)
[✅] Document user credentials (securely!)
```

### Backup:
```
[✅] Test database backup (Inventory → Backup Database)
[✅] Download backup JSON (store safely!)
[✅] Test CSV export
[✅] Schedule weekly backups
```

---

## 🔧 TROUBLESHOOTING

### ❌ Problem: "Cannot connect to database"
**Solution**:
1. Check Supabase project is running (Dashboard → Project → Status)
2. Verify environment variables in Vercel
3. Redeploy application
4. Check Supabase URL is correct (no trailing slash!)

---

### ❌ Problem: "Login failed / Invalid credentials"
**Solution**:
1. Check email/password correct
2. Verify user exists in Supabase (Authentication → Users)
3. Check user metadata has "role": "admin"
4. Try password reset in Supabase Dashboard

---

### ❌ Problem: "Kasir can see admin menus"
**Solution**:
1. Check user metadata in Supabase
2. User metadata must have `"role": "cashier"` (lowercase!)
3. Update metadata and ask user to re-login

---

### ❌ Problem: "Products not showing"
**Solution**:
1. Check database has products: Supabase → SQL Editor → `SELECT * FROM products;`
2. Check RLS policies are correct (see Security Audit)
3. Check user is authenticated (logged in)
4. Clear browser cache and reload

---

### ❌ Problem: "CSV Import failed"
**Solution**:
1. Check CSV format matches template
2. Check column headers are correct (lowercase, underscore)
3. Check no empty required fields (name, sku, prices, stock)
4. Check SKU is unique (no duplicates)
5. Try import 1 product first to test

---

### ❌ Problem: "Offline mode not working"
**Solution**:
1. Check browser supports localStorage
2. Check Service Worker registered (DevTools → Application → Service Workers)
3. Clear cache and reload
4. Check PWA manifest loaded (DevTools → Application → Manifest)

---

### ❌ Problem: "Receipt print not working"
**Solution**:
1. Check browser print dialog opens
2. Check printer is connected
3. Set paper size to 80mm (3.15 inches)
4. Try "Print Preview" first
5. Check printer drivers installed

---

## 📞 SUPPORT & RESOURCES

### Documentation:
- 📘 [README.md](./README.md) - Overview & features
- 🔒 [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md) - Security checklist
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) - Advanced deployment
- 📋 [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Admin operations guide
- ❓ [FAQ.md](./FAQ.md) - Common questions

### External Resources:
- 🗄️ [Supabase Docs](https://supabase.com/docs) - Database & auth
- ☁️ [Vercel Docs](https://vercel.com/docs) - Hosting & deployment
- ⚛️ [React Docs](https://react.dev) - Frontend framework

### Community:
- Supabase Discord: https://discord.supabase.com
- Vercel Discord: https://discord.gg/vercel

---

## 🎓 TRAINING STAFF

### For Admin:
**Training Duration**: 2 hours

**Topics**:
1. ✅ Product Management (add/edit/delete)
2. ✅ CSV Import/Export
3. ✅ User Management (create cashier)
4. ✅ Sales Reports
5. ✅ Inventory Reports
6. ✅ Database Backup
7. ✅ Low Stock Alerts

**Hands-on Practice**:
- Add 10 products manually
- Import 50 products via CSV
- Create 3 cashier accounts
- Process 5 test sales
- Generate daily report
- Export backup

---

### For Cashier:
**Training Duration**: 1 hour

**Topics**:
1. ✅ Login/Logout
2. ✅ Product Search
3. ✅ Barcode Scanning
4. ✅ Add to Cart
5. ✅ Choose Price Type (Retail/Wholesale)
6. ✅ Process Payment
7. ✅ Print Receipt
8. ✅ Handle Returns (manual process)

**Hands-on Practice**:
- Process 10 test sales
- Use barcode scanner
- Handle different payment amounts
- Print receipts
- What to do if offline

---

## 📊 MAINTENANCE SCHEDULE

### Daily:
```
[ ] Check app is online and working
[ ] Monitor sales processed
[ ] Check for any errors reported by staff
```

### Weekly:
```
[ ] Backup database (Inventory → Backup Database)
[ ] Review low stock alerts
[ ] Check for any unusual sales
[ ] Update product prices if needed
```

### Monthly:
```
[ ] Review user accounts (add/remove as needed)
[ ] Check Supabase usage/costs
[ ] Review sales reports
[ ] Update product categories
[ ] Check for app updates
```

### Quarterly:
```
[ ] Change admin password
[ ] Review security settings
[ ] Check for dependency updates
[ ] Review and optimize slow queries
[ ] Train new staff if hired
```

---

## 💰 COST ESTIMATION

### Free Tier (Recommended for Start):
```
Supabase Free:
- 500MB database
- 2GB bandwidth/month
- 50,000 monthly active users
- Enough for: Small store, ~50 sales/day, ~500 products

Vercel Free:
- 100GB bandwidth/month
- Unlimited requests
- HTTPS included
- Custom domain (1 free)

Total: $0/month ✅
```

### When to Upgrade:
```
Upgrade Supabase Pro ($25/mo) if:
- Database > 500MB (many products/sales)
- Need automatic backups
- Need longer data retention
- Need priority support

Upgrade Vercel Pro ($20/mo) if:
- Multiple stores (team features)
- Need advanced analytics
- Need dedicated support
```

---

## 🔐 SECURITY REMINDERS

### ⚠️ BEFORE GOING LIVE:

**CRITICAL - DO THESE 3 FIXES** (from Security Audit):

#### 1. Fix RLS Policies (5 minutes):
```sql
-- Run in Supabase SQL Editor:

-- Drop permissive policies
DROP POLICY IF EXISTS "Anyone can read products" ON products;
DROP POLICY IF EXISTS "Anyone can read sales" ON sales;
DROP POLICY IF EXISTS "Anyone can read sale items" ON sale_items;

-- Create secure policies
CREATE POLICY "Authenticated users can read products"
  ON products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read sales"
  ON sales FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read sale items"
  ON sale_items FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

#### 2. Enable Rate Limiting (2 minutes):
```
Supabase Dashboard → Settings → API → Rate Limiting:
✅ Enable rate limiting
Set: 100 requests/minute per IP
```

#### 3. Strengthen Passwords (2 minutes):
```
Supabase Dashboard → Authentication → Policies:
Minimum password length: 12 (change from 6)
✅ Require uppercase
✅ Require numbers
✅ Require special characters
```

**Total Time: 10 minutes**  
**Impact: Prevents unauthorized access!**

---

## ✅ INSTALLATION COMPLETE!

Congratulations! 🎉 Toko Anda sekarang memiliki sistem POS modern yang:

```
✅ Dapat diakses dari mana saja (cloud-based)
✅ Bekerja offline (auto-sync when online)
✅ Aman dengan authentication & RLS
✅ Mudah digunakan (user-friendly interface)
✅ Scalable (bisa handle ratusan transaksi/hari)
✅ Gratis! (free tier cukup untuk small-medium business)
```

---

## 🎯 NEXT STEPS

### Week 1:
1. ✅ Train all staff (admin + cashiers)
2. ✅ Import all products
3. ✅ Create all user accounts
4. ✅ Test thoroughly with dummy transactions
5. ✅ Setup backup routine

### Week 2:
1. ✅ Soft launch (parallel with old system)
2. ✅ Monitor for bugs/issues
3. ✅ Gather user feedback
4. ✅ Make adjustments as needed

### Week 3+:
1. ✅ Full switch to new system
2. ✅ Retire old system
3. ✅ Monitor performance
4. ✅ Optimize workflows

---

## 📧 NEED HELP?

Jika ada masalah atau pertanyaan:

1. ✅ Check this guide first
2. ✅ Check [FAQ.md](./FAQ.md)
3. ✅ Check [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
4. ✅ Check Supabase/Vercel docs
5. ✅ Ask in community Discord

---

**Happy Selling!** 🛒✨

**Version**: 1.0  
**Last Updated**: 27 Februari 2026  
**Author**: Avril Mart Development Team

---

## 🎁 BONUS: QUICK REFERENCE CARD

Print ini dan tempel di kasir untuk referensi cepat:

```
═══════════════════════════════════════════════
         AVRIL MART POS - QUICK GUIDE
═══════════════════════════════════════════════

🔑 LOGIN:
   1. Buka: https://avril-mart-[nama].vercel.app
   2. Email: [your-email]
   3. Password: [your-password]

🛒 PROCESS SALE:
   1. Search product atau scan barcode
   2. Click "Add to Cart"
   3. Choose: Eceran atau Grosir
   4. Enter payment amount
   5. Click "Process Payment"
   6. Print receipt

📦 ADD PRODUCT (Admin Only):
   1. Click "Inventory"
   2. Click "Tambah Produk"
   3. Fill form
   4. Click "Add Product"

💾 BACKUP (Weekly):
   1. Click "Inventory"
   2. Click "Backup Database"
   3. Save JSON file to safe location

🔌 IF OFFLINE:
   - App still works!
   - Data saved locally
   - Auto-sync when online

🆘 EMERGENCY:
   - Can't login? → Check password
   - App down? → Check internet
   - Print error? → Check printer on
   - Data lost? → Restore from backup

📞 Support: [your-phone]
═══════════════════════════════════════════════
```

**Print this card and keep near POS terminal!** 📋
