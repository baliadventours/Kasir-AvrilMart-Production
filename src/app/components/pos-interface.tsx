import { useState, useRef, useEffect, memo } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  Scan,
  Menu,
  Grid3x3,
  List,
  ChevronUp,
  PauseCircle,
  PlayCircle,
  UserPlus,
  Users,
  Sparkles,
} from "lucide-react";
import { Product, CartItem, AppSettings, Customer, HeldOrder } from "../types";
import { ThermalReceipt } from "./thermal-receipt";
import { toast } from "sonner";
import { BarcodeScannerModal } from "./barcode-scanner-modal";

const HELD_ORDERS_KEY = "avrilmart_held_orders_v1";
const CUSTOMERS_KEY = "avrilmart_customers_v1";
const AUTO_WHOLESALE_KEY = "avrilmart_auto_wholesale_v1";

// ⚡ Limit initial product render to 32 products for snappy <5ms desktop rendering
const INITIAL_PRODUCTS_DISPLAY = 32;
const PRODUCTS_LOAD_STEP = 32;

// 🔥 Memoized Product Grid Item - Proportional, clean, modern centered card with smooth hover effect
const ProductGridItem = memo(({
  product,
  displayPrice,
  onClick,
}: {
  product: Product;
  displayPrice: number;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="bg-white hover:bg-[#FFF5F2] rounded-xl px-3.5 py-3.5 min-h-[98px] sm:min-h-[108px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md border border-gray-200/90 hover:border-[#E05D43]/60 transition-all duration-150 text-center flex flex-col items-center justify-center active:scale-[0.98] group cursor-pointer"
    >
      <h3 className="font-semibold text-[13px] sm:text-sm text-gray-800 group-hover:text-gray-950 leading-snug line-clamp-2 transition-colors">
        {product.name}
      </h3>
      <div className="text-sm sm:text-[15px] font-bold text-[#E05D43] group-hover:text-[#C54D33] tabular-nums tracking-tight mt-1.5 transition-colors">
        Rp {displayPrice.toLocaleString("id-ID")}
      </div>
      <div className="w-full text-[10px] font-medium text-gray-400 group-hover:text-[#E05D43]/75 tracking-wide uppercase mt-1 truncate transition-colors">
        {product.category}
      </div>
    </button>
  );
});

ProductGridItem.displayName = "ProductGridItem";

interface POSInterfaceProps {
  products: Product[];
  settings?: AppSettings | null;
  onSale: (
    items: CartItem[],
    total: number,
    priceType: "retail" | "wholesale",
    paymentAmount?: number,
    paymentMethod?: "cash" | "credit_card" | "debit_card" | "qris" | "transfer",
    customer?: { id?: string; name?: string; phone?: string }
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

  // ── Modern POS State: Auto-Grosir (Tiered Pricing) ──
  const [autoWholesale, setAutoWholesale] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_WHOLESALE_KEY);
      return saved ? JSON.parse(saved).enabled ?? true : true;
    } catch {
      return true;
    }
  });
  const [minWholesaleQty, setMinWholesaleQty] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(AUTO_WHOLESALE_KEY);
      return saved ? Number(JSON.parse(saved).minQty) || 6 : 6;
    } catch {
      return 6;
    }
  });

  // ── Modern POS State: Hold / Park Bill ──
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const raw = localStorage.getItem(HELD_ORDERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showHeldModal, setShowHeldModal] = useState(false);
  const [holdNote, setHoldNote] = useState("");
  const [showHoldPrompt, setShowHoldPrompt] = useState(false);

  // ── Modern POS State: Customer Database ──
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOMERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerType, setNewCustomerType] = useState<"retail" | "wholesale">("retail");

  const cartEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Persist Auto-Wholesale config
  useEffect(() => {
    try {
      localStorage.setItem(
        AUTO_WHOLESALE_KEY,
        JSON.stringify({ enabled: autoWholesale, minQty: minWholesaleQty })
      );
    } catch {}
  }, [autoWholesale, minWholesaleQty]);

  // Persist Held Orders
  useEffect(() => {
    try {
      localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(heldOrders));
    } catch {}
  }, [heldOrders]);

  // Persist Customers
  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch {}
  }, [customers]);

  // Helper to compute the right applied price & priceType for a product and quantity
  const resolveItemPrice = (
    product: Product,
    qty: number,
    globalMode: "retail" | "wholesale" = priceType,
    autoTier: boolean = autoWholesale,
    tierMin: number = minWholesaleQty
  ): { itemPriceType: "retail" | "wholesale"; appliedPrice: number; isAutoTiered: boolean } => {
    const retailPrice = product.priceRetail || product.price_retail || 0;
    const wholesalePrice = product.priceWholesale || product.price_wholesale || 0;

    if (globalMode === "wholesale" && wholesalePrice > 0) {
      return { itemPriceType: "wholesale", appliedPrice: wholesalePrice, isAutoTiered: false };
    }
    if (autoTier && qty >= tierMin && wholesalePrice > 0) {
      return { itemPriceType: "wholesale", appliedPrice: wholesalePrice, isAutoTiered: true };
    }
    return { itemPriceType: "retail", appliedPrice: retailPrice, isAutoTiered: false };
  };

  // Recalculate cart item prices whenever global priceType, autoWholesale, or minWholesaleQty changes
  useEffect(() => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        const { itemPriceType, appliedPrice } = resolveItemPrice(
          item,
          item.quantity,
          priceType,
          autoWholesale,
          minWholesaleQty
        );
        return { ...item, priceType: itemPriceType, appliedPrice };
      })
    );
  }, [priceType, autoWholesale, minWholesaleQty]);

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
  }, [cart.length]);

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

    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        const nextQty = existingItem.quantity + 1;
        const { itemPriceType, appliedPrice, isAutoTiered } = resolveItemPrice(product, nextQty);
        if (isAutoTiered && existingItem.priceType === "retail") {
          toast.success(`Harga Grosir otomatis aktif untuk ${product.name} (≥${minWholesaleQty} pcs)`);
        }
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: nextQty, priceType: itemPriceType, appliedPrice }
              : item
          )
        );
      } else {
        toast.error(`Stok maksimal ${product.name} (${product.stock} pcs)`);
      }
    } else {
      const { itemPriceType, appliedPrice } = resolveItemPrice(product, 1);
      setCart([...cart, { ...product, quantity: 1, priceType: itemPriceType, appliedPrice }]);
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
    } else {
      const cappedQty = Math.min(newQuantity, product.stock);
      if (newQuantity > product.stock) {
        toast.error(`Stok maksimal tersedia: ${product.stock} pcs`);
      }
      const { itemPriceType, appliedPrice, isAutoTiered } = resolveItemPrice(product, cappedQty);
      const currentItem = cart.find((i) => i.id === id);
      if (isAutoTiered && currentItem?.priceType === "retail") {
        toast.success(`Harga Grosir otomatis aktif untuk ${product.name} (≥${minWholesaleQty} pcs)`);
      }
      setCart(
        cart.map((item) =>
          item.id === id
            ? { ...item, quantity: cappedQty, priceType: itemPriceType, appliedPrice }
            : item
        )
      );
    }
  };

  // Manual per-item Eceran/Grosir toggle
  const toggleItemPriceType = (id: string) => {
    setCart(
      cart.map((item) => {
        if (item.id !== id) return item;
        const nextType = item.priceType === "retail" ? "wholesale" : "retail";
        const retailPrice = item.priceRetail || item.price_retail || 0;
        const wholesalePrice = item.priceWholesale || item.price_wholesale || retailPrice;
        return {
          ...item,
          priceType: nextType,
          appliedPrice: nextType === "wholesale" ? wholesalePrice : retailPrice,
        };
      })
    );
  };

  const removeFromCart = (id: string) => setCart(cart.filter((item) => item.id !== id));
  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  // ── Hold / Park Bill Handlers ──
  const handleHoldCurrentOrder = () => {
    if (cart.length === 0) return;
    const label =
      holdNote.trim() ||
      selectedCustomer?.name ||
      `Antrean #${heldOrders.length + 1} (${new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })})`;

    const newHeld: HeldOrder = {
      id: `hold_${Date.now()}`,
      label,
      customer_id: selectedCustomer?.id,
      customer_name: selectedCustomer?.name,
      customer_phone: selectedCustomer?.phone,
      items: cart,
      priceType,
      created_at: new Date().toISOString(),
    };

    setHeldOrders([newHeld, ...heldOrders]);
    setCart([]);
    setSelectedCustomer(null);
    setHoldNote("");
    setShowHoldPrompt(false);
    setShowCartSheet(false);
    toast.success(`Transaksi "${label}" disimpan sementara (Hold)`);
  };

  const handleResumeHeldOrder = (held: HeldOrder) => {
    // If current cart is not empty, park it first so nothing is lost
    if (cart.length > 0) {
      const autoSaved: HeldOrder = {
        id: `hold_${Date.now()}`,
        label: selectedCustomer?.name || `Keranjang Sebelumnya (${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        customer_phone: selectedCustomer?.phone,
        items: cart,
        priceType,
        created_at: new Date().toISOString(),
      };
      setHeldOrders([autoSaved, ...heldOrders.filter((h) => h.id !== held.id)]);
    } else {
      setHeldOrders(heldOrders.filter((h) => h.id !== held.id));
    }

    setCart(held.items);
    setPriceType(held.priceType);
    if (held.customer_name) {
      const found = customers.find((c) => c.id === held.customer_id || c.name === held.customer_name);
      setSelectedCustomer(
        found || {
          id: held.customer_id || `cust_${Date.now()}`,
          name: held.customer_name,
          phone: held.customer_phone || "",
          type: held.priceType,
          created_at: new Date().toISOString(),
        }
      );
    } else {
      setSelectedCustomer(null);
    }
    setShowHeldModal(false);
    toast.success(`Transaksi "${held.label}" dipanggil kembali`);
  };

  const handleDeleteHeldOrder = (id: string) => {
    setHeldOrders(heldOrders.filter((h) => h.id !== id));
    toast.success("Transaksi Hold dihapus");
  };

  // ── Customer Handlers ──
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      type: newCustomerType,
      created_at: new Date().toISOString(),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    setSelectedCustomer(newCust);
    if (newCust.type === "wholesale") {
      setPriceType("wholesale");
    }
    setNewCustomerName("");
    setNewCustomerPhone("");
    setShowCustomerModal(false);
    toast.success(`Pelanggan ${newCust.name} ditambahkan & dipilih`);
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    if (cust.type === "wholesale") {
      setPriceType("wholesale");
      toast.success(`Pelanggan Grosir (${cust.name}) dipilih — Harga Grosir aktif`);
    } else {
      toast.success(`Pelanggan ${cust.name} dipilih`);
    }
    setShowCustomerModal(false);
  };

  const completeSale = () => {
    const payment = parseFloat(paymentAmount);
    if (payment >= total) {
      const saleData = {
        id: Date.now().toString(),
        total,
        payment_type: priceType,
        payment_amount: payment,
        payment_method: paymentMethod,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name,
        customer_phone: selectedCustomer?.phone,
        created_at: new Date().toISOString(),
        items: cart.map((item) => ({
          product_name: item.name,
          quantity: item.quantity,
          price: item.appliedPrice,
          total: item.appliedPrice * item.quantity,
        })),
      };
      onSale(
        cart,
        total,
        priceType,
        payment,
        paymentMethod,
        selectedCustomer
          ? { id: selectedCustomer.id, name: selectedCustomer.name, phone: selectedCustomer.phone }
          : undefined
      );
      setLastSale(saleData);
      setCart([]);
      setSelectedCustomer(null);
      setShowCheckout(false);
      setPaymentAmount("");
      setShowReceipt(true);
      setShowCartSheet(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  // Inline helpers (not components - avoids remount on every render)
  const renderCartItem = (item: CartItem) => {
    const isWholesaleItem = item.priceType === "wholesale";
    return (
      <div key={item.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-gray-900 leading-tight line-clamp-2">{item.name}</h4>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                type="button"
                onClick={() => toggleItemPriceType(item.id)}
                title="Klik untuk ubah Eceran / Grosir item ini"
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                  isWholesaleItem
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {isWholesaleItem ? "Grosir" : "Eceran"}
              </button>
              {autoWholesale && isWholesaleItem && priceType === "retail" && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Auto ≥{minWholesaleQty}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 flex-shrink-0 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-l-lg">
              <Minus className="w-3 h-3 text-gray-600" />
            </button>
            <input
              type="number"
              min={1}
              max={item.stock}
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) updateQuantity(item.id, val);
              }}
              className="w-10 text-center font-semibold text-sm bg-transparent focus:outline-none"
            />
            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-r-lg">
              <Plus className="w-3 h-3 text-gray-600" />
            </button>
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-gray-900">Rp {(item.quantity * item.appliedPrice).toLocaleString("id-ID")}</div>
            <div className="text-[10px] text-gray-400">Rp {item.appliedPrice.toLocaleString("id-ID")}/pc</div>
          </div>
        </div>

        {/* Quick Multi-Satuan / Pack Multiplier Buttons */}
        <div className="flex items-center gap-1 pt-1 border-t border-gray-200/60 overflow-x-auto">
          <span className="text-[10px] text-gray-400 mr-0.5 flex-shrink-0">Satuan:</span>
          {[
            { label: "6 (½ Lsn)", qty: 6 },
            { label: "10 (Rtg)", qty: 10 },
            { label: "12 (1 Lsn)", qty: 12 },
            { label: "24 (Dus)", qty: 24 },
          ].map((unit) => (
            <button
              key={unit.qty}
              type="button"
              onClick={() => updateQuantity(item.id, unit.qty)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors flex-shrink-0 ${
                item.quantity === unit.qty
                  ? "bg-[#E05D43] text-white border-[#E05D43]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#E05D43] hover:text-[#E05D43]"
              }`}
            >
              {unit.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderCustomerAndHoldBar = () => (
    <div className="space-y-2 mt-2.5">
      {/* Customer selector & Hold list row */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setShowCustomerModal(true)}
          className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all truncate ${
            selectedCustomer
              ? "bg-orange-50 border-[#E05D43] text-[#E05D43]"
              : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {selectedCustomer ? `${selectedCustomer.name}` : "Pilih Pelanggan (WA)"}
          </span>
          {selectedCustomer && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCustomer(null);
              }}
              className="ml-auto text-gray-400 hover:text-red-500 px-0.5"
              title="Hapus pelanggan"
            >
              ×
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowHeldModal(true)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all flex-shrink-0 ${
            heldOrders.length > 0
              ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}
          title="Daftar Transaksi Ditahan (Hold)"
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Hold ({heldOrders.length})</span>
        </button>
      </div>

      {/* Auto-Grosir Tiered Pricing Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200/80 text-[11px]">
        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700 select-none">
          <input
            type="checkbox"
            checked={autoWholesale}
            onChange={(e) => setAutoWholesale(e.target.checked)}
            className="rounded text-[#E05D43] focus:ring-[#E05D43] w-3.5 h-3.5"
          />
          <span>Grosir Otomatis</span>
        </label>
        {autoWholesale && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>Min:</span>
            <input
              type="number"
              min={2}
              max={999}
              value={minWholesaleQty}
              onChange={(e) => setMinWholesaleQty(Math.max(2, parseInt(e.target.value, 10) || 6))}
              className="w-11 px-1.5 py-0.5 text-center font-bold text-gray-900 bg-white border border-gray-300 rounded text-[11px]"
            />
            <span>pcs</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderOrderSummary = (onPay: () => void) => (
    <div className="border-t border-gray-200 px-4 py-4 bg-white flex-shrink-0">
      <div className="space-y-1.5 text-sm mb-3">
        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between text-gray-600"><span>Diskon</span><span>-Rp {discount.toLocaleString("id-ID")}</span></div>
        <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
          <span>Total</span>
          <span className="text-[#E05D43]">Rp {total.toLocaleString("id-ID")}</span>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={clearCart}
          className="px-3 py-3 rounded-xl border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={() => setShowHoldPrompt(true)}
          className="px-3 py-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center gap-1"
          title="Simpan Sementara (Hold)"
        >
          <PauseCircle className="w-4 h-4" />
          <span>Hold</span>
        </button>
        <button
          type="button"
          onClick={onPay}
          className="flex-1 px-4 py-3 rounded-xl bg-[#E05D43] text-white text-sm font-semibold hover:bg-[#C54D33] transition-all shadow-lg shadow-orange-200 flex items-center justify-center"
        >
          Bayar Sekarang
        </button>
      </div>
    </div>
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen h-[100dvh] max-h-screen bg-white overflow-hidden">

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
            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowHeldModal(true)}
                className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold flex-shrink-0"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>{heldOrders.length}</span>
              </button>
            )}
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

                return (
                  <ProductGridItem
                    key={product.id}
                    product={product}
                    displayPrice={displayPrice}
                    onClick={() => addToCart(product)}
                  />
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
      <div className="hidden md:flex w-96 bg-white border-l border-gray-200 flex-col overflow-hidden flex-shrink-0 h-full">
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Order Aktif</h2>
            <div className="bg-[#E05D43] text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold">{cartCount}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPriceType("retail")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priceType === "retail" ? "bg-[#E05D43] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Eceran</button>
            <button onClick={() => setPriceType("wholesale")} className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${priceType === "wholesale" ? "bg-[#E05D43] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>Grosir</button>
          </div>
          {renderCustomerAndHoldBar()}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-14">
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Keranjang kosong</p>
              <p className="text-gray-300 text-xs mt-1">Tap produk untuk menambahkan</p>
              {heldOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHeldModal(true)}
                  className="mt-4 px-3.5 py-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-amber-100"
                >
                  <PlayCircle className="w-4 h-4" />
                  Lihat {heldOrders.length} Transaksi Ditahan (Hold)
                </button>
              )}
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
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col max-h-[90vh] max-h-[90dvh] shadow-2xl">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Keranjang</h2>
                  <p className="text-xs text-gray-400">{cartCount} item dipilih</p>
                </div>
                <button onClick={() => setShowCartSheet(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              {renderCustomerAndHoldBar()}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
              {cart.map(renderCartItem)}
              <div ref={cartEndRef} />
            </div>
            {renderOrderSummary(() => { setShowCartSheet(false); setShowCheckout(true); })}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
          </div>
        </div>
      )}

      {/* ════ HOLD / PARK BILL PROMPT MODAL ════ */}
      {showHoldPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900">Tahan Transaksi (Hold)</h3>
              <button onClick={() => setShowHoldPrompt(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Simpan keranjang ini sementara untuk melayani pembeli berikutnya. Anda dapat memanggilnya kembali kapan saja.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan / Nama Pembeli (Opsional)</label>
              <input
                type="text"
                value={holdNote}
                onChange={(e) => setHoldNote(e.target.value)}
                placeholder={selectedCustomer?.name || "Cth: Ibu Sari (Masih pilih barang)"}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowHoldPrompt(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleHoldCurrentOrder}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Simpan Hold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ HELD ORDERS LIST MODAL ════ */}
      {showHeldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Daftar Transaksi Ditahan (Hold)</h3>
                <p className="text-xs text-gray-400">{heldOrders.length} keranjang tersimpan sementara</p>
              </div>
              <button onClick={() => setShowHeldModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {heldOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Belum ada transaksi yang ditahan.
                </div>
              ) : (
                heldOrders.map((held) => {
                  const heldTotal = held.items.reduce((s, i) => s + i.appliedPrice * i.quantity, 0);
                  const heldCount = held.items.reduce((s, i) => s + i.quantity, 0);
                  return (
                    <div key={held.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-sm text-gray-900">{held.label}</div>
                          <div className="text-[11px] text-gray-500">
                            {new Date(held.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · {heldCount} item · {held.priceType === "wholesale" ? "Grosir" : "Eceran"}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#E05D43]">
                          Rp {heldTotal.toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {held.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteHeldOrder(held.id)}
                          className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResumeHeldOrder(held)}
                          className="flex-1 py-1.5 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Panggil ke Kasir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ CUSTOMER SELECTOR & QUICK ADD MODAL ════ */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Pelanggan & Langganan WA</h3>
                <p className="text-xs text-gray-400">Pilih pelanggan untuk harga otomatis & struk WA 1-klik</p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 bg-gray-50/60">
              <form onSubmit={handleAddCustomer} className="space-y-2.5">
                <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#E05D43]" />
                  Tambah Pelanggan Baru
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Nama Pelanggan / Toko"
                    className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                  <input
                    type="tel"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="No. WhatsApp (08...)"
                    className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={newCustomerType}
                    onChange={(e) => setNewCustomerType(e.target.value as "retail" | "wholesale")}
                    className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none"
                  >
                    <option value="retail">Tipe: Eceran</option>
                    <option value="wholesale">Tipe: Langganan Grosir</option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    + Simpan & Pilih
                  </button>
                </div>
              </form>
            </div>

            <div className="p-3 border-b border-gray-100">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Cari nama atau nomor WA pelanggan..."
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  Belum ada data pelanggan yang cocok.
                </div>
              ) : (
                filteredCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleSelectCustomer(cust)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      selectedCustomer?.id === cust.id
                        ? "border-[#E05D43] bg-orange-50/70"
                        : "border-gray-200 hover:border-[#E05D43] hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{cust.name}</div>
                      <div className="text-xs text-gray-500">{cust.phone || "Tanpa No. WA"}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cust.type === "wholesale"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {cust.type === "wholesale" ? "Grosir" : "Eceran"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ CHECKOUT MODAL ════ */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md max-h-[92vh] max-h-[92dvh] flex flex-col my-auto shadow-2xl overflow-hidden">
            {/* Pinned Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 flex-shrink-0 bg-white">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Pembayaran</h2>
                <p className="text-xs text-gray-500">
                  {selectedCustomer ? `Pelanggan: ${selectedCustomer.name}` : "Pilih metode & nominal pembayaran"}
                </p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {/* Total summary */}
              <div className="space-y-1.5 p-4 bg-gray-50 rounded-2xl text-sm border border-gray-100">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Diskon</span>
                    <span>-Rp {discount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between text-base md:text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total Tagihan</span>
                  <span className="text-[#E05D43]">Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Payment amount input */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Jumlah Bayar</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent text-xl font-bold bg-white"
                />
                {parseFloat(paymentAmount) >= total && (
                  <div className="mt-2.5 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800">
                      Kembalian: <span className="font-bold text-green-900">Rp {change.toLocaleString("id-ID")}</span>
                    </p>
                  </div>
                )}
                {parseFloat(paymentAmount) > 0 && parseFloat(paymentAmount) < total && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">Jumlah bayar kurang Rp {(total - parseFloat(paymentAmount)).toLocaleString("id-ID")}</p>
                )}
              </div>

              {/* Quick amount */}
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1.5">Uang Pas & Pecahan:</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(total.toString())}
                    className="py-2 border border-[#E05D43] bg-orange-50 text-[#E05D43] rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors"
                  >
                    Uang Pas
                  </button>
                  {[50000, 100000, 200000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setPaymentAmount(amount.toString())}
                      className="py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:border-[#E05D43] hover:text-[#E05D43] hover:bg-orange-50 transition-colors"
                    >
                      {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["cash", "qris", "transfer", "credit_card", "debit_card"] as const).map((method) => {
                    const labels: Record<string, string> = {
                      cash: "Tunai", qris: "QRIS", transfer: "Transfer",
                      credit_card: "Kredit", debit_card: "Debit",
                    };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          paymentMethod === method
                            ? "bg-[#E05D43] text-white border-[#E05D43] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#E05D43]"
                        }`}
                      >
                        {labels[method]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pinned Action buttons (ALWAYS VISIBLE AT BOTTOM) */}
            <div className="p-4 md:p-5 border-t border-gray-100 bg-white flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={completeSale}
                disabled={parseFloat(paymentAmount) < total}
                className="flex-[2] px-4 py-3 bg-[#E05D43] text-white rounded-xl hover:bg-[#C54D33] disabled:opacity-40 disabled:cursor-not-allowed font-bold shadow-md shadow-orange-200 transition-all text-sm flex items-center justify-center"
              >
                Selesai Transaksi
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
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl md:rounded-2xl p-5 md:p-6 w-full md:max-w-md max-h-[85vh] max-h-[85dvh] flex flex-col my-auto shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Pilih Kategori</h2>
              <button onClick={() => setShowCategoryMenu(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <div className="grid grid-cols-2 gap-2.5">
                {categories.map((category) => {
                  const count =
                    category === "All"
                      ? availableProducts.length
                      : availableProducts.filter((p) => p.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => { setSelectedCategory(category); setShowCategoryMenu(false); }}
                      className={`p-3.5 rounded-xl text-left border transition-all ${
                        selectedCategory === category
                          ? "bg-[#E05D43] text-white border-[#E05D43] shadow-sm"
                          : "bg-white text-gray-900 border-gray-200 hover:border-[#E05D43] hover:bg-orange-50"
                      }`}
                    >
                      <div className="font-semibold text-sm mb-0.5 truncate">{category}</div>
                      <div className={`text-xs ${selectedCategory === category ? "text-white/80" : "text-gray-400"}`}>
                        {count} produk
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowCategoryMenu(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
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