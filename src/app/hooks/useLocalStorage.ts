import { Product, Sale } from '../types';

const PRODUCTS_KEY = 'local_products';
const SALES_KEY = 'local_sales';
const USER_KEY = 'local_user';

export function useLocalStorage() {
  // ─── User cache (for offline session restore) ────────────────────────────

  const saveUser = (user: { id: string; email: string; name: string; role: string }) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  };

  const loadUser = (): { id: string; email: string; name: string; role: 'admin' | 'cashier' } | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      return null;
    }
  };

  const clearUser = () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing user from localStorage:', error);
    }
  };

  // ─── Products ─────────────────────────────────────────────────────────────

  const saveProducts = (products: Product[]) => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      localStorage.setItem(`${PRODUCTS_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Error saving products to localStorage:', error);
    }
  };

  const loadProducts = (): Product[] | null => {
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading products from localStorage:', error);
      return null;
    }
  };

  // ─── Sales ────────────────────────────────────────────────────────────────

  const saveSales = (sales: Sale[]) => {
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));
      localStorage.setItem(`${SALES_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error('Error saving sales to localStorage:', error);
    }
  };

  const loadSales = (): Sale[] | null => {
    try {
      const stored = localStorage.getItem(SALES_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading sales from localStorage:', error);
      return null;
    }
  };

  const updateProductInStorage = (productId: string, updates: Partial<Product>) => {
    const products = loadProducts();
    if (products) {
      const updated = products.map(p =>
        p.id === productId ? { ...p, ...updates } : p
      );
      saveProducts(updated);
    }
  };

  const addSaleToStorage = (sale: Sale) => {
    const sales = loadSales() || [];
    sales.unshift(sale);
    saveSales(sales);
  };

  const clearLocalData = () => {
    try {
      localStorage.removeItem(PRODUCTS_KEY);
      localStorage.removeItem(`${PRODUCTS_KEY}_timestamp`);
      localStorage.removeItem(SALES_KEY);
      localStorage.removeItem(`${SALES_KEY}_timestamp`);
      // Note: clearUser() is called separately on logout
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  };

  const getLastSync = (type: 'products' | 'sales'): number | null => {
    try {
      const key = type === 'products' ? PRODUCTS_KEY : SALES_KEY;
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      return timestamp ? parseInt(timestamp) : null;
    } catch {
      return null;
    }
  };

  return {
    saveUser,
    loadUser,
    clearUser,
    saveProducts,
    loadProducts,
    saveSales,
    loadSales,
    updateProductInStorage,
    addSaleToStorage,
    clearLocalData,
    getLastSync,
  };
}
