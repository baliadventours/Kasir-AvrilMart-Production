# 🔧 ADD MODAL_PRICE COLUMN TO DATABASE

## 📋 STEP 1: RUN SQL MIGRATION IN SUPABASE

### **Go to Supabase Dashboard:**
```
1. Open: https://supabase.com/dashboard
2. Select your project: Avril Mart
3. Go to: SQL Editor (left sidebar)
4. Click: "+ New query"
```

### **Copy & Run This SQL:**

```sql
-- Add modal_price column to products table
ALTER TABLE products 
ADD COLUMN modal_price NUMERIC(10,2);

-- Add comment to column
COMMENT ON COLUMN products.modal_price IS 'Modal/cost price of the product';

-- Optional: Set default value for existing products
-- (You can skip this if you want to manually update)
UPDATE products 
SET modal_price = wholesale_price * 0.9
WHERE modal_price IS NULL;
```

### **Click: RUN**

**Expected Output:**
```
Success. No rows returned
```

---

## ✅ VERIFY MIGRATION:

### **Run this query to check:**
```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
```

**Expected Output:**
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
modal_price       | numeric   | YES   ← Should appear!
stock             | integer   | NO
created_at        | timestamp | NO
updated_at        | timestamp | NO
```

---

## 🎯 ALTERNATIVE: Using Table Editor

**If you prefer GUI:**
```
1. Go to: Table Editor (left sidebar)
2. Select: products table
3. Click: "+ Add Column" (top right)
4. Fill in:
   - Name: modal_price
   - Type: numeric
   - Default: (leave empty)
   - Is Nullable: ✅ Yes
   - Is Unique: ☐ No
5. Click: Save
```

---

## ✅ SUCCESS INDICATORS:

**After running migration:**
- ✅ No errors in SQL Editor
- ✅ Column appears in table structure
- ✅ Can insert products with modal_price
- ✅ CSV import will work with modal_price

---

## 🔄 ROLLBACK (If Needed):

**To remove modal_price column:**
```sql
ALTER TABLE products 
DROP COLUMN modal_price;
```

---

After running this migration, proceed to import CSV with modal_price! 🚀
