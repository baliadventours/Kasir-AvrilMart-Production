# 🚀 QUICK DEPLOYMENT GUIDE - SETTINGS FEATURE

## ⚡ 5-MINUTE SETUP

---

## 📋 **PREREQUISITES**

```
✅ Supabase project is set up
✅ Previous SQL scripts have been run
✅ App is already deployed to Vercel
✅ You have admin access
```

---

## 🎯 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Run SQL Script** (2 minutes)

```bash
1. Open Supabase Dashboard
   https://supabase.com/dashboard

2. Go to: SQL Editor → New query

3. Copy ENTIRE content from:
   /create-settings-table.sql

4. Paste in SQL Editor

5. Click "Run" (Ctrl+Enter)
```

**✅ Success Indicators**:
```
- "App Settings:" shows 1 row
- "Success message" displayed
- No errors
```

**❌ If Error**:
```sql
-- If you get "table already exists":
DROP TABLE IF EXISTS app_settings CASCADE;
-- Then run the script again
```

---

### **Step 2: Deploy Frontend** (3 minutes)

```bash
# Option A: Git Push (Recommended)
git add .
git commit -m "Add Settings: Logo, Tax, Custom Receipt, Payment Methods"
git push

# Vercel will auto-deploy in ~2 minutes
```

```bash
# Option B: Manual Deploy in Vercel Dashboard
1. Go to Vercel Dashboard
2. Find your project
3. Click "Redeploy"
```

---

## ✅ **VERIFICATION**

### **Check Database**:

```sql
-- In Supabase SQL Editor:
SELECT * FROM app_settings;
-- Should show 1 row with default settings

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'sales' AND column_name = 'payment_method';
-- Should return 'payment_method'
```

### **Check Frontend**:

```bash
1. Open your app URL
2. Login as Admin
3. ✅ See "⚙️ Pengaturan" in sidebar
4. Click on it
5. ✅ Settings page loads
```

---

## 🧪 **QUICK TEST**

### **Test All Features (2 minutes)**:

```bash
1. Go to Settings
2. Change store name to "Test Store"
3. Enable tax (set to 15%)
4. Click "Simpan Pengaturan"
5. ✅ Toast: "Pengaturan berhasil disimpan!"

6. Go to POS (Kasir)
7. Add a product (e.g., Rp 10,000)
8. Process sale
9. Check receipt:
   ✅ Shows "Test Store"
   ✅ Shows Pajak (15%): Rp 1,500
   ✅ Total: Rp 11,500
```

---

## 📊 **WHAT'S NEW**

### **Menu**:
```
⚙️ Settings (New menu in sidebar)
- Only visible to Admin
- Located at bottom of menu list
```

### **Features**:
```
1. Store Info (Nama, Alamat, Telp)
2. Logo Upload (PNG/JPG, max 2MB)
3. Receipt Messages (Header & Footer)
4. Tax (Enable/Disable + Percentage)
5. Payment Amount (Show/Hide)
6. Payment Methods (5 options)
```

### **Database**:
```
+ app_settings table (new)
+ sales.payment_method column (new)
```

---

## 🔧 **TROUBLESHOOTING**

### **Problem: "Table already exists"**

**Solution**:
```sql
DROP TABLE IF EXISTS app_settings CASCADE;
-- Then run the script again
```

---

### **Problem: "Settings not loading"**

**Solution**:
```sql
-- Check if settings exist:
SELECT * FROM app_settings;

-- If empty, insert manually:
INSERT INTO app_settings (store_name, store_address, store_phone, tax_enabled, tax_percentage, receipt_header, receipt_footer, show_payment_amount, default_payment_method)
VALUES ('Avril Mart', 'Kintamani - Bali', '0812-3456-7890', FALSE, 10.00, 'Terima kasih telah berbelanja!', 'Barang yang sudah dibeli tidak dapat dikembalikan', TRUE, 'cash');
```

---

### **Problem: "Cannot access Settings menu"**

**Check**:
```
- Are you logged in as Admin? (Cashier cannot access Settings)
- Did you refresh the page after deployment?
- Clear browser cache (Ctrl+Shift+R)
```

---

### **Problem: "Logo not uploading"**

**Check**:
```
- File size < 2MB?
- File format is PNG/JPG?
- Try a smaller image
```

---

### **Problem: "Tax not calculating"**

**Check**:
```sql
-- Verify settings:
SELECT tax_enabled, tax_percentage FROM app_settings;

-- Should show:
tax_enabled: true
tax_percentage: 10.00 (or your custom value)
```

---

## 📱 **MOBILE TESTING**

```bash
1. Open app on mobile browser
2. Login as Admin
3. Go to Settings
4. ✅ All fields responsive
5. ✅ Logo upload works
6. ✅ Save button works
```

---

## 🎯 **FEATURE CHECKLIST**

After deployment, verify:

```
[ ] Settings menu appears in sidebar
[ ] Can access Settings page
[ ] Can change store name
[ ] Can change store address
[ ] Can change store phone
[ ] Can upload logo (<2MB)
[ ] Can remove logo
[ ] Can edit receipt header
[ ] Can edit receipt footer
[ ] Can enable/disable tax
[ ] Can change tax percentage
[ ] Can toggle payment amount display
[ ] Can select payment method
[ ] Can save all settings
[ ] Toast notification on save
[ ] Settings persist after refresh
[ ] Receipt shows updated settings
[ ] Tax calculation works
[ ] Payment method saved to sales
```

---

## 💡 **TIPS**

### **Logo Tips**:
```
- Use square logo (1:1 ratio) for best results
- Recommended size: 200x200px to 500x500px
- Compress image before upload
- Use transparent background (PNG) for best look
```

### **Tax Tips**:
```
- Common tax rates:
  - PPN Indonesia: 11%
  - Service charge: 5-10%
  - Combined: 16-21%
- You can use decimal: 11.5%, 10.25%, etc.
```

### **Receipt Messages Tips**:
```
- Keep header short and friendly
- Keep footer clear and important
- Examples:
  - Header: "Terima kasih!", "Thank you!", "Gracias!"
  - Footer: "No returns", "Keep receipt", "Visit again!"
```

---

## 📞 **SUPPORT CHECKLIST**

If users report issues:

```
1. Check Supabase logs:
   Dashboard → Logs → SQL Logs

2. Check browser console:
   F12 → Console → Look for errors

3. Check network tab:
   F12 → Network → Filter "settings"

4. Verify database:
   SELECT * FROM app_settings;

5. Verify RLS policies:
   SELECT * FROM pg_policies WHERE tablename = 'app_settings';
```

---

## 🎉 **SUCCESS!**

After successful deployment:

```
✅ Settings table created
✅ Default settings inserted
✅ Frontend deployed
✅ Settings menu visible
✅ All features working
✅ Receipts use settings
✅ Tax calculating correctly
✅ Payment methods saved

🎊 Your POS system now has full customization!
```

---

## 📚 **NEXT STEPS**

After Settings is working:

```
1. Test all 6 features
2. Configure your store info
3. Upload your logo
4. Set your tax rate
5. Customize receipt messages
6. Train staff on new features
7. ✅ Start using!
```

---

## 🔗 **QUICK LINKS**

```
SQL Script:     /create-settings-table.sql
Documentation:  /SETTINGS_FEATURE.md
This Guide:     /DEPLOYMENT_SETTINGS.md

Frontend Files:
- /src/app/components/settings.tsx
- /src/app/types.ts
- /src/services/supabase.ts
- /src/app/components/thermal-receipt.tsx
```

---

**Total Time**: ~5 minutes  
**Difficulty**: ⭐⭐ Easy  
**Status**: ✅ Ready to deploy

**Just run the SQL script and push to Git!** 🚀
