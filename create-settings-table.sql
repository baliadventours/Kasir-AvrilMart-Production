-- =====================================================
-- CREATE APP_SETTINGS TABLE
-- =====================================================
-- This table stores application-wide settings for the POS system

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name TEXT NOT NULL DEFAULT 'Avril Mart',
  store_address TEXT NOT NULL DEFAULT 'Kintamani - Bali',
  store_phone TEXT NOT NULL DEFAULT '0812-3456-7890',
  logo_url TEXT,
  tax_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  receipt_header TEXT DEFAULT 'Terima kasih telah berbelanja!',
  receipt_footer TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat dikembalikan',
  show_payment_amount BOOLEAN NOT NULL DEFAULT TRUE,
  default_payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (default_payment_method IN ('cash', 'credit_card', 'debit_card', 'qris', 'transfer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "All users can read settings" ON app_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON app_settings;

-- Policies: All authenticated users can read, only admin can update
CREATE POLICY "All users can read settings"
  ON app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can update settings"
  ON app_settings FOR ALL
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Create index
CREATE INDEX IF NOT EXISTS idx_app_settings_id ON app_settings(id);

-- Insert default settings (only if table is empty)
INSERT INTO app_settings (
  store_name,
  store_address,
  store_phone,
  tax_enabled,
  tax_percentage,
  receipt_header,
  receipt_footer,
  show_payment_amount,
  default_payment_method
)
SELECT
  'Avril Mart',
  'Kintamani - Bali',
  '0812-3456-7890',
  FALSE,
  10.00,
  'Terima kasih telah berbelanja!',
  'Barang yang sudah dibeli tidak dapat dikembalikan',
  TRUE,
  'cash'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);

-- =====================================================
-- ADD PAYMENT_METHOD COLUMN TO SALES TABLE
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit_card', 'debit_card', 'qris', 'transfer'));
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'App Settings:' as info, * FROM app_settings LIMIT 1;

-- =====================================================
-- ✅ DONE!
-- =====================================================

SELECT '
✅ Settings table created successfully!

Features:
- Store name, address, phone
- Logo URL storage (base64 or URL)
- Tax enable/disable with custom percentage
- Custom receipt header and footer
- Show/hide payment amount
- Default payment method selector

Test it:
- Go to Settings → Configure your store
- Changes apply immediately to receipts

' as success_message;
