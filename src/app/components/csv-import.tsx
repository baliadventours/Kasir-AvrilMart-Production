import { useState } from "react";
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import { productsAPI } from "../../services/supabase";
import { toast } from "sonner";

interface CSVImportProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductCSVRow {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  retail_price: string | number;
  wholesale_price: string | number;
  modal_price?: string | number;
  stock: string | number;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: ProductCSVRow[];
}

export function CSVImport({ onClose, onSuccess }: CSVImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductCSVRow[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const downloadTemplate = () => {
    const template = `name,sku,barcode,category,retail_price,wholesale_price,modal_price,stock
Wireless Headphones,WH-001,,Electronics,150000,120000,100000,50
Smart Watch,SW-002,,Electronics,500000,450000,400000,30
Coffee Mug,CM-003,,Kitchenware,50000,40000,30000,100`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateRow = (row: any, index: number): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Required fields
    if (!row.name || row.name.trim() === "") {
      errors.push(`Row ${index + 2}: Nama produk wajib diisi`);
    }
    if (!row.sku || row.sku.trim() === "") {
      errors.push(`Row ${index + 2}: SKU wajib diisi`);
    }
    if (!row.category || row.category.trim() === "") {
      errors.push(`Row ${index + 2}: Kategori wajib diisi`);
    }

    // Price validation
    const retailPrice = parseFloat(row.retail_price);
    const wholesalePrice = parseFloat(row.wholesale_price);
    const modalPrice = row.modal_price ? parseFloat(row.modal_price) : null;
    
    if (isNaN(retailPrice) || retailPrice <= 0) {
      errors.push(`Row ${index + 2}: Harga eceran harus angka positif`);
    }
    if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
      errors.push(`Row ${index + 2}: Harga grosir harus angka positif`);
    }
    if (modalPrice !== null && (isNaN(modalPrice) || modalPrice <= 0)) {
      errors.push(`Row ${index + 2}: Harga modal harus angka positif`);
    }

    // Stock validation
    const stock = parseInt(row.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push(`Row ${index + 2}: Stok harus angka positif atau 0`);
    }

    return { valid: errors.length === 0, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ProductCSVRow[];
        const allErrors: string[] = [];
        let isValid = true;

        // Validate each row
        data.forEach((row, index) => {
          const { valid, errors } = validateRow(row, index);
          if (!valid) {
            isValid = false;
            allErrors.push(...errors);
          }
        });

        setValidation({
          valid: isValid,
          errors: allErrors,
          data: data,
        });

        // Show preview (first 5 rows)
        setPreview(data.slice(0, 5));
      },
      error: (error) => {
        setValidation({
          valid: false,
          errors: [`Error parsing CSV: ${error.message}`],
          data: [],
        });
      },
    });
  };

  const handleImport = async () => {
    if (!validation || !validation.valid || validation.data.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validation.data.length; i++) {
      const row = validation.data[i];
      try {
        // Convert frontend field names to database field names
        // Database uses: price_retail, price_wholesale, price_modal
        // CSV uses: retail_price, wholesale_price, modal_price
        const productData: any = {
          name: row.name.trim(),
          sku: row.sku.trim(),
          barcode: row.barcode?.trim() || null,
          category: row.category.trim(),
          price_retail: parseFloat(row.retail_price.toString()),
          price_wholesale: parseFloat(row.wholesale_price.toString()),
          price_modal: row.modal_price ? parseFloat(row.modal_price.toString()) : null,
          stock: parseInt(row.stock.toString()),
        };
        
        // Debug: Log data being sent
        console.log(`Importing product ${i+1}/${validation.data.length}:`, productData);
        
        await productsAPI.create(productData);
        successCount++;
      } catch (error: any) {
        failedCount++;
        // Detailed error logging
        console.error(`Error importing row ${i + 2}:`, error);
        console.error('Error details:', {
          message: error.message,
          hint: error.hint,
          details: error.details,
          code: error.code,
          row: row
        });
        errors.push(`Row ${i + 2} (${row.name}): ${error.message || error.hint || 'Unknown error'}`);
      }
    }

    setImporting(false);
    setImportResult({
      success: successCount,
      failed: failedCount,
      errors: errors,
    });

    // Show toast notifications
    if (failedCount === 0 && successCount > 0) {
      toast.success(`✅ Berhasil mengimport ${successCount} produk!`, {
        duration: 4000,
      });
    } else if (successCount > 0 && failedCount > 0) {
      toast.warning(`⚠️ Import selesai: ${successCount} berhasil, ${failedCount} gagal`, {
        duration: 5000,
      });
    } else if (successCount === 0 && failedCount > 0) {
      toast.error(`❌ Import gagal: ${failedCount} produk tidak dapat diimport`, {
        duration: 5000,
      });
    }

    if (successCount > 0) {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Import Produk dari CSV</h2>

        {/* Template Download */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Format CSV yang Diperlukan
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                File CSV harus memiliki kolom: name, sku, barcode (optional), category, retail_price,
                wholesale_price, modal_price (optional), stock
              </p>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Download Template CSV
              </button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Upload File CSV</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
            >
              Klik untuk upload file CSV
            </label>
            <p className="text-sm text-gray-500 mt-1">atau drag & drop file disini</p>
            {file && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✓ File terpilih: {file.name}
              </p>
            )}
          </div>
        </div>

        {/* Validation Results */}
        {validation && (
          <div className="mb-6">
            {validation.valid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Validasi berhasil! {validation.data.length} produk siap diimport
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Validasi gagal! {validation.errors.length} error ditemukan
                  </span>
                </div>
                <ul className="text-sm text-red-600 ml-7 space-y-1 max-h-40 overflow-y-auto">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Preview (5 produk pertama):</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">SKU</th>
                    <th className="px-3 py-2 text-left">Barcode</th>
                    <th className="px-3 py-2 text-left">Kategori</th>
                    <th className="px-3 py-2 text-right">Harga Eceran</th>
                    <th className="px-3 py-2 text-right">Harga Grosir</th>
                    <th className="px-3 py-2 text-right">Harga Modal</th>
                    <th className="px-3 py-2 text-right">Stok</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.sku}</td>
                      <td className="px-3 py-2">{row.barcode}</td>
                      <td className="px-3 py-2">{row.category}</td>
                      <td className="px-3 py-2 text-right">
                        {parseFloat(row.retail_price.toString()).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {parseFloat(row.wholesale_price.toString()).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.modal_price ? parseFloat(row.modal_price.toString()).toLocaleString("id-ID") : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">{row.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validation && validation.data.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                ...dan {validation.data.length - 5} produk lainnya
              </p>
            )}
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="mb-6">
            <div
              className={`rounded-lg p-4 ${
                importResult.failed === 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <h3 className="font-semibold mb-2">Hasil Import:</h3>
              <p className="text-sm">
                ✓ Berhasil: {importResult.success} produk
                {importResult.failed > 0 && (
                  <>
                    <br />✗ Gagal: {importResult.failed} produk
                  </>
                )}
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-1">Error details:</p>
                  <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            {importResult ? "Tutup" : "Batal"}
          </button>
          {!importResult && (
            <button
              onClick={handleImport}
              disabled={!validation || !validation.valid || importing}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Import Produk"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}