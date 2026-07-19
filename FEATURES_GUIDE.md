# 📋 New Features Guide

Panduan untuk fitur-fitur baru: CSV Import & Thermal Receipt Printing

---

## 📥 CSV Import untuk Bulk Products

### Overview

Fitur CSV Import memungkinkan Anda menambahkan banyak produk sekaligus melalui file CSV, menghemat waktu dibanding input manual satu per satu.

### Cara Menggunakan

#### Step 1: Akses Inventory Tab
1. Login sebagai **Admin**
2. Click tab **"Inventory"**
3. Click tombol **"Import CSV"** (icon Upload)

#### Step 2: Download Template CSV
1. Di modal Import CSV, click **"Download Template CSV"**
2. File `products_template.csv` akan terdownload
3. Buka file dengan Excel, Google Sheets, atau LibreOffice

#### Step 3: Isi Data Produk

Format CSV yang diperlukan:
```csv
name,sku,category,retail_price,wholesale_price,stock,image_url
Wireless Headphones,WH-001,Electronics,150000,120000,50,https://example.com/image.jpg
```

**Kolom Wajib:**
- `name`: Nama produk
- `sku`: Kode barcode/SKU (harus unique)
- `category`: Kategori produk
- `retail_price`: Harga eceran (angka tanpa titik/koma)
- `wholesale_price`: Harga grosir (angka tanpa titik/koma)
- `stock`: Jumlah stok (angka)

**Kolom Optional:**
- `image_url`: URL gambar produk (kosongkan jika tidak punya)

**Contoh Data:**
```csv
name,sku,category,retail_price,wholesale_price,stock,image_url
Wireless Headphones,WH-001,Electronics,150000,120000,50,
Smart Watch,SW-002,Electronics,500000,450000,30,https://example.com/watch.jpg
Coffee Mug,CM-003,Kitchenware,50000,40000,100,
```

#### Step 4: Upload File CSV
1. Click **"Klik untuk upload file CSV"** atau drag & drop
2. Pilih file CSV Anda
3. System akan otomatis validasi data

#### Step 5: Preview & Validasi

System akan menampilkan:
- ✅ **Validasi Berhasil**: Jika semua data benar
- ❌ **Error**: Jika ada data yang salah/kurang

**Preview Table:**
- Menampilkan 5 produk pertama
- Check semua data sudah sesuai

**Error Messages:**
- "Row X: Nama produk wajib diisi"
- "Row X: Harga eceran harus angka positif"
- dll.

#### Step 6: Import Products
1. Jika validasi berhasil, click **"Import Produk"**
2. Tunggu proses import (loading indicator muncul)
3. Hasil import akan ditampilkan:
   - ✓ Berhasil: X produk
   - ✗ Gagal: Y produk (with error details)

#### Step 7: Verify
1. Close modal import
2. Check table Inventory - produk baru sudah muncul!
3. Test dengan scan barcode atau add to cart

---

## 🖨️ Thermal Receipt Printing

### Overview

Fitur Thermal Receipt menghasilkan nota struk otomatis yang dioptimalkan untuk printer thermal (58mm/80mm), dengan format profesional dan ready to print.

### Cara Menggunakan

#### Step 1: Complete a Sale
1. Di tab **"Point of Sale"**
2. Add products ke cart
3. Click **"Checkout"**
4. Input payment amount
5. Click **"Complete Sale"**

#### Step 2: Auto Receipt Display
Setelah transaksi berhasil, modal receipt otomatis muncul dengan:
- Store information (nama toko, alamat, telp)
- Transaction details (tanggal, waktu, no. transaksi)
- Items purchased (nama, qty, harga)
- Subtotal, Tax, Total
- Payment info
- Footer message

#### Step 3: Print Receipt
**Option A: Click Print Button**
1. Click tombol **"Cetak"** (Printer icon)
2. Browser print dialog akan muncul
3. Pilih printer (thermal printer or regular)
4. Click "Print"

**Option B: Keyboard Shortcut**
1. Press `Ctrl+P` (Windows/Linux) atau `Cmd+P` (Mac)
2. Same print dialog akan muncul

#### Step 4: Printer Setup

**For Thermal Printer (58mm/80mm):**
- Paper size: Auto-detect atau Custom (80mm width)
- Margins: None/Minimal
- Scale: 100%
- Background graphics: Enabled

**For Regular Printer (A4):**
- Works but akan ada spacing banyak
- Not recommended untuk production use

---

## ⚙️ Thermal Receipt Configuration

### Customize Store Information

Edit file `/src/app/components/thermal-receipt.tsx`:

```typescript
<ThermalReceipt
  sale={saleData}
  storeName="TOKO SERBA ADA"  // Change here
  storeAddress="Jl. Contoh No. 123, Jakarta"  // Change here
  storePhone="0812-3456-7890"  // Change here
  onClose={...}
/>
```

**In POS Interface:**
Update `pos-interface.tsx` around line 121-123 (where ThermalReceipt is called).

### Customize Receipt Format

**Change Paper Width:**
In `thermal-receipt.tsx`, line 42:
```typescript
@page {
  size: 80mm auto;  // Change to 58mm for smaller thermal printer
  margin: 0;
}
```

**Change Tax Rate:**
Receipt automatically calculates from sale data. To change default tax:
In `pos-interface.tsx`, line 28:
```typescript
const tax = subtotal * 0.1; // Change 0.1 to your tax rate (e.g., 0.11 for 11%)
```

**Change Footer Message:**
In `thermal-receipt.tsx`, around line 290:
```typescript
<div>Terima kasih atas kunjungan Anda</div>
<div style={{ marginTop: "5px" }}>Barang yang sudah dibeli</div>
<div>tidak dapat dikembalikan</div>
```

**Add Barcode/QR Code:**
Install package: `react-barcode` or `qrcode.react`
```bash
npm install react-barcode
```

Then import dan add to receipt component.

---

## 💡 Tips & Best Practices

### CSV Import

✅ **DO:**
- Use template CSV provided
- Test dengan beberapa produk dulu
- Check preview sebelum import
- Backup data existing sebelum bulk import
- Use unique SKU untuk tiap produk

❌ **DON'T:**
- Import file dengan thousands separator (1,000 atau 1.000)
- Use special characters di SKU
- Mix decimal separator (use dots only: 50.5)
- Import duplicate SKU
- Skip validation messages

### Thermal Receipt

✅ **DO:**
- Test print ke regular printer dulu
- Configure store info sebelum production
- Check paper roll sebelum print
- Keep printer connected & powered
- Use recommended thermal paper (quality)

❌ **DON'T:**
- Print without preview
- Use incompatible paper width
- Ignore printer calibration
- Let paper run out mid-transaction

---

## 🐛 Troubleshooting

### CSV Import Issues

**Problem: "Validasi gagal! X error ditemukan"**

**Solutions:**
1. Read error messages carefully
2. Check row numbers mentioned
3. Fix errors in CSV file:
   - Empty required fields → Fill them
   - Non-numeric prices → Remove letters/symbols
   - Negative stock → Use 0 or positive number
4. Re-upload file

**Problem: "Import gagal untuk beberapa produk"**

**Causes:**
- Duplicate SKU already exists in database
- Database connection issue
- Server timeout (too many products)

**Solutions:**
1. Check error details in result message
2. Remove products that already exist
3. Split large CSV into smaller batches (max 100 products per import)
4. Try again with smaller file

**Problem: "File CSV tidak terbaca"**

**Solutions:**
1. Make sure file extension is `.csv`
2. Save as CSV UTF-8 (not Excel format)
3. Check file not corrupted
4. Try export/save again from spreadsheet app

### Thermal Receipt Issues

**Problem: "Nothing happens when clicking Print"**

**Solutions:**
1. Check browser popup blocker
2. Allow print dialog in browser settings
3. Check printer connected & online
4. Try Ctrl+P manually

**Problem: "Receipt format wrong/cut off"**

**Solutions:**
1. Verify paper width setting (58mm vs 80mm)
2. Check printer margins = 0 or minimal
3. Scale must be 100% (no fit-to-page)
4. Update printer driver if old

**Problem: "Receipt prints blank"**

**Solutions:**
1. Enable "Background graphics" in print settings
2. Check thermal paper not faded/old
3. Check printer darkness setting
4. Try test print from printer menu

**Problem: "Store info not updating"**

**Solutions:**
1. Edit source file: `/src/app/components/thermal-receipt.tsx`
2. Rebuild app: `npm run build`
3. Deploy new version
4. Hard refresh browser (Ctrl+Shift+R)

---

## 📊 Feature Comparison

| Feature | CSV Import | Manual Add | Receipt | Regular HTML |
|---------|-----------|------------|---------|-------------|
| Speed | ⚡⚡⚡ Fast | 🐌 Slow | ⚡⚡ Fast | ⚡⚡ Fast |
| Validation | ✅ Batch | ✅ Per item | - | - |
| Error handling | ✅ Detailed | ✅ Immediate | ✅ Auto | ⚠️ Manual |
| Bulk operation | ✅ Yes | ❌ No | - | - |
| Preview | ✅ Yes | ✅ Live | ✅ Yes | ❌ No |
| Thermal optimized | - | - | ✅ Yes | ❌ No |
| Professional | - | - | ✅ Yes | ⚠️ Basic |

---

## 📚 Additional Resources

### CSV Format Tools
- **Excel**: File → Save As → CSV UTF-8
- **Google Sheets**: File → Download → CSV
- **LibreOffice**: Save As → Text CSV (.csv)

### Thermal Printer Recommendations
- **58mm**: Portable, cashier, mobile POS
- **80mm**: Standard, retail stores, restaurants (recommended)
- **Brands**: Epson TM-T82, Xprinter, Zjiang

### Printer Connection
- **USB**: Plug & play, most reliable
- **Bluetooth**: Mobile, wireless
- **Network**: Multi-device, centralized

---

## 🎓 Video Tutorial (Coming Soon)

- CSV Import walkthrough
- Receipt configuration
- Printer setup guide
- Troubleshooting common issues

---

## 🔄 Changelog

### v1.1.0 (February 2026)
- ✅ Added CSV Import feature
- ✅ Added Thermal Receipt printing
- ✅ Template CSV download
- ✅ Validation & preview
- ✅ Print optimization for 80mm thermal

---

## 🆘 Need Help?

**For CSV Import issues:**
- Check FAQ.md → Inventory Management section
- Validate CSV in online tools first
- Contact support with error screenshots

**For Thermal Receipt issues:**
- Check printer compatibility
- Test with regular printer first
- Share print preview screenshot

**Report bugs:**
- GitHub Issues with label: `csv-import` or `thermal-receipt`
- Include steps to reproduce
- Attach sample CSV or screenshot

---

**Happy importing & printing! 🎉📄**
