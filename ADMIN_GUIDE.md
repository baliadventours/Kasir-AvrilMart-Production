# 📋 Admin Quick Reference Card

Cheat sheet untuk administrator - print dan tempel di meja kasir!

---

## 🔑 Login Credentials

**Admin Login:**
```
URL: https://your-app.vercel.app
Email: admin@toko.com
Password: [your-password]
```

**Supabase Dashboard:**
```
URL: https://app.supabase.com
Project: [your-project-name]
Password: [database-password]
```

---

## 👤 User Management

### Tambah Kasir Baru

1. Login sebagai admin
2. Click tab **"Users"**
3. Click **"Tambah User"**
4. Isi:
   - Nama: `[Nama Kasir]`
   - Email: `kasir@toko.com`
   - Password: `[password]`
   - Role: **Kasir**
5. Click **"Tambah User"**
6. Share credentials ke kasir

### Tambah Admin Baru

Same as above, tapi Role: **Administrator**

⚠️ **Only give admin to trusted people!**

---

## 📦 Product Management

### Tambah Produk Baru

1. Tab **"Inventory"**
2. **"Tambah Produk"**
3. Isi:
   - Nama Produk
   - SKU (kode barcode)
   - Kategori
   - Harga Eceran (Rp)
   - Harga Grosir (Rp)
   - Stok Awal
   - URL Gambar (optional)
4. **"Tambah"**

### Edit Produk

1. Find product in list
2. Click **Edit** icon (pencil)
3. Update fields
4. **"Update"**

### Hapus Produk

1. Find product
2. Click **Delete** icon (trash)
3. Confirm

---

## 💰 POS Operations (Kasir)

### Proses Penjualan

1. Tab **"Point of Sale"**
2. Pilih tipe harga:
   - 🔵 **Eceran** (retail)
   - 🟢 **Grosir** (wholesale)
3. **Add products:**
   - Click product card, OR
   - Scan barcode
4. Adjust quantity (+/-)
5. Click **"Checkout"**
6. Input jumlah bayar
7. **"Process Payment"**
8. ✅ Done! Print receipt (Ctrl+P)

### Scan Barcode

1. Click barcode input field (top)
2. Scan product
3. Auto-added to cart

---

## 📊 View Reports (Admin Only)

### Sales History

1. Tab **"Sales History"**
2. View all transactions
3. Filter by date (coming soon)
4. Export to CSV (coming soon)

### Revenue Summary

See at top of Sales History:
- Total transaksi
- Total revenue
- Revenue by type (Eceran/Grosir)

### Low Stock Alert

In Inventory tab:
- 🔴 Red badge = Stock ≤ 5
- 🟡 Yellow badge = Stock ≤ 10
- 🟢 Green = Stock > 10

---

## 🚨 Common Issues

### "Produk stok habis"

**Fix:**
1. Inventory → Find product
2. Edit → Increase stock
3. Save

### "Kasir tidak bisa login"

**Fix:**
1. Check email & password correct
2. Verify user exists in Users tab
3. Reset password via Supabase if needed

### "Harga salah"

**Fix:**
1. Inventory → Edit product
2. Update Harga Eceran/Grosir
3. Save

### "Barcode tidak scan"

**Check:**
- Scanner connected & powered on
- Click barcode input field first
- SKU exists in database

---

## 📞 Emergency Contacts

**Technical Support:**
- IT Admin: [phone/email]
- Developer: [phone/email]

**Platform Support:**
- Supabase: https://supabase.com/support
- Vercel: https://vercel.com/support

---

## 🔒 Security Reminders

✅ **DO:**
- Logout setelah selesai
- Ganti password secara berkala
- Jangan share admin password
- Monitor user activity

❌ **DON'T:**
- Share service role key
- Create admin accounts sembarangan
- Leave terminal unattended when logged in

---

## 💡 Tips & Tricks

### Keyboard Shortcuts

- `Ctrl+F`: Search products
- `Ctrl+P`: Print receipt
- `F5`: Refresh data
- `Esc`: Close modal/dialog

### Best Practices

✅ Daily:
- Check low stock products
- Review sales summary
- Verify cashier activity

✅ Weekly:
- Update product prices
- Add new products
- Remove discontinued items

✅ Monthly:
- Full sales report
- Database backup
- User access review

---

## 📋 Daily Opening Checklist

Morning routine:

- [ ] Check internet connection
- [ ] Login to admin account
- [ ] Review low stock items
- [ ] Verify all products active
- [ ] Test barcode scanner
- [ ] Brief cashiers on promotions
- [ ] Ensure receipt printer working

---

## 📋 Daily Closing Checklist

End of day:

- [ ] Review sales for the day
- [ ] Check for errors/issues
- [ ] Verify cash vs system total
- [ ] Update stock for damaged items
- [ ] Logout all terminals
- [ ] Note issues for tomorrow

---

## 🆘 Who to Call When...

**System down / can't access:**
→ IT Support + Check Vercel status

**Database issues / data not saving:**
→ Check Supabase dashboard + IT Support

**Payment processing issues:**
→ Recount physical cash + Check transaction log

**New feature request:**
→ Document request + Contact developer

**User forgot password:**
→ Admin reset via Users tab or Supabase

---

## 📱 Mobile Access

App works on mobile browsers:

1. Open in Safari/Chrome
2. Login normally
3. Add to Home Screen:
   - iOS: Share → Add to Home Screen
   - Android: Menu → Add to Home Screen

---

## 🎓 Training New Staff

### For New Cashiers:

1. **Show login process**
2. **Practice adding products**
3. **Demo barcode scanning**
4. **Walk through checkout**
5. **Practice returns (if applicable)**
6. **Review common issues**

### For New Admins:

1. All cashier functions +
2. User management
3. Product management
4. Inventory updates
5. Report generation
6. Security best practices

---

## 📊 Key Metrics to Monitor

**Daily:**
- Number of transactions
- Total revenue
- Average transaction value

**Weekly:**
- Best selling products
- Slow moving items
- Stock turnover rate

**Monthly:**
- Revenue growth
- User activity
- System uptime

---

## 🔄 Update & Maintenance

**When developer pushes updates:**

1. Check Vercel dashboard
2. Auto-deploys in ~2 minutes
3. Refresh browser (Ctrl+F5)
4. Test critical functions
5. Report any issues immediately

**No downtime needed for updates!**

---

**Print this page and keep handy! 📄**

Last updated: February 2026
