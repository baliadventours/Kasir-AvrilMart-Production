import { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ClipboardCheck,
  History,
  Plus,
  Minus,
  Trash2,
  Search,
  Scan,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Truck,
  PackagePlus,
  FileSpreadsheet,
  X,
  Eye,
  Database,
  Copy,
} from "lucide-react";
import { Product, StockMovement, StockMovementItem, StockMovementType, AppSettings } from "../types";
import { supabase } from "../../services/supabase";
import { BarcodeScannerModal } from "./barcode-scanner-modal";
import { toast } from "sonner";

interface StockManagementProps {
  products: Product[];
  userName: string;
  settings?: AppSettings | null;
  onUpdateProduct: (id: string, updates: Partial<Product>) => Promise<void> | void;
  onRefreshProducts: () => Promise<void> | void;
}

const STORAGE_KEY_MOVEMENTS = "avrilmart_stock_movements_v1";

interface RestockDraftItem {
  product: Product;
  qty: number;
  newModalPrice: number;
}

interface TransferDraftItem {
  product: Product;
  qty: number;
}

interface OpnameEntry {
  physicalStock: string;
  reason: string;
}

export function StockManagement({
  products,
  userName,
  settings,
  onUpdateProduct,
  onRefreshProducts,
}: StockManagementProps) {
  const [activeTab, setActiveTab] = useState<"restock" | "transfer" | "opname" | "history">("restock");
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedMovementForPrint, setSelectedMovementForPrint] = useState<StockMovement | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // =====================================================
  // 1. RESTOCK (BARANG MASUK) STATE
  // =====================================================
  const [restockSearch, setRestockSearch] = useState("");
  const [restockSupplier, setRestockSupplier] = useState("");
  const [restockRefNo, setRestockRefNo] = useState(() => generateRefNo("IN"));
  const [restockNotes, setRestockNotes] = useState("");
  const [restockItems, setRestockItems] = useState<RestockDraftItem[]>([]);

  // =====================================================
  // 2. STOCK TRANSFER (PINDAH STOK ANTAR TOKO) STATE
  // =====================================================
  const [transferDirection, setTransferDirection] = useState<"transfer_out" | "transfer_in">("transfer_out");
  const [transferSource, setTransferSource] = useState(settings?.store_name || "AvrilMart Pusat");
  const [transferDestination, setTransferDestination] = useState("");
  const [transferRefNo, setTransferRefNo] = useState(() => generateRefNo("TRF"));
  const [transferNotes, setTransferNotes] = useState("");
  const [transferSearch, setTransferSearch] = useState("");
  const [transferItems, setTransferItems] = useState<TransferDraftItem[]>([]);

  // =====================================================
  // 3. STOK OPNAME STATE
  // =====================================================
  const [opnameSearch, setOpnameSearch] = useState("");
  const [opnameCategory, setOpnameCategory] = useState("All");
  const [opnameFilterMode, setOpnameFilterMode] = useState<"all" | "edited" | "variance">("all");
  const [opnameNotes, setOpnameNotes] = useState("");
  const [opnameEntries, setOpnameEntries] = useState<Record<string, OpnameEntry>>({});
  const [opnamePage, setOpnamePage] = useState(1);
  const opnameInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // =====================================================
  // 4. HISTORY / KARTU STOK STATE
  // =====================================================
  const [historySearch, setHistorySearch] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"all" | StockMovementType>("all");
  const [historyViewMode, setHistoryViewMode] = useState<"documents" | "items">("documents");

  function generateRefNo(prefix: string) {
    const now = new Date();
    const dateStr =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${dateStr}-${rand}`;
  }

  // Load movements from localStorage and Supabase (if table exists)
  useEffect(() => {
    const loadMovements = async () => {
      let localList: StockMovement[] = [];
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_MOVEMENTS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            localList = parsed;
            setMovements(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to parse local stock movements:", e);
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) return;

      try {
        const { data, error } = await supabase
          .from("stock_movements")
          .select("*")
          .order("date", { ascending: false })
          .limit(300);

        if (!error && Array.isArray(data) && data.length > 0) {
          // Merge remote & local by id
          const mergedMap = new Map<string, StockMovement>();
          [...data, ...localList].forEach((m: any) => {
            if (m && m.id) {
              mergedMap.set(m.id, {
                ...m,
                items: Array.isArray(m.items) ? m.items : [],
              });
            }
          });
          const merged = Array.from(mergedMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setMovements(merged);
          window.localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(merged));
        }
      } catch {
        // Silent fallback if table does not exist yet
      }
    };

    loadMovements();
  }, []);

  const saveMovementRecord = async (record: StockMovement) => {
    const updated = [record, ...movements];
    setMovements(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed saving movement to localStorage:", e);
    }

    if (typeof navigator !== "undefined" && navigator.onLine) {
      try {
        await supabase.from("stock_movements").insert([record]);
      } catch {
        // Ignore if table not created yet; local storage already persisted
      }
    }
  };

  // Update default source location when settings load
  useEffect(() => {
    if (settings?.store_name) {
      if (transferDirection === "transfer_out") {
        setTransferSource(settings.store_name);
      } else {
        setTransferDestination(settings.store_name);
      }
    }
  }, [settings?.store_name, transferDirection]);

  // Categories for Opname filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  // =====================================================
  // BARCODE SCANNER HANDLER ACROSS TABS
  // =====================================================
  const handleBarcodeScanned = (code: string) => {
    setIsScannerOpen(false);
    if (!code) return;
    const normalized = code.trim().toLowerCase();
    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.trim().toLowerCase() === normalized) ||
        p.sku.trim().toLowerCase() === normalized
    );

    if (!matched) {
      toast.error(`Produk dengan barcode/SKU "${code}" tidak ditemukan`);
      return;
    }

    if (activeTab === "restock") {
      addProductToRestock(matched);
      toast.success(`Ditambahkan ke Barang Masuk: ${matched.name}`);
    } else if (activeTab === "transfer") {
      addProductToTransfer(matched);
      toast.success(`Ditambahkan ke Transfer Stok: ${matched.name}`);
    } else if (activeTab === "opname") {
      setOpnameSearch(matched.name);
      setOpnameCategory("All");
      setTimeout(() => {
        const inputEl = opnameInputRefs.current[matched.id];
        if (inputEl) {
          inputEl.focus();
          inputEl.select();
        }
      }, 100);
      toast.success(`Produk ditemukan: ${matched.name}`);
    } else {
      setHistorySearch(matched.name);
    }
  };

  // =====================================================
  // TAB 1: RESTOCK HELPERS
  // =====================================================
  const restockSearchResults = useMemo(() => {
    const q = restockSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [products, restockSearch]);

  const addProductToRestock = (product: Product) => {
    setRestockItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      const currentModal = Number(product.priceModal ?? product.price_modal ?? 0);
      return [...prev, { product, qty: 1, newModalPrice: currentModal }];
    });
    setRestockSearch("");
  };

  const handleProcessRestock = async () => {
    const validItems = restockItems.filter((item) => item.qty > 0);
    if (validItems.length === 0) {
      toast.error("Pilih minimal 1 produk dengan jumlah masuk lebih dari 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const movementItems: StockMovementItem[] = [];
      let totalValue = 0;

      for (const item of validItems) {
        const freshProduct = products.find((p) => p.id === item.product.id) || item.product;
        const stockBefore = Number(freshProduct.stock) || 0;
        const stockAfter = stockBefore + item.qty;
        const modalPrice = Number(item.newModalPrice) || 0;

        await onUpdateProduct(freshProduct.id, {
          name: freshProduct.name,
          sku: freshProduct.sku,
          barcode: freshProduct.barcode,
          category: freshProduct.category,
          priceRetail: freshProduct.priceRetail ?? freshProduct.price_retail ?? 0,
          priceWholesale: freshProduct.priceWholesale ?? freshProduct.price_wholesale ?? 0,
          priceModal: modalPrice,
          stock: stockAfter,
        });

        movementItems.push({
          product_id: freshProduct.id,
          product_name: freshProduct.name,
          product_sku: freshProduct.sku,
          stock_before: stockBefore,
          quantity_change: item.qty,
          stock_after: stockAfter,
          price_modal: modalPrice,
        });

        totalValue += item.qty * modalPrice;
      }

      const newMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        reference_no: restockRefNo.trim() || generateRefNo("IN"),
        type: "restock",
        date: new Date().toISOString(),
        user_name: userName || "Admin",
        supplier_name: restockSupplier.trim() || "Supplier Umum",
        notes: restockNotes.trim(),
        items: movementItems,
        total_items: movementItems.reduce((sum, i) => sum + Math.abs(i.quantity_change), 0),
        total_value: totalValue,
      };

      await saveMovementRecord(newMovement);
      await onRefreshProducts();

      toast.success(`Barang masuk (${newMovement.reference_no}) berhasil disimpan! Stok telah diperbarui.`);
      setRestockItems([]);
      setRestockSupplier("");
      setRestockNotes("");
      setRestockRefNo(generateRefNo("IN"));
    } catch (error: any) {
      toast.error(`Gagal memproses barang masuk: ${error.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // TAB 2: TRANSFER STOK HELPERS
  // =====================================================
  const transferSearchResults = useMemo(() => {
    const q = transferSearch.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [products, transferSearch]);

  const addProductToTransfer = (product: Product) => {
    setTransferItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    setTransferSearch("");
  };

  const handleProcessTransfer = async () => {
    const validItems = transferItems.filter((item) => item.qty > 0);
    if (validItems.length === 0) {
      toast.error("Pilih minimal 1 produk untuk ditransfer");
      return;
    }

    if (!transferSource.trim() || !transferDestination.trim()) {
      toast.error("Mohon isi Lokasi Asal dan Lokasi Tujuan toko/gudang");
      return;
    }

    // Validate stock if transfer_out
    if (transferDirection === "transfer_out") {
      for (const item of validItems) {
        const currentProduct = products.find((p) => p.id === item.product.id) || item.product;
        if (item.qty > currentProduct.stock) {
          toast.error(
            `Stok "${currentProduct.name}" tidak mencukupi (Tersedia: ${currentProduct.stock}, Diminta: ${item.qty})`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const movementItems: StockMovementItem[] = [];
      let totalValue = 0;

      for (const item of validItems) {
        const freshProduct = products.find((p) => p.id === item.product.id) || item.product;
        const stockBefore = Number(freshProduct.stock) || 0;
        const change = transferDirection === "transfer_out" ? -item.qty : item.qty;
        const stockAfter = Math.max(0, stockBefore + change);
        const modalPrice = Number(freshProduct.priceModal ?? freshProduct.price_modal ?? 0);

        await onUpdateProduct(freshProduct.id, {
          name: freshProduct.name,
          sku: freshProduct.sku,
          barcode: freshProduct.barcode,
          category: freshProduct.category,
          priceRetail: freshProduct.priceRetail ?? freshProduct.price_retail ?? 0,
          priceWholesale: freshProduct.priceWholesale ?? freshProduct.price_wholesale ?? 0,
          priceModal: modalPrice,
          stock: stockAfter,
        });

        movementItems.push({
          product_id: freshProduct.id,
          product_name: freshProduct.name,
          product_sku: freshProduct.sku,
          stock_before: stockBefore,
          quantity_change: change,
          stock_after: stockAfter,
          price_modal: modalPrice,
        });

        totalValue += item.qty * modalPrice;
      }

      const newMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        reference_no: transferRefNo.trim() || generateRefNo("TRF"),
        type: transferDirection,
        date: new Date().toISOString(),
        user_name: userName || "Admin",
        source_location: transferSource.trim(),
        destination_location: transferDestination.trim(),
        notes: transferNotes.trim(),
        items: movementItems,
        total_items: movementItems.reduce((sum, i) => sum + Math.abs(i.quantity_change), 0),
        total_value: totalValue,
      };

      await saveMovementRecord(newMovement);
      await onRefreshProducts();

      toast.success(`Transfer stok (${newMovement.reference_no}) berhasil diproses!`);
      setSelectedMovementForPrint(newMovement);
      setTransferItems([]);
      setTransferNotes("");
      setTransferRefNo(generateRefNo("TRF"));
    } catch (error: any) {
      toast.error(`Gagal memproses transfer stok: ${error.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // TAB 3: STOK OPNAME HELPERS
  // =====================================================
  const filteredOpnameProducts = useMemo(() => {
    const q = opnameSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = opnameCategory === "All" || p.category === opnameCategory;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));

      if (!matchesCategory || !matchesSearch) return false;

      const entry = opnameEntries[p.id];
      const hasInput = entry && entry.physicalStock !== "" && !isNaN(Number(entry.physicalStock));

      if (opnameFilterMode === "edited") {
        return Boolean(hasInput);
      }
      if (opnameFilterMode === "variance") {
        return Boolean(hasInput && Number(entry.physicalStock) !== p.stock);
      }
      return true;
    });
  }, [products, opnameSearch, opnameCategory, opnameFilterMode, opnameEntries]);

  const OPNAME_PAGE_SIZE = 25;
  const totalOpnamePages = Math.max(1, Math.ceil(filteredOpnameProducts.length / OPNAME_PAGE_SIZE));
  const paginatedOpnameProducts = useMemo(() => {
    const start = (opnamePage - 1) * OPNAME_PAGE_SIZE;
    return filteredOpnameProducts.slice(start, start + OPNAME_PAGE_SIZE);
  }, [filteredOpnameProducts, opnamePage]);

  useEffect(() => {
    setOpnamePage(1);
  }, [opnameSearch, opnameCategory, opnameFilterMode]);

  const opnameSummary = useMemo(() => {
    let checkedCount = 0;
    let varianceItemsCount = 0;
    let surplusUnits = 0;
    let deficitUnits = 0;
    let netValueDiff = 0;

    Object.entries(opnameEntries).forEach(([productId, entry]) => {
      if (entry.physicalStock === "" || isNaN(Number(entry.physicalStock))) return;
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      checkedCount++;
      const physical = parseInt(entry.physicalStock, 10);
      const diff = physical - product.stock;
      const modal = Number(product.priceModal ?? product.price_modal ?? 0);

      if (diff !== 0) {
        varianceItemsCount++;
        if (diff > 0) surplusUnits += diff;
        if (diff < 0) deficitUnits += Math.abs(diff);
        netValueDiff += diff * modal;
      }
    });

    return { checkedCount, varianceItemsCount, surplusUnits, deficitUnits, netValueDiff };
  }, [opnameEntries, products]);

  const handleOpnameInputChange = (productId: string, physicalStock: string) => {
    setOpnameEntries((prev) => ({
      ...prev,
      [productId]: {
        physicalStock,
        reason: prev[productId]?.reason || "Selisih Hitung / Koreksi Opname",
      },
    }));
  };

  const handleOpnameReasonChange = (productId: string, reason: string) => {
    setOpnameEntries((prev) => ({
      ...prev,
      [productId]: {
        physicalStock: prev[productId]?.physicalStock ?? "",
        reason,
      },
    }));
  };

  const handleCommitOpname = async () => {
    const adjustments: Array<{ product: Product; physical: number; diff: number; reason: string }> = [];

    Object.entries(opnameEntries).forEach(([productId, entry]) => {
      if (entry.physicalStock === "" || isNaN(Number(entry.physicalStock))) return;
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const physical = parseInt(entry.physicalStock, 10);
      const diff = physical - product.stock;
      if (diff !== 0) {
        adjustments.push({
          product,
          physical,
          diff,
          reason: entry.reason || "Koreksi Stok Opname",
        });
      }
    });

    if (adjustments.length === 0) {
      toast.error("Belum ada produk dengan selisih stok fisik vs sistem untuk disesuaikan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const movementItems: StockMovementItem[] = [];
      let totalValueDiff = 0;

      for (const adj of adjustments) {
        const modalPrice = Number(adj.product.priceModal ?? adj.product.price_modal ?? 0);

        await onUpdateProduct(adj.product.id, {
          name: adj.product.name,
          sku: adj.product.sku,
          barcode: adj.product.barcode,
          category: adj.product.category,
          priceRetail: adj.product.priceRetail ?? adj.product.price_retail ?? 0,
          priceWholesale: adj.product.priceWholesale ?? adj.product.price_wholesale ?? 0,
          priceModal: modalPrice,
          stock: adj.physical,
        });

        movementItems.push({
          product_id: adj.product.id,
          product_name: adj.product.name,
          product_sku: adj.product.sku,
          stock_before: adj.product.stock,
          quantity_change: adj.diff,
          stock_after: adj.physical,
          price_modal: modalPrice,
          reason: adj.reason,
        });

        totalValueDiff += adj.diff * modalPrice;
      }

      const newMovement: StockMovement = {
        id: `mov_${Date.now()}`,
        reference_no: generateRefNo("OPN"),
        type: "opname",
        date: new Date().toISOString(),
        user_name: userName || "Admin",
        notes: opnameNotes.trim() || `Stok Opname (${adjustments.length} produk disesuaikan)`,
        items: movementItems,
        total_items: adjustments.length,
        total_value: totalValueDiff,
      };

      await saveMovementRecord(newMovement);
      await onRefreshProducts();

      toast.success(
        `Stok Opname selesai! ${adjustments.length} produk berhasil disesuaikan (${newMovement.reference_no}).`
      );
      setOpnameEntries({});
      setOpnameNotes("");
    } catch (error: any) {
      toast.error(`Gagal menyimpan hasil Stok Opname: ${error.message || "Terjadi kesalahan"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // TAB 4: HISTORY & EXPORT HELPERS
  // =====================================================
  const filteredMovements = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return movements.filter((m) => {
      if (historyTypeFilter !== "all" && m.type !== historyTypeFilter) return false;
      if (!q) return true;
      const matchDoc =
        m.reference_no.toLowerCase().includes(q) ||
        (m.supplier_name && m.supplier_name.toLowerCase().includes(q)) ||
        (m.source_location && m.source_location.toLowerCase().includes(q)) ||
        (m.destination_location && m.destination_location.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q));
      const matchItem = (m.items || []).some(
        (item) =>
          item.product_name.toLowerCase().includes(q) ||
          item.product_sku.toLowerCase().includes(q)
      );
      return matchDoc || matchItem;
    });
  }, [movements, historySearch, historyTypeFilter]);

  const flattenedItemLogs = useMemo(() => {
    const rows: Array<{
      movement: StockMovement;
      item: StockMovementItem;
    }> = [];
    filteredMovements.forEach((m) => {
      (m.items || []).forEach((item) => {
        const q = historySearch.trim().toLowerCase();
        if (
          !q ||
          item.product_name.toLowerCase().includes(q) ||
          item.product_sku.toLowerCase().includes(q) ||
          m.reference_no.toLowerCase().includes(q)
        ) {
          rows.push({ movement: m, item });
        }
      });
    });
    return rows;
  }, [filteredMovements, historySearch]);

  const exportHistoryToCSV = () => {
    const header =
      "No Referensi,Tanggal,Tipe Mutasi,Petugas,Keterangan/Lokasi,SKU,Nama Produk,Stok Awal,Perubahan,Stok Akhir,Alasan\n";
    const lines: string[] = [];

    filteredMovements.forEach((m) => {
      const dateStr = new Date(m.date).toLocaleString("id-ID");
      const typeLabel =
        m.type === "restock"
          ? "Barang Masuk"
          : m.type === "transfer_out"
          ? "Transfer Keluar"
          : m.type === "transfer_in"
          ? "Transfer Masuk"
          : "Stok Opname";
      const locationOrSupplier =
        m.type === "restock"
          ? m.supplier_name || "-"
          : m.type === "transfer_out" || m.type === "transfer_in"
          ? `${m.source_location || "-"} -> ${m.destination_location || "-"}`
          : m.notes || "-";

      (m.items || []).forEach((item) => {
        lines.push(
          `"${m.reference_no}","${dateStr}","${typeLabel}","${m.user_name}","${locationOrSupplier}","${item.product_sku}","${item.product_name}",${item.stock_before},${item.quantity_change},${item.stock_after},"${item.reason || m.notes || "-"}"`
        );
      });
    });

    const blob = new Blob([header + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `kartu-stok-mutasi-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getMovementBadge = (type: StockMovementType) => {
    switch (type) {
      case "restock":
        return { label: "Barang Masuk", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "transfer_out":
        return { label: "Transfer Keluar", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case "transfer_in":
        return { label: "Transfer Masuk", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "opname":
        return { label: "Stok Opname", color: "text-purple-700 bg-purple-50 border-purple-200" };
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mutasi Stok & Stok Opname</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola barang masuk (restock), pindah stok antar cabang, audit stok fisik (opname), dan kartu stok
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-medium transition-colors cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            Scan Barcode
          </button>
          <button
            onClick={() => setShowSqlModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-xs font-medium transition-colors cursor-pointer"
            title="Sinkronisasi Tabel Cloud Supabase"
          >
            <Database className="w-4 h-4 text-[#E05D43]" />
            Info Tabel Cloud
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab("restock")}
          className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "restock"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Barang Masuk (Restock)</span>
        </button>

        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "transfer"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Pindah Stok Antar Toko</span>
        </button>

        <button
          onClick={() => setActiveTab("opname")}
          className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "opname"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Stok Opname</span>
          {opnameSummary.varianceItemsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 text-[11px] rounded-md font-bold ${
                activeTab === "opname" ? "bg-white text-[#E05D43]" : "bg-[#E05D43] text-white"
              }`}
            >
              {opnameSummary.varianceItemsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Kartu Stok & Riwayat ({movements.length})</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: BARANG MASUK (RESTOCK / PEMBELIAN SUPPLIER)                */}
      {/* ================================================================= */}
      {activeTab === "restock" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Product Picker & Document Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                Informasi Barang Masuk
              </h2>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  No. Referensi / Nota Pembelian
                </label>
                <input
                  type="text"
                  value={restockRefNo}
                  onChange={(e) => setRestockRefNo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="IN-20261028-0001"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nama Supplier / Distributor
                </label>
                <input
                  type="text"
                  value={restockSupplier}
                  onChange={(e) => setRestockSupplier(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="Contoh: PT Indofood / Agen Grosir Jaya"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="Keterangan tambahan barang masuk..."
                />
              </div>
            </div>

            {/* Product Search Box */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Cari & Tambah Produk
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-medium text-[#E05D43] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Scan Kamera
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={restockSearch}
                  onChange={(e) => setRestockSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && restockSearchResults.length > 0) {
                      e.preventDefault();
                      addProductToRestock(restockSearchResults[0]);
                    }
                  }}
                  placeholder="Ketik nama produk, SKU, atau scan barcode..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              {restockSearchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {restockSearchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductToRestock(p)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-[#FFF5F2] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.sku} · Stok saat ini: <span className="font-semibold text-gray-700">{p.stock}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#E05D43] flex items-center gap-1 flex-shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Pilih
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {restockSearch.trim() !== "" && restockSearchResults.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  Produk tidak ditemukan. Pastikan produk sudah terdaftar di menu Inventori.
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Draft Items Table */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Daftar Item Barang Masuk ({restockItems.length} Produk)
                </h2>
                {restockItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRestockItems([])}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Kosongkan Daftar
                  </button>
                )}
              </div>

              {restockItems.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-16 px-4 text-center">
                  <PackagePlus className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    Belum ada produk di daftar Barang Masuk
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cari produk di kolom sebelah kiri atau gunakan tombol Scan Barcode untuk menambahkan stok masuk
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                      <tr>
                        <th className="py-3 px-3 text-left">Produk</th>
                        <th className="py-3 px-3 text-center">Stok Awal</th>
                        <th className="py-3 px-3 text-center">Jumlah Masuk (+)</th>
                        <th className="py-3 px-3 text-center">Stok Akhir</th>
                        <th className="py-3 px-3 text-right">Harga Modal / Beli (Rp)</th>
                        <th className="py-3 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {restockItems.map((item, idx) => {
                        const stockAfter = (Number(item.product.stock) || 0) + (Number(item.qty) || 0);
                        return (
                          <tr key={item.product.id} className="hover:bg-gray-50/70">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-gray-900">{item.product.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{item.product.sku}</div>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-600 font-medium tabular-nums">
                              {item.product.stock}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRestockItems((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, qty: Math.max(1, r.qty - 1) } : r
                                      )
                                    )
                                  }
                                  className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    setRestockItems((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, qty: val } : r))
                                    );
                                  }}
                                  className="w-20 text-center py-1 px-2 border border-gray-300 rounded-md font-bold text-emerald-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRestockItems((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, qty: r.qty + 1 } : r))
                                    )
                                  }
                                  className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-gray-900 tabular-nums">
                              {stockAfter}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.newModalPrice}
                                onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  setRestockItems((prev) =>
                                    prev.map((r, i) => (i === idx ? { ...r, newModalPrice: val } : r))
                                  );
                                }}
                                className="w-28 text-right py-1 px-2 border border-gray-300 rounded-md text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                              />
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setRestockItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Summary & Submit */}
            {restockItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs text-gray-500">
                    Total Unit Masuk:{" "}
                    <span className="font-bold text-gray-900">
                      +{restockItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)} unit
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    Estimasi Nilai Pembelian:{" "}
                    <span className="text-[#E05D43] font-bold tabular-nums">
                      Rp{" "}
                      {restockItems
                        .reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.newModalPrice) || 0), 0)
                        .toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProcessRestock}
                  className="px-6 py-3 bg-[#E05D43] hover:bg-[#C54D33] disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? "Memproses..." : "Simpan & Tambahkan Stok"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: PINDAH STOK ANTAR TOKO / CABANG (TRANSFER STOK)            */}
      {/* ================================================================= */}
      {activeTab === "transfer" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Transfer Details */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#E05D43]" />
                Detail Pindah Stok Antar Toko
              </h2>

              {/* Direction Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    setTransferDirection("transfer_out");
                    setTransferSource(settings?.store_name || "AvrilMart Pusat");
                    setTransferDestination("");
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    transferDirection === "transfer_out"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Kirim Stok (Keluar)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTransferDirection("transfer_in");
                    setTransferSource("");
                    setTransferDestination(settings?.store_name || "AvrilMart Pusat");
                  }}
                  className={`py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    transferDirection === "transfer_in"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Terima Stok (Masuk)
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  No. Surat Jalan / Referensi Transfer
                </label>
                <input
                  type="text"
                  value={transferRefNo}
                  onChange={(e) => setTransferRefNo(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dari Toko / Gudang Asal
                </label>
                <input
                  type="text"
                  value={transferSource}
                  onChange={(e) => setTransferSource(e.target.value)}
                  placeholder="Contoh: AvrilMart Pusat / Gudang Utama"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Ke Toko / Cabang Tujuan
                </label>
                <input
                  type="text"
                  value={transferDestination}
                  onChange={(e) => setTransferDestination(e.target.value)}
                  placeholder="Contoh: AvrilMart Cabang 2 / Toko Timur"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Catatan Pengiriman / Nama Kurir
                </label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Dikirim via mobil box (Sopir: Budi)"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>
            </div>

            {/* Product Search Box for Transfer */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Pilih Barang yang Ditransfer
                </label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-xs font-medium text-[#E05D43] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Scan Kamera
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={transferSearch}
                  onChange={(e) => setTransferSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && transferSearchResults.length > 0) {
                      e.preventDefault();
                      addProductToTransfer(transferSearchResults[0]);
                    }
                  }}
                  placeholder="Cari produk atau scan barcode..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              {transferSearchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {transferSearchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProductToTransfer(p)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-[#FFF5F2] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {p.sku} · Stok tersedia: <span className="font-semibold text-gray-700">{p.stock}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#E05D43] flex items-center gap-1 flex-shrink-0">
                        <Plus className="w-3.5 h-3.5" /> Pilih
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Transfer Items Table */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Daftar Barang Surat Jalan ({transferItems.length} Produk)
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {transferDirection === "transfer_out"
                      ? "Stok toko ini akan otomatis DIKURANGI setelah Surat Jalan diproses"
                      : "Stok toko ini akan otomatis DITAMBAHKAN setelah penerimaan diproses"}
                  </p>
                </div>
                {transferItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTransferItems([])}
                    className="text-xs text-red-600 hover:underline cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {transferItems.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-16 px-4 text-center">
                  <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">
                    Belum ada barang yang dipilih untuk dipindahkan
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Isi lokasi toko asal & tujuan, lalu pilih barang yang ingin dikirim/diterima
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                      <tr>
                        <th className="py-3 px-3 text-left">Produk</th>
                        <th className="py-3 px-3 text-center">Stok Saat Ini</th>
                        <th className="py-3 px-3 text-center">
                          Jumlah {transferDirection === "transfer_out" ? "Kirim (-)" : "Terima (+)"}
                        </th>
                        <th className="py-3 px-3 text-center">Sisa / Stok Akhir</th>
                        <th className="py-3 px-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transferItems.map((item, idx) => {
                        const change = transferDirection === "transfer_out" ? -item.qty : item.qty;
                        const stockAfter = (Number(item.product.stock) || 0) + change;
                        const isInsufficient =
                          transferDirection === "transfer_out" && item.qty > item.product.stock;

                        return (
                          <tr key={item.product.id} className="hover:bg-gray-50/70">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-gray-900">{item.product.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{item.product.sku}</div>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-600 font-medium tabular-nums">
                              {item.product.stock}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTransferItems((prev) =>
                                      prev.map((r, i) =>
                                        i === idx ? { ...r, qty: Math.max(1, r.qty - 1) } : r
                                      )
                                    )
                                  }
                                  className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                    setTransferItems((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, qty: val } : r))
                                    );
                                  }}
                                  className={`w-20 text-center py-1 px-2 border rounded-md font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43] ${
                                    isInsufficient
                                      ? "border-red-500 text-red-600 bg-red-50"
                                      : "border-gray-300 text-gray-900"
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTransferItems((prev) =>
                                      prev.map((r, i) => (i === idx ? { ...r, qty: r.qty + 1 } : r))
                                    )
                                  }
                                  className="w-7 h-7 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {isInsufficient && (
                                <div className="text-[11px] text-red-600 text-center mt-1">
                                  Melebihi stok!
                                </div>
                              )}
                            </td>
                            <td
                              className={`py-3 px-3 text-center font-bold tabular-nums ${
                                stockAfter < 0 ? "text-red-600" : "text-gray-900"
                              }`}
                            >
                              {stockAfter}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setTransferItems((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {transferItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Total Barang Ditransfer:{" "}
                  <span className="font-bold text-gray-900">
                    {transferItems.reduce((sum, i) => sum + (Number(i.qty) || 0), 0)} unit
                  </span>{" "}
                  ({transferSource || "..."} → {transferDestination || "..."})
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProcessTransfer}
                  className="px-6 py-3 bg-[#E05D43] hover:bg-[#C54D33] disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  {isSubmitting ? "Memproses..." : "Proses Transfer & Cetak Surat Jalan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: STOK OPNAME (AUDIT STOK FISIK VS SISTEM)                   */}
      {/* ================================================================= */}
      {activeTab === "opname" && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Produk Dihitung</div>
              <div className="text-xl font-bold text-gray-900 mt-1 tabular-nums">
                {opnameSummary.checkedCount} <span className="text-xs font-normal text-gray-400">/ {products.length}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Produk Berselisih</div>
              <div className="text-xl font-bold text-amber-600 mt-1 tabular-nums">
                {opnameSummary.varianceItemsCount} produk
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Selisih Unit (+ / -)</div>
              <div className="text-lg font-bold mt-1 tabular-nums flex items-center gap-3">
                <span className="text-emerald-600">+{opnameSummary.surplusUnits}</span>
                <span className="text-gray-300">|</span>
                <span className="text-red-600">-{opnameSummary.deficitUnits}</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-500">Estimasi Nilai Selisih (Modal)</div>
              <div
                className={`text-lg font-bold mt-1 tabular-nums ${
                  opnameSummary.netValueDiff < 0
                    ? "text-red-600"
                    : opnameSummary.netValueDiff > 0
                    ? "text-emerald-600"
                    : "text-gray-900"
                }`}
              >
                {opnameSummary.netValueDiff < 0 ? "-" : opnameSummary.netValueDiff > 0 ? "+" : ""}Rp{" "}
                {Math.abs(opnameSummary.netValueDiff).toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={opnameSearch}
                  onChange={(e) => setOpnameSearch(e.target.value)}
                  placeholder="Cari nama produk, SKU, atau scan barcode..."
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
                {opnameSearch && (
                  <button
                    type="button"
                    onClick={() => setOpnameSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="md:col-span-3">
                <select
                  value={opnameCategory}
                  onChange={(e) => setOpnameCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "Semua Kategori" : cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOpnameFilterMode("all")}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    opnameFilterMode === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Semua ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOpnameFilterMode("edited")}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    opnameFilterMode === "edited" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Diisi ({opnameSummary.checkedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setOpnameFilterMode("variance")}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    opnameFilterMode === "variance" ? "bg-white text-[#E05D43] shadow-sm" : "text-gray-600"
                  }`}
                >
                  Selisih ({opnameSummary.varianceItemsCount})
                </button>
              </div>
            </div>

            {/* Opname Notes & Commit Bar */}
            {opnameSummary.varianceItemsCount > 0 && (
              <div className="pt-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <input
                  type="text"
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Catatan Berita Acara Opname (contoh: Opname Rutin Akhir Bulan Rak A-C)..."
                  className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpnameEntries({})}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
                  >
                    Reset Hitungan
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleCommitOpname}
                    className="px-5 py-2 bg-[#E05D43] hover:bg-[#C54D33] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting
                      ? "Menyimpan..."
                      : `Terapkan Hasil Opname (${opnameSummary.varianceItemsCount} Produk)`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Opname Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-4 text-left">Nama Produk & SKU</th>
                    <th className="py-3 px-3 text-left">Kategori</th>
                    <th className="py-3 px-3 text-center">Stok Sistem</th>
                    <th className="py-3 px-3 text-center">Stok Fisik (Nyata)</th>
                    <th className="py-3 px-3 text-center">Selisih</th>
                    <th className="py-3 px-4 text-left">Alasan / Keterangan Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedOpnameProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Tidak ada produk yang sesuai filter
                      </td>
                    </tr>
                  ) : (
                    paginatedOpnameProducts.map((product) => {
                      const entry = opnameEntries[product.id];
                      const hasPhysical =
                        entry && entry.physicalStock !== "" && !isNaN(Number(entry.physicalStock));
                      const physicalNum = hasPhysical ? parseInt(entry.physicalStock, 10) : null;
                      const diff = physicalNum !== null ? physicalNum - product.stock : 0;

                      return (
                        <tr
                          key={product.id}
                          className={
                            hasPhysical && diff !== 0
                              ? "bg-amber-50/40 hover:bg-amber-50/70"
                              : hasPhysical && diff === 0
                              ? "bg-emerald-50/30 hover:bg-emerald-50/50"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400 font-mono">
                              {product.sku}
                              {product.barcode ? ` · ${product.barcode}` : ""}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-500">{product.category}</td>
                          <td className="py-3 px-3 text-center font-semibold text-gray-700 tabular-nums">
                            {product.stock}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                ref={(el) => {
                                  opnameInputRefs.current[product.id] = el;
                                }}
                                type="number"
                                min={0}
                                placeholder={String(product.stock)}
                                value={entry?.physicalStock ?? ""}
                                onChange={(e) => handleOpnameInputChange(product.id, e.target.value)}
                                className={`w-24 text-center py-1.5 px-2.5 border rounded-lg font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43] ${
                                  hasPhysical && diff !== 0
                                    ? "border-amber-400 bg-white text-gray-900"
                                    : hasPhysical && diff === 0
                                    ? "border-emerald-400 bg-white text-emerald-700"
                                    : "border-gray-300 text-gray-900"
                                }`}
                              />
                              <button
                                type="button"
                                title="Stok Sesuai Sistem"
                                onClick={() =>
                                  handleOpnameInputChange(product.id, String(product.stock))
                                }
                                className="p-1.5 text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold tabular-nums">
                            {!hasPhysical ? (
                              <span className="text-gray-300">-</span>
                            ) : diff === 0 ? (
                              <span className="text-emerald-600 text-xs font-semibold">Sesuai (0)</span>
                            ) : (
                              <span className={diff > 0 ? "text-emerald-600" : "text-red-600"}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {hasPhysical && diff !== 0 ? (
                              <select
                                value={entry?.reason || "Selisih Hitung / Koreksi Opname"}
                                onChange={(e) =>
                                  handleOpnameReasonChange(product.id, e.target.value)
                                }
                                className="w-full py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                              >
                                <option value="Selisih Hitung / Koreksi Opname">
                                  Selisih Hitung / Koreksi Opname
                                </option>
                                <option value="Barang Rusak / Cacat">Barang Rusak / Cacat</option>
                                <option value="Barang Kedaluwarsa (Expired)">
                                  Barang Kedaluwarsa (Expired)
                                </option>
                                <option value="Barang Hilang / Susut">Barang Hilang / Susut</option>
                                <option value="Bonus / Lebih Kirim Supplier">
                                  Bonus / Lebih Kirim Supplier
                                </option>
                                <option value="Salah Input Transaksi Sebelumnya">
                                  Salah Input Transaksi Sebelumnya
                                </option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {hasPhysical ? "Stok cocok dengan sistem" : "Belum diisi"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalOpnamePages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 text-xs text-gray-600">
                <span>
                  Halaman <strong className="text-gray-900">{opnamePage}</strong> dari{" "}
                  <strong className="text-gray-900">{totalOpnamePages}</strong> ({filteredOpnameProducts.length} produk)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={opnamePage <= 1}
                    onClick={() => setOpnamePage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 font-medium cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={opnamePage >= totalOpnamePages}
                    onClick={() => setOpnamePage((p) => Math.min(totalOpnamePages, p + 1))}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 font-medium cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: KARTU STOK & RIWAYAT MUTASI                                */}
      {/* ================================================================= */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-1 items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari No. Referensi, Nama Produk, SKU, Supplier, atau Cabang..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              >
                <option value="all">Semua Tipe Mutasi</option>
                <option value="restock">Barang Masuk (Restock)</option>
                <option value="transfer_out">Transfer Keluar</option>
                <option value="transfer_in">Transfer Masuk</option>
                <option value="opname">Stok Opname</option>
              </select>

              <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("documents")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    historyViewMode === "documents" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Per Dokumen
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryViewMode("items")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                    historyViewMode === "items" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Kartu Stok Item
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={exportHistoryToCSV}
              disabled={filteredMovements.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#E05D43] hover:bg-[#C54D33] disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV Kartu Stok
            </button>
          </div>

          {/* View Mode 1: Per Dokumen Mutasi */}
          {historyViewMode === "documents" ? (
            <div className="space-y-3">
              {filteredMovements.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl py-16 text-center text-gray-400">
                  Belum ada riwayat mutasi stok yang tercatat
                </div>
              ) : (
                filteredMovements.map((mov) => {
                  const badge = getMovementBadge(mov.type);
                  return (
                    <div
                      key={mov.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-gray-900">
                            {mov.reference_no}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(mov.date).toLocaleString("id-ID")} · Oleh:{" "}
                            <strong className="text-gray-600">{mov.user_name}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMovementForPrint(mov)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Cetak Bukti / Surat Jalan
                          </button>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="text-xs text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                        {mov.supplier_name && (
                          <div>
                            Supplier: <strong className="text-gray-900">{mov.supplier_name}</strong>
                          </div>
                        )}
                        {(mov.source_location || mov.destination_location) && (
                          <div>
                            Rute Transfer:{" "}
                            <strong className="text-gray-900">
                              {mov.source_location || "-"} → {mov.destination_location || "-"}
                            </strong>
                          </div>
                        )}
                        {mov.notes && (
                          <div>
                            Catatan: <span className="text-gray-800">{mov.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Table inside Document */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase">
                            <tr>
                              <th className="py-2 px-3 text-left">Produk</th>
                              <th className="py-2 px-3 text-center">Stok Awal</th>
                              <th className="py-2 px-3 text-center">Mutasi</th>
                              <th className="py-2 px-3 text-center">Stok Akhir</th>
                              <th className="py-2 px-3 text-left">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(mov.items || []).map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-2 px-3 font-medium text-gray-900">
                                  {item.product_name}{" "}
                                  <span className="text-gray-400 font-mono">({item.product_sku})</span>
                                </td>
                                <td className="py-2 px-3 text-center text-gray-600 tabular-nums">
                                  {item.stock_before}
                                </td>
                                <td
                                  className={`py-2 px-3 text-center font-bold tabular-nums ${
                                    item.quantity_change > 0 ? "text-emerald-600" : "text-red-600"
                                  }`}
                                >
                                  {item.quantity_change > 0
                                    ? `+${item.quantity_change}`
                                    : item.quantity_change}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-gray-900 tabular-nums">
                                  {item.stock_after}
                                </td>
                                <td className="py-2 px-3 text-gray-500">
                                  {item.reason || mov.notes || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* View Mode 2: Kartu Stok Item (Flattened Table) */
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="py-3 px-4 text-left">Waktu & No. Ref</th>
                      <th className="py-3 px-3 text-left">Tipe</th>
                      <th className="py-3 px-4 text-left">Produk</th>
                      <th className="py-3 px-3 text-center">Stok Awal</th>
                      <th className="py-3 px-3 text-center">Perubahan</th>
                      <th className="py-3 px-3 text-center">Stok Akhir</th>
                      <th className="py-3 px-4 text-left">Info / Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {flattenedItemLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-400">
                          Belum ada data kartu stok
                        </td>
                      </tr>
                    ) : (
                      flattenedItemLogs.map(({ movement, item }, idx) => {
                        const badge = getMovementBadge(movement.type);
                        return (
                          <tr key={`${movement.id}_${idx}`} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="font-mono text-xs font-bold text-gray-900">
                                {movement.reference_no}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {new Date(movement.date).toLocaleString("id-ID")}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                              >
                                {badge.label}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900">{item.product_name}</div>
                              <div className="text-xs text-gray-400 font-mono">{item.product_sku}</div>
                            </td>
                            <td className="py-3 px-3 text-center text-gray-600 tabular-nums">
                              {item.stock_before}
                            </td>
                            <td
                              className={`py-3 px-3 text-center font-bold tabular-nums ${
                                item.quantity_change > 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {item.quantity_change > 0
                                ? `+${item.quantity_change}`
                                : item.quantity_change}
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-gray-900 tabular-nums">
                              {item.stock_after}
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-600">
                              {movement.type === "restock" && movement.supplier_name
                                ? `Supplier: ${movement.supplier_name}`
                                : movement.type === "transfer_out" || movement.type === "transfer_in"
                                ? `${movement.source_location} → ${movement.destination_location}`
                                : item.reason || movement.notes || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL CETAK SURAT JALAN / BUKTI MUTASI STOK                       */}
      {/* ================================================================= */}
      {selectedMovementForPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Bukti Mutasi / Surat Jalan ({selectedMovementForPrint.reference_no})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedMovementForPrint(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm" id="printable-stock-document">
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <div className="text-base font-bold text-gray-900">
                  {settings?.store_name || "AVRIL MART"}
                </div>
                <div className="text-xs text-gray-500">
                  {selectedMovementForPrint.type === "transfer_out" ||
                  selectedMovementForPrint.type === "transfer_in"
                    ? "SURAT JALAN TRANSFER STOK"
                    : selectedMovementForPrint.type === "restock"
                    ? "BUKTI PENERIMAAN BARANG MASUK"
                    : "BERITA ACARA STOK OPNAME"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">No. Dokumen:</span>
                  <div className="font-mono font-bold text-gray-900">
                    {selectedMovementForPrint.reference_no}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Tanggal:</span>
                  <div className="font-medium text-gray-900">
                    {new Date(selectedMovementForPrint.date).toLocaleString("id-ID")}
                  </div>
                </div>
                {selectedMovementForPrint.source_location && (
                  <div>
                    <span className="text-gray-500">Dari Lokasi:</span>
                    <div className="font-semibold text-gray-900">
                      {selectedMovementForPrint.source_location}
                    </div>
                  </div>
                )}
                {selectedMovementForPrint.destination_location && (
                  <div className="text-right">
                    <span className="text-gray-500">Ke Tujuan:</span>
                    <div className="font-semibold text-gray-900">
                      {selectedMovementForPrint.destination_location}
                    </div>
                  </div>
                )}
                {selectedMovementForPrint.supplier_name && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Supplier: </span>
                    <strong className="text-gray-900">{selectedMovementForPrint.supplier_name}</strong>
                  </div>
                )}
                {selectedMovementForPrint.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Catatan: </span>
                    <span className="text-gray-800">{selectedMovementForPrint.notes}</span>
                  </div>
                )}
              </div>

              <table className="w-full text-xs border-y border-gray-200">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="py-2 px-2 text-left">Nama Barang</th>
                    <th className="py-2 px-2 text-center">Awal</th>
                    <th className="py-2 px-2 text-center">Jumlah</th>
                    <th className="py-2 px-2 text-center">Akhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(selectedMovementForPrint.items || []).map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 px-2 font-medium text-gray-900">
                        {item.product_name}
                        <div className="text-[10px] text-gray-400 font-mono">{item.product_sku}</div>
                      </td>
                      <td className="py-2 px-2 text-center tabular-nums">{item.stock_before}</td>
                      <td className="py-2 px-2 text-center font-bold tabular-nums">
                        {item.quantity_change > 0 ? `+${item.quantity_change}` : item.quantity_change}
                      </td>
                      <td className="py-2 px-2 text-center font-bold tabular-nums">{item.stock_after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-gray-600">
                <div>
                  <p className="mb-10">Dibuat / Pengirim</p>
                  <p className="border-t border-gray-300 pt-1 font-medium text-gray-900">
                    {selectedMovementForPrint.user_name}
                  </p>
                </div>
                <div>
                  <p className="mb-10">Kurir / Pembawa</p>
                  <p className="border-t border-gray-300 pt-1 text-gray-400">( .................... )</p>
                </div>
                <div>
                  <p className="mb-10">Penerima / Kepala Toko</p>
                  <p className="border-t border-gray-300 pt-1 text-gray-400">( .................... )</p>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedMovementForPrint(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL INFO SQL CLOUD SUPABASE (OPSIONAL)                          */}
      {/* ================================================================= */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-[#E05D43]" />
                Sinkronisasi Riwayat Kartu Stok ke Supabase (Opsional)
              </h3>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Perubahan jumlah stok produk pada <strong>Barang Masuk</strong>,{" "}
              <strong>Transfer Stok</strong>, dan <strong>Stok Opname</strong> sudah{" "}
              <span className="text-emerald-700 font-semibold">
                otomatis langsung mengupdate tabel `products` di Supabase Anda
              </span>
              . Jika Anda ingin riwayat dokumen Kartu Stok juga tersimpan di cloud lintas perangkat, jalankan SQL berikut satu kali di <strong>Supabase SQL Editor</strong>:
            </p>

            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto leading-relaxed">
{`CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  reference_no TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  user_name TEXT,
  supplier_name TEXT,
  source_location TEXT,
  destination_location TEXT,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_items INTEGER DEFAULT 0,
  total_value NUMERIC DEFAULT 0
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to stock_movements"
  ON stock_movements FOR ALL USING (true) WITH CHECK (true);`}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `CREATE TABLE IF NOT EXISTS stock_movements (\n  id TEXT PRIMARY KEY,\n  reference_no TEXT NOT NULL,\n  type TEXT NOT NULL,\n  date TIMESTAMPTZ DEFAULT NOW(),\n  user_name TEXT,\n  supplier_name TEXT,\n  source_location TEXT,\n  destination_location TEXT,\n  notes TEXT,\n  items JSONB NOT NULL DEFAULT '[]'::jsonb,\n  total_items INTEGER DEFAULT 0,\n  total_value NUMERIC DEFAULT 0\n);\nALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow all access to stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);`
                  );
                  toast.success("Kode SQL berhasil disalin ke clipboard!");
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Salin SQL
              </button>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
      />
    </div>
  );
}
