import {
  Receipt,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Download,
  Printer,
  Search,
  Filter,
  RotateCcw,
  Users,
  UserPlus,
  MessageCircle,
  Trash2,
  ShieldAlert,
  X,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Sale, Customer, AppSettings } from "../types";
import { useState, useEffect } from "react";
import { ThermalReceipt } from "./thermal-receipt";
import { toast } from "sonner";

const CUSTOMERS_KEY = "avrilmart_customers_v1";
const REFUND_META_KEY = "avrilmart_sales_meta_v1";
const ADMIN_PIN_KEY = "avrilmart_admin_pin_v1";

interface SalesHistoryProps {
  sales: Sale[];
  settings?: AppSettings | null;
  userRole?: "admin" | "cashier";
  onRefundOrVoidSale?: (
    sale: Sale,
    mode: "void" | "partial",
    returnedItems: Array<{ product_id: string; product_name: string; product_sku: string; quantity: number; price: number }>,
    reason: string
  ) => Promise<void>;
}

export function SalesHistory({
  sales,
  settings,
  userRole = "admin",
  onRefundOrVoidSale,
}: SalesHistoryProps) {
  const [activeTab, setActiveTab] = useState<"transactions" | "customers">("transactions");
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "month" | "year">("all");

  // Local metadata map for customer linkage & refund/void status (persisted so reload preserves status)
  const [salesMeta, setSalesMeta] = useState<
    Record<
      string,
      {
        customer_id?: string;
        customer_name?: string;
        customer_phone?: string;
        status?: "completed" | "voided" | "partially_refunded";
        refunded_amount?: number;
        refund_reason?: string;
        refunded_at?: string;
      }
    >
  >(() => {
    try {
      const raw = localStorage.getItem(REFUND_META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REFUND_META_KEY);
      if (raw) setSalesMeta(JSON.parse(raw));
    } catch {}
  }, [sales]);

  const saveSalesMeta = (next: typeof salesMeta) => {
    setSalesMeta(next);
    try {
      localStorage.setItem(REFUND_META_KEY, JSON.stringify(next));
    } catch {}
  };

  // Refund / Void Modal state
  const [refundTarget, setRefundTarget] = useState<Sale | null>(null);
  const [refundMode, setRefundMode] = useState<"void" | "partial">("void");
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState("Permintaan pelanggan / tukar barang");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const savedAdminPin = (() => {
    try {
      return localStorage.getItem(ADMIN_PIN_KEY) || "1234";
    } catch {
      return "1234";
    }
  })();

  // Customer Database State
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOMERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [customerSearch, setCustomerSearch] = useState("");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custType, setCustType] = useState<"retail" | "wholesale">("retail");
  const [custAddress, setCustAddress] = useState("");
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState<Customer | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch {}
  }, [customers]);

  // Enrich sales with stored metadata
  const enrichedSales: Sale[] = (Array.isArray(sales) ? sales : [])
    .filter(Boolean)
    .map((s) => {
      const meta = salesMeta[s.id] || {};
      return {
        ...s,
        customer_id: s.customer_id || meta.customer_id,
        customer_name: s.customer_name || meta.customer_name,
        customer_phone: s.customer_phone || meta.customer_phone,
        status: s.status || meta.status || "completed",
        refunded_amount: s.refunded_amount ?? meta.refunded_amount,
        refund_reason: s.refund_reason || meta.refund_reason,
      };
    });

  // Filter sales by search and period
  const filteredSales = enrichedSales
    .filter((sale) => {
      if (!sale) return false;
      const safeId = String(sale.id || "");
      const txnId = safeId.slice(0, 8).toUpperCase();
      const custNameMatch = (sale.customer_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch =
        searchTerm === "" ||
        txnId.includes(searchTerm.toUpperCase()) ||
        safeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        custNameMatch;

      const saleDate = new Date(sale.date || Date.now());
      const now = new Date();
      let matchesPeriod = true;

      if (filterPeriod === "today") {
        matchesPeriod = saleDate.toDateString() === now.toDateString();
      } else if (filterPeriod === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesPeriod = saleDate >= weekAgo;
      } else if (filterPeriod === "month") {
        matchesPeriod =
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
      } else if (filterPeriod === "year") {
        matchesPeriod = saleDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesPeriod;
    })
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const activeFilteredSales = filteredSales.filter((s) => s.status !== "voided");
  const totalRevenue = activeFilteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
  const totalItems = activeFilteredSales.reduce(
    (sum, sale) =>
      sum +
      (Array.isArray(sale.items) ? sale.items : []).reduce(
        (s, item) => s + (Number(item?.quantity) || 0),
        0
      ),
    0
  );

  const today = new Date().toDateString();
  const todaySales = activeFilteredSales.filter(
    (sale) => new Date(sale.date || Date.now()).toDateString() === today
  );
  const todayRevenue = todaySales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);

  const exportToCSV = () => {
    const csvHeader = "No Transaksi,Tanggal,Waktu,Pelanggan,Status,Tipe Harga,Item,Jumlah,Total\n";
    const csvContent = filteredSales
      .map((sale) => {
        const date = new Date(sale.date || Date.now());
        const dateStr = date.toLocaleDateString("id-ID");
        const timeStr = date.toLocaleTimeString("id-ID");
        const txnId = String(sale.id || "").slice(0, 8).toUpperCase();
        const cust = sale.customer_name || "-";
        const status =
          sale.status === "voided"
            ? "VOID"
            : sale.status === "partially_refunded"
            ? "RETUR SEBAGIAN"
            : "SELESAI";
        const priceType = sale.priceType === "retail" ? "Eceran" : "Grosir";
        const safeItems = Array.isArray(sale.items) ? sale.items : [];
        const items = safeItems.map((item) => `${item?.name || "Produk"} (x${item?.quantity || 0})`).join("; ");
        const totalQty = safeItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);

        return `${txnId},${dateStr},${timeStr},"${cust}",${status},${priceType},"${items}",${totalQty},${Number(sale.total) || 0}`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-penjualan-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReprintReceipt = (sale: Sale) => {
    const safeItems = Array.isArray(sale.items) ? sale.items : [];
    const receiptSale = {
      id: String(sale.id || ""),
      total: Number(sale.total) || 0,
      payment_type: (sale.priceType === "retail" ? "retail" : "wholesale") as "retail" | "wholesale",
      payment_amount: sale.payment_amount,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone,
      created_at: sale.date || new Date().toISOString(),
      items: safeItems.map((item) => ({
        product_name: item?.name || "Produk",
        quantity: Number(item?.quantity) || 1,
        price: Number(item?.appliedPrice) || 0,
        total: (Number(item?.appliedPrice) || 0) * (Number(item?.quantity) || 1),
      })),
    };

    setSelectedSale(receiptSale);
  };

  const openRefundModal = (sale: Sale) => {
    setRefundTarget(sale);
    setRefundMode("void");
    const initialQty: Record<string, number> = {};
    (sale.items || []).forEach((item, idx) => {
      initialQty[`${item.id}_${idx}`] = 0;
    });
    setRefundQuantities(initialQty);
    setRefundReason("Permintaan pelanggan / tukar barang");
    setAdminPinInput("");
  };

  const handleConfirmRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    if (adminPinInput.trim() !== savedAdminPin) {
      toast.error("PIN Otorisasi Admin tidak sesuai (Default: 1234)");
      return;
    }

    const safeItems = Array.isArray(refundTarget.items) ? refundTarget.items : [];
    let returnedItems: Array<{
      product_id: string;
      product_name: string;
      product_sku: string;
      quantity: number;
      price: number;
    }> = [];

    if (refundMode === "void") {
      returnedItems = safeItems.map((item) => ({
        product_id: item.id,
        product_name: item.name || "Produk",
        product_sku: item.sku || "-",
        quantity: Number(item.quantity) || 1,
        price: Number(item.appliedPrice) || 0,
      }));
    } else {
      returnedItems = safeItems
        .map((item, idx) => {
          const qty = Number(refundQuantities[`${item.id}_${idx}`]) || 0;
          return {
            product_id: item.id,
            product_name: item.name || "Produk",
            product_sku: item.sku || "-",
            quantity: Math.min(qty, Number(item.quantity) || 1),
            price: Number(item.appliedPrice) || 0,
          };
        })
        .filter((i) => i.quantity > 0);

      if (returnedItems.length === 0) {
        toast.error("Pilih minimal 1 barang yang diretur");
        return;
      }
    }

    const refundedValue = returnedItems.reduce((s, i) => s + i.quantity * i.price, 0);

    try {
      setIsProcessingRefund(true);
      if (onRefundOrVoidSale) {
        await onRefundOrVoidSale(refundTarget, refundMode, returnedItems, refundReason);
      }

      const nextMeta = {
        ...salesMeta,
        [refundTarget.id]: {
          ...(salesMeta[refundTarget.id] || {}),
          status: (refundMode === "void" ? "voided" : "partially_refunded") as
            | "voided"
            | "partially_refunded",
          refunded_amount: (salesMeta[refundTarget.id]?.refunded_amount || 0) + refundedValue,
          refund_reason: refundReason,
          refunded_at: new Date().toISOString(),
        },
      };
      saveSalesMeta(nextMeta);

      toast.success(
        refundMode === "void"
          ? `Nota #${String(refundTarget.id).slice(0, 8).toUpperCase()} dibatalkan (Void) & stok dikembalikan!`
          : `Retur sebagian berhasil (Rp ${refundedValue.toLocaleString("id-ID")}) & stok dikembalikan!`
      );
      setRefundTarget(null);
    } catch (err: any) {
      toast.error("Gagal memproses retur: " + (err?.message || "Terjadi kesalahan"));
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Customer management handlers
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: custName.trim(),
      phone: custPhone.trim(),
      type: custType,
      address: custAddress.trim(),
      created_at: new Date().toISOString(),
    };
    setCustomers([newCust, ...customers]);
    setCustName("");
    setCustPhone("");
    setCustAddress("");
    toast.success(`Pelanggan ${newCust.name} berhasil disimpan`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((c) => c.id !== id));
    toast.success("Data pelanggan dihapus");
  };

  const getCustomerSales = (cust: Customer) => {
    return enrichedSales.filter(
      (s) =>
        s.status !== "voided" &&
        (s.customer_id === cust.id ||
          (s.customer_name && s.customer_name.toLowerCase() === cust.name.toLowerCase()) ||
          (cust.phone && s.customer_phone === cust.phone))
    );
  };

  const formatWA = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("0")) return "62" + digits.slice(1);
    if (digits.startsWith("8")) return "62" + digits;
    return digits;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan & Pelanggan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola nota transaksi, Retur/Void stok otomatis, Struk Digital WA, dan Database Pelanggan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "transactions"
                  ? "bg-white text-[#E05D43] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Receipt className="w-4 h-4" />
              Nota & Retur
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "customers"
                  ? "bg-white text-[#E05D43] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users className="w-4 h-4" />
              Pelanggan ({customers.length})
            </button>
          </div>
          {activeTab === "transactions" && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#E05D43] text-white rounded-xl hover:bg-[#C54D33] text-xs sm:text-sm font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "transactions" ? (
        <>
          {/* Search & Filter Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari No. Transaksi atau Nama Pelanggan..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Periode:</span>
              {(
                [
                  { id: "all", label: "Semua" },
                  { id: "today", label: "Hari Ini" },
                  { id: "week", label: "Minggu Ini" },
                  { id: "month", label: "Bulan Ini" },
                  { id: "year", label: "Tahun Ini" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilterPeriod(p.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterPeriod === p.id
                      ? "bg-[#E05D43] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              Menampilkan <span className="font-bold text-gray-900">{filteredSales.length}</span> dari{" "}
              {enrichedSales.length} transaksi
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-800">Total Pendapatan Bersih</span>
              </div>
              <p className="text-xl font-bold text-blue-900">Rp {totalRevenue.toLocaleString("id-ID")}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-green-800">Omzet Hari Ini</span>
              </div>
              <p className="text-xl font-bold text-green-900">Rp {todayRevenue.toLocaleString("id-ID")}</p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Receipt className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-semibold text-purple-800">Transaksi Aktif</span>
              </div>
              <p className="text-xl font-bold text-purple-900">{activeFilteredSales.length}</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-orange-800">Produk Terjual</span>
              </div>
              <p className="text-xl font-bold text-orange-900">{totalItems}</p>
            </div>
          </div>

          {/* Sales List */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">No Nota</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pelanggan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipe & Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rincian Item</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                        Belum ada transaksi
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const safeItems = Array.isArray(sale.items) ? sale.items : [];
                      const totalQty = safeItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
                      const txnId = String(sale.id || "").slice(0, 8).toUpperCase();
                      const isVoided = sale.status === "voided";
                      const isPartial = sale.status === "partially_refunded";

                      return (
                        <tr key={sale.id} className={`hover:bg-gray-50 ${isVoided ? "bg-red-50/30 opacity-70" : ""}`}>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => handleReprintReceipt(sale)}
                              className="font-mono font-bold text-sm text-[#E05D43] hover:text-[#C54D33] hover:underline cursor-pointer"
                            >
                              #{txnId}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 text-xs">
                            {new Date(sale.date || Date.now()).toLocaleString("id-ID")}
                          </td>
                          <td className="px-4 py-3.5 text-xs">
                            {sale.customer_name ? (
                              <div>
                                <div className="font-semibold text-gray-900">{sale.customer_name}</div>
                                {sale.customer_phone && (
                                  <div className="text-[11px] text-gray-500">{sale.customer_phone}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Umum</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  sale.priceType === "retail"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-emerald-100 text-emerald-700"
                                }`}
                              >
                                {sale.priceType === "retail" ? "Eceran" : "Grosir"}
                              </span>
                              {isVoided && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                                  <Ban className="w-3 h-3" /> VOID / BATAL
                                </span>
                              )}
                              {isPartial && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Retur Sebagian
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="space-y-0.5 max-w-xs">
                              {safeItems.map((item, idx) => (
                                <div key={idx} className="text-xs text-gray-700 truncate">
                                  {item?.name || "Produk"} <span className="font-semibold">(x{item?.quantity || 0})</span>
                                </div>
                              ))}
                              <div className="text-[10px] text-gray-400">Total: {totalQty} pcs</div>
                              {sale.refund_reason && (
                                <div className="text-[10px] text-red-600 italic">Alasan: {sale.refund_reason}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className={`font-bold text-sm ${isVoided ? "line-through text-gray-400" : "text-emerald-600"}`}>
                              Rp {(Number(sale.total) || 0).toLocaleString("id-ID")}
                            </div>
                            {sale.refunded_amount ? (
                              <div className="text-[10px] text-red-500 font-medium">
                                -Rp {sale.refunded_amount.toLocaleString("id-ID")} (Retur)
                              </div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleReprintReceipt(sale)}
                                className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1"
                                title="Cetak Ulang Struk atau Kirim Struk Digital via WhatsApp"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Struk / WA</span>
                              </button>
                              {!isVoided && (
                                <button
                                  onClick={() => openRefundModal(sale)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors inline-flex items-center gap-1"
                                  title="Retur Barang atau Batalkan Transaksi (Void)"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Retur/Void</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ════ TAB 2: DATABASE PELANGGAN & RIWAYAT BELANJA ════ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Customer Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm h-fit space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-50 text-[#E05D43] rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Tambah Pelanggan</h2>
                <p className="text-xs text-gray-500">Simpan kontak WA langganan grosir/eceran</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Pelanggan / Warung *</label>
                <input
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Cth: Toko Berkah / Ibu Made"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="Cth: 081234567890"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tipe Harga Default</label>
                <select
                  value={custType}
                  onChange={(e) => setCustType(e.target.value as "retail" | "wholesale")}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none bg-white"
                >
                  <option value="retail">Pelanggan Eceran</option>
                  <option value="wholesale">Langganan Grosir (Otomatis Harga Grosir)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat / Catatan</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Cth: Pasar Kintamani Blok B"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                + Simpan Pelanggan
              </button>
            </form>
          </div>

          {/* Customer List & Purchase History */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">Daftar Pelanggan & Riwayat Belanja</h2>
                <p className="text-xs text-gray-500">Klik "Riwayat" untuk melihat histori belanja atau kirim WA</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama / WA..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {customers
                .filter(
                  (c) =>
                    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    c.phone.toLowerCase().includes(customerSearch.toLowerCase())
                )
                .map((cust) => {
                  const custSales = getCustomerSales(cust);
                  const totalSpent = custSales.reduce((s, sale) => s + (Number(sale.total) || 0), 0);
                  const waPhone = formatWA(cust.phone);

                  return (
                    <div key={cust.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{cust.name}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              cust.type === "wholesale"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {cust.type === "wholesale" ? "Langganan Grosir" : "Eceran"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          WA: {cust.phone || "-"} {cust.address ? `· ${cust.address}` : ""}
                        </div>
                        <div className="text-xs text-gray-600 font-medium pt-0.5">
                          {custSales.length} transaksi · Total Belanja:{" "}
                          <span className="font-bold text-[#E05D43]">Rp {totalSpent.toLocaleString("id-ID")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {waPhone && (
                          <a
                            href={`https://wa.me/${waPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat WA
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setViewingCustomerHistory(cust)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
                        >
                          Riwayat ({custSales.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(cust.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {customers.length === 0 && (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Belum ada pelanggan tersimpan. Tambahkan pelanggan di samping atau langsung dari layar Kasir.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: RETUR & PEMBATALAN TRANSAKSI (REFUND / VOID) ════ */}
      {refundTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-red-50/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Retur / Pembatalan Nota #{String(refundTarget.id).slice(0, 8).toUpperCase()}
                  </h3>
                  <p className="text-xs text-gray-500">Stok barang otomatis dikembalikan ke inventori</p>
                </div>
              </div>
              <button onClick={() => setRefundTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRefund} className="p-5 space-y-4">
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRefundMode("void")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    refundMode === "void"
                      ? "border-red-500 bg-red-50 text-red-900"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-bold text-xs">Void Seluruh Nota</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Batalkan nota & kembalikan semua stok</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRefundMode("partial")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    refundMode === "partial"
                      ? "border-amber-500 bg-amber-50 text-amber-900"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="font-bold text-xs">Retur Sebagian Barang</div>
                  <div className="text-[11px] opacity-80 mt-0.5">Pilih jumlah item yang dikembalikan</div>
                </button>
              </div>

              {/* Partial item selector */}
              {refundMode === "partial" && (
                <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-1">Pilih Jumlah Barang yang Diretur:</div>
                  {(refundTarget.items || []).map((item, idx) => {
                    const key = `${item.id}_${idx}`;
                    const maxQty = Number(item.quantity) || 1;
                    const currentVal = refundQuantities[key] || 0;
                    return (
                      <div key={key} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                        <div className="flex-1 pr-2">
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="text-gray-500">
                            Dibeli: {maxQty} pcs × Rp {(Number(item.appliedPrice) || 0).toLocaleString("id-ID")}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Retur:</span>
                          <input
                            type="number"
                            min={0}
                            max={maxQty}
                            value={currentVal}
                            onChange={(e) =>
                              setRefundQuantities({
                                ...refundQuantities,
                                [key]: Math.min(maxQty, Math.max(0, parseInt(e.target.value, 10) || 0)),
                              })
                            }
                            className="w-14 px-2 py-1 text-center font-bold border border-gray-300 rounded-lg"
                          />
                          <span className="text-gray-400">/ {maxQty}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Retur / Void *</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Salah input barang / Barang rusak"
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  required
                />
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  PIN Otorisasi Admin (Default: 1234)
                </div>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="Masukkan PIN Admin..."
                  className="w-full px-3.5 py-2 text-sm bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingRefund}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isProcessingRefund
                    ? "Memproses..."
                    : refundMode === "void"
                    ? "Konfirmasi Void & Kembalikan Stok"
                    : "Proses Retur Sebagian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════ MODAL: CUSTOMER PURCHASE HISTORY ════ */}
      {viewingCustomerHistory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Riwayat Belanja: {viewingCustomerHistory.name}
                </h3>
                <p className="text-xs text-gray-500">WA: {viewingCustomerHistory.phone || "-"}</p>
              </div>
              <button onClick={() => setViewingCustomerHistory(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {getCustomerSales(viewingCustomerHistory).length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Belum ada riwayat transaksi untuk pelanggan ini.
                </div>
              ) : (
                getCustomerSales(viewingCustomerHistory).map((sale) => (
                  <div key={sale.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-gray-900">
                        Nota #{String(sale.id).slice(0, 8).toUpperCase()} ·{" "}
                        {new Date(sale.date).toLocaleDateString("id-ID")}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {(sale.items || []).map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="font-bold text-sm text-[#E05D43]">
                        Rp {(Number(sale.total) || 0).toLocaleString("id-ID")}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setViewingCustomerHistory(null);
                          handleReprintReceipt(sale);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Struk / WA
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt (with 1-Click WA Digital Receipt) */}
      {selectedSale && (
        <ThermalReceipt sale={selectedSale} settings={settings} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}