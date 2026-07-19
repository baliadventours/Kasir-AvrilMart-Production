export interface Product {
  id: string;
  name: string;
  price_retail?: number;  // For Supabase (snake_case)
  price_wholesale?: number;  // For Supabase (snake_case)
  price_modal?: number;  // For Supabase (snake_case) - Cost price
  priceRetail?: number;  // For frontend (camelCase) - legacy
  priceWholesale?: number;  // For frontend (camelCase) - legacy
  priceModal?: number;  // For frontend (camelCase) - Cost price
  stock: number;
  sku: string;
  barcode?: string | null;  // Barcode field
  category: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem extends Product {
  quantity: number;
  priceType: "retail" | "wholesale";  // Track which price was used
  appliedPrice: number;  // The actual price used for this item
}

export interface Sale {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  priceType: "retail" | "wholesale";
  payment_amount?: number;
  receipt_number?: string;
  payment_method?: "cash" | "credit_card" | "debit_card" | "qris" | "transfer";
}

export interface AppSettings {
  id?: string;
  store_name: string;
  store_address: string;
  store_phone: string;
  logo_url?: string;
  tax_enabled: boolean;
  tax_percentage: number;
  receipt_header: string;
  receipt_footer: string;
  show_payment_amount: boolean;
  default_payment_method: "cash" | "credit_card" | "debit_card" | "qris" | "transfer";
  created_at?: string;
  updated_at?: string;
}