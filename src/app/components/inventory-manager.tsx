import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Package, AlertTriangle, Upload, Download, Search, Scan, Database, Trash, Camera, X } from "lucide-react";
import { supabase } from "../../services/supabase";
import { Product } from "../types";
import { CSVImport } from "./csv-import";
import { toast } from "sonner";
import { BarcodeScannerModal } from "./barcode-scanner-modal";
import { toTitleCase } from "../../utils/helpers";

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, "id">) => void;
  onUpdateProduct: (id: string, product: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onRefresh: () => void;
}

export function InventoryManager({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRefresh,
}: InventoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const handleCameraScan = (code: string) => {
    setIsScannerOpen(false);
    if (code) {
      setFormData((prev) => ({ ...prev, barcode: code }));
      toast.success(`Barcode berhasil dipindai: ${code}`);
    }
  };
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  const [formData, setFormData] = useState({
    name: "",
    priceRetail: "",
    priceWholesale: "",
    priceModal: "",
    stock: "",
    barcode: "",
    category: "",
  });

  const [dbCategories, setDbCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase.from("categories").select("name");
        if (!error && data) {
          setDbCategories(data.map((c) => c.name));
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Get unique categories from existing products and database
  const existingCategories = Array.from(new Set([
    ...products.map(p => p.category).filter(Boolean),
    ...dbCategories
  ])).sort();

  const resetForm = () => {
    setFormData({
      name: "",
      priceRetail: "",
      priceWholesale: "",
      priceModal: "",
      stock: "",
      barcode: "",
      category: "",
    });
    setEditingId(null);
    setShowForm(false);
    setIsAddingNewCategory(false);
    setNewCategoryName("");
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__add_new__") {
      setIsAddingNewCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setIsAddingNewCategory(false);
      setFormData({ ...formData, category: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if barcode is already registered on another product
    const trimmedBarcode = formData.barcode?.trim() || null;
    if (trimmedBarcode) {
      const barcodeExists = products.some(
        (p) =>
          p.barcode?.trim().toLowerCase() === trimmedBarcode.toLowerCase() &&
          (!editingId || p.id !== editingId)
      );
      if (barcodeExists) {
        toast.error("❌ Barcode sudah terdaftar!", {
          duration: 4000,
        });
        return;
      }
    }
    
    // Use newCategoryName if adding new category
    const finalCategory = isAddingNewCategory ? newCategoryName : formData.category;
    
    // Auto-generate SKU from category and timestamp
    const autoSKU = editingId 
      ? products.find(p => p.id === editingId)?.sku || `${finalCategory.substring(0, 3).toUpperCase()}-${Date.now()}`
      : `${finalCategory.substring(0, 3).toUpperCase()}-${Date.now()}`;
    
    const formattedName = toTitleCase(formData.name.trim());
    const productData = {
      name: formattedName,
      priceRetail: parseFloat(formData.priceRetail),
      priceWholesale: parseFloat(formData.priceWholesale),
      priceModal: parseFloat(formData.priceModal) || 0,
      stock: parseInt(formData.stock),
      sku: autoSKU,
      barcode: formData.barcode?.trim() || null,

      category: finalCategory,
      image: "",
    };

    try {
      if (editingId) {
        onUpdateProduct(editingId, productData);
        toast.success(`✅ Produk "${formattedName}" berhasil diupdate!`, {
          duration: 3000,
        });
      } else {
        onAddProduct(productData);
        toast.success(`✅ Produk "${formattedName}" berhasil ditambahkan!`, {
          duration: 3000,
        });
      }
      resetForm();
    } catch (error: any) {
      toast.error(`❌ Gagal ${editingId ? 'update' : 'tambah'} produk: ${error.message}`, {
        duration: 4000,
      });
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      priceRetail: (product.priceRetail || product.price_retail || 0).toString(),
      priceWholesale: (product.priceWholesale || product.price_wholesale || 0).toString(),
      priceModal: (product.priceModal || product.price_modal || 0).toString(),
      stock: product.stock.toString(),
      barcode: product.barcode || "",
      category: product.category,

    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const lowStockProducts = products.filter((p) => p.stock < 10);

  // Filter products based on search term
  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchLower)) ||
      product.category.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    handleSearchChange("");
    searchInputRef.current?.focus();
  };

  // Pagination helpers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
      try {
        await onDeleteProduct(productId);
        toast.success(`✅ Produk "${productName}" berhasil dihapus!`, {
          duration: 3000,
        });
      } catch (error: any) {
        toast.error(`❌ Gagal menghapus produk: ${error.message}`, {
          duration: 4000,
        });
      }
    }
  };

  const exportProductsToCSV = () => {
    try {
      const csvHeader = "name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock\n";
      const csvContent = products
        .map((product) => {
          return `"${product.name}",${product.sku},${product.barcode || ""},${product.category},${product.priceRetail},${product.priceWholesale},${product.priceModal || 0},${product.stock}`;
        })
        .join("\n");

      const blob = new Blob([csvHeader + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `data-produk-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`✅ Berhasil export ${products.length} produk ke CSV!`, {
        duration: 3000,
      });
    } catch (error: any) {
      toast.error(`❌ Gagal export CSV: ${error.message}`, {
        duration: 4000,
      });
    }
  };

  const handleBackupDatabase = () => {
    try {
      // Create comprehensive backup with metadata
      const backup = {
        metadata: {
          backup_date: new Date().toISOString(),
          app_name: "Avril Mart POS",
          version: "1.0",
          total_products: products.length,
          categories: existingCategories,
        },
        products: products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode?.trim() || null,

          category: product.category,
          priceRetail: product.priceRetail,
          priceWholesale: product.priceWholesale,
          priceModal: product.priceModal || 0,
          stock: product.stock,
          image: product.image,
        })),
      };

      const jsonString = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `avril-mart-backup-${timestamp}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`✅ Backup database berhasil! (${products.length} produk)`, {
        duration: 4000,
      });
    } catch (error: any) {
      toast.error(`❌ Gagal backup database: ${error.message}`, {
        duration: 4000,
      });
    }
  };

  const handleDeleteAll = async () => {
    if (deleteAllConfirmText !== "HAPUS SEMUA") {
      toast.error("❌ Ketik 'HAPUS SEMUA' untuk konfirmasi", {
        duration: 3000,
      });
      return;
    }

    try {
      let successCount = 0;
      let failedCount = 0;

      // Delete all products one by one
      for (const product of products) {
        try {
          await onDeleteProduct(product.id);
          successCount++;
        } catch (error) {
          failedCount++;
          console.error(`Failed to delete product ${product.id}:`, error);
        }
      }

      setShowDeleteAllModal(false);
      setDeleteAllConfirmText("");

      if (failedCount === 0) {
        toast.success(`✅ Berhasil menghapus ${successCount} produk!`, {
          duration: 4000,
        });
      } else {
        toast.warning(`⚠️ ${successCount} produk dihapus, ${failedCount} gagal`, {
          duration: 5000,
        });
      }

      onRefresh();
    } catch (error: any) {
      toast.error(`❌ Gagal menghapus produk: ${error.message}`, {
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="px-4 md:px-6 pt-2 md:pt-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-medium text-gray-900">Manajemen Inventori</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Kelola stok dan data produk</p>
          </div>
          {/* Desktop action buttons */}
          <div className="hidden md:flex gap-3">
            <button
              onClick={exportProductsToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] font-medium"
            >
              <Download className="w-5 h-5" />
              Export Produk
            </button>
            <button
              onClick={handleBackupDatabase}
              className="flex items-center gap-2 px-4 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] font-medium"
            >
              <Database className="w-5 h-5" />
              Backup Database
            </button>
            <button
              onClick={() => setShowCSVImport(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
            >
              <Plus className="w-5 h-5" />
              Tambah Produk
            </button>
          </div>
          {/* Mobile action buttons — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            <button
              onClick={exportProductsToCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#E05D43] text-white rounded-lg font-medium text-xs"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleBackupDatabase}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#E05D43] text-white rounded-lg font-medium text-xs"
            >
              <Database className="w-4 h-4" />
              Backup
            </button>
            <button
              onClick={() => setShowCSVImport(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 rounded-lg font-medium text-xs"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-xs"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 md:px-6">
        <div className="bg-white border-2 border-[#E05D43] rounded-lg p-3 md:p-4 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 md:w-5 h-4 md:h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Cari Produk (Nama, SKU, Barcode, atau Kategori)..."
                className="w-full pl-10 md:pl-12 pr-20 md:pr-28 py-2.5 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
              />
              <div className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1.5">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 md:px-2 md:py-1 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                    title="Hapus Pencarian (1-Click Clear)"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="p-1 text-[#E05D43] hover:bg-orange-50 rounded-md transition-all"
                  title="Scan Barcode via Kamera"
                >
                  <Scan className="w-4 md:w-5 h-4 md:h-5" />
                </button>
              </div>
            </div>
            {searchTerm && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#E05D43] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg">
                  <span className="font-medium text-sm">{filteredProducts.length} hasil</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 md:py-3 rounded-lg font-semibold text-xs md:text-sm transition-all border border-gray-300 active:scale-95 whitespace-nowrap"
                  title="Bersihkan pencarian (1-Click Clear)"
                >
                  <X className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              </div>
            )}
          </div>
          {searchTerm && filteredProducts.length === 0 && (
            <div className="mt-3 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
              <span>Tidak ada produk yang cocok dengan pencarian "{searchTerm}"</span>
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-3 py-1.5 bg-[#E05D43] text-white rounded-lg text-xs font-medium hover:bg-[#C54D33] transition-all flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Bersihkan Filter Pencarian</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="mx-4 md:mx-0 bg-yellow-50 border border-yellow-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-2 mb-1 md:mb-2">
            <AlertTriangle className="w-4 md:w-5 h-4 md:h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800 text-sm md:text-base">Low Stock Alert</h3>
          </div>
          <p className="text-xs md:text-sm text-yellow-700">
            {lowStockProducts.length} product(s) have low stock levels (less than 10 units)
          </p>
        </div>
      )}

      {/* Products — Desktop Table */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Harga Eceran
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Harga Grosir
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    <span className="text-xs text-gray-500 font-mono">SKU: {product.sku}</span>
                    {product.barcode && (
                      <span className="text-xs text-blue-600 font-mono flex items-center gap-1">
                        <Scan className="w-3 h-3" />
                        {product.barcode}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                    {product.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold text-blue-600">
                  Rp {(product.priceRetail || product.price_retail || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  Rp {(product.priceWholesale || product.price_wholesale || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      product.stock < 10
                        ? "bg-red-100 text-red-700"
                        : product.stock < 20
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {product.stock} units
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} dari {filteredProducts.length} produk
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                « Prev
              </button>
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                  className={`px-3 py-2 rounded-lg font-medium ${
                    page === currentPage 
                      ? 'bg-[#E05D43] text-white' 
                      : page === '...'
                      ? 'bg-transparent text-gray-400 cursor-default'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Next »
              </button>
            </div>
          </div>
        )}
        
        {/* Delete All Products - Danger Zone */}
        {products.length > 0 && (
          <div className="border-t border-gray-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Danger Zone</h3>
                  <p className="text-sm text-red-700">
                    Hapus semua produk dari database ({products.length} produk)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                <Trash className="w-5 h-5" />
                Hapus Semua Produk
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Products — Mobile Card List */}
      <div className="md:hidden px-4 space-y-2">
        {paginatedProducts.map((product) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-3 active:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">SKU: {product.sku}</p>
                {product.barcode && (
                  <p className="text-[11px] text-blue-600 font-mono flex items-center gap-0.5 mt-0.5">
                    <Scan className="w-3 h-3 flex-shrink-0" />
                    {product.barcode}
                  </p>
                )}
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] rounded-full font-medium flex-shrink-0">
                {product.category}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Eceran</p>
                  <p className="text-xs font-bold text-blue-600">Rp {(product.priceRetail || product.price_retail || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Grosir</p>
                  <p className="text-xs font-bold text-green-600">Rp {(product.priceWholesale || product.price_wholesale || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase">Stok</p>
                  <p className={`text-xs font-bold ${
                    product.stock < 10 ? "text-red-600" : product.stock < 20 ? "text-yellow-600" : "text-green-600"
                  }`}>{product.stock}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3">
            <span className="text-xs text-gray-500">
              {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="px-2 py-1.5 text-xs font-semibold text-[#E05D43]">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Mobile Danger Zone */}
        {products.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-xs text-red-700 font-medium">Hapus semua ({products.length})</p>
              </div>
              <button
                onClick={() => setShowDeleteAllModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium"
              >
                <Trash className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-2xl md:rounded-lg p-5 md:p-6 w-full md:max-w-md" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-red-900">Konfirmasi Hapus Semua</h2>
                <p className="text-sm text-red-700">Tindakan ini tidak dapat dibatalkan!</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 mb-2">
                ⚠️ Anda akan menghapus <strong>{products.length} produk</strong> secara permanen dari database.
              </p>
              <p className="text-sm text-red-700">
                Semua data produk, SKU, barcode, harga, dan stok akan hilang!
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                Ketik <span className="text-red-600 font-mono">HAPUS SEMUA</span> untuk konfirmasi:
              </label>
              <input
                type="text"
                value={deleteAllConfirmText}
                onChange={(e) => setDeleteAllConfirmText(e.target.value)}
                className="w-full px-3 py-3 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-base"
                placeholder="HAPUS SEMUA"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAllModal(false);
                  setDeleteAllConfirmText("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllConfirmText !== "HAPUS SEMUA"}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal — full-screen sheet on mobile */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
          <div
            className="bg-white w-full md:max-w-md md:rounded-lg rounded-t-2xl flex flex-col"
            style={{ maxHeight: "95dvh" }}
          >
            {/* Sticky header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? "Edit Produk" : "Tambah Produk Baru"}
              </h2>
              <button
                type="button"
                onClick={resetForm}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Scrollable form body */}
            <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Kategori</label>
                {!isAddingNewCategory ? (
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent appearance-none"
                  >
                    <option value="">Pilih Kategori</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">+ Tambah Kategori Baru</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                      placeholder="Nama kategori baru"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false);
                        setNewCategoryName("");
                      }}
                      className="text-xs text-[#E05D43] font-medium"
                    >
                      ← Kembali ke pilihan kategori
                    </button>
                  </div>
                )}
              </div>

              {/* Price row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Harga Eceran</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="500"
                      required
                      value={formData.priceRetail}
                      onChange={(e) => setFormData({ ...formData, priceRetail: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Harga Grosir</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="500"
                      required
                      value={formData.priceWholesale}
                      onChange={(e) => setFormData({ ...formData, priceWholesale: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Modal price & stock row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Harga Modal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      step="500"
                      value={formData.priceModal}
                      onChange={(e) => setFormData({ ...formData, priceModal: e.target.value })}
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                      placeholder="Opsional"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Stok</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Barcode <span className="font-normal text-gray-400">(opsional)</span></label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                    placeholder="Scan atau ketik barcode"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#E05D43] hover:bg-orange-50 rounded-xl transition-all active:scale-95"
                    title="Scan Barcode via Kamera"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Spacer for sticky footer */}
              <div className="h-2" />
            </form>

            {/* Sticky footer buttons */}
            <div
              className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-white flex-shrink-0"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
            >
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 px-4 py-3.5 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium text-gray-700"
              >
                Batal
              </button>
              <button
                type="submit"
                form="product-form"
                className="flex-1 px-4 py-3.5 bg-[#E05D43] text-white rounded-xl hover:bg-[#C54D33] font-semibold shadow-sm"
              >
                {editingId ? "Simpan Perubahan" : "Tambah Produk"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCSVImport && (
        <CSVImport
          onClose={() => setShowCSVImport(false)}
          onSuccess={() => {
            setShowCSVImport(false);
            onRefresh();
          }}
        />
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScan}
        title="Scan Barcode Produk ke Formulir"
      />
    </div>
  );
}