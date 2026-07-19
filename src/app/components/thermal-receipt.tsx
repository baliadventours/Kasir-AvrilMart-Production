import { X, Printer } from "lucide-react";
import { AppSettings } from "../types";

interface ThermalReceiptProps {
  sale: {
    id: string;
    total: number;
    payment_type: "retail" | "wholesale";
    created_at: string;
    payment_amount?: number;
    receipt_number?: string;
    payment_method?: "cash" | "credit_card" | "debit_card" | "qris" | "transfer";
    items: Array<{
      product_name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
  };
  settings?: AppSettings | null;
  onClose: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  store_name: "AVRIL MART",
  store_address: "Kintamani - Bali",
  store_phone: "0812-3456-7890",
  logo_url: "",
  tax_enabled: false,
  tax_percentage: 10,
  receipt_header: "Terima kasih telah berbelanja!",
  receipt_footer: "Barang yang sudah dibeli tidak dapat dikembalikan",
  show_payment_amount: true,
  default_payment_method: "cash",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tunai",
  credit_card: "Kartu Kredit",
  debit_card: "Kartu Debit",
  qris: "QRIS",
  transfer: "Transfer Bank",
};

export function ThermalReceipt({
  sale,
  settings,
  onClose,
}: ThermalReceiptProps) {
  const activeSettings = settings || DEFAULT_SETTINGS;
  
  const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
  const tax = activeSettings.tax_enabled ? subtotal * (activeSettings.tax_percentage / 100) : 0;
  const total = subtotal + tax;
  
  const paymentMethod = sale.payment_method || activeSettings.default_payment_method;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Overlay - Hidden when printing */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-900">Struk Pembayaran</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview of thermal receipt */}
          <div className="border rounded-lg p-4 mb-4 bg-gray-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="text-center space-y-1 mb-4 pb-3 border-b border-dashed border-gray-400">
              {/* Logo */}
              {activeSettings.logo_url && (
                <div className="flex justify-center mb-2">
                  <img 
                    src={activeSettings.logo_url} 
                    alt="Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}
              <div className="font-bold text-base">{activeSettings.store_name}</div>
              <div className="text-xs">{activeSettings.store_address}</div>
              <div className="text-xs">Telp: {activeSettings.store_phone}</div>
              {/* Header Message */}
              {activeSettings.receipt_header && (
                <div className="text-xs text-gray-600 italic mt-2">{activeSettings.receipt_header}</div>
              )}
            </div>

            {/* Transaction Info */}
            <div className="text-xs space-y-1 mb-4 pb-3 border-b border-dashed border-gray-400">
              <div className="flex justify-between">
                <span className="text-gray-600">Tanggal</span>
                <span className="font-medium">
                  {new Date(sale.created_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Waktu</span>
                <span className="font-medium">
                  {new Date(sale.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No. Transaksi</span>
                <span className="font-medium">{sale.receipt_number || sale.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipe</span>
                <span className="font-medium">{sale.payment_type === "retail" ? "Eceran" : "Grosir"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pembayaran</span>
                <span className="font-medium">{PAYMENT_METHOD_LABELS[paymentMethod]}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3 mb-4 pb-3 border-b border-dashed border-gray-400">
              {sale.items.map((item, index) => (
                <div key={index} className="text-xs">
                  <div className="font-semibold text-gray-900">{item.product_name}</div>
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>
                      {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                    </span>
                    <span className="font-medium text-gray-900">Rp {item.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {activeSettings.tax_enabled && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Pajak ({activeSettings.tax_percentage}%)</span>
                  <span className="font-medium">Rp {tax.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-300">
                <span>TOTAL</span>
                <span>Rp {total.toLocaleString("id-ID")}</span>
              </div>
              
              {/* Payment Info */}
              {sale.payment_amount && sale.payment_amount > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-600 pt-2 border-t border-dashed border-gray-300">
                    <span>Bayar</span>
                    <span className="font-medium">Rp {sale.payment_amount.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Kembalian</span>
                    <span className="font-medium">Rp {(sale.payment_amount - total).toLocaleString("id-ID")}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600 mt-4 pt-3 border-t border-dashed border-gray-400">
              {activeSettings.receipt_footer && (
                <div className="italic mb-2">
                  {activeSettings.receipt_footer}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Cetak
            </button>
          </div>
        </div>
      </div>

      {/* Thermal Receipt - Only visible when printing */}
      <div className="hidden print:block print:absolute print:inset-0 print:bg-white">
        <style>
          {`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              body * {
                visibility: hidden;
              }
              .print-receipt, .print-receipt * {
                visibility: visible;
              }
              .print-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
              }
            }
          `}
        </style>

        <div
          className="print-receipt"
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            padding: "10mm 5mm",
            margin: "0 auto",
          }}
        >
          {/* Store Header */}
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", fontSize: "16px" }}>{activeSettings.store_name}</div>
            <div style={{ fontSize: "11px", marginTop: "3px" }}>{activeSettings.store_address}</div>
            <div style={{ fontSize: "11px" }}>Telp: {activeSettings.store_phone}</div>
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: "1px dashed #000",
              margin: "10px 0",
            }}
          />

          {/* Transaction Info */}
          <div style={{ fontSize: "11px", marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tanggal</span>
              <span>
                {new Date(sale.created_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Waktu</span>
              <span>
                {new Date(sale.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>No. Transaksi</span>
              <span>{sale.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tipe</span>
              <span>{sale.payment_type === "retail" ? "Eceran" : "Grosir"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pembayaran</span>
              <span>{PAYMENT_METHOD_LABELS[paymentMethod]}</span>
            </div>
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: "1px dashed #000",
              margin: "10px 0",
            }}
          />

          {/* Items */}
          <div style={{ marginBottom: "10px" }}>
            {sale.items.map((item, index) => (
              <div key={index} style={{ marginBottom: "8px" }}>
                <div style={{ fontWeight: "bold" }}>{item.product_name}</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                  }}
                >
                  <span>
                    {item.quantity} x Rp {item.price.toLocaleString("id-ID")}
                  </span>
                  <span>Rp {item.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: "1px dashed #000",
              margin: "10px 0",
            }}
          />

          {/* Totals */}
          <div style={{ fontSize: "11px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}
            >
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            {activeSettings.tax_enabled && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span>Pajak ({activeSettings.tax_percentage}%)</span>
                <span>Rp {tax.toLocaleString("id-ID")}</span>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: "bold",
                fontSize: "14px",
                marginTop: "8px",
              }}
            >
              <span>TOTAL</span>
              <span>Rp {total.toLocaleString("id-ID")}</span>
            </div>
            
            {/* Payment Info */}
            {sale.payment_amount && sale.payment_amount > 0 && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "8px",
                  }}
                >
                  <span>Bayar</span>
                  <span>Rp {sale.payment_amount.toLocaleString("id-ID")}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Kembalian</span>
                  <span>Rp {(sale.payment_amount - total).toLocaleString("id-ID")}</span>
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <div
            style={{
              borderTop: "1px dashed #000",
              margin: "10px 0",
            }}
          />

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: "11px",
              marginTop: "15px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              Terima kasih sudah berbelanja di Avril Mart
            </div>
            <div style={{ marginTop: "5px" }}>Barang yang sudah dibeli</div>
            <div>tidak dapat dikembalikan</div>
          </div>

          {/* Barcode placeholder - you can add actual barcode library if needed */}
          <div
            style={{
              textAlign: "center",
              marginTop: "15px",
              fontSize: "10px",
              letterSpacing: "2px",
            }}
          >
            {sale.id.slice(0, 12).toUpperCase()}
          </div>
        </div>
      </div>
    </>
  );
}