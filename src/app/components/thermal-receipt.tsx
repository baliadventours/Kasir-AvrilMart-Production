import { useState } from "react";
import { X, Printer, MessageCircle, Copy, Check } from "lucide-react";
import { AppSettings } from "../types";
import { toTitleCase } from "../../utils/helpers";
import { toast } from "sonner";

interface ThermalReceiptProps {
  sale: {
    id: string;
    total: number;
    payment_type: "retail" | "wholesale";
    created_at: string;
    payment_amount?: number;
    receipt_number?: string;
    payment_method?: "cash" | "credit_card" | "debit_card" | "qris" | "transfer";
    customer_name?: string;
    customer_phone?: string;
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

function formatWhatsAppPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("8")) return "62" + digits;
  return digits;
}

export function ThermalReceipt({
  sale,
  settings,
  onClose,
}: ThermalReceiptProps) {
  const activeSettings = settings || DEFAULT_SETTINGS;
  const [waPhone, setWaPhone] = useState(sale.customer_phone || "");
  const [copied, setCopied] = useState(false);

  const subtotal = sale.items.reduce((sum, item) => sum + item.total, 0);
  const tax = activeSettings.tax_enabled ? subtotal * (activeSettings.tax_percentage / 100) : 0;
  const total = subtotal + tax;

  const paymentMethod = sale.payment_method || activeSettings.default_payment_method;
  const receiptNo = sale.receipt_number || sale.id.slice(0, 8).toUpperCase();

  const buildWhatsAppText = () => {
    const dateStr = new Date(sale.created_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = new Date(sale.created_at).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const lines: string[] = [
      `*${activeSettings.store_name}*`,
      `${activeSettings.store_address}`,
      `Telp: ${activeSettings.store_phone}`,
      `--------------------------------`,
      `No. Nota : *#${receiptNo}*`,
      `Tanggal  : ${dateStr}, ${timeStr}`,
      `Tipe     : ${sale.payment_type === "retail" ? "Eceran" : "Grosir"}`,
      `Metode   : ${PAYMENT_METHOD_LABELS[paymentMethod] || "Tunai"}`,
    ];

    if (sale.customer_name) {
      lines.push(`Pelanggan: *${sale.customer_name}*`);
    }

    lines.push(`--------------------------------`);
    sale.items.forEach((item) => {
      lines.push(`*${toTitleCase(item.product_name)}*`);
      lines.push(`  ${item.quantity} x Rp ${item.price.toLocaleString("id-ID")} = Rp ${item.total.toLocaleString("id-ID")}`);
    });
    lines.push(`--------------------------------`);

    if (activeSettings.tax_enabled) {
      lines.push(`Subtotal : Rp ${subtotal.toLocaleString("id-ID")}`);
      lines.push(`Pajak (${activeSettings.tax_percentage}%): Rp ${tax.toLocaleString("id-ID")}`);
    }
    lines.push(`*TOTAL    : Rp ${total.toLocaleString("id-ID")}*`);

    if (sale.payment_amount && sale.payment_amount > 0) {
      lines.push(`Bayar    : Rp ${sale.payment_amount.toLocaleString("id-ID")}`);
      lines.push(`Kembali  : Rp ${Math.max(0, sale.payment_amount - total).toLocaleString("id-ID")}`);
    }

    lines.push(`--------------------------------`);
    lines.push(`_${activeSettings.receipt_footer || "Terima kasih sudah berbelanja!"}_`);
    return lines.join("\n");
  };

  const formattedPhone = formatWhatsAppPhone(waPhone);
  const waTextEncoded = encodeURIComponent(buildWhatsAppText());
  const waHref = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${waTextEncoded}`
    : `https://wa.me/?text=${waTextEncoded}`;

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsAppText());
      setCopied(true);
      toast.success("Teks struk berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin teks struk");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Overlay - Hidden when printing */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto print:hidden">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-gray-100">
          {/* Header (pinned at top) */}
          <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Struk Pembayaran</h2>
              <p className="text-xs text-gray-400">Pratinjau struk thermal 80mm & Struk Digital WA</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Preview of thermal receipt (scrollable middle) */}
          <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 bg-gray-50">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              {/* Store Header */}
              <div className="text-center space-y-1 mb-4 pb-3 border-b border-dashed border-gray-300">
                {/* Logo */}
                {activeSettings.logo_url && (
                  <div className="flex justify-center mb-2">
                    <img 
                      src={activeSettings.logo_url} 
                      alt="Logo" 
                      className="h-14 w-auto object-contain"
                    />
                  </div>
                )}
                <div className="font-bold text-base text-gray-900">{activeSettings.store_name}</div>
                <div className="text-xs text-gray-600">{activeSettings.store_address}</div>
                <div className="text-xs text-gray-500">Telp: {activeSettings.store_phone}</div>
                {/* Header Message */}
                {activeSettings.receipt_header && (
                  <div className="text-xs text-gray-600 italic mt-1.5">{activeSettings.receipt_header}</div>
                )}
              </div>

              {/* Transaction Info */}
              <div className="text-xs space-y-1 mb-4 pb-3 border-b border-dashed border-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tanggal</span>
                  <span className="font-medium text-gray-900">
                    {new Date(sale.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Waktu</span>
                  <span className="font-medium text-gray-900">
                    {new Date(sale.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">No. Transaksi</span>
                  <span className="font-medium text-gray-900">{receiptNo}</span>
                </div>
                {sale.customer_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pelanggan</span>
                    <span className="font-semibold text-gray-900">{sale.customer_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipe</span>
                  <span className="font-medium text-gray-900">{sale.payment_type === "retail" ? "Eceran" : "Grosir"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pembayaran</span>
                  <span className="font-medium text-gray-900">{PAYMENT_METHOD_LABELS[paymentMethod]}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3 mb-4 pb-3 border-b border-dashed border-gray-300">
                {sale.items.map((item, index) => (
                  <div key={index} className="text-xs">
                    <div className="font-semibold text-gray-900">{toTitleCase(item.product_name)}</div>
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
              <div className="space-y-1.5">
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
                  <span className="text-[#E05D43]">Rp {total.toLocaleString("id-ID")}</span>
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

              {/* Footer Message */}
              {activeSettings.receipt_footer && (
                <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t border-dashed border-gray-300 italic">
                  {activeSettings.receipt_footer}
                </div>
              )}
            </div>
          </div>

          {/* 1-Click Digital WhatsApp Receipt Bar */}
          <div className="px-4 py-3 bg-emerald-50/70 border-t border-emerald-100 flex-shrink-0">
            <label className="block text-[11px] font-semibold text-emerald-800 mb-1.5">
              Kirim Struk Digital via WhatsApp (Tanpa Kertas)
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="No. WA (cth: 08123456789)"
                className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="px-2.5 py-2 bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                title="Salin Teks Struk"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 flex-shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Kirim WA
              </a>
            </div>
          </div>

          {/* Action buttons (pinned at bottom - always visible) */}
          <div className="flex gap-3 px-5 py-3.5 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors text-sm"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 px-4 py-2.5 bg-[#E05D43] text-white rounded-xl hover:bg-[#C54D33] flex items-center justify-center gap-2 font-semibold shadow-md shadow-orange-100 transition-all text-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Struk
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
                <div style={{ fontWeight: "bold" }}>{toTitleCase(item.product_name)}</div>
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