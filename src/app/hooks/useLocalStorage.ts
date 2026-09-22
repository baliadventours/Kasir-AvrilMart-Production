import { Product, Sale, AppSettings } from '../types';
import { offlineDB } from '../../utils/offline-db';

const PRODUCTS_KEY = 'local_products';
const SALES_KEY = 'local_sales';
const USER_KEY = 'local_user';
const CATEGORIES_KEY = 'local_categories';
const SETTINGS_KEY = 'local_settings';

export function useLocalStorage() {
  // ─── User cache (for offline session restore) ────────────────────────────

  const saveUser = (user: { id: string; email: string; name: string; role: 'admin' | 'cashier' }) => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('localStorage saveUser failed:', error);
    }
    offlineDB.saveUser(user).catch(err => console.warn('offlineDB saveUser error:', err));
  };

  const loadUser = (): { id: string; email: string; name: string; role: 'admin' | 'cashier' } | null => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('localStorage loadUser error:', error);
      return null;
    }
  };

  const clearUser = () => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.warn('localStorage clearUser error:', error);
    }
    offlineDB.clearUser().catch(err => console.warn('offlineDB clearUser error:', err));
  };

  // ─── Products ─────────────────────────────────────────────────────────────

  const saveProducts = (products: Product[]) => {
    // 1. Always save to robust IndexedDB (no 5MB storage limit)
    offlineDB.saveProducts(products).catch(err => console.warn('offlineDB saveProducts error:', err));

    // 2. Also keep localStorage updated for immediate 0ms synchronous read, with QuotaExceeded guard
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
      localStorage.setItem(`${PRODUCTS_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.warn('localStorage quota reached or unavailable, preserved in IndexedDB:', error);
    }
  };

  const loadProducts = (): Product[] | null => {
    try {
      const stored = localStorage.getItem(PRODUCTS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('localStorage loadProducts error:', error);
      return null;
    }
  };

  const loadProductsAsync = async (): Promise<Product[] | null> => {
    // Fast path: localStorage
    const local = loadProducts();
    if (local && local.length > 0) return local;

    // Reliable fallback path: IndexedDB
    return offlineDB.loadProducts();
  };

  // ─── Categories ───────────────────────────────────────────────────────────

  const saveCategories = (categories: any[]) => {
    offlineDB.saveCategories(categories).catch(err => console.warn('offlineDB saveCategories error:', err));
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.warn('localStorage saveCategories error:', error);
    }
  };

  const loadCategories = (): any[] | null => {
    try {
      const stored = localStorage.getItem(CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const loadCategoriesAsync = async (): Promise<any[] | null> => {
    const local = loadCategories();
    if (local && local.length > 0) return local;
    return offlineDB.loadCategories();
  };

  // ─── Settings ─────────────────────────────────────────────────────────────

  const saveSettings = (settings: AppSettings) => {
    offlineDB.saveSettings(settings).catch(err => console.warn('offlineDB saveSettings error:', err));
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('localStorage saveSettings error:', error);
    }
  };

  const loadSettings = (): AppSettings | null => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const loadSettingsAsync = async (): Promise<AppSettings | null> => {
    const local = loadSettings();
    if (local) return local;
    return offlineDB.loadSettings();
  };

  // ─── Sales ────────────────────────────────────────────────────────────────

  const saveSales = (sales: Sale[]) => {
    offlineDB.saveSales(sales).catch(err => console.warn('offlineDB saveSales error:', err));
    try {
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));
      localStorage.setItem(`${SALES_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.warn('localStorage saveSales quota/error:', error);
    }
  };

  const loadSales = (): Sale[] | null => {
    try {
      const stored = localStorage.getItem(SALES_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('localStorage loadSales error:', error);
      return null;
    }
  };

  const loadSalesAsync = async (): Promise<Sale[] | null> => {
    const local = loadSales();
    if (local && local.length > 0) return local;
    return offlineDB.loadSales();
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
      localStorage.removeItem(CATEGORIES_KEY);
      localStorage.removeItem(SETTINGS_KEY);
    } catch (error) {
      console.warn('Error clearing local data:', error);
    }
    offlineDB.clearAll().catch(err => console.warn('offlineDB clearAll error:', err));
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
    loadProductsAsync,
    saveCategories,
    loadCategories,
    loadCategoriesAsync,
    saveSettings,
    loadSettings,
    loadSettingsAsync,
    saveSales,
    loadSales,
    loadSalesAsync,
    updateProductInStorage,
    addSaleToStorage,
    clearLocalData,
    getLastSync,
  };
}
