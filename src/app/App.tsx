import { useState, useEffect, lazy, Suspense } from "react";
import { Download } from "lucide-react";
import { MobileNav } from "./components/mobile-nav";
import { POSInterface } from "./components/pos-interface";
import { Login } from "./components/login";
import { Sidebar } from "./components/sidebar";
import { OfflineIndicator } from "./components/offline-indicator";
import { PWAPrompt } from "./components/pwa-prompt";
import { Product, CartItem, Sale, AppSettings } from "./types";
import { productsAPI, salesAPI, authAPI, settingsAPI } from "../services/supabase";
import { dbToFrontendProduct, frontendToDbProduct } from "../utils/helpers";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { testDatabaseSchema, getDatabaseColumns } from "../utils/test-db-schema";
import { Toaster } from "sonner";

// ⚡ Code-split heavy management views to keep initial load lightweight & fast
const InventoryManager = lazy(() => import("./components/inventory-manager").then(m => ({ default: m.InventoryManager })));
const Reports = lazy(() => import("./components/reports").then(m => ({ default: m.Reports })));
const SalesHistory = lazy(() => import("./components/sales-history").then(m => ({ default: m.SalesHistory })));
const UserManagement = lazy(() => import("./components/user-management").then(m => ({ default: m.UserManagement })));
const CategoryManager = lazy(() => import("./components/category-manager").then(m => ({ default: m.CategoryManager })));
const Settings = lazy(() => import("./components/settings").then(m => ({ default: m.Settings })));

// Expose test functions to window for console access
if (typeof window !== 'undefined') {
  (window as any).testDatabaseSchema = testDatabaseSchema;
  (window as any).getDatabaseColumns = getDatabaseColumns;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: "admin" | "cashier";
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<
    "pos" | "inventory" | "sales" | "reports" | "users" | "categories" | "settings"
  >("pos");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileMenuDrawer, setShowMobileMenuDrawer] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Check if app is installed / standalone
  useEffect(() => {
    const checkInstalledStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                           (navigator as any).standalone;
      setIsPWAInstalled(!!isStandalone);
    };
    checkInstalledStatus();

    const mediaMatcher = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPWAInstalled(e.matches);
    };
    
    if (mediaMatcher.addEventListener) {
      mediaMatcher.addEventListener('change', handleMediaChange);
    }

    const handleAppInstalled = () => {
      setIsPWAInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      if (mediaMatcher.removeEventListener) {
        mediaMatcher.removeEventListener('change', handleMediaChange);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Offline sync hooks
  const offlineSync = useOfflineSync();
  const localStorage = useLocalStorage();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Load products and settings when user logs in; sales are lazy-loaded
  useEffect(() => {
    if (user) {
      loadProductsCacheFirst();
      loadSettings();
      // Sales are loaded lazily when the tab is opened
    }
  }, [user]);

  // Auto-sync when going online
  useEffect(() => {
    if (offlineSync.isOnline && user) {
      handleAutoSync();
    }
  }, [offlineSync.isOnline, user]);

  // ⚡ Re-check session & sync products when app becomes visible / focused after being idle
  useEffect(() => {
    const handleFocusOrVisible = async () => {
      if (document.visibilityState === "visible") {
        console.log("👁️ App focused/visible - restoring cache and refreshing session...");

        // Always show cached products immediately if state is empty
        const cached = localStorage.loadProducts();
        if (cached && cached.length > 0) {
          setProducts((prev) => (prev && prev.length > 0 ? prev : cached));
        }

        if (user) {
          try {
            const freshSession = await authAPI.getSession();
            if (freshSession) {
              setAccessToken(freshSession.access_token);
            }
          } catch (e) {
            console.warn("Visibility session refresh warning:", e);
          }

          loadProductsCacheFirst();
        }
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
    };
  }, [user]);

  // Save to localStorage whenever products/sales change
  useEffect(() => {
    if (products.length > 0) {
      localStorage.saveProducts(products);
    }
  }, [products]);

  useEffect(() => {
    if (sales.length > 0) {
      localStorage.saveSales(sales);
    }
  }, [sales]);

  const checkSession = async () => {
    // 🔌 If offline, restore session immediately from local cache with zero network wait
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cachedUser = localStorage.loadUser();
      if (cachedUser) {
        console.log("📦 Offline mode: Loaded cached user session");
        setUser(cachedUser);
      }
      setIsCheckingSession(false);
      return;
    }

    try {
      // Race session check with a fast 1500ms safety timeout to prevent slow network from blocking UI
      const sessionPromise = authAPI.getSession();
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const session = await Promise.race([sessionPromise, timeoutPromise]);

      if (session?.user) {
        // ✅ Use session.user directly — no extra network call needed.
        const u = session.user;
        const userData = {
          id: u.id,
          email: u.email || "",
          name: u.user_metadata?.name || "",
          role: (u.user_metadata?.role || "cashier") as "admin" | "cashier",
        };
        setAccessToken(session.access_token);
        setUser(userData);
        localStorage.saveUser(userData); // Keep cache fresh
        setIsCheckingSession(false);
        return;
      }
    } catch (error) {
      console.warn("Session check failed (possibly offline):", error);
    }

    // 🔌 Offline fallback: restore user from localStorage cache
    const cachedUser = localStorage.loadUser();
    if (cachedUser) {
      console.log("📦 Restoring session from local cache (offline mode)");
      setUser(cachedUser);
    }

    setIsCheckingSession(false);
  };


  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);

    // 🔌 If offline, check if matches cached user
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const cachedUser = localStorage.loadUser();
      if (cachedUser && cachedUser.email.toLowerCase() === email.trim().toLowerCase()) {
        setUser(cachedUser);
        setActiveMenu("pos");
        setLoginLoading(false);
        return;
      } else if (cachedUser) {
        setLoginError(`Mode Offline: Anda dapat login dengan akun tersimpan (${cachedUser.email}) saat offline.`);
        setLoginLoading(false);
        return;
      } else {
        setLoginError("Mode Offline: Belum ada akun tersimpan di perangkat ini. Harap hubungkan internet untuk login pertama kali.");
        setLoginLoading(false);
        return;
      }
    }

    try {
      const { session, user: authUser } = await authAPI.signIn(email, password);

      if (session && authUser) {
        const userData = {
          id: authUser.id,
          email: authUser.email || "",
          name: authUser.user_metadata?.name || "",
          role: (authUser.user_metadata?.role || "cashier") as "admin" | "cashier",
        };
        setAccessToken(session.access_token);
        setUser(userData);
        localStorage.saveUser(userData); // 💾 Persist for offline restarts
        setActiveMenu("pos");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      // Fallback: If network failed but user exists in cache, allow offline access
      const cachedUser = localStorage.loadUser();
      if (cachedUser && cachedUser.email.toLowerCase() === email.trim().toLowerCase()) {
        setUser(cachedUser);
        setActiveMenu("pos");
      } else {
        setLoginError(error.message || "Terjadi kesalahan saat login");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear local state and cache on explicit logout
      localStorage.clearUser();
      localStorage.clearLocalData();
      setUser(null);
      setAccessToken(null);
      setProducts([]);
      setSales([]);
      setActiveMenu("pos");
    }
  };

  // ⚡ CACHE-FIRST: Show cached products instantly, then refresh in background
  const loadProductsCacheFirst = async () => {
    // 1. Show cached products immediately (zero wait)
    let cached = localStorage.loadProducts();
    if (!cached || cached.length === 0) {
      cached = await localStorage.loadProductsAsync();
    }

    if (cached && cached.length > 0) {
      setProducts(cached);
      setLoading(false); // Do not stay in loading state if cache is available
    } else {
      setLoading(true);
    }

    // 🔌 If offline, keep cached data and do not attempt network fetch
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    // 2. Fetch fresh products in the background with progressive first-batch rendering
    try {
      const dbProducts = await productsAPI.getForPOS((firstBatch) => {
        // If we didn't have cached data, render the first batch immediately!
        if (!cached || cached.length === 0) {
          const frontendBatch = firstBatch.map(dbToFrontendProduct);
          setProducts(frontendBatch);
          setLoading(false);
        }
      });

      if (dbProducts && Array.isArray(dbProducts)) {
        const frontendProducts = dbProducts.map(dbToFrontendProduct);
        setProducts(frontendProducts);
        localStorage.saveProducts(frontendProducts);
        setError(null);
      }
    } catch (error: any) {
      console.error("Error loading fresh products from server:", error);
      const fallbackCached = localStorage.loadProducts() || (await localStorage.loadProductsAsync());
      if (fallbackCached && fallbackCached.length > 0) {
        setProducts(fallbackCached);
        setError(null); // Keep using cache silently without showing error toast
      } else {
        if (navigator.onLine) {
          setError("Gagal memuat produk: " + (error.message || "Koneksi terputus"));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Full product reload (used by Inventory Manager)
  const loadProducts = async () => {
    const cached = localStorage.loadProducts() || (await localStorage.loadProductsAsync());
    if (cached && cached.length > 0) {
      setProducts(cached);
    } else {
      setLoading(true);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setLoading(false);
      return;
    }

    try {
      await authAPI.getSession().catch(() => null);

      const dbProducts = await productsAPI.getAll();
      const frontendProducts = dbProducts.map(dbToFrontendProduct);
      setProducts(frontendProducts);
      localStorage.saveProducts(frontendProducts);
      setError(null);
    } catch (error: any) {
      console.error("Error reloading products:", error);
      const fallbackCached = localStorage.loadProducts() || (await localStorage.loadProductsAsync());
      if (fallbackCached && fallbackCached.length > 0) {
        setProducts(fallbackCached);
        setError(null);
      } else {
        setError("Gagal memuat produk: " + (error.message || "Koneksi terputus"));
      }
    } finally {
      setLoading(false);
    }
  };

  // ⚡ LAZY & CACHE-FIRST: Only load sales when the Sales or Reports tab is opened
  const [salesLoaded, setSalesLoaded] = useState(false);

  const loadSales = async () => {
    if (salesLoaded) return; // Already loaded this session

    // 1. Immediately show cached sales
    const cachedSales = localStorage.loadSales() || (await localStorage.loadSalesAsync());
    if (cachedSales && cachedSales.length > 0) {
      setSales(cachedSales);
    }

    // 2. If offline, don't attempt network fetch
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSalesLoaded(true);
      return;
    }

    try {
      const dbSales = await salesAPI.getAll();

      // Convert to frontend format
      const frontendSales: Sale[] = await Promise.all(
        dbSales.map(async (sale) => {
          const { items } = await salesAPI.getWithItems(sale.id);

          const cartItems: CartItem[] = items.map((item) => ({
            id: item.product_id,
            name: item.product_name,
            sku: item.product_sku,
            priceRetail: item.price,
            priceWholesale: item.price,
            price_retail: item.price,
            price_wholesale: item.price,
            stock: 0,
            category: "",
            quantity: item.quantity,
            priceType: sale.price_type,
            appliedPrice: item.price,
          }));

          return {
            id: sale.id,
            date: sale.created_at,
            items: cartItems,
            total: sale.total,
            priceType: sale.price_type,
          };
        })
      );

      setSales(frontendSales);
      localStorage.saveSales(frontendSales);
      setSalesLoaded(true);
    } catch (error: any) {
      console.error("Error loading sales:", error);
    }
  };

  const loadSettings = async () => {
    // 1. Load cached settings immediately
    const cachedSettings = localStorage.loadSettings() || (await localStorage.loadSettingsAsync());
    if (cachedSettings) {
      setSettings(cachedSettings);
    }

    // 2. If offline, skip network call
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    try {
      const dbSettings = await settingsAPI.get();
      if (dbSettings) {
        setSettings(dbSettings);
        localStorage.saveSettings(dbSettings);
      }
    } catch (error: any) {
      console.warn("Error loading settings:", error);
      // Don't show error for settings loading - not critical
    }
  };

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    try {
      setLoading(true);
      const updated = await settingsAPI.upsert(updates);
      setSettings(updated);
      setError(null);
    } catch (error: any) {
      console.error("Error updating settings:", error);
      setError("Gagal update pengaturan: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Omit<Product, "id">) => {
    try {
      setLoading(true);
      const dbProduct = frontendToDbProduct(product);
      const newProduct = await productsAPI.create(dbProduct);
      const frontendProduct = dbToFrontendProduct(newProduct);
      setProducts([...products, frontendProduct]);
      setError(null);
    } catch (error: any) {
      console.error("Error adding product:", error);
      setError("Gagal menambah produk: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setLoading(true);
      const dbUpdates = frontendToDbProduct(updates);
      const updatedProduct = await productsAPI.update(id, dbUpdates);
      const frontendProduct = dbToFrontendProduct(updatedProduct);
      setProducts(products.map((p) => (p.id === id ? frontendProduct : p)));
      setError(null);
    } catch (error: any) {
      console.error("Error updating product:", error);
      setError("Gagal update produk: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setLoading(true);
      await productsAPI.delete(id);
      setProducts(products.filter((p) => p.id !== id));
      setError(null);
    } catch (error: any) {
      console.error("Error deleting product:", error);
      setError("Gagal hapus produk: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSale = async (
    items: CartItem[],
    total: number,
    priceType: "retail" | "wholesale",
    paymentAmount?: number
  ) => {
    if (!user) return;

    // Update stock optimistically (in memory)
    const updatedProducts = products.map(product => {
      const soldItem = items.find(item => item.id === product.id);
      if (soldItem) {
        return { ...product, stock: product.stock - soldItem.quantity };
      }
      return product;
    });
    setProducts(updatedProducts);

    // Create temporary sale for immediate UI feedback
    const tempSale: Sale = {
      id: `temp_${Date.now()}`,
      date: new Date().toISOString(),
      items,
      total,
      priceType,
    };
    setSales([tempSale, ...sales]);

    // If offline, queue the transaction
    if (!offlineSync.isOnline) {
      offlineSync.addToQueue('sale', {
        items,
        total,
        priceType,
        paymentAmount,
        tempSaleId: tempSale.id,
      });
      console.log('📡 Offline mode: Transaction queued for sync');
      return; // Exit early, will sync when online
    }

    // If online, try to sync immediately
    try {
      setLoading(true);

      // Prepare sale items for database
      const saleItems = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        price: item.appliedPrice,
      }));

      // Create sale in database
      const { sale } = await salesAPI.create(user.id, saleItems, priceType, paymentAmount);

      // Reload products to get updated stock from server
      await loadProducts();

      // Replace temp sale with real sale
      const newSale: Sale = {
        id: sale.id,
        date: sale.created_at,
        items,
        total: sale.total,
        priceType: sale.price_type,
      };
      setSales([newSale, ...sales.filter(s => s.id !== tempSale.id)]);

      setError(null);
    } catch (error: any) {
      console.error("Error processing sale:", error);
      
      // If error, queue for later
      offlineSync.addToQueue('sale', {
        items,
        total,
        priceType,
        paymentAmount,
        tempSaleId: tempSale.id,
      });
      
      setError("Koneksi bermasalah. Transaksi disimpan di cache lokal & akan disinkronkan otomatis saat online.");
    } finally {
      setLoading(false);
    }
  };

  const syncQueuedSale = async (
    items: any[],
    total: number,
    priceType: any,
    paymentAmount?: number,
    tempSaleId?: string
  ) => {
    if (!user) return;
    const saleItems = items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      product_sku: item.sku,
      quantity: item.quantity,
      price: item.appliedPrice || item.priceRetail || item.price,
    }));
    const { sale } = await salesAPI.create(user.id, saleItems, priceType, paymentAmount);
    if (tempSaleId) {
      setSales((prev) =>
        prev.map((s) =>
          s.id === tempSaleId ? { ...s, id: sale.id, date: sale.created_at } : s
        )
      );
    }
  };

  const handleAutoSync = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Drain offline queue transactions first
      if (offlineSync.queuedCount > 0) {
        await offlineSync.syncQueue(
          syncQueuedSale,
          handleAddProduct,
          handleUpdateProduct,
          handleDeleteProduct
        );
      }

      // Use lightweight POS fetch for sync (not the heavy getAll)
      const dbProducts = await productsAPI.getForPOS();
      if (dbProducts && dbProducts.length > 0) {
        const frontendProducts = dbProducts.map(dbToFrontendProduct);
        setProducts(frontendProducts);
        localStorage.saveProducts(frontendProducts);
      }

      setError(null);
    } catch (error: any) {
      console.warn("Auto-sync background warning:", error);
    } finally {
      setLoading(false);
    }
  };


  // Show loading while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={handleLogin} error={loginError} loading={loginLoading} />;
  }

  // Check permissions for tabs
  const canAccessInventory = user.role === "admin";
  const canAccessSales = true; // ✅ Allow both admin and cashier to see transaction reports
  const canAccessUsers = user.role === "admin";

  const allMenuItems = [
    { id: "pos", label: "Kasir", emoji: "🛒", allowCashier: true },
    { id: "inventory", label: "Inventori", emoji: "📦", allowCashier: false },
    { id: "categories", label: "Kategori", emoji: "🏷️", allowCashier: false },
    { id: "sales", label: "Riwayat Penjualan", emoji: "📊", allowCashier: true },
    { id: "reports", label: "Laporan", emoji: "📄", allowCashier: false },
    { id: "users", label: "Pengguna", emoji: "👥", allowCashier: false },
    { id: "settings", label: "Pengaturan", emoji: "⚙️", allowCashier: false },
  ].filter((item) => user.role === "admin" || item.allowCashier);

  return (
    <div className="min-h-screen bg-white flex">
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* PWA Prompt */}
      <PWAPrompt />

      {/* Offline Indicator */}
      <OfflineIndicator
        isOnline={offlineSync.isOnline}
        isSyncing={offlineSync.isSyncing}
        queuedCount={offlineSync.queuedCount}
        onRetrySync={() => offlineSync.syncQueue(
          syncQueuedSale,
          handleAddProduct,
          handleUpdateProduct,
          handleDeleteProduct
        )}
        failedCount={offlineSync.getFailedTransactions().length}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuChange={(menu) => setActiveMenu(menu as any)}
        userRole={user.role}
        userName={user.name}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeMenu={activeMenu}
        onMenuChange={(menu) => setActiveMenu(menu as any)}
        onOpenDrawer={() => setShowMobileMenuDrawer(true)}
      />

      {/* Mobile Drawer (slide from right) */}
      {showMobileMenuDrawer && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMobileMenuDrawer(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {/* Header */}
            <div className="px-5 py-5 bg-gradient-to-br from-[#E05D43] to-[#C54D33] text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-11 h-11 rounded-full bg-white/25 flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{user.name}</p>
                  <p className="text-xs text-white/75">{user.role === "admin" ? "Administrator" : "Kasir"}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {allMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveMenu(item.id as any); setShowMobileMenuDrawer(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 text-left transition-all ${
                    activeMenu === item.id
                      ? "bg-[#E05D43]/10 text-[#E05D43] font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-sm">{item.label}</span>
                  {activeMenu === item.id && (
                    <span className="ml-auto w-1.5 h-5 bg-[#E05D43] rounded-full" />
                  )}
                </button>
              ))}

              {/* Install PWA Option Card for Mobile */}
              {!isPWAInstalled && (
                <div className="mt-4 mx-1 p-4 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/60 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">📲</span>
                    <p className="text-xs font-bold text-gray-900">
                      Pasang Aplikasi PWA
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-600 mb-3 leading-normal">
                    Pasang Avril Mart di layar utama HP Anda untuk akses instan dan dukungan offline yang lebih stabil!
                  </p>
                  <button
                    onClick={() => {
                      setShowMobileMenuDrawer(false);
                      if ((window as any).triggerPWAInstall) {
                        (window as any).triggerPWAInstall();
                      } else {
                        window.dispatchEvent(new CustomEvent('trigger-pwa-install'));
                      }
                    }}
                    className="w-full py-2 px-3 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-100 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pasang Sekarang</span>
                  </button>
                </div>
              )}
            </nav>

            {/* Logout */}
            <div className="px-3 py-4 border-t border-gray-100">
              <button
                onClick={() => { handleLogout(); setShowMobileMenuDrawer(false); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
              >
                <span className="text-lg">🚪</span>
                <span className="text-sm font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "md:ml-16" : "md:ml-64"} overflow-hidden`}>
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-3 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-900 font-bold hover:text-red-700">×</button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="fixed top-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            Memuat...
          </div>
        )}

        {/* Page Content */}
        <main className={activeMenu === "pos" ? "h-[100dvh] overflow-hidden" : "pt-4 pb-20 md:pb-6 px-4 md:px-6 bg-gray-50 min-h-screen"}>
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-500 gap-3">
              <div className="w-8 h-8 border-3 border-[#E05D43] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs">Memuat halaman...</p>
            </div>
          }>
            {activeMenu === "pos" && <POSInterface products={products} settings={settings} onSale={handleSale} />}
            {activeMenu === "inventory" && canAccessInventory && (
              <InventoryManager
                products={products}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onRefresh={loadProducts}
              />
            )}
            {activeMenu === "sales" && canAccessSales && (() => { if (!salesLoaded) loadSales(); return <SalesHistory sales={sales} />; })()}
            {activeMenu === "reports" && canAccessSales && (() => { if (!salesLoaded) loadSales(); return <Reports sales={sales} />; })()}

            {activeMenu === "users" && canAccessUsers && (
              <UserManagement accessToken={accessToken || ""} />
            )}
            {activeMenu === "categories" && <CategoryManager />}
            {activeMenu === "settings" && <Settings settings={settings} onUpdateSettings={handleUpdateSettings} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}