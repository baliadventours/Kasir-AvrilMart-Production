import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// Get Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables!");
}

// Create Supabase client — autoRefreshToken disabled so offline startup never
// triggers a network fetch just to check the session. Tokens still refresh
// automatically when the user makes an actual API call while online.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // Keep session in localStorage (survives restart)
    autoRefreshToken: false,    // Don't auto-refresh on startup (needs network)
    detectSessionInUrl: false,  // Not using OAuth redirects
  },
});


// Database Types
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
}

export interface Sale {
  id: string;
  user_id: string;
  total: number;
  subtotal: number;
  tax: number;
  price_type: "retail" | "wholesale";
  payment_amount?: number;
  change_amount?: number;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

// ===================================
// PRODUCTS API
// ===================================

export const productsAPI = {
  // Get all products (supports unlimited records with pagination)
  async getAll(): Promise<Product[]> {
    let allProducts: Product[] = [];
    let from = 0;
    const batchSize = 1000; // Request up to 1000 at a time (will auto-adapt if database Max Rows is lower)
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name")
        .range(from, from + batchSize - 1);

      if (error) {
        console.error("Error fetching products:", error);
        throw error;
      }

      if (data && data.length > 0) {
        allProducts = [...allProducts, ...data];
        from += data.length; // Always increment by actual loaded count to handle any truncation
        
        // Log progress
        console.log(`Loaded ${allProducts.length} products...`);
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Total products loaded: ${allProducts.length}`);
    return allProducts;
  },

  // Alias for backward compatibility / cached service worker / custom POS calls
  async getForPOS(): Promise<Product[]> {
    return this.getAll();
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
    return data;
  },

  // Get product by SKU (for barcode scanning)
  async getBySKU(sku: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("sku", sku)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching product by SKU:", error);
      throw error;
    }
    return data;
  },

  // Create new product
  async create(product: Omit<Product, "id" | "created_at" | "updated_at">): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw error;
    }
    return data;
  },

  // Update product
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw error;
    }
    return data;
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Get low stock products (stock <= 10)
  async getLowStock(): Promise<Product[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .lte("stock", 10)
      .order("stock");

    if (error) {
      console.error("Error fetching low stock products:", error);
      throw error;
    }
    return data || [];
  },
};

// ===================================
// SALES API
// ===================================

export const salesAPI = {
  // Create new sale
  async create(
    userId: string,
    items: Array<{
      product_id: string;
      product_name: string;
      product_sku: string;
      quantity: number;
      price: number;
    }>,
    priceType: "retail" | "wholesale",
    paymentAmount?: number
  ): Promise<{ sale: Sale; items: SaleItem[] }> {
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    const changeAmount = paymentAmount ? paymentAmount - total : 0;

    // Insert sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          user_id: userId,
          total,
          subtotal,
          tax,
          price_type: priceType,
          payment_amount: paymentAmount,
          change_amount: changeAmount,
        },
      ])
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError);
      throw saleError;
    }

    // Insert sale items
    const saleItems = items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems)
      .select();

    if (itemsError) {
      console.error("Error creating sale items:", itemsError);
      throw itemsError;
    }

    return { sale, items: insertedItems || [] };
  },

  // Get all sales
  async getAll(): Promise<Sale[]> {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      throw error;
    }
    return data || [];
  },

  // Get sale with items
  async getWithItems(saleId: string): Promise<{ sale: Sale; items: SaleItem[] }> {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (saleError) {
      console.error("Error fetching sale:", saleError);
      throw saleError;
    }

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", saleId);

    if (itemsError) {
      console.error("Error fetching sale items:", itemsError);
      throw itemsError;
    }

    return { sale, items: items || [] };
  },

  // Get sales summary
  async getSummary(startDate?: string, endDate?: string) {
    let query = supabase
      .from("sales")
      .select("total, price_type, created_at");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sales summary:", error);
      throw error;
    }

    const summary = {
      total_sales: data?.length || 0,
      total_revenue: data?.reduce((sum, sale) => sum + sale.total, 0) || 0,
      retail_revenue: data?.filter((s) => s.price_type === "retail").reduce((sum, sale) => sum + sale.total, 0) || 0,
      wholesale_revenue: data?.filter((s) => s.price_type === "wholesale").reduce((sum, sale) => sum + sale.total, 0) || 0,
    };

    return summary;
  },
};

// ===================================
// SETTINGS API
// ===================================

export const settingsAPI = {
  // Get app settings (only one record should exist)
  async get(): Promise<any | null> {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      console.error("Error fetching settings:", error);
      throw error;
    }
    return data;
  },

  // Create or update settings (upsert)
  async upsert(settings: any): Promise<any> {
    const { data: existing } = await supabase
      .from("app_settings")
      .select("id")
      .limit(1)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("app_settings")
        .update(settings)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating settings:", error);
        throw error;
      }
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from("app_settings")
        .insert([settings])
        .select()
        .single();

      if (error) {
        console.error("Error creating settings:", error);
        throw error;
      }
      return data;
    }
  },
};

// ===================================
// AUTH API
// ===================================

export const authAPI = {
  // Sign up new user (admin only - call server endpoint)
  async signUp(email: string, password: string, name: string, role: "admin" | "cashier", accessToken: string) {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/make-server-b5055851/signup`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Use access token instead of anon key
        },
        body: JSON.stringify({ email, password, name, role }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create user");
    }

    return data;
  },

  // Sign in
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }

    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Get session error:", error);
      throw error;
    }
    return data.session;
  },

  // Get current user
  async getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Get user error:", error);
      throw error;
    }
    return data.user;
  },
};
