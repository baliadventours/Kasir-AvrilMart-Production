import { useState, useRef, useEffect } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Scan, Menu, Grid3x3, List, ChevronUp } from "lucide-react";
import { Product, CartItem, AppSettings } from "../types";
import { ThermalReceipt } from "./thermal-receipt";
import { toast } from "sonner";
import { ProductCard, ProductGridCard } from "./product-card-lazy";
import { BarcodeScannerModal } from "./barcode-scanner-modal";

// 🔥 Local Cached Placeholder Image (served immediately from PWA cache, 0 external requests)
const placeholderImage = "/avrilmart-app-icon.png";

// ⚡ Limit initial product render to 32 products for snappy <5ms desktop rendering
const INITIAL_PRODUCTS_DISPLAY = 32;
const PRODUCTS_LOAD_STEP = 32;

interface POSInterfaceProps {
  products: Product[];
  settings?: AppSettings | null;
  onSale: (
    items: CartItem[],
    total: number,
    priceType: "retail" | "wholesale",
    paymentAmount?: number,
    paymentMethod?: "cash" | "credit_card" | "debit_card" | "qris" | "transfer"
  ) => void;
}

export function POSInterface({ products, settings, onSale }: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "debit_card" | "qris" | "transfer">(
    settings?.default_payment_method || "cash"
  );
  const [priceType, setPriceType] = useState<"retail" | "wholesale">("retail");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lastSale, setLastSale] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [displayLimit, setDisplayLimit] = useState(INITIAL_PRODUCTS_DISPLAY);
  const [showCartSheet, setShowCartSheet] = useState(false); // mobile slide-up cart
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const cartEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const handleClearSearch = () => {
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const handleCameraScan = (code: string) => {
    setIsScannerOpen(false);
    setSearchTerm(""); // Reset search term so next search/scan is fresh
    if (!code) return;

    // Find product matching the scanned barcode or SKU
    const matchedProduct = products.find(
      (p) =>
        p.barcode?.toLowerCase() === code.toLowerCase() ||
        p.sku.toLowerCase() === code.toLowerCase()
    );

    if (matchedProduct) {
      if (matchedProduct.stock > 0) {
        addToCart(matchedProduct);
        toast.success(`Ditambahkan ke keranjang: ${matchedProduct.name}`);
      } else {
        toast.error(`Stok habis untuk produk: ${matchedProduct.name}`);
      }
    } else {
      toast.error(`Produk dengan barcode "${code}" tidak ditemukan.`);
    }
  };

  useEffect(() => {
    cartEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cart]);

  // Reset pagination on filter change
  useEffect(() => {
    setDisplayLimit(INITIAL_PRODUCTS_DISPLAY);
  }, [searchTerm, selectedCategory]);

  const availableProducts = products.filter((p) => p.stock > 0);
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = availableProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedProducts = filteredProducts.slice(0, displayLimit);
  const hasMore = filteredProducts.length > displayLimit;
  const remainingProducts = filteredProducts.length - displayLimit;

  // 🚀 Automatic seamless infinite scroll: loads next batch when user scrolls near the bottom
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => prev + PRODUCTS_LOAD_STEP);
        }
      },
      { rootMargin: "300px" } // Preload 300px before reaching the end for zero waiting
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, displayedProducts.length]);

  const subtotal = cart.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const change = parseFloat(paymentAmount) - total;

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    const appliedPrice =
      priceType === "retail"
        ? product.priceRetail || product.price_retail || 0
        : product.priceWholesale || product.price_wholesale || 0;

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)));
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, priceType, appliedPrice }]);
    }
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      const product = products.find(
        (p) =>
          p.barcode?.toLowerCase() === searchTerm.toLowerCase() ||
          p.sku.toLowerCase() === searchTerm.toLowerCase()
      );
      if (product && product.stock > 0) {
        addToCart(product);
        setSearchTerm("");
        toast.success(`Ditambahkan: ${product.name}`);
      } else if (product && product.stock === 0) {
        toast.error(`Stok habis: ${product.name}`);
        setSearchTerm("");
      } else {
        toast.error(`Produk tidak ditemukan: ${searchTerm}`);
        setSearchTerm("");
      }
    }
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else if (newQuantity <= product.stock) {
      setCart(cart.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)));
    }
  };

  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const completeSale = () => {
    const payment = parseFloat(paymentAmount);
    if (payment >= total) {
      const saleData = {
        id: Date.now().toString(),
        total,
        payment_type: priceType,
        payment_amount: payment,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        items: cart.map((item) => ({
          product_name: item.name,
          quantity: item.quantity,
          price: item.appliedPrice,
          total: item.appliedPrice * item.quantity,
        })),
      };
      onSale(cart, total, priceType, payment, paymentMethod);
      setLastSale(saleData);
      setCart([]);
      setShowCheckout(false);
      setPaymentAmount("");
      setShowReceipt(true);
      setShowCartSheet(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  // Inline helpers (not components - avoids remount on every render)
  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight flex-1 pr-2 line-clamp-2">{item.name}</h4>
        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-lg">
            <Minus className="w-3 h-3 text-gray-600" />
          </button>
          <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-lg">
            <Plus className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-gray-900">Rp {(item.quantity * item.appliedPrice).toLocaleString("id-ID")}</div>
          <div className="text-[10px] text-gray-400">Rp {item.appliedPrice.toLocaleString("id-ID")}/pc</div>
        </div>
      </div>
    </div>
  );

  const renderOrderSummary = (onPay: () => void) => (
    <div className="border-t border-gray-200 px-4 py-4 bg-white">
      <div className="space-y-1.5 text-sm mb-4">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between text-gray-600"><span>Diskon</span><span>-Rp {discount.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
          <span>Total</span>
          <span className="text-[#E05D43]">Rp {total.toLocaleString("id-ID")}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={clearCart} className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors">Hapus</button>
        <button onClick={onPay} className="flex-2 px-6 py-3 rounded-xl bg-[#E05D43] text-white text-sm font-semibold hover:bg-[#C54D33] transition-all shadow-lg shadow-orange-200">Bayar Sekarang</button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] bg-white overflow-hidden">

      {/* ════ PRODUCT PANEL (always visible, full width on mobile) ════ */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Header: category, price type, view toggle, search ── */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 px-3 md:px-6 py-3">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowCategoryMenu(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] transition-all font-medium text-sm flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Kategori</span>
            </button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg flex-1 min-w-0">
              <span className="text-xs text-gray-400 flex-shrink-0">Kategori:</span>
              <span className="text-xs font-semibold text-gray-800 truncate">{selectedCategory}</span>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button
                onClick={() => setPriceType("retail")}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${priceType === "retail" ? "bg-white text-[#E05D43] shadow-sm" : "text-gray-500"}`}
              >
                Eceran
              </button>
              <button
                onClick={() => setPriceType("wholesale")}
                className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${priceType === "wholesale" ? "bg-white text-[#E05D43] shadow-sm" : "text-gray-500"}`}
              >
                Grosir
              </button>
            </div>
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
              <button onClick={() => setViewMode("list")} className={`p-1.5 rounded transition-all ${viewMode === "list" ? "bg-white text-[#E05D43] shadow-sm" : "text-gray-400"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded transition-all ${viewMode === "grid" ? "bg-white text-[#E05D43] shadow-sm" : "text-gray-400"}`}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {/* Search bar — inlined directly, never remounts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk / scan barcode…"
              className="w-full pl-9 pr-24 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
              onKeyDown={handleBarcodeSearch}
              autoComplete="off"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 bg-gray-100 rounded-lg transition-all active:scale-95 flex items-center gap-1 text-xs"
                  title="Hapus / Reset Pencarian (1-Click Clear)"
                >
                  <X className="w-4 h-4 text-gray-600" />
                  <span className="hidden sm:inline font-medium text-[11px]">Clear</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-2 text-[#E05D43] hover:bg-orange-50 rounded-xl transition-all active:scale-95"
                title="Scan Barcode menggunakan Kamera"
              >
                <Scan className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-gray-400 text-center">
            {displayedProducts.length} dari {filteredProducts.length} produk
          </div>
        </div>

        {/* ── Product list / grid ── */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3">
          {viewMode === "list" ? (
            <div className="space-y-1.5 pb-2">
              {displayedProducts.map((product) => {
                const displayPrice = priceType === "retail"
                  ? (product.priceRetail || product.price_retail || 0)
                  : (product.priceWholesale || product.price_wholesale || 0);
                return (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className="w-full bg-white rounded-xl px-3 py-2.5 hover:bg-orange-50 hover:border-[#E05D43] transition-all text-left border border-gray-200 active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{product.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{product.sku} · Stok: {product.stock}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#E05D43]">Rp {displayPrice.toLocaleString("id-ID")}</div>
                        <div className="text-[10px] text-gray-400">{product.category}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pb-2">
              {displayedProducts.map((product) => {
                const displayPrice = priceType === "retail"
                  ? (product.priceRetail || product.price_retail || 0)
                  : (product.priceWholesale || product.price_wholesale || 0);
                const hasValidCustomImage = Boolean(
                  product.image &&
                  !product.image.includes("avrilmart-app-icon") &&
                  !product.image.includes("i.ibb.co.com")
                );

                return (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className="bg-white rounded-xl p-2.5 hover:shadow-md hover:border-[#E05D43] transition-all text-left border border-gray-200 flex flex-col active:scale-[0.96]"
                  >
                    <div className="w-full aspect-square bg-gray-50 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      <img
                        src={hasValidCustomImage ? product.image : placeholderImage}
                        alt={product.name}
                        loading="lazy"
                        className={`w-full h-full object-contain p-1 ${!hasValidCustomImage ? 'grayscale opacity-40' : ''}`}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.src = placeholderImage;
                          t.className = "w-full h-full object-contain p-1 grayscale opacity-40";
                        }}
                      />
                    </div>
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 leading-tight mb-1 flex-1">{product.name}</h3>
                    <div className="text-sm font-bold text-[#E05D43]">Rp {displayPrice.toLocaleString("id-ID")}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{product.category}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Sentinel & Load More trigger */}
          {hasMore && (
            <div ref={loadMoreSentinelRef} className="pt-3 pb-8 text-center">
              <button
                onClick={() => setDisplayLimit((prev) => prev + PRODUCTS_LOAD_STEP)}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-[#E05D43] hover:border-[#E05D43] shadow-sm transition-all"
              >
                Muat Lebih Banyak ({remainingProducts} produk tersisa)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ════ DESKTOP CART SIDEBAR (hidden on mobile) ════ */}
      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col overflow-hidden flex-shrink-0">
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Order Aktif</h2>
            <div className="bg-[#E05D43] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">{cartCount}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPriceType("retail")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${priceType === "retail" ? "bg-[#E05D43] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Eceran</button>
            <button onClick={() => setPriceType("wholesale")} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${priceType === "wholesale" ? "bg-[#E05D43] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Grosir</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Keranjang kosong</p>
              <p className="text-gray-300 text-xs mt-1">Tap produk untuk menambahkan</p>
            </div>
          ) : (
            <>{cart.map(renderCartItem)}<div ref={cartEndRef} /></>
          )}
        </div>
        {cart.length > 0 && renderOrderSummary(() => setShowCheckout(true))}
      </div>

      {/* ════ MOBILE FLOATING CART BUTTON ════ */}
      {cartCount > 0 && (
        <button
          onClick={() => setShowCartSheet(true)}
          className="md:hidden fixed bottom-20 left-4 right-4 z-30 bg-[#E05D43] text-white py-3.5 px-5 rounded-2xl shadow-xl shadow-orange-300/50 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <span className="font-semibold text-sm">{cartCount} item</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold">Rp {total.toLocaleString("id-ID")}</span>
            <ChevronUp className="w-4 h-4 opacity-80" />
          </div>
        </button>
      )}

      {/* ════ MOBILE CART SLIDE-UP SHEET ════ */}
      {showCartSheet && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCartSheet(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col max-h-[90dvh] shadow-2xl">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Keranjang</h2>
                <p className="text-xs text-gray-400">{cartCount} item dipilih</p>
              </div>
              <button onClick={() => setShowCartSheet(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cart.map(renderCartItem)}
              <div ref={cartEndRef} />
            </div>
            {renderOrderSummary(() => { setShowCartSheet(false); setShowCheckout(true); })}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}

      {/* ════ CHECKOUT MODAL ════ */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md max-h-[95dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Pembayaran</h2>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total summary */}
            <div className="space-y-2 mb-5 p-4 bg-gray-50 rounded-2xl text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-[#E05D43]">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Payment amount input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Jumlah Bayar</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent text-xl font-bold"
              />
              {parseFloat(paymentAmount) >= total && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700">
                    Kembalian: <span className="font-bold">Rp {change.toLocaleString("id-ID")}</span>
                  </p>
                </div>
              )}
              {parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < total && (
                <p className="mt-2 text-sm text-red-500">Jumlah bayar kurang dari total</p>
              )}
            </div>

            {/* Quick amount */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[20000, 50000, 100000, 200000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setPaymentAmount(amount.toString())}
                  className="py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-[#E05D43] hover:text-[#E05D43] hover:bg-orange-50 transition-colors"
                >
                  {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
                </button>
              ))}
            </div>

            {/* Payment method */}
            <div className="mb-5">
              <label className="block text-sm font-medium mb-2 text-gray-700">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "qris", "transfer", "credit_card", "debit_card"] as const).map((method) => {
                  const labels: Record<string, string> = {
                    cash: "Tunai", qris: "QRIS", transfer: "Transfer",
                    credit_card: "Kredit", debit_card: "Debit",
                  };
                  return (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                        paymentMethod === method
                          ? "bg-[#E05D43] text-white border-[#E05D43]"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[#E05D43]"
                      }`}
                    >
                      {labels[method]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-4 py-3.5 border-2 border-gray-200 rounded-2xl hover:bg-gray-50 font-medium text-gray-700"
              >
                Batal
              </button>
              <button
                onClick={completeSale}
                disabled={parseFloat(paymentAmount) < total}
                className="flex-1 px-4 py-3.5 bg-[#E05D43] text-white rounded-2xl hover:bg-[#C54D33] disabled:opacity-40 disabled:cursor-not-allowed font-bold shadow-lg shadow-orange-200 transition-all"
              >
                Selesai
              </button>
            </div>
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}

      {/* ════ THERMAL RECEIPT ════ */}
      {showReceipt && lastSale && (
        <ThermalReceipt sale={lastSale} settings={settings} onClose={() => setShowReceipt(false)} />
      )}

      {/* ════ CATEGORY MENU MODAL ════ */}
      {showCategoryMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-6 w-full md:max-w-md max-h-[80dvh] flex flex-col">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">Pilih Kategori</h2>
              <button onClick={() => setShowCategoryMenu(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const count =
                    category === "All"
                      ? availableProducts.length
                      : availableProducts.filter((p) => p.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => { setSelectedCategory(category); setShowCategoryMenu(false); }}
                      className={`p-4 rounded-2xl text-left border-2 transition-all ${
                        selectedCategory === category
                          ? "bg-[#E05D43] text-white border-[#E05D43]"
                          : "bg-white text-gray-900 border-gray-200 hover:border-[#E05D43] hover:bg-orange-50"
                      }`}
                    >
                      <div className="font-semibold text-sm mb-0.5 truncate">{category}</div>
                      <div className={`text-xs ${selectedCategory === category ? "text-white/75" : "text-gray-400"}`}>
                        {count} produk
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCategoryMenu(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-medium transition-colors"
              >
                Tutup
              </button>
            </div>
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}

      {/* ════ CAMERA BARCODE SCANNER MODAL ════ */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScan}
        title="Scan Barcode Produk via Kamera"
      />
    </div>
  );
}