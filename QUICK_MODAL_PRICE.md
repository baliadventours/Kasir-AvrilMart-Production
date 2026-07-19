# ⚡ QUICK START: Add Modal Price (5 Minutes)

## 🎯 STEP 1: RUN SQL (2 min)

### Open Supabase Dashboard:
```
https://supabase.com/dashboard
→ Your Project
→ SQL Editor
→ New Query
```

### Copy & Run This SQL:
```sql
ALTER TABLE products ADD COLUMN modal_price NUMERIC(10,2);
UPDATE products SET modal_price = wholesale_price * 0.9 WHERE modal_price IS NULL;
```

### Click: **RUN**

✅ Should see: "Success. No rows returned"

---

## 🔄 STEP 2: HARD REFRESH (1 min)

```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Clear PWA Cache:**
```
F12 → Application → Clear storage → Clear site data
```

---

## 📝 STEP 3: CHECK CSV FORMAT (1 min)

### Your CSV Should Have 8 Columns:
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Mie Goreng,AVR-001,123,Makanan,3000,2850,2125,10000
```

**Count commas in header: Should be 7 (= 8 columns)**

✅ Your current CSV format: `formatted_products_no_image_part_1.csv` is **CORRECT**!

---

## 🧪 STEP 4: TEST IMPORT (1 min)

### Test File: `test.csv`
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Test,TEST-001,,Test,10000,9000,8000,100
```

### Import:
```
App → Manajemen Inventori → Import CSV → Upload test.csv
```

✅ Should show: "✓ Berhasil: 1 produk"

---

## 🚀 STEP 5: IMPORT FULL CSV (1 min)

```
1. Delete test product
2. Import: formatted_products_no_image_part_1.csv
3. Wait for completion
4. ✅ Done!
```

---

## ✅ VERIFICATION:

### Console Should Show:
```javascript
Importing product 1/100: {
  name: "Mie Goreng Sedaap",
  modal_price: 2125,  // ← Should appear!
  ...
}
```

### Success Message:
```
✓ Berhasil: 100 produk
✗ Gagal: 0 produk
```

---

## 🆘 IF ERROR:

### "column modal_price does not exist"
```
→ SQL not executed
→ Go to Supabase → Run SQL again
```

### "Could not find modal_price column"
```
→ Cache issue
→ Ctrl + Shift + R
→ Clear all site data
```

### CSV Import Shows Wrong Columns
```
→ Hard refresh: Ctrl + Shift + R
→ Download new template from app
```

---

## 📊 FINAL CSV FORMAT:

```
8 COLUMNS (7 commas):
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock

✅ CORRECT: 7 commas
❌ WRONG: 6 commas (missing modal_price)
❌ WRONG: 8 commas (extra column)
```

---

## 🎯 DONE IN 5 STEPS:

```
1. ✅ Run SQL in Supabase
2. ✅ Hard refresh browser
3. ✅ Check CSV has 8 columns
4. ✅ Test with 1 product
5. ✅ Import full CSV
```

**Total Time: ~5 minutes** ⏱️

---

See `/COMPLETE_MODAL_PRICE_GUIDE.md` for detailed guide! 📖
