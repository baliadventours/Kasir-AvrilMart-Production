# 📘 Installation Guide - Step by Step

Panduan instalasi lengkap untuk deploy aplikasi POS & Inventory Management ke production.

**Estimasi waktu**: 20-30 menit

---

## 📋 Prerequisites Checklist

Sebelum mulai, pastikan Anda punya:

- [ ] Akun [Supabase](https://supabase.com) (gratis)
- [ ] Akun [Vercel](https://vercel.com) (gratis)
- [ ] Akun [GitHub](https://github.com) (gratis)
- [ ] Node.js 18+ terinstall ([Download](https://nodejs.org))
- [ ] Git terinstall ([Download](https://git-scm.com))
- [ ] Text editor (VS Code, Sublime, dll)
- [ ] Browser modern (Chrome, Firefox, Edge)

---

## 🗂️ PART 1: Setup Local Project

### Step 1.1: Clone atau Download Project

**Pilihan A: Jika sudah di Git**
```bash
git clone <repository-url>
cd pos-inventory
```

**Pilihan B: Jika belum di Git**
```bash
# Buat folder project
mkdir pos-inventory
cd pos-inventory

# Copy semua file project ke folder ini
# (termasuk src/, supabase/, dll)
```

### Step 1.2: Install Dependencies

```bash
# Install semua package yang diperlukan
npm install
```

**Expected output:**
```
added XXX packages in XXs
```

✅ **Verification:**
```bash
# Check if node_modules created
ls node_modules

# Should see lots of folders
```

---

## 🗄️ PART 2: Setup Supabase Database

### Step 2.1: Buat Supabase Project

1. **Buka browser** → https://supabase.com
2. **Sign up / Login** dengan GitHub atau email
3. **Click "New Project"**

   ![New Project Button]

4. **Isi Form:**
   - **Organization**: Pilih atau buat baru
   - **Name**: `pos-inventory-production`
   - **Database Password**: Generate strong password
     - **⚠️ PENTING: COPY & SIMPAN PASSWORD INI!**
     - Paste di notepad sementara
   - **Region**: Pilih terdekat (e.g., "Southeast Asia (Singapore)")
   - **Pricing Plan**: Free (untuk testing) atau Pro

5. **Click "Create new project"**

6. **Tunggu ~2-3 menit** - Progress bar akan muncul

✅ **Verification:**
- Project dashboard terbuka
- Status: "Active" (hijau)

### Step 2.2: Copy API Credentials

1. **Di sidebar kiri**, click **Settings** (icon gear)
2. **Click "API"** di menu settings
3. **Copy & Simpan** info berikut:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon/public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
   (very long key)
   ```
   
   **service_role key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdX...
   (very long key - KEEP SECRET!)
   ```

4. **Paste ke notepad** dengan label yang jelas:
   ```
   PROJECT_URL=https://xxxxx.supabase.co
   ANON_KEY=eyJhbGc...
   SERVICE_ROLE_KEY=eyJhbGc... (RAHASIA!)
   ```

⚠️ **IMPORTANT**: 
- `anon key` = Public, boleh di frontend
- `service_role key` = SECRET, jangan pernah expose!

### Step 2.3: Run Database Schema

1. **Di sidebar kiri**, click **SQL Editor**

2. **Click "New query"** button

3. **Buka file `supabase-schema.sql`** di project Anda
   - Location: `pos-inventory/supabase-schema.sql`
   - Buka dengan text editor

4. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)

5. **Paste ke SQL Editor** di Supabase

6. **Click "RUN"** button (atau tekan Ctrl+Enter)

7. **Tunggu ~5-10 detik**

✅ **Expected Result:**
```
Success. No rows returned
```

8. **Verify Tables Created:**
   - Click **Table Editor** di sidebar
   - Should see tables:
     - ✅ `products` (6 rows - sample data)
     - ✅ `sales` (0 rows - empty)
     - ✅ `sale_items` (0 rows - empty)

🎉 **Database setup complete!**

---

## ⚙️ PART 3: Setup Supabase CLI & Edge Function

### Step 3.1: Install Supabase CLI

**macOS/Linux:**
```bash
npm install -g supabase
```

**Windows:**
```bash
npm install -g supabase
```

**Alternative (jika npm gagal):**
- Download dari: https://github.com/supabase/cli/releases

✅ **Verification:**
```bash
supabase --version
# Should show: 1.x.x or higher
```

### Step 3.2: Login to Supabase

```bash
supabase login
```

**Expected flow:**
1. Browser akan terbuka otomatis
2. Click "Authorize"
3. Kembali ke terminal
4. Akan muncul: "You're logged in!"

✅ **Verification:**
```bash
supabase projects list
# Should see your projects
```

### Step 3.3: Link Project

1. **Get Project Reference ID:**
   - Buka Supabase Dashboard
   - Settings → General
   - Copy "Reference ID" (e.g., `abcdefghijk`)

2. **Link project:**
```bash
cd pos-inventory
supabase link --project-ref abcdefghijk
```

**Expected:**
```
Linked to project abcdefghijk
```

### Step 3.4: Deploy Edge Function

```bash
# Deploy the signup function
supabase functions deploy server
```

**Expected output:**
```
Deploying server (version xxx)
Deployed server
```

⏱️ This takes ~30-60 seconds

### Step 3.5: Set Environment Secrets

```bash
# Set Supabase URL
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co

# Set Service Role Key (use your actual key!)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Replace:**
- `xxxxx` = Your project ID
- `eyJhbGc...` = Your actual service_role key

✅ **Verification:**
```bash
supabase secrets list
# Should show:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

🎉 **Edge function deployed!**

---

## 🌐 PART 4: Deploy to Vercel

### Step 4.1: Push to GitHub

**If not already a Git repo:**
```bash
cd pos-inventory
git init
```

**Add all files:**
```bash
git add .
```

**Commit:**
```bash
git commit -m "Initial commit - POS Application"
```

**Create GitHub repo:**
1. Go to https://github.com/new
2. **Repository name**: `pos-inventory`
3. **Visibility**: Private (recommended)
4. **DON'T** check any "Initialize" options
5. Click **"Create repository"**

**Push to GitHub:**
```bash
# Copy commands from GitHub (will look like this):
git remote add origin https://github.com/YOUR-USERNAME/pos-inventory.git
git branch -M main
git push -u origin main
```

✅ **Verification:**
- Refresh GitHub page
- Files should be visible

### Step 4.2: Connect Vercel to GitHub

1. **Go to** https://vercel.com/dashboard

2. **Click "Add New..."** → **"Project"**

3. **Import Git Repository:**
   - Find `pos-inventory` in list
   - Click **"Import"**

### Step 4.3: Configure Build Settings

**Framework Preset:**
```
Vite (should auto-detect)
```

**Root Directory:**
```
./ (leave as default)
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

**Leave all other settings as default**

### Step 4.4: Add Environment Variables

**Click "Environment Variables" section**

**Add these variables:**

1. **Variable 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co`
   - Environments: ✅ Production, ✅ Preview, ✅ Development

2. **Variable 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGc...` (your anon/public key)
   - Environments: ✅ Production, ✅ Preview, ✅ Development

**Screenshot of what it should look like:**
```
VITE_SUPABASE_URL         https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY    eyJhbGc...
```

### Step 4.5: Deploy!

**Click "Deploy" button**

**Wait 2-3 minutes...**

Progress will show:
```
1. Building...
2. Checking Build Cache...
3. Running Build Command...
4. Collecting Files...
5. Uploading Build Outputs...
6. Deploying...
```

✅ **Success!**
```
🎉 Your project is live!
```

**Copy your URL:**
```
https://pos-inventory-xxxxx.vercel.app
```

🎉 **App is now deployed!**

---

## 👤 PART 5: Create First Admin User

### Step 5.1: Access Supabase Authentication

1. **Go to Supabase Dashboard**
2. **Click "Authentication"** (icon: person/user)
3. **Click "Users"** tab

### Step 5.2: Create Admin User

1. **Click "Add user"** dropdown
2. **Select "Create new user"**

3. **Fill form:**
   - **Email**: `admin@toko.com`
     (or your actual email)
   - **Password**: `Admin123456!`
     (create strong password!)
   - **Auto Confirm User**: ✅ **CHECK THIS!**
     (penting untuk bisa langsung login)

4. **Click "Create user"**

✅ **User created!** Will appear in users list

### Step 5.3: Set User Role (Metadata)

1. **Click on the user** you just created
   - Will open user details

2. **Scroll down** to **"Raw User Meta Data"** section
   - NOT "User Metadata" - look for "Raw User Meta Data"

3. **Click "Edit" icon** (pencil icon on the right)

4. **Replace content** with:
```json
{
  "email_verified": true,
  "name": "Administrator",
  "role": "admin"
}
```

**⚠️ IMPORTANT**: 
- Keep `"email_verified": true` jika sudah ada
- Add `"name"` and `"role"` fields
- Make sure JSON syntax valid (commas, quotes)

5. **Click "Save"**

✅ **Verification:**
- Raw User Meta Data now shows `name` and `role`
- `role` = `"admin"`

**🔧 Alternative: If UI edit doesn't work**

Use SQL Editor instead:
```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'email_verified', true,
  'name', 'Administrator',
  'role', 'admin'
)
WHERE email = 'admin@toko.com';
```

See `/update-user-metadata.sql` for more options.

🎉 **Admin user ready!**

---

## ✅ PART 6: Test Installation

### Step 6.1: Access Application

1. **Open browser**
2. **Go to your Vercel URL:**
   ```
   https://pos-inventory-xxxxx.vercel.app
   ```

### Step 6.2: Login

**Login form should appear**

**Enter credentials:**
- Email: `admin@toko.com`
- Password: `Admin123456!` (or what you set)

**Click "Login"**

✅ **Expected:**
- Redirects to POS interface
- Header shows your name: "Administrator"
- Navigation tabs visible: POS, Inventory, Sales, Users

### Step 6.3: Verify Sample Products

1. **Check product grid**
   - Should see 6 sample products:
     - Wireless Headphones
     - Smart Watch
     - Coffee Mug
     - Notebook Set
     - Desk Lamp
     - Water Bottle

2. **Click product** → Should add to cart

✅ **Products loading = Database connected!**

### Step 6.4: Test User Creation

1. **Click "Users" tab**

2. **Click "Tambah User"**

3. **Fill form:**
   - Nama: `Kasir Test`
   - Email: `kasir@toko.com`
   - Password: `kasir123`
   - Role: `Kasir`

4. **Click "Tambah User"**

✅ **Expected:**
- Success message: "User Kasir Test berhasil dibuat!"

5. **Test login as kasir:**
   - Logout
   - Login with `kasir@toko.com` / `kasir123`
   - Should ONLY see "Point of Sale" tab
   - Should NOT see Inventory, Sales, Users tabs

🎉 **User creation working!**

### Step 6.5: Test POS Transaction

1. **Login as admin** or kasir
2. **Add product to cart**
3. **Set quantity** (e.g., 2)
4. **Click "Checkout"**
5. **Enter payment** amount
6. **Click "Process Payment"**

✅ **Expected:**
- Success message
- Cart cleared
- Stock updated
- (Admin) Can see in Sales History

🎉 **All features working!**

---

## 🎓 PART 7: Post-Installation Setup

### Step 7.1: Change Default Passwords

⚠️ **IMPORTANT**: Change default admin password!

**Via Supabase Dashboard:**
1. Authentication → Users
2. Click admin user
3. Click "Send password recovery email"
4. Check email and set new password

### Step 7.2: Add Your Products

1. **Login as admin**
2. **Go to Inventory tab**
3. **Click "Tambah Produk"**
4. **Fill product details**
5. **Repeat for all your products**

**You can delete sample products:**
- Click trash icon on each sample product

### Step 7.3: Create Real Users

1. **Go to Users tab**
2. **Create accounts for:**
   - Your cashiers
   - Other admins (if needed)
3. **Use real email addresses**
4. **Share credentials securely**

### Step 7.4: Custom Domain (Optional)

**In Vercel Dashboard:**
1. Go to project settings
2. Domains tab
3. Add your domain (e.g., `pos.tokosaya.com`)
4. Follow DNS setup instructions

### Step 7.5: Backup Database

**Setup automatic backups:**
1. Supabase Dashboard → Database
2. Backups tab
3. Enable Point-in-Time Recovery (Pro plan)

**Or manual backup:**
```bash
# Export database
pg_dump <connection-string> > backup.sql
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

✅ Check Vercel Analytics:
- https://vercel.com/dashboard → Analytics

✅ Check Supabase Logs:
- Dashboard → Logs → Auth / Database

### Weekly Tasks

- Review user accounts (disable inactive)
- Check database size (Dashboard → Database → Size)
- Monitor API usage (Settings → Billing)

### Monthly Tasks

- Update products & pricing
- Review sales reports
- Backup database manually
- Check for updates

---

## 🐛 Troubleshooting

### Issue: Can't login after creation

**Symptom:** "Invalid credentials" error

**Solutions:**
1. Check email spelling (case-sensitive)
2. Verify "Auto Confirm User" was checked
3. Check User Status in Supabase (should be "Confirmed")
4. Reset password via Supabase Dashboard

### Issue: Products not loading

**Symptom:** Empty product grid or loading forever

**Solutions:**
1. Check browser console (F12) for errors
2. Verify database schema was run successfully
3. Check Table Editor → products table has data
4. Verify environment variables in Vercel

### Issue: "Failed to fetch" on user creation

**Symptom:** Error when clicking "Tambah User"

**Solutions:**
1. Verify edge function deployed:
   ```bash
   supabase functions list
   ```
2. Check edge function logs:
   - Supabase Dashboard → Edge Functions → Logs
3. Verify secrets are set:
   ```bash
   supabase secrets list
   ```

### Issue: Build failed on Vercel

**Symptom:** Red "Failed" status

**Solutions:**
1. Check build logs in Vercel
2. Verify package.json has all dependencies
3. Check if build command is correct: `npm run build`
4. Try build locally: `npm run build`

### Issue: Environment variables not working

**Symptom:** "Missing Supabase environment variables" error

**Solutions:**
1. Verify variables in Vercel settings
2. Check variable names (must start with `VITE_`)
3. Redeploy after adding variables:
   - Deployments → Three dots → Redeploy

### Issue: 403 Forbidden when creating users

**Symptom:** "Only administrators can create users"

**Solutions:**
1. Verify you're logged in as admin
2. Check user metadata has `"role": "admin"`
3. Logout and login again to refresh token

---

## ✅ Installation Checklist

Print this and check off as you go:

- [ ] Node.js & Git installed
- [ ] Project downloaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] Database schema executed
- [ ] API credentials copied
- [ ] Supabase CLI installed
- [ ] Edge function deployed
- [ ] Secrets configured
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set
- [ ] Application deployed
- [ ] First admin created
- [ ] Admin metadata set
- [ ] Login tested
- [ ] Sample products visible
- [ ] User creation tested
- [ ] POS transaction tested
- [ ] Default password changed
- [ ] Real users created
- [ ] Custom products added

---

## 📞 Need Help?

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [React Docs](https://react.dev)

### Common Resources
- **DEPLOYMENT.md** - Deployment details
- **SECURITY.md** - Security architecture
- **QUICKSTART.md** - Quick reference
- **README.md** - Project overview

### Support Channels
- GitHub Issues (untuk bug reports)
- Supabase Discord (untuk database issues)
- Vercel Community (untuk deployment issues)

---

## 🎉 Congratulations!

Anda berhasil menginstall dan deploy aplikasi POS & Inventory Management!

**Your stack:**
- ✅ Frontend: React + Vite + TailwindCSS
- ✅ Backend: Supabase Edge Functions
- ✅ Database: PostgreSQL (Supabase)
- ✅ Auth: Supabase Auth
- ✅ Hosting: Vercel
- ✅ SSL: Automatic (Vercel)

**Next steps:**
1. Customize aplikasi sesuai kebutuhan
2. Add your products
3. Train your cashiers
4. Start selling! 🚀

---

**Terakhir diupdate**: February 2026
**Versi**: 1.0.0