import { Receipt, TrendingUp, DollarSign, ShoppingBag, Download, Printer, Search, Filter } from "lucide-react";
import { Sale } from "../types";
import { useState } from "react";
import { ThermalReceipt } from "./thermal-receipt";

interface SalesHistoryProps {
  sales: Sale[];
}

export function SalesHistory({ sales }: SalesHistoryProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  
  // 🔥 NEW: Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "month" | "year">("all");
  
  // 🔥 NEW: Filter sales by search and period
  const filteredSales = sales.filter((sale) => {
    // Search by receipt number (transaction ID)
    const txnId = sale.id.slice(0, 8).toUpperCase();
    const matchesSearch = searchTerm === "" || 
      txnId.includes(searchTerm.toUpperCase()) ||
      sale.id.includes(searchTerm.toLowerCase());
    
    // Filter by time period
    const saleDate = new Date(sale.date);
    const now = new Date();
    let matchesPeriod = true;
    
    if (filterPeriod === "today") {
      matchesPeriod = saleDate.toDateString() === now.toDateString();
    } else if (filterPeriod === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = saleDate >= weekAgo;
    } else if (filterPeriod === "month") {
      matchesPeriod = saleDate.getMonth() === now.getMonth() && 
                      saleDate.getFullYear() === now.getFullYear();
    } else if (filterPeriod === "year") {
      matchesPeriod = saleDate.getFullYear() === now.getFullYear();
    }
    
    return matchesSearch && matchesPeriod;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalItems = filteredSales.reduce(
    (sum, sale) => sum + sale.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const today = new Date().toDateString();
  const todaySales = filteredSales.filter((sale) => new Date(sale.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

  const exportToCSV = () => {
    const csvHeader = "No Transaksi,Tanggal,Waktu,Tipe Harga,Item,Jumlah,Total\n";
    const csvContent = filteredSales
      .map((sale) => {
        const date = new Date(sale.date);
        const dateStr = date.toLocaleDateString("id-ID");
        const timeStr = date.toLocaleTimeString("id-ID");
        const txnId = sale.id.slice(0, 8).toUpperCase();
        const priceType = sale.priceType === "retail" ? "Eceran" : "Grosir";
        const items = sale.items.map(item => `${item.name} (x${item.quantity})`).join("; ");
        const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return `${txnId},${dateStr},${timeStr},${priceType},"${items}",${totalQty},${sale.total}`;
      })
      .join("\n");

    const blob = new Blob([csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan-penjualan-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReprintReceipt = (sale: Sale) => {
    // Convert Sale to receipt format
    const receiptSale = {
      id: sale.id,
      total: sale.total,
      payment_type: (sale.priceType === "retail" ? "retail" : "wholesale") as "retail" | "wholesale",
      payment_amount: sale.payment_amount,
      created_at: sale.date,
      items: sale.items.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        price: item.appliedPrice,
        total: item.appliedPrice * item.quantity
      }))
    };
    
    setSelectedSale(receiptSale);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Riwayat Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Track your sales and revenue</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          Export Laporan
        </button>
      </div>

      {/* 🔥 NEW: Search & Filter Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Search Box */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari No. Transaksi (contoh: INV-20260227-00001)"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 font-medium">Filter:</span>
          <button
            onClick={() => setFilterPeriod("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterPeriod === "all"
                ? "bg-[#E05D43] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterPeriod("today")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterPeriod === "today"
                ? "bg-[#E05D43] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setFilterPeriod("week")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterPeriod === "week"
                ? "bg-[#E05D43] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Minggu Ini
          </button>
          <button
            onClick={() => setFilterPeriod("month")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterPeriod === "month"
                ? "bg-[#E05D43] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setFilterPeriod("year")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterPeriod === "year"
                ? "bg-[#E05D43] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tahun Ini
          </button>
        </div>

        {/* Results Counter */}
        <div className="text-sm text-gray-600">
          Menampilkan <span className="font-bold text-gray-900">{filteredSales.length}</span> dari {sales.length} transaksi
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">Rp {totalRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm font-semibold text-green-800">Today's Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-900">Rp {todayRevenue.toLocaleString()}</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-800">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{filteredSales.length}</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">Items Sold</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{totalItems}</p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  No Transaksi
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tipe Harga
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                  Aksi
                </th>
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
                filteredSales
                  .slice()
                  .reverse()
                  .map((sale) => {
                    const totalQty = sale.items.reduce((sum, item) => sum + item.quantity, 0);
                    const txnId = sale.id.slice(0, 8).toUpperCase();
                    return (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleReprintReceipt(sale)}
                            className="font-mono font-semibold text-[#E05D43] hover:text-[#C54D33] hover:underline cursor-pointer"
                          >
                            {txnId}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(sale.date).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            sale.priceType === "retail" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {sale.priceType === "retail" ? "Eceran" : "Grosir"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {sale.items.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-700">
                                {item.name} (x{item.quantity})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm font-medium">
                            {totalQty} items
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          Rp {sale.total.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleReprintReceipt(sale)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Cetak Ulang Nota"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt */}
      {selectedSale && (
        <ThermalReceipt sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}