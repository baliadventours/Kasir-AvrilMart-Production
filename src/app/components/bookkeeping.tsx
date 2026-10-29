import { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  Receipt,
  Calculator,
  BookOpen,
  Plus,
  Trash2,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  DollarSign,
  Search,
  X,
  CreditCard,
} from "lucide-react";
import {
  Product,
  Sale,
  ExpenseRecord,
  CashierShift,
  ShiftCashEntry,
  DebtRecord,
  AppSettings,
} from "../types";
import { supabase } from "../../services/supabase";
import { toast } from "sonner";

interface BookkeepingProps {
  products: Product[];
  sales: Sale[];
  userName: string;
  userRole: "admin" | "cashier";
  settings?: AppSettings | null;
}

const STORAGE_KEY_EXPENSES = "avrilmart_expenses_v1";
const STORAGE_KEY_SHIFTS = "avrilmart_shifts_v1";
const STORAGE_KEY_DEBTS = "avrilmart_debts_v1";

const EXPENSE_CATEGORIES = [
  "Gaji & Upah Karyawan",
  "Listrik, Air & Internet",
  "Plastik & Kemasan",
  "Transport & Bensin",
  "Sewa Toko / Ruko",
  "Perawatan & Peralatan",
  "Konsumsi & Operasional Harian",
  "Lain-lain",
];

type PeriodFilter = "today" | "week" | "month" | "year" | "all";

export function Bookkeeping({
  products,
  sales,
  userName,
  userRole,
  settings,
}: BookkeepingProps) {
  const [activeTab, setActiveTab] = useState<"pnl" | "expenses" | "shifts" | "debts">(
    userRole === "cashier" ? "shifts" : "pnl"
  );
  const [period, setPeriod] = useState<PeriodFilter>("month");

  // =====================================================
  // PERSISTENT STATES (LocalStorage + Optional Supabase)
  // =====================================================
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [shifts, setShifts] = useState<CashierShift[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);

  // Expense Form State
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseMethod, setExpenseMethod] = useState<"cash" | "transfer" | "qris">("cash");
  const [expenseSearch, setExpenseSearch] = useState("");

  // Shift Form State
  const [startingCashInput, setStartingCashInput] = useState("");
  const [shiftNotesInput, setShiftNotesInput] = useState("");
  const [cashEntryType, setCashEntryType] = useState<"in" | "out">("out");
  const [cashEntryAmount, setCashEntryAmount] = useState("");
  const [cashEntryReason, setCashEntryReason] = useState("");
  const [actualClosingCashInput, setActualClosingCashInput] = useState("");
  const [closingNotesInput, setClosingNotesInput] = useState("");
  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState<CashierShift | null>(null);

  // Debt (Kasbon / Hutang) State
  const [debtFilterType, setDebtFilterType] = useState<"all" | "receivable" | "payable">("all");
  const [debtType, setDebtType] = useState<"receivable" | "payable">("receivable");
  const [debtPartyName, setDebtPartyName] = useState("");
  const [debtPhone, setDebtPhone] = useState("");
  const [debtRefNo, setDebtRefNo] = useState("");
  const [debtTotalAmount, setDebtTotalAmount] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  const [debtSearch, setDebtSearch] = useState("");
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentNoteInput, setPaymentNoteInput] = useState("");

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const rawExp = window.localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (rawExp) {
        const parsed = JSON.parse(rawExp);
        if (Array.isArray(parsed)) setExpenses(parsed);
      }
    } catch (e) {
      console.warn("Error loading expenses:", e);
    }

    try {
      const rawShifts = window.localStorage.getItem(STORAGE_KEY_SHIFTS);
      if (rawShifts) {
        const parsed = JSON.parse(rawShifts);
        if (Array.isArray(parsed)) setShifts(parsed);
      }
    } catch (e) {
      console.warn("Error loading shifts:", e);
    }

    try {
      const rawDebts = window.localStorage.getItem(STORAGE_KEY_DEBTS);
      if (rawDebts) {
        const parsed = JSON.parse(rawDebts);
        if (Array.isArray(parsed)) setDebts(parsed);
      }
    } catch (e) {
      console.warn("Error loading debts:", e);
    }
  }, []);

  const saveExpenses = (next: ExpenseRecord[]) => {
    setExpenses(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving expenses:", e);
    }
  };

  const saveShifts = (next: CashierShift[]) => {
    setShifts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving shifts:", e);
    }
  };

  const saveDebts = (next: DebtRecord[]) => {
    setDebts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_DEBTS, JSON.stringify(next));
    } catch (e) {
      console.warn("Error saving debts:", e);
    }
  };

  // =====================================================
  // PRODUCT COST (MODAL) LOOKUP MAP
  // =====================================================
  const productModalMap = useMemo(() => {
    const byId = new Map<string, number>();
    const bySku = new Map<string, number>();
    const byName = new Map<string, number>();

    products.forEach((p) => {
      const modal = Number(p.priceModal ?? p.price_modal ?? 0);
      if (p.id) byId.set(p.id, modal);
      if (p.sku) bySku.set(p.sku.toLowerCase(), modal);
      if (p.name) byName.set(p.name.toLowerCase(), modal);
    });

    return { byId, bySku, byName };
  }, [products]);

  const getItemModalPrice = (item: any): number => {
    if (!item) return 0;
    const directModal = Number(item.priceModal ?? item.price_modal ?? 0);
    if (directModal > 0) return directModal;
    if (item.id && productModalMap.byId.has(item.id)) {
      return productModalMap.byId.get(item.id) || 0;
    }
    if (item.sku && productModalMap.bySku.has(String(item.sku).toLowerCase())) {
      return productModalMap.bySku.get(String(item.sku).toLowerCase()) || 0;
    }
    if (item.name && productModalMap.byName.has(String(item.name).toLowerCase())) {
      return productModalMap.byName.get(String(item.name).toLowerCase()) || 0;
    }
    return 0;
  };

  // =====================================================
  // PERIOD FILTER HELPER
  // =====================================================
  const isDateInPeriod = (dateStr: string, p: PeriodFilter) => {
    if (p === "all") return true;
    const d = new Date(dateStr || Date.now());
    const now = new Date();

    if (p === "today") {
      return d.toDateString() === now.toDateString();
    }
    if (p === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    if (p === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (p === "year") {
      return d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // =====================================================
  // TAB 1: PROFIT & LOSS (LABA RUGI) CALCULATIONS
  // =====================================================
  const pnlData = useMemo(() => {
    const safeSales = (Array.isArray(sales) ? sales : []).filter(
      (s) => s && isDateInPeriod(s.date, period)
    );
    const safeExpenses = expenses.filter((e) => e && isDateInPeriod(e.date, period));

    let grossRevenue = 0;
    let retailRevenue = 0;
    let wholesaleRevenue = 0;
    let totalCOGS = 0;
    let totalUnitsSold = 0;

    const productStatsMap = new Map<
      string,
      {
        name: string;
        sku: string;
        qty: number;
        revenue: number;
        cogs: number;
        profit: number;
      }
    >();

    safeSales.forEach((sale) => {
      const saleTotal = Number(sale.total) || 0;
      grossRevenue += saleTotal;
      if (sale.priceType === "wholesale") {
        wholesaleRevenue += saleTotal;
      } else {
        retailRevenue += saleTotal;
      }

      const items = Array.isArray(sale.items) ? sale.items : [];
      items.forEach((item) => {
        const qty = Number(item?.quantity) || 0;
        const sellPrice =
          Number(item?.appliedPrice ?? item?.priceRetail ?? item?.price_retail ?? 0) || 0;
        const modalPrice = getItemModalPrice(item);

        const itemRev = sellPrice * qty;
        const itemCogs = modalPrice * qty;

        totalCOGS += itemCogs;
        totalUnitsSold += qty;

        const key = item?.sku || item?.name || "Produk";
        const existing = productStatsMap.get(key) || {
          name: item?.name || "Produk",
          sku: item?.sku || "-",
          qty: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
        existing.qty += qty;
        existing.revenue += itemRev;
        existing.cogs += itemCogs;
        existing.profit += itemRev - itemCogs;
        productStatsMap.set(key, existing);
      });
    });

    const grossProfit = grossRevenue - totalCOGS;
    const grossMarginPct = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    const totalExpenses = safeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = grossProfit - totalExpenses;
    const netMarginPct = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // Group expenses by category
    const expensesByCategory: Record<string, number> = {};
    safeExpenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + (Number(e.amount) || 0);
    });

    const topProfitProducts = Array.from(productStatsMap.values()).sort(
      (a, b) => b.profit - a.profit
    );

    return {
      salesCount: safeSales.length,
      totalUnitsSold,
      grossRevenue,
      retailRevenue,
      wholesaleRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPct,
      totalExpenses,
      netProfit,
      netMarginPct,
      expensesByCategory,
      topProfitProducts,
    };
  }, [sales, expenses, period, productModalMap]);

  const exportPnLToCSV = () => {
    const lines = [
      `LAPORAN LABA RUGI - ${settings?.store_name || "AVRIL MART"}`,
      `Periode,${period.toUpperCase()}`,
      `Tanggal Cetak,${new Date().toLocaleString("id-ID")}`,
      "",
      "RINGKASAN KEUANGAN,NILAI (RP)",
      `Total Transaksi,${pnlData.salesCount}`,
      `Penjualan Eceran,${pnlData.retailRevenue}`,
      `Penjualan Grosir,${pnlData.wholesaleRevenue}`,
      `Total Omzet Kotor (Gross Revenue),${pnlData.grossRevenue}`,
      `Total HPP / Modal Barang Terjual (COGS),${pnlData.totalCOGS}`,
      `Laba Kotor (Gross Profit),${pnlData.grossProfit}`,
      `Margin Laba Kotor (%),${pnlData.grossMarginPct.toFixed(2)}%`,
      `Total Biaya Operasional,${pnlData.totalExpenses}`,
      `Laba Bersih Usaha (Net Profit),${pnlData.netProfit}`,
      "",
      "RINCIAN PROFITABILITAS PER PRODUK",
      "SKU,Nama Produk,Qty Terjual,Omzet (Rp),HPP Modal (Rp),Laba Kotor (Rp),Margin (%)",
      ...pnlData.topProfitProducts.map((p) => {
        const margin = p.revenue > 0 ? ((p.profit / p.revenue) * 100).toFixed(1) : "0.0";
        return `"${p.sku}","${p.name}",${p.qty},${p.revenue},${p.cogs},${p.profit},${margin}%`;
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-laba-rugi-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // =====================================================
  // TAB 2: EXPENSE HANDLERS
  // =====================================================
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expenseAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Masukkan nominal pengeluaran yang valid");
      return;
    }
    if (!expenseDescription.trim()) {
      toast.error("Masukkan keterangan pengeluaran");
      return;
    }

    const newRecord: ExpenseRecord = {
      id: `exp_${Date.now()}`,
      date: new Date(expenseDate || Date.now()).toISOString(),
      category: expenseCategory,
      description: expenseDescription.trim(),
      amount: amountNum,
      payment_method: expenseMethod,
      user_name: userName || "Admin",
    };

    saveExpenses([newRecord, ...expenses]);
    setExpenseDescription("");
    setExpenseAmount("");
    toast.success("Pengeluaran operasional berhasil dicatat");
  };

  const handleDeleteExpense = (id: string) => {
    saveExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Catatan pengeluaran dihapus");
  };

  const filteredExpenses = useMemo(() => {
    const q = expenseSearch.trim().toLowerCase();
    return expenses.filter((e) => {
      if (!isDateInPeriod(e.date, period)) return false;
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.user_name.toLowerCase().includes(q)
      );
    });
  }, [expenses, period, expenseSearch]);

  // =====================================================
  // TAB 3: SHIFT KASIR & CASH DRAWER HANDLERS
  // =====================================================
  const activeShift = useMemo(() => shifts.find((s) => s.status === "open") || null, [shifts]);

  // Calculate live sales during activeShift
  const activeShiftSalesStats = useMemo(() => {
    if (!activeShift) return { count: 0, total: 0 };
    const openedTime = new Date(activeShift.opened_at).getTime();
    const matchingSales = (Array.isArray(sales) ? sales : []).filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= openedTime;
    });
    const total = matchingSales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    return { count: matchingSales.length, total };
  }, [activeShift, sales]);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeShift) {
      toast.error("Masih ada shift kasir yang sedang aktif!");
      return;
    }
    const startCash = Math.max(0, parseFloat(startingCashInput) || 0);
    const newShift: CashierShift = {
      id: `shift_${Date.now()}`,
      cashier_name: userName || "Kasir",
      opened_at: new Date().toISOString(),
      status: "open",
      starting_cash: startCash,
      cash_in: 0,
      cash_out: 0,
      cash_entries: [],
      sales_total: 0,
      sales_count: 0,
      expected_cash: startCash,
      notes: shiftNotesInput.trim(),
    };

    saveShifts([newShift, ...shifts]);
    setStartingCashInput("");
    setShiftNotesInput("");
    toast.success("Shift kasir berhasil dibuka!");
  };

  const handleAddShiftCashEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    const amt = parseFloat(cashEntryAmount);
    if (!amt || amt <= 0) {
      toast.error("Masukkan nominal kas yang valid");
      return;
    }
    if (!cashEntryReason.trim()) {
      toast.error("Masukkan alasan kas masuk/keluar");
      return;
    }

    const entry: ShiftCashEntry = {
      id: `ce_${Date.now()}`,
      time: new Date().toISOString(),
      type: cashEntryType,
      amount: amt,
      reason: cashEntryReason.trim(),
    };

    const nextShifts = shifts.map((s) => {
      if (s.id !== activeShift.id) return s;
      const nextIn = cashEntryType === "in" ? s.cash_in + amt : s.cash_in;
      const nextOut = cashEntryType === "out" ? s.cash_out + amt : s.cash_out;
      return {
        ...s,
        cash_in: nextIn,
        cash_out: nextOut,
        cash_entries: [entry, ...(s.cash_entries || [])],
      };
    });

    saveShifts(nextShifts);
    setCashEntryAmount("");
    setCashEntryReason("");
    toast.success(`Kas ${cashEntryType === "in" ? "Masuk" : "Keluar"} berhasil dicatat`);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (actualClosingCashInput === "" || isNaN(Number(actualClosingCashInput))) {
      toast.error("Masukkan jumlah uang fisik aktual yang dihitung di laci kasir");
      return;
    }

    const actualCash = Math.max(0, parseFloat(actualClosingCashInput) || 0);
    const expectedCash =
      activeShift.starting_cash +
      activeShiftSalesStats.total +
      activeShift.cash_in -
      activeShift.cash_out;
    const variance = actualCash - expectedCash;

    const closedShift: CashierShift = {
      ...activeShift,
      closed_at: new Date().toISOString(),
      status: "closed",
      sales_total: activeShiftSalesStats.total,
      sales_count: activeShiftSalesStats.count,
      expected_cash: expectedCash,
      actual_cash: actualCash,
      variance,
      notes: closingNotesInput.trim() || activeShift.notes,
    };

    const nextShifts = shifts.map((s) => (s.id === activeShift.id ? closedShift : s));
    saveShifts(nextShifts);
    setActualClosingCashInput("");
    setClosingNotesInput("");
    setSelectedShiftForPrint(closedShift);
    toast.success("Shift kasir berhasil ditutup!");
  };

  // =====================================================
  // TAB 4: DEBTS (PIUTANG PELANGGAN & HUTANG SUPPLIER)
  // =====================================================
  const handleAddDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmt = parseFloat(debtTotalAmount);
    if (!debtPartyName.trim()) {
      toast.error("Masukkan nama pelanggan atau supplier");
      return;
    }
    if (!totalAmt || totalAmt <= 0) {
      toast.error("Masukkan nominal piutang/hutang yang valid");
      return;
    }

    const newDebt: DebtRecord = {
      id: `debt_${Date.now()}`,
      type: debtType,
      party_name: debtPartyName.trim(),
      phone: debtPhone.trim() || undefined,
      reference_no: debtRefNo.trim() || undefined,
      created_at: new Date().toISOString(),
      due_date: debtDueDate || undefined,
      total_amount: totalAmt,
      paid_amount: 0,
      status: "unpaid",
      notes: debtNotes.trim() || undefined,
      payments: [],
    };

    saveDebts([newDebt, ...debts]);
    setDebtPartyName("");
    setDebtPhone("");
    setDebtRefNo("");
    setDebtTotalAmount("");
    setDebtDueDate("");
    setDebtNotes("");
    toast.success(
      `Catatan ${debtType === "receivable" ? "Kasbon Pelanggan" : "Hutang Supplier"} berhasil ditambahkan`
    );
  };

  const handleRecordDebtPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const payAmt = parseFloat(paymentAmountInput);
    if (!payAmt || payAmt <= 0) {
      toast.error("Masukkan nominal pembayaran yang valid");
      return;
    }

    const remaining = payingDebt.total_amount - payingDebt.paid_amount;
    const appliedAmt = Math.min(remaining, payAmt);
    const nextPaid = payingDebt.paid_amount + appliedAmt;
    const nextStatus: "unpaid" | "partial" | "paid" =
      nextPaid >= payingDebt.total_amount ? "paid" : nextPaid > 0 ? "partial" : "unpaid";

    const updatedDebts = debts.map((d) => {
      if (d.id !== payingDebt.id) return d;
      return {
        ...d,
        paid_amount: nextPaid,
        status: nextStatus,
        payments: [
          ...(d.payments || []),
          {
            id: `pay_${Date.now()}`,
            date: new Date().toISOString(),
            amount: appliedAmt,
            note: paymentNoteInput.trim() || undefined,
          },
        ],
      };
    });

    saveDebts(updatedDebts);
    setPayingDebt(null);
    setPaymentAmountInput("");
    setPaymentNoteInput("");
    toast.success(
      nextStatus === "paid" ? "Lunas! Pembayaran telah dicatat." : "Cicilan berhasil dicatat!"
    );
  };

  const handleDeleteDebt = (id: string) => {
    saveDebts(debts.filter((d) => d.id !== id));
    toast.success("Data berhasil dihapus");
  };

  const filteredDebts = useMemo(() => {
    const q = debtSearch.trim().toLowerCase();
    return debts.filter((d) => {
      if (debtFilterType !== "all" && d.type !== debtFilterType) return false;
      if (!q) return true;
      return (
        d.party_name.toLowerCase().includes(q) ||
        (d.reference_no && d.reference_no.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
      );
    });
  }, [debts, debtFilterType, debtSearch]);

  const debtSummary = useMemo(() => {
    let unpaidReceivable = 0;
    let unpaidPayable = 0;
    debts.forEach((d) => {
      const rem = Math.max(0, (Number(d.total_amount) || 0) - (Number(d.paid_amount) || 0));
      if (d.type === "receivable") unpaidReceivable += rem;
      else unpaidPayable += rem;
    });
    return { unpaidReceivable, unpaidPayable };
  }, [debts]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pembukuan & Kasir Shift</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Laporan Laba Rugi (HPP & Margin), Biaya Operasional, Rekap Shift Kasir, serta Buku Kasbon & Hutang
          </p>
        </div>

        {/* Global Period Selector for P&L and Expenses */}
        {(activeTab === "pnl" || activeTab === "expenses") && (
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-1 rounded-xl shadow-sm flex-wrap">
            {(
              [
                { id: "today", label: "Hari Ini" },
                { id: "week", label: "7 Hari" },
                { id: "month", label: "Bulan Ini" },
                { id: "year", label: "Tahun Ini" },
                { id: "all", label: "Semua" },
              ] as { id: PeriodFilter; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === item.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl p-1.5 grid grid-cols-2 lg:grid-cols-4 gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab("pnl")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "pnl"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Laba Rugi & HPP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "expenses"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Biaya Operasional</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("shifts")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "shifts"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Shift Kasir (Buka/Tutup)</span>
          {activeShift && (
            <span
              className={`w-2 h-2 rounded-full ${
                activeTab === "shifts" ? "bg-white" : "bg-emerald-500"
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("debts")}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "debts"
              ? "bg-[#E05D43] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kasbon & Hutang</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: LAPORAN LABA RUGI & ANALISIS HPP / MARGIN                  */}
      {/* ================================================================= */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Omzet Kotor (Penjualan)</div>
              <div className="text-xl font-bold text-gray-900 mt-1.5 tabular-nums">
                Rp {pnlData.grossRevenue.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                {pnlData.salesCount} transaksi · {pnlData.totalUnitsSold} item
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Total HPP (Modal Barang)</div>
              <div className="text-xl font-bold text-gray-700 mt-1.5 tabular-nums">
                Rp {pnlData.totalCOGS.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">
                Berdasarkan Harga Modal produk
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-emerald-700">Laba Kotor (Gross Profit)</div>
              <div className="text-xl font-bold text-emerald-700 mt-1.5 tabular-nums">
                Rp {pnlData.grossProfit.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Margin Kotor: {pnlData.grossMarginPct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-amber-700">Biaya Operasional</div>
              <div className="text-xl font-bold text-amber-700 mt-1.5 tabular-nums">
                Rp {pnlData.totalExpenses.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-amber-600 mt-1">
                Total pengeluaran periode ini
              </div>
            </div>

            <div
              className={`border rounded-xl p-4 shadow-sm ${
                pnlData.netProfit >= 0
                  ? "bg-emerald-950 text-white border-emerald-900"
                  : "bg-red-950 text-white border-red-900"
              }`}
            >
              <div className="text-xs font-medium text-white/80">Laba Bersih (Net Profit)</div>
              <div className="text-xl font-extrabold mt-1.5 tabular-nums">
                {pnlData.netProfit < 0 ? "-" : ""}Rp{" "}
                {Math.abs(pnlData.netProfit).toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-white/75 mt-1">
                Net Margin: {pnlData.netMarginPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Accounting Statement & Product Margin Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Structured Profit & Loss Statement */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Ringkasan Pembukuan Laba Rugi
                    </h2>
                    <p className="text-xs text-gray-500">Perhitungan otomatis Omzet, HPP, & Beban</p>
                  </div>
                  <button
                    type="button"
                    onClick={exportPnLToCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="font-semibold text-xs uppercase tracking-wider text-gray-400">
                    1. Pendapatan Penjualan
                  </div>
                  <div className="flex justify-between text-gray-700 pl-3">
                    <span>Penjualan Eceran (Retail)</span>
                    <span className="font-medium tabular-nums">
                      Rp {pnlData.retailRevenue.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700 pl-3">
                    <span>Penjualan Grosir (Wholesale)</span>
                    <span className="font-medium tabular-nums">
                      Rp {pnlData.wholesaleRevenue.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
                    <span>Total Pendapatan Kotor</span>
                    <span className="tabular-nums">
                      Rp {pnlData.grossRevenue.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="font-semibold text-xs uppercase tracking-wider text-gray-400 pt-2">
                    2. Harga Pokok Penjualan (HPP)
                  </div>
                  <div className="flex justify-between text-red-600 pl-3">
                    <span>(-) HPP / Modal Barang Terjual</span>
                    <span className="font-medium tabular-nums">
                      (Rp {pnlData.totalCOGS.toLocaleString("id-ID")})
                    </span>
                  </div>

                  <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50/70 px-3 py-2 rounded-lg">
                    <span>Laba Kotor (Gross Profit)</span>
                    <span className="tabular-nums">
                      Rp {pnlData.grossProfit.toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="font-semibold text-xs uppercase tracking-wider text-gray-400 pt-2">
                    3. Beban & Biaya Operasional
                  </div>
                  {Object.keys(pnlData.expensesByCategory).length === 0 ? (
                    <div className="text-xs text-gray-400 pl-3 italic">
                      Belum ada biaya operasional dicatat pada periode ini
                    </div>
                  ) : (
                    Object.entries(pnlData.expensesByCategory).map(([cat, amt]) => (
                      <div key={cat} className="flex justify-between text-gray-700 pl-3 text-xs">
                        <span>(-) {cat}</span>
                        <span className="tabular-nums text-red-600">
                          (Rp {amt.toLocaleString("id-ID")})
                        </span>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between font-semibold text-red-600 border-t border-gray-100 pt-2">
                    <span>Total Biaya Operasional</span>
                    <span className="tabular-nums">
                      (Rp {pnlData.totalExpenses.toLocaleString("id-ID")})
                    </span>
                  </div>

                  <div className="flex justify-between font-extrabold text-base text-gray-900 bg-gray-100 px-3.5 py-3 rounded-xl mt-3">
                    <span>LABA BERSIH USAHA</span>
                    <span
                      className={`tabular-nums ${
                        pnlData.netProfit >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {pnlData.netProfit < 0 ? "-" : ""}Rp{" "}
                      {Math.abs(pnlData.netProfit).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Profitability Breakdown per Product */}
            <div className="lg:col-span-7 bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Kontribusi Laba & Margin per Produk
                </h2>
                <p className="text-xs text-gray-500">
                  Menampilkan produk terjual beserta perbandingan Omzet, HPP Modal, dan Laba Kotor
                </p>
              </div>

              <div className="overflow-x-auto max-h-[440px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Produk</th>
                      <th className="py-2.5 px-2 text-center">Terjual</th>
                      <th className="py-2.5 px-3 text-right">Omzet</th>
                      <th className="py-2.5 px-3 text-right">HPP Modal</th>
                      <th className="py-2.5 px-3 text-right">Laba Kotor</th>
                      <th className="py-2.5 px-2 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pnlData.topProfitProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          Belum ada data penjualan pada periode ini
                        </td>
                      </tr>
                    ) : (
                      pnlData.topProfitProducts.slice(0, 50).map((item, idx) => {
                        const margin =
                          item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">{item.sku}</div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-medium text-gray-700 tabular-nums">
                              {item.qty}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-700 tabular-nums text-xs sm:text-sm">
                              Rp {item.revenue.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500 tabular-nums text-xs sm:text-sm">
                              Rp {item.cogs.toLocaleString("id-ID")}
                            </td>
                            <td
                              className={`py-2.5 px-3 text-right font-bold tabular-nums text-xs sm:text-sm ${
                                item.profit >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              Rp {item.profit.toLocaleString("id-ID")}
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold text-xs tabular-nums text-gray-600">
                              {margin.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: BIAYA OPERASIONAL (EXPENSE TRACKER)                        */}
      {/* ================================================================= */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Catat Pengeluaran */}
          <form
            onSubmit={handleAddExpense}
            className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-fit"
          >
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#E05D43]" />
              Catat Biaya Operasional Baru
            </h2>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Kategori Biaya
              </label>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nominal Pengeluaran (Rp)
              </label>
              <input
                type="number"
                min={1}
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="Contoh: 150000"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={expenseMethod}
                onChange={(e) => setExpenseMethod(e.target.value as any)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              >
                <option value="cash">Tunai (Kas Toko)</option>
                <option value="transfer">Transfer Bank</option>
                <option value="qris">QRIS / E-Wallet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Keterangan / Rincian
              </label>
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Contoh: Beli kantong plastik kresek 10 pak"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              Simpan Pengeluaran
            </button>
          </form>

          {/* Daftar Riwayat Pengeluaran */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Riwayat Pengeluaran Operasional
                </h2>
                <p className="text-xs text-gray-500">
                  Total periode ini:{" "}
                  <strong className="text-red-600">
                    Rp{" "}
                    {filteredExpenses
                      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                      .toLocaleString("id-ID")}
                  </strong>
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Cari pengeluaran..."
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-3 text-left">Tanggal</th>
                    <th className="py-3 px-3 text-left">Kategori</th>
                    <th className="py-3 px-3 text-left">Keterangan</th>
                    <th className="py-3 px-3 text-center">Metode</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        Belum ada pengeluaran operasional yang dicatat
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 text-xs text-gray-600">
                          {new Date(exp.date).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold text-gray-800">
                          {exp.category}
                        </td>
                        <td className="py-3 px-3 text-gray-900">
                          {exp.description}
                          <div className="text-[11px] text-gray-400">Oleh: {exp.user_name}</div>
                        </td>
                        <td className="py-3 px-3 text-center text-xs uppercase text-gray-500">
                          {exp.payment_method}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-600 tabular-nums">
                          Rp {exp.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: SHIFT KASIR & LACI KAS (CASH DRAWER / Z-REPORT)            */}
      {/* ================================================================= */}
      {activeTab === "shifts" && (
        <div className="space-y-6">
          {!activeShift ? (
            /* Form Buka Shift */
            <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-xl mx-auto shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#FFF0EC] text-[#E05D43] flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Buka Shift Kasir Baru</h2>
                  <p className="text-xs text-gray-500">
                    Masukkan modal uang kembalian awal di laci kasir sebelum memulai shift
                  </p>
                </div>
              </div>

              <form onSubmit={handleOpenShift} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Modal Awal Laci Kasir (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={startingCashInput}
                    onChange={(e) => setStartingCashInput(e.target.value)}
                    placeholder="Contoh: 200000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Catatan Shift (Opsional)
                  </label>
                  <input
                    type="text"
                    value={shiftNotesInput}
                    onChange={(e) => setShiftNotesInput(e.target.value)}
                    placeholder="Contoh: Shift Pagi (08:00 - 15:00)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                >
                  Buka Shift Sekarang ({userName})
                </button>
              </form>
            </div>
          ) : (
            /* Dashboard Shift Aktif */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Status Shift & Mutasi Kas Laci */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <h2 className="text-base font-bold text-gray-900">
                        Shift Aktif — Kasir: {activeShift.cashier_name}
                      </h2>
                    </div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Dibuka: {new Date(activeShift.opened_at).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-[11px] text-gray-500">Modal Awal Laci</div>
                      <div className="text-sm font-bold text-gray-900 mt-0.5 tabular-nums">
                        Rp {activeShift.starting_cash.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <div className="text-[11px] text-emerald-700">
                        Penjualan Shift ({activeShiftSalesStats.count} nota)
                      </div>
                      <div className="text-sm font-bold text-emerald-700 mt-0.5 tabular-nums">
                        +Rp {activeShiftSalesStats.total.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-[11px] text-gray-500">Kas Masuk / Keluar</div>
                      <div className="text-xs font-bold mt-0.5 tabular-nums">
                        <span className="text-emerald-600">
                          +{activeShift.cash_in.toLocaleString("id-ID")}
                        </span>{" "}
                        /{" "}
                        <span className="text-red-600">
                          -{activeShift.cash_out.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#FFF0EC] border border-[#E05D43]/30 rounded-lg">
                      <div className="text-[11px] font-semibold text-[#E05D43]">
                        Uang Seharusnya di Laci
                      </div>
                      <div className="text-base font-extrabold text-[#E05D43] mt-0.5 tabular-nums">
                        Rp{" "}
                        {(
                          activeShift.starting_cash +
                          activeShiftSalesStats.total +
                          activeShift.cash_in -
                          activeShift.cash_out
                        ).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Kas Masuk / Kas Keluar Laci */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Catat Kas Masuk / Kas Keluar Laci Kasir
                  </h3>
                  <form
                    onSubmit={handleAddShiftCashEntry}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3"
                  >
                    <div className="sm:col-span-3">
                      <select
                        value={cashEntryType}
                        onChange={(e) => setCashEntryType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                      >
                        <option value="out">Kas Keluar (-)</option>
                        <option value="in">Kas Masuk (+)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min={1}
                        value={cashEntryAmount}
                        onChange={(e) => setCashEntryAmount(e.target.value)}
                        placeholder="Nominal (Rp)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm tabular-nums"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={cashEntryReason}
                        onChange={(e) => setCashEntryReason(e.target.value)}
                        placeholder="Alasan (misal: Beli galon / Tambah receh)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Simpan
                      </button>
                    </div>
                  </form>

                  {(activeShift.cash_entries || []).length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1.5">
                      {(activeShift.cash_entries || []).map((ce) => (
                        <div
                          key={ce.id}
                          className="flex items-center justify-between text-xs py-1 px-2 bg-gray-50 rounded"
                        >
                          <span>
                            <strong
                              className={ce.type === "in" ? "text-emerald-600" : "text-red-600"}
                            >
                              {ce.type === "in" ? "[KAS MASUK]" : "[KAS KELUAR]"}
                            </strong>{" "}
                            {ce.reason}
                          </span>
                          <span className="font-bold tabular-nums">
                            {ce.type === "in" ? "+" : "-"}Rp {ce.amount.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Form Tutup Shift */}
              <form
                onSubmit={handleCloseShift}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4 h-fit"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Tutup Shift & Hitung Uang Fisik
                </h3>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Total Uang Tunai Fisik di Laci Saat Ini (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={actualClosingCashInput}
                    onChange={(e) => setActualClosingCashInput(e.target.value)}
                    placeholder="Hitung & ketik total uang fisik..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                </div>

                {actualClosingCashInput !== "" && !isNaN(Number(actualClosingCashInput)) && (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
                    {(() => {
                      const expected =
                        activeShift.starting_cash +
                        activeShiftSalesStats.total +
                        activeShift.cash_in -
                        activeShift.cash_out;
                      const diff = parseFloat(actualClosingCashInput) - expected;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Seharusnya di Laci:</span>
                            <span className="font-semibold tabular-nums">
                              Rp {expected.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Selisih Kas:</span>
                            <span
                              className={
                                diff === 0
                                  ? "text-emerald-600"
                                  : diff > 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                              }
                            >
                              {diff === 0
                                ? "Pas (Rp 0)"
                                : `${diff > 0 ? "+" : "-"}Rp ${Math.abs(diff).toLocaleString(
                                    "id-ID"
                                  )}`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Catatan Penutupan Shift (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={closingNotesInput}
                    onChange={(e) => setClosingNotesInput(e.target.value)}
                    placeholder="Keterangan serah terima shift..."
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl font-semibold text-sm shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Tutup Shift & Cetak Z-Report
                </button>
              </form>
            </div>
          )}

          {/* Riwayat Shift Sebelumnya */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Riwayat Rekap Shift Kasir</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <tr>
                    <th className="py-3 px-3 text-left">Kasir & Waktu</th>
                    <th className="py-3 px-3 text-right">Modal Awal</th>
                    <th className="py-3 px-3 text-right">Penjualan Shift</th>
                    <th className="py-3 px-3 text-right">Seharusnya</th>
                    <th className="py-3 px-3 text-right">Uang Fisik</th>
                    <th className="py-3 px-3 text-right">Selisih</th>
                    <th className="py-3 px-3 text-center">Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shifts.filter((s) => s.status === "closed").length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Belum ada riwayat penutupan shift
                      </td>
                    </tr>
                  ) : (
                    shifts
                      .filter((s) => s.status === "closed")
                      .map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-gray-900">{s.cashier_name}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(s.opened_at).toLocaleString("id-ID")} —{" "}
                              {s.closed_at ? new Date(s.closed_at).toLocaleTimeString("id-ID") : "-"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            Rp {s.starting_cash.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-medium tabular-nums">
                            Rp {s.sales_total.toLocaleString("id-ID")} ({s.sales_count})
                          </td>
                          <td className="py-3 px-3 text-right font-semibold tabular-nums">
                            Rp {s.expected_cash.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-3 text-right font-bold tabular-nums">
                            Rp {(s.actual_cash ?? 0).toLocaleString("id-ID")}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold tabular-nums ${
                              (s.variance || 0) === 0
                                ? "text-emerald-600"
                                : (s.variance || 0) > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {(s.variance || 0) === 0
                              ? "Pas"
                              : `${(s.variance || 0) > 0 ? "+" : "-"}Rp ${Math.abs(
                                  s.variance || 0
                                ).toLocaleString("id-ID")}`}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedShiftForPrint(s)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: BUKU KASBON PELANGGAN & HUTANG SUPPLIER                    */}
      {/* ================================================================= */}
      {activeTab === "debts" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-gray-500">Total Sisa Kasbon / Piutang Pelanggan</div>
                <div className="text-xl font-bold text-amber-600 mt-1 tabular-nums">
                  Rp {debtSummary.unpaidReceivable.toLocaleString("id-ID")}
                </div>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-amber-500/40" />
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-xs text-gray-500">Total Sisa Hutang ke Supplier</div>
                <div className="text-xl font-bold text-red-600 mt-1 tabular-nums">
                  Rp {debtSummary.unpaidPayable.toLocaleString("id-ID")}
                </div>
              </div>
              <ArrowUpRight className="w-8 h-8 text-red-500/40" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Form Tambah Kasbon / Hutang */}
            <form
              onSubmit={handleAddDebt}
              className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm h-fit"
            >
              <h2 className="text-base font-semibold text-gray-900">
                Catat Kasbon / Hutang Baru
              </h2>

              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setDebtType("receivable")}
                  className={`py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    debtType === "receivable"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-gray-600"
                  }`}
                >
                  Kasbon Pelanggan
                </button>
                <button
                  type="button"
                  onClick={() => setDebtType("payable")}
                  className={`py-2 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    debtType === "payable" ? "bg-white text-red-700 shadow-sm" : "text-gray-600"
                  }`}
                >
                  Hutang Supplier
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {debtType === "receivable" ? "Nama Pelanggan" : "Nama Supplier / Agen"}
                </label>
                <input
                  type="text"
                  required
                  value={debtPartyName}
                  onChange={(e) => setDebtPartyName(e.target.value)}
                  placeholder={
                    debtType === "receivable"
                      ? "Contoh: Ibu Sari (Warung Sebelah)"
                      : "Contoh: Agen Sembako Makmur"
                  }
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    No. WA / Telepon
                  </label>
                  <input
                    type="text"
                    value={debtPhone}
                    onChange={(e) => setDebtPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    value={debtDueDate}
                    onChange={(e) => setDebtDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Total Nominal (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={debtTotalAmount}
                  onChange={(e) => setDebtTotalAmount(e.target.value)}
                  placeholder="Contoh: 350000"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  No. Nota / Keterangan Barang
                </label>
                <input
                  type="text"
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  placeholder="Contoh: Nota grosir rokok & minuman"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Simpan Catatan
              </button>
            </form>

            {/* Right: Daftar Kasbon & Hutang */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDebtFilterType("all")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      debtFilterType === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtFilterType("receivable")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      debtFilterType === "receivable"
                        ? "bg-white text-amber-700 shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    Kasbon Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDebtFilterType("payable")}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      debtFilterType === "payable"
                        ? "bg-white text-red-700 shadow-sm"
                        : "text-gray-600"
                    }`}
                  >
                    Hutang Supplier
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={debtSearch}
                    onChange={(e) => setDebtSearch(e.target.value)}
                    placeholder="Cari nama atau keterangan..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                    <tr>
                      <th className="py-3 px-3 text-left">Nama & Keterangan</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3 text-right">Sisa Belum Bayar</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDebts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-400">
                          Belum ada data kasbon atau hutang
                        </td>
                      </tr>
                    ) : (
                      filteredDebts.map((d) => {
                        const remaining = Math.max(0, d.total_amount - d.paid_amount);
                        return (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    d.type === "receivable"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {d.type === "receivable" ? "Piutang" : "Hutang"}
                                </span>
                                <span className="font-semibold text-gray-900">{d.party_name}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {d.notes || "-"}{" "}
                                {d.due_date
                                  ? `· Jatuh Tempo: ${new Date(d.due_date).toLocaleDateString(
                                      "id-ID"
                                    )}`
                                  : ""}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right text-gray-700 tabular-nums">
                              Rp {d.total_amount.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-gray-900 tabular-nums">
                              Rp {remaining.toLocaleString("id-ID")}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                  d.status === "paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : d.status === "partial"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {d.status === "paid"
                                  ? "Lunas"
                                  : d.status === "partial"
                                  ? "Dicicil"
                                  : "Belum Lunas"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {d.status !== "paid" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayingDebt(d);
                                      setPaymentAmountInput(String(remaining));
                                    }}
                                    className="px-2.5 py-1 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-md text-xs font-semibold cursor-pointer"
                                  >
                                    Bayar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDebt(d.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
          </div>
        </div>
      )}

      {/* Modal Cicilan / Pelunasan Kasbon & Hutang */}
      {payingDebt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Catat Pembayaran — {payingDebt.party_name}
              </h3>
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Tagihan:</span>
                <span className="font-semibold">
                  Rp {payingDebt.total_amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sudah Dibayar:</span>
                <span className="font-semibold text-emerald-600">
                  Rp {payingDebt.paid_amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                <span>Sisa Tagihan:</span>
                <span>
                  Rp {(payingDebt.total_amount - payingDebt.paid_amount).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <form onSubmit={handleRecordDebtPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nominal Pembayaran Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  min={1}
                  max={payingDebt.total_amount - payingDebt.paid_amount}
                  required
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-base font-bold tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Catatan Pembayaran (Opsional)
                </label>
                <input
                  type="text"
                  value={paymentNoteInput}
                  onChange={(e) => setPaymentNoteInput(e.target.value)}
                  placeholder="Contoh: Diterima tunai / transfer BCA"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Struk Z-Report Shift Kasir */}
      {selectedShiftForPrint && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-semibold text-gray-900">Struk Rekap Shift Kasir (Z-Report)</h3>
              <button
                type="button"
                onClick={() => setSelectedShiftForPrint(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono border border-dashed border-gray-300 rounded-xl p-4">
              <div className="text-center border-b border-dashed border-gray-300 pb-2">
                <div className="font-bold text-sm">{settings?.store_name || "AVRIL MART"}</div>
                <div>REKAP TUTUP SHIFT KASIR (Z-REPORT)</div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <strong>{selectedShiftForPrint.cashier_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Buka:</span>
                  <span>{new Date(selectedShiftForPrint.opened_at).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Tutup:</span>
                  <span>
                    {selectedShiftForPrint.closed_at
                      ? new Date(selectedShiftForPrint.closed_at).toLocaleString("id-ID")
                      : "-"}
                  </span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Modal Awal Laci:</span>
                  <span>Rp {selectedShiftForPrint.starting_cash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan ({selectedShiftForPrint.sales_count} transaksi):</span>
                  <span>+Rp {selectedShiftForPrint.sales_total.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kas Masuk:</span>
                  <span>+Rp {selectedShiftForPrint.cash_in.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Kas Keluar:</span>
                  <span>-Rp {selectedShiftForPrint.cash_out.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1">
                  <span>Uang Seharusnya:</span>
                  <span>Rp {selectedShiftForPrint.expected_cash.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Uang Fisik Aktual:</span>
                  <span>Rp {(selectedShiftForPrint.actual_cash ?? 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Selisih Kas:</span>
                  <span>
                    {(selectedShiftForPrint.variance || 0) >= 0 ? "+" : "-"}Rp{" "}
                    {Math.abs(selectedShiftForPrint.variance || 0).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedShiftForPrint(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#E05D43] hover:bg-[#C54D33] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak Z-Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
