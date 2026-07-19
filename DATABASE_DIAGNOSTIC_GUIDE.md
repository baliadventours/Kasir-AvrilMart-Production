# 🔍 DATABASE SCHEMA DIAGNOSTIC TOOL

## 🚨 ERROR 400: Field Name Mismatch!

Error "Failed to load resource: 400" biasanya disebabkan oleh **field name mismatch** antara code dan database schema.

**Possible Issues:**
- Code pakai: `retail_price` → Database expect: `price_retail`
- Code pakai: `wholesale_price` → Database expect: `price_wholesale`
- Code pakai: `modal_price` → Database expect: `price_modal`

---

## 🔧 STEP 1: RUN DIAGNOSTIC

### **Hard Refresh dulu!**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### **Open Browser Console**
```
1. Press F12
2. Click "Console" tab
3. Make sure console is clear
```

### **Run Diagnostic Commands**

**Command 1: Get Database Columns**
```javascript
await getDatabaseColumns()
```

Expected Output:
```javascript
✅ Database columns found: [
  "id",
  "name", 
  "sku",
  "barcode",
  "category",
  "price_retail",      // atau retail_price?
  "price_wholesale",   // atau wholesale_price?
  "price_modal",       // atau modal_price?
  "stock",
  "created_at",
  "updated_at"
]
```

**Command 2: Test Schema**
```javascript
await testDatabaseSchema()
```

Expected Output:
```javascript
=== Testing Database Schema ===

1. Testing with retail_price / wholesale_price...
✅ retail_price / wholesale_price SUCCESS!

// OR

❌ retail_price / wholesale_price failed:
Error: column "retail_price" does not exist

2. Testing with price_retail / price_wholesale...
✅ price_retail / price_wholesale SUCCESS!
```

---

## 📊 ANALYZE RESULTS

### **Scenario A: retail_price SUCCESS**
```
✅ Database uses: retail_price, wholesale_price, modal_price
→ Code already correct!
→ Problem is elsewhere (possibly cache)
```

**Solution:**
```
1. Clear all cache (see CLEAR_CACHE_GUIDE.md)
2. Try import again
```

### **Scenario B: price_retail SUCCESS**
```
❌ Database uses: price_retail, price_wholesale, price_modal
→ Code needs field name conversion!
→ Need to map frontend → database field names
```

**Solution:**
```
→ I will update code to convert field names
→ See "STEP 2: FIX FIELD NAMES" below
```

---

## 🔧 STEP 2: SHARE DIAGNOSTIC RESULTS

### **Copy Console Output**

**What to Share:**
```
1. Output dari: getDatabaseColumns()
   → Shows actual database columns

2. Output dari: testDatabaseSchema()
   → Shows which format works

3. Full error message from CSV import
   → Shows exact error details
```

**Example:**
```
Console Output:
--------------
await getDatabaseColumns()

✅ Database columns found: [
  "id",
  "name",
  "sku", 
  "barcode",
  "category",
  "price_retail",
  "price_wholesale",
  "price_modal",
  "stock",
  "created_at",
  "updated_at"
]

await testDatabaseSchema()

1. Testing with retail_price / wholesale_price...
❌ retail_price / wholesale_price failed
Error: column "retail_price" does not exist

2. Testing with price_retail / price_wholesale...  
✅ price_retail / price_wholesale SUCCESS!
```

---

## 🎯 STEP 3: QUICK FIX (If price_retail format)

Jika database menggunakan `price_retail` format, saya perlu update code untuk map field names.

### **Field Name Mapping:**
```typescript
Frontend (Code) → Database
---------------------------------
retail_price    → price_retail
wholesale_price → price_wholesale
modal_price     → price_modal
```

### **What I'll Fix:**
```
1. ✅ productsAPI.create() - add field mapping
2. ✅ CSV import - convert field names
3. ✅ Product interface - add conversion utility
4. ✅ All CRUD operations - apply mapping
```

---

## 🧪 DETAILED ERROR LOGGING

Saya sudah tambahkan detailed error logging. Ketika CSV import error, console akan show:

```javascript
Error importing row 2:
{
  message: "...",
  hint: "...",
  details: "...",
  code: "...",
  row: { ... }
}
```

**What to Look For:**
```
1. message: "column "retail_price" does not exist"
   → Field name mismatch!
   → Database expects: price_retail

2. message: "duplicate key value violates unique constraint"
   → SKU already exists
   → Need unique SKU per product

3. message: "null value in column"
   → Required field missing
   → Check CSV data
```

---

## 🚀 QUICK TEST STEPS

### **1. Hard Refresh**
```bash
Ctrl + Shift + R
```

### **2. Open Console**
```bash
F12 → Console tab
```

### **3. Run Diagnostics**
```javascript
// Get actual database columns
await getDatabaseColumns()

// Test which format works
await testDatabaseSchema()
```

### **4. Try Import 1 Product**

**Create test file: `test_one.csv`**
```csv
name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Test Single,TEST-999,,Test,10000,9000,8000,100
```

**Upload & Check Console:**
```
1. Import test_one.csv
2. Watch console for errors
3. Look for "Error importing row 2:"
4. Copy full error details
```

### **5. Share Results**
```
Share:
1. Output dari getDatabaseColumns()
2. Output dari testDatabaseSchema()
3. Error details dari console
4. Screenshot if possible
```

---

## 💡 COMMON FIXES

### **Fix 1: Cache Issue**
```bash
# Clear all cache
Ctrl + Shift + R

# Or clear site data
DevTools → Application → Clear storage
```

### **Fix 2: Field Name Mismatch**
```javascript
// If database uses price_retail format
// I'll update code to convert:

const dbProduct = {
  ...product,
  price_retail: product.retail_price,
  price_wholesale: product.wholesale_price,
  price_modal: product.modal_price,
};

// Remove frontend field names
delete dbProduct.retail_price;
delete dbProduct.wholesale_price;
delete dbProduct.modal_price;
```

### **Fix 3: Unique Constraint**
```
Error: "duplicate key value violates unique constraint"

Solution:
- Check SKU is unique in CSV
- Or delete existing products first
- Or update instead of insert
```

---

## ✅ VERIFICATION

**Success Indicators:**
```
✅ testDatabaseSchema() returns "retail_price" or "price_retail"
✅ getDatabaseColumns() shows all columns
✅ CSV import works without errors
✅ Products appear in inventory
```

---

## 🆘 IF STILL ERROR

### **Last Resort:**

**Check Supabase Dashboard:**
```
1. Go to Supabase Dashboard
2. Table Editor → products table
3. Look at column names
4. Take screenshot
5. Share with me
```

**Manual SQL Query:**
```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

**Result will show:**
```
column_name       | data_type
------------------+-----------
id                | uuid
name              | text
sku               | text
barcode           | text
category          | text
price_retail      | numeric    ← Check this!
price_wholesale   | numeric    ← And this!
price_modal       | numeric    ← And this!
stock             | integer
created_at        | timestamp
updated_at        | timestamp
```

---

## 🎯 ACTION REQUIRED

**Do This Now:**
```
1. Hard Refresh (Ctrl + Shift + R)
2. F12 → Console
3. Run: await getDatabaseColumns()
4. Run: await testDatabaseSchema()
5. Share output with me
```

**I Need:**
```
✅ Output dari getDatabaseColumns()
✅ Output dari testDatabaseSchema()  
✅ Full error message from console
✅ (Optional) Screenshot Supabase table structure
```

Then I can create the exact fix for your database schema! 🚀
