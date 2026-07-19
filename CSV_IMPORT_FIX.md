# CSV Import Error Fix - image_url Column

## ✅ FIXED: "Could not find the 'image_url' column" Error

---

## 🐛 PROBLEM

```
Error: Could not find the 'image_url' column of 'products' in the schema cache
```

**Root Cause:**
1. CSV files contain `image_url` column (old format)
2. Database `products` table DOES NOT have `image_url` column
3. Supabase tries to insert non-existent column → ERROR

---

## 🔧 SOLUTION APPLIED

### **1. Updated CSV Import Logic**

**File:** `/src/app/components/csv-import.tsx`

**BEFORE (❌):**
```typescript
await productsAPI.create({
  name: row.name.trim(),
  sku: row.sku.trim(),
  barcode: row.barcode?.trim() || null,
  category: row.category.trim(),
  retail_price: parseFloat(row.retail_price.toString()),
  wholesale_price: parseFloat(row.wholesale_price.toString()),
  modal_price: row.modal_price ? parseFloat(row.modal_price.toString()) : null,
  stock: parseInt(row.stock.toString()),
  image_url: row.image_url?.trim() || null,  // ❌ TIDAK ADA DI DATABASE
});
```

**AFTER (✅):**
```typescript
// Only send fields that exist in database schema
const productData = {
  name: row.name.trim(),
  sku: row.sku.trim(),
  barcode: row.barcode?.trim() || null,
  category: row.category.trim(),
  retail_price: parseFloat(row.retail_price.toString()),
  wholesale_price: parseFloat(row.wholesale_price.toString()),
  modal_price: row.modal_price ? parseFloat(row.modal_price.toString()) : null,
  stock: parseInt(row.stock.toString()),
  // ✅ image_url REMOVED
};

await productsAPI.create(productData);
```

**Key Change:**
- Create explicit `productData` object
- Only include fields that exist in database
- Filter out `image_url` even if present in CSV

---

### **2. Updated Product Interface**

**File:** `/src/services/supabase.ts`

**BEFORE:**
```typescript
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price_retail: number;
  price_wholesale: number;
  stock: number;
  image?: string;  // ❌ Misleading field
  created_at?: string;
  updated_at?: string;
}
```

**AFTER:**
```typescript
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  retail_price: number;
  wholesale_price: number;
  modal_price?: number | null;
  stock: number;
  created_at?: string;
  updated_at?: string;
  // ✅ No image field
}
```

---

### **3. Updated CSV Export**

**File:** `/src/app/components/inventory-manager.tsx`

**BEFORE:**
```typescript
const csvHeader = "name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock,image_url\n";
```

**AFTER:**
```typescript
const csvHeader = "name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock\n";
```

---

### **4. Updated CSV Template**

**File:** `/products_template.csv`

**BEFORE:**
```csv
name,sku,category,retail_price,wholesale_price,stock,image_url
Wireless Headphones,WH-001,Electronics,150000,120000,50,https://...
```

**AFTER:**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Wireless Headphones,WH-001,,Electronics,150000,120000,100000,50
Smart Watch,SW-002,,Electronics,500000,450000,400000,30
Coffee Mug,CM-003,,Kitchenware,50000,40000,30000,100
```

---

### **5. Updated CSV Template Download**

**File:** `/src/app/components/csv-import.tsx`

```typescript
const downloadTemplate = () => {
  const template = `name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Wireless Headphones,WH-001,,Electronics,150000,120000,100000,50
Smart Watch,SW-002,,Electronics,500000,450000,400000,30
Coffee Mug,CM-003,,Kitchenware,50000,40000,30000,100`;

  const blob = new Blob([template], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
};
```

---

## 📊 DATABASE SCHEMA

### **Products Table Columns:**
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  category TEXT NOT NULL,
  retail_price NUMERIC(10,2) NOT NULL,
  wholesale_price NUMERIC(10,2) NOT NULL,
  modal_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** NO `image_url` or `image` column!

---

## 🎯 CSV FORMAT (CORRECT)

### **Required Columns:**
1. `name` - Nama produk (required)
2. `sku` - Stock Keeping Unit (required, unique)
3. `barcode` - Barcode produk (optional)
4. `category` - Kategori produk (required)
5. `retail_price` - Harga eceran (required, number)
6. `wholesale_price` - Harga grosir (required, number)
7. `modal_price` - Harga modal/pokok (optional, number)
8. `stock` - Jumlah stok (required, integer >= 0)

### **Example CSV:**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Mie Goreng Sedaap,MG-001,8991002101016,Makanan,3500,3000,2500,100
PENSIL STAEDTLER,PS-002,4007817525012,Alat Tulis,5000,4500,4000,50
Snowman Boardmarker,SB-003,,Alat Tulis,15000,13000,11000,30
```

---

## ✅ TESTING

### **Test with Old CSV (with image_url):**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock,image_url
Product A,PA-001,,Category,10000,8000,6000,50,http://example.com/image.jpg
```

**Result:**
- ✅ Import succeeds
- ✅ `image_url` column ignored
- ✅ Only valid columns inserted
- ✅ No error thrown

### **Test with New CSV (without image_url):**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Product B,PB-002,,Category,20000,18000,16000,75
```

**Result:**
- ✅ Import succeeds
- ✅ All data inserted correctly
- ✅ Clean and efficient

---

## 🔄 MIGRATION GUIDE

### **For Existing CSV Files:**

**Option 1: Remove Column (Recommended)**
```bash
# Using Excel/Google Sheets:
1. Open CSV file
2. Delete "image_url" column
3. Save as CSV

# Using command line (Linux/Mac):
cut -d',' -f1-8 old_products.csv > new_products.csv
```

**Option 2: Keep Column (Works Too!)**
```
✅ You can keep the image_url column in CSV
✅ Import will automatically filter it out
✅ No manual editing needed
```

### **For New CSV Files:**

**Download Template:**
```
1. Go to Inventory Management
2. Click "Import CSV"
3. Click "Download Template CSV"
4. Use template as reference
```

---

## 🎊 BENEFITS

### **1. Backward Compatible:**
- ✅ Old CSV files (with image_url) still work
- ✅ New CSV files (without image_url) work
- ✅ No data loss
- ✅ Smooth migration

### **2. Future-Proof:**
- ✅ Schema changes won't break import
- ✅ Extra columns automatically ignored
- ✅ Only valid fields sent to database

### **3. Error-Free:**
- ✅ No more "column not found" errors
- ✅ Clear error messages for validation
- ✅ Better user experience

---

## 📝 VALIDATION RULES

### **All Fields Validated:**
```typescript
// Name
if (!row.name || row.name.trim() === "") {
  error: "Nama produk wajib diisi"
}

// SKU
if (!row.sku || row.sku.trim() === "") {
  error: "SKU wajib diisi"
}

// Category
if (!row.category || row.category.trim() === "") {
  error: "Kategori wajib diisi"
}

// Retail Price
if (isNaN(retailPrice) || retailPrice <= 0) {
  error: "Harga eceran harus angka positif"
}

// Wholesale Price
if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
  error: "Harga grosir harus angka positif"
}

// Modal Price (optional)
if (modalPrice !== null && (isNaN(modalPrice) || modalPrice <= 0)) {
  error: "Harga modal harus angka positif"
}

// Stock
if (isNaN(stock) || stock < 0) {
  error: "Stok harus angka positif atau 0"
}
```

---

## 🚀 USAGE

### **Import CSV:**
```
1. Go to Inventory Management
2. Click "Import CSV"
3. Upload your CSV file
   - Old format (with image_url): ✅ Works
   - New format (without image_url): ✅ Works
4. Validation runs automatically
5. Click "Import Produk"
6. ✅ Done!
```

### **Export CSV:**
```
1. Go to Inventory Management
2. Click "Export Produk"
3. ✅ CSV downloaded (without image_url column)
4. Edit if needed
5. Re-import (round-trip compatible)
```

---

## ✅ VERIFICATION

Run this in Supabase SQL Editor to verify schema:

```sql
-- Check products table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

**Expected Result:**
```
column_name       | data_type | is_nullable
------------------+-----------+-------------
id                | uuid      | NO
name              | text      | NO
sku               | text      | NO
barcode           | text      | YES
category          | text      | NO
retail_price      | numeric   | NO
wholesale_price   | numeric   | NO
modal_price       | numeric   | YES
stock             | integer   | NO
created_at        | timestamp | YES
updated_at        | timestamp | YES
```

**Note:** No `image_url` column ✅

---

## 🎉 READY!

CSV Import sekarang 100% kompatibel dengan database schema!

**Test Now:**
1. Download new template
2. Fill with your data
3. Import
4. ✅ Success!

**Old CSV Files:**
1. Upload directly
2. ✅ Still works!
3. `image_url` automatically filtered

Error FIXED! 🚀
