# 🚀 COMPLETE GUIDE: ADD MODAL_PRICE TO DATABASE

## 📋 OVERVIEW:

**What We're Adding:**
- ✅ `modal_price` column to `products` table
- ✅ Support for modal/cost price tracking
- ✅ CSV import/export with modal_price
- ✅ Full integration with existing system

---

## 🎯 STEP-BY-STEP GUIDE:

### **STEP 1: ADD COLUMN TO SUPABASE DATABASE** 🔧

#### **Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard
2. Select your project: **Avril Mart**
3. Go to: **SQL Editor** (left sidebar)
4. Click: **"+ New query"**

#### **Copy & Paste This SQL:**

```sql
-- ========================================
-- ADD MODAL_PRICE COLUMN TO PRODUCTS TABLE
-- ========================================

-- Add the column
ALTER TABLE products 
ADD COLUMN modal_price NUMERIC(10,2);

-- Add comment for documentation
COMMENT ON COLUMN products.modal_price 
IS 'Modal/cost price of the product (harga modal/HPP)';

-- Optional: Set default value for existing products
-- This will calculate modal_price as 90% of wholesale_price
-- for products that don't have modal_price yet
UPDATE products 
SET modal_price = wholesale_price * 0.9
WHERE modal_price IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

#### **Click: RUN (Ctrl + Enter)**

#### **Expected Output:**
```
Success. 0 rows affected.

column_name       | data_type | is_nullable
------------------+-----------+-------------
id                | uuid      | NO
name              | text      | NO
sku               | text      | NO
barcode           | text      | YES
category          | text      | NO
retail_price      | numeric   | NO
wholesale_price   | numeric   | NO
modal_price       | numeric   | YES   ← NEW!
stock             | integer   | NO
created_at        | timestamp | NO
updated_at        | timestamp | NO
```

✅ **Success! Column added!**

---

### **ALTERNATIVE: Using Table Editor GUI** 🖱️

If you prefer using GUI instead of SQL:

```
1. Go to: Table Editor (left sidebar)
2. Select: products table
3. Click: "+ New Column" (top right)
4. Fill in:
   - Name: modal_price
   - Type: numeric
   - Precision: 10
   - Scale: 2
   - Default value: (leave empty)
   - Is Nullable: ✅ Yes
   - Is Unique: ☐ No
   - Is Primary Key: ☐ No
5. Click: Save
```

---

### **STEP 2: VERIFY DATABASE CHANGE** ✅

#### **Run Verification Query:**

```sql
-- Check if modal_price column exists
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'modal_price';
```

#### **Expected Result:**
```
column_name | data_type | numeric_precision | numeric_scale | is_nullable
------------+-----------+-------------------+---------------+-------------
modal_price | numeric   | 10                | 2             | YES
```

#### **Test Insert:**

```sql
-- Test inserting a product with modal_price
INSERT INTO products (name, sku, category, retail_price, wholesale_price, modal_price, stock)
VALUES ('Test Product', 'TEST-001', 'Test', 10000, 9000, 8000, 100)
RETURNING *;

-- Delete test product
DELETE FROM products WHERE sku = 'TEST-001';
```

✅ **If no errors → Database ready!**

---

### **STEP 3: UPDATE APPLICATION CODE** 💻

**All code already updated! Files changed:**

#### **✅ 1. Product Interface** (`/src/services/supabase.ts`)
```typescript
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  retail_price: number;
  wholesale_price: number;
  modal_price?: number | null;  // ← ADDED!
  stock: number;
  created_at?: string;
  updated_at?: string;
}
```

#### **✅ 2. CSV Import** (`/src/app/components/csv-import.tsx`)
```typescript
interface ProductCSVRow {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  retail_price: string | number;
  wholesale_price: string | number;
  modal_price?: string | number;  // ← ADDED!
  stock: string | number;
}

// Import handler includes modal_price
const productData: any = {
  name: row.name.trim(),
  sku: row.sku.trim(),
  barcode: row.barcode?.trim() || null,
  category: row.category.trim(),
  retail_price: parseFloat(row.retail_price.toString()),
  wholesale_price: parseFloat(row.wholesale_price.toString()),
  modal_price: row.modal_price ? parseFloat(row.modal_price.toString()) : null,  // ← ADDED!
  stock: parseInt(row.stock.toString()),
};
```

#### **✅ 3. CSV Template** (`/products_template.csv`)
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Wireless Headphones,WH-001,,Electronics,150000,120000,100000,50
Smart Watch,SW-002,,Electronics,500000,450000,400000,30
Coffee Mug,CM-003,,Kitchenware,50000,40000,30000,100
```

#### **✅ 4. CSV Export** (Already includes modal_price)
```typescript
const csvHeader = "name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock\n";
```

---

### **STEP 4: CLEAR CACHE & REFRESH** 🔄

#### **Hard Refresh Browser:**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### **Clear Service Worker (PWA):**
```
1. Open DevTools (F12)
2. Go to: Application tab
3. Click: Clear storage (left sidebar)
4. Check: ✅ Unregister service workers
5. Check: ✅ Cache storage
6. Click: Clear site data
7. Refresh page (F5)
```

#### **Verify Console (No Errors):**
```
1. Press F12
2. Console tab should be clean
3. No red errors about modal_price
```

---

### **STEP 5: PREPARE YOUR CSV FILE** 📝

#### **Your Current CSV Format:**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Mie Goreng Sedaap,AVR-00001,8998866200301,Makanan,3000,2850,2125,10000
PENSIL STAEDTLER,AVR-00002,4007817104118,Alat Tulis,4000,3800,3000,10000
```

✅ **This format is now CORRECT!**

#### **If Your CSV Missing modal_price Column:**

**Option 1: Add Column in Excel/Google Sheets**
```
1. Open CSV file
2. Insert new column after wholesale_price
3. Name it: modal_price
4. Fill with cost prices
5. Save as CSV
```

**Option 2: Calculate from wholesale_price**
```python
import pandas as pd

# Read CSV
df = pd.read_csv('your_products.csv')

# Calculate modal_price as 90% of wholesale_price
df['modal_price'] = df['wholesale_price'] * 0.9

# Save
df.to_csv('products_with_modal.csv', index=False)
```

---

### **STEP 6: TEST IMPORT** 🧪

#### **Test with ONE Product First:**

**Create: `test_single.csv`**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Test Modal Price,TEST-MODAL-001,,Test,10000,9000,8000,100
```

#### **Import Steps:**
```
1. Open App
2. Go to: Manajemen Inventori
3. Click: Import CSV
4. Upload: test_single.csv
5. Check: Should show preview with modal_price
6. Click: Import Produk
7. ✅ Should succeed!
```

#### **Verify in Console (F12):**
```javascript
Importing product 1/1: {
  name: "Test Modal Price",
  sku: "TEST-MODAL-001",
  barcode: null,
  category: "Test",
  retail_price: 10000,
  wholesale_price: 9000,
  modal_price: 8000,  // ← Should appear!
  stock: 100
}
```

#### **Success Message:**
```
✓ Berhasil: 1 produk
✗ Gagal: 0 produk
```

---

### **STEP 7: IMPORT FULL CSV** 🚀

#### **After Test Success:**
```
1. Delete test product (TEST-MODAL-001)
2. Upload your full CSV file
3. Preview should show 8 columns including modal_price
4. Click Import Produk
5. Wait for completion
6. ✅ All products imported!
```

---

## ✅ VERIFICATION CHECKLIST:

```
✅ SQL migration executed successfully
✅ modal_price column exists in database
✅ No errors in Supabase SQL Editor
✅ Hard refresh browser (Ctrl + Shift + R)
✅ Service worker cache cleared
✅ No console errors
✅ Test import with 1 product succeeds
✅ CSV preview shows 8 columns
✅ Full import completes successfully
✅ Products have modal_price values
```

---

## 📊 NEW CSV FORMAT (8 COLUMNS):

```
Column 1: name            - Product name
Column 2: sku             - Stock Keeping Unit (unique)
Column 3: barcode         - Barcode (optional - can be empty)
Column 4: category        - Product category
Column 5: retail_price    - Selling price (retail)
Column 6: wholesale_price - Wholesale price
Column 7: modal_price     - Cost price / HPP (optional)
Column 8: stock           - Stock quantity
```

**Example:**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Mie Goreng Sedaap,AVR-00001,8998866200301,Makanan,3000,2850,2125,10000
PENSIL STAEDTLER,AVR-00002,4007817104118,Alat Tulis,4000,3800,3000,10000
```

---

## 🎯 QUICK SUMMARY:

**What Changed:**
1. ✅ Database: Added `modal_price` column (NUMERIC(10,2), nullable)
2. ✅ Code: Product interface includes `modal_price?: number | null`
3. ✅ CSV Import: Accepts and imports `modal_price` field
4. ✅ CSV Export: Exports `modal_price` field
5. ✅ Template: Updated to include `modal_price` column

**What To Do:**
1. 🔧 Run SQL migration in Supabase
2. 🔄 Hard refresh browser
3. 📝 Ensure CSV has `modal_price` column
4. 🧪 Test with 1 product first
5. 🚀 Import full CSV

---

## 🆘 TROUBLESHOOTING:

### **Error: "column modal_price does not exist"**
```
→ SQL migration not executed yet
→ Run the SQL in Supabase SQL Editor
→ Verify with: SELECT * FROM information_schema.columns WHERE table_name='products'
```

### **Error: "Could not find the 'modal_price' column"**
```
→ Old code still cached
→ Hard refresh: Ctrl + Shift + R
→ Clear service worker cache
→ Restart browser
```

### **CSV Import Shows 7 Columns Instead of 8**
```
→ Browser cache issue
→ Clear all site data
→ Hard refresh
→ Download new template from app
```

### **Modal Price Not Saving**
```
→ Check database column type is numeric
→ Check CSV values are valid numbers
→ Check console for error messages
```

---

## 🎊 SUCCESS INDICATORS:

**Console Output:**
```javascript
Importing product 1/100: {
  name: "Mie Goreng Sedaap",
  sku: "AVR-00001",
  barcode: "8998866200301",
  category: "Makanan",
  retail_price: 3000,
  wholesale_price: 2850,
  modal_price: 2125,  // ✅ Present!
  stock: 10000
}
```

**Import Result:**
```
✓ Berhasil: 100 produk
✗ Gagal: 0 produk
```

**CSV Export Result:**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Mie Goreng Sedaap,AVR-00001,8998866200301,Makanan,3000,2850,2125,10000
```

---

Ready to add modal_price! Start with STEP 1: Run the SQL migration! 🚀
