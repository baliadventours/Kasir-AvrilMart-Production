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
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  status?: "completed" | "voided" | "partially_refunded";
  refunded_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  type: "retail" | "wholesale";
  address?: string;
  notes?: string;
  created_at: string;
}

export interface HeldOrder {
  id: string;
  label: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  items: CartItem[];
  priceType: "retail" | "wholesale";
  created_at: string;
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

export type StockMovementType = "restock" | "transfer_out" | "transfer_in" | "opname" | "return_in";

export interface StockMovementItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  stock_before: number;
  quantity_change: number; // positive for add, negative for deduct
  stock_after: number;
  price_modal?: number;
  reason?: string;
}

export interface StockMovement {
  id: string;
  reference_no: string;
  type: StockMovementType;
  date: string;
  user_name: string;
  supplier_name?: string;
  source_location?: string;
  destination_location?: string;
  notes?: string;
  items: StockMovementItem[];
  total_items: number;
  total_value?: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: "cash" | "transfer" | "qris";
  user_name: string;
}

export interface ShiftCashEntry {
  id: string;
  time: string;
  type: "in" | "out";
  amount: number;
  reason: string;
}

export interface CashierShift {
  id: string;
  cashier_name: string;
  opened_at: string;
  closed_at?: string;
  status: "open" | "closed";
  starting_cash: number;
  cash_in: number;
  cash_out: number;
  cash_entries: ShiftCashEntry[];
  sales_total: number;
  sales_count: number;
  expected_cash: number;
  actual_cash?: number;
  variance?: number;
  notes?: string;
}

export interface DebtPayment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export interface DebtRecord {
  id: string;
  type: "receivable" | "payable"; // receivable = Piutang/Kasbon Pelanggan, payable = Hutang Supplier
  party_name: string;
  phone?: string;
  reference_no?: string;
  created_at: string;
  due_date?: string;
  total_amount: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid";
  notes?: string;
  payments: DebtPayment[];
}