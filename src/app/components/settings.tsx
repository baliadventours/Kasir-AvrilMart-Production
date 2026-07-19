import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Store, Image, Receipt, DollarSign, CreditCard, Save, Upload, X } from "lucide-react";
import { AppSettings } from "../types";
import { toast } from "sonner";

interface SettingsProps {
  settings: AppSettings | null;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  store_name: "Avril Mart",
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

export function Settings({ settings, onUpdateSettings }: SettingsProps) {
  const [formData, setFormData] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  useEffect(() => {
    if (settings) {
      setFormData(settings);
      if (settings.logo_url) {
        setLogoPreview(settings.logo_url);
      }
    }
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("❌ Ukuran logo maksimal 2MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast.error("❌ File harus berupa gambar");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogoPreview(base64String);
        setFormData({ ...formData, logo_url: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setFormData({ ...formData, logo_url: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onUpdateSettings(formData);
      toast.success("✅ Pengaturan berhasil disimpan!", {
        duration: 3000,
      });
    } catch (error: any) {
      toast.error(`❌ Gagal menyimpan pengaturan: ${error.message}`, {
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const paymentMethods = [
    { value: "cash", label: "Cash / Tunai", icon: "💵" },
    { value: "credit_card", label: "Kartu Kredit", icon: "💳" },
    { value: "debit_card", label: "Kartu Debit", icon: "💳" },
    { value: "qris", label: "QRIS", icon: "📱" },
    { value: "transfer", label: "Transfer Bank", icon: "🏦" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#E05D43] p-3 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pengaturan Aplikasi</h1>
              <p className="text-gray-600">Kelola pengaturan toko dan struk pembayaran</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-[#E05D43]" />
              <h2 className="text-lg font-semibold text-gray-900">Informasi Toko</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Nama Toko
                </label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  placeholder="Avril Mart"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Alamat Toko
                </label>
                <textarea
                  required
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  rows={2}
                  placeholder="Kintamani - Bali"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  required
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  placeholder="0812-3456-7890"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-[#E05D43]" />
              <h2 className="text-lg font-semibold text-gray-900">Logo Toko</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Logo akan ditampilkan di struk pembayaran (maksimal 2MB, format PNG/JPG)
              </p>

              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-32 w-auto border-2 border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Klik untuk upload logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Receipt Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-[#E05D43]" />
              <h2 className="text-lg font-semibold text-gray-900">Pengaturan Struk</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Pesan Header (Atas Struk)
                </label>
                <input
                  type="text"
                  value={formData.receipt_header}
                  onChange={(e) => setFormData({ ...formData, receipt_header: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  placeholder="Terima kasih telah berbelanja!"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Pesan Footer (Bawah Struk)
                </label>
                <input
                  type="text"
                  value={formData.receipt_footer}
                  onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  placeholder="Barang yang sudah dibeli tidak dapat dikembalikan"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.show_payment_amount}
                    onChange={(e) => setFormData({ ...formData, show_payment_amount: e.target.checked })}
                    className="w-5 h-5 text-[#E05D43] border-gray-300 rounded focus:ring-[#E05D43]"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-900">Tampilkan Jumlah Bayar & Kembalian</span>
                    <p className="text-xs text-gray-600">Aktifkan untuk menampilkan detail pembayaran di struk</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#E05D43]" />
              <h2 className="text-lg font-semibold text-gray-900">Pengaturan Pajak</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.tax_enabled}
                  onChange={(e) => setFormData({ ...formData, tax_enabled: e.target.checked })}
                  className="w-5 h-5 text-[#E05D43] border-gray-300 rounded focus:ring-[#E05D43]"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900">Aktifkan Pajak</span>
                  <p className="text-xs text-gray-600">Tambahkan pajak otomatis ke setiap transaksi</p>
                </div>
              </label>

              {formData.tax_enabled && (
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Persentase Pajak (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pajak {formData.tax_percentage}% akan ditambahkan ke subtotal
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#E05D43]" />
              <h2 className="text-lg font-semibold text-gray-900">Metode Pembayaran</h2>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Metode Pembayaran Default
              </label>
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={formData.default_payment_method === method.value}
                    onChange={(e) => setFormData({ ...formData, default_payment_method: e.target.value as any })}
                    className="w-4 h-4 text-[#E05D43] border-gray-300 focus:ring-[#E05D43]"
                  />
                  <span className="text-2xl">{method.icon}</span>
                  <span className="text-sm font-medium text-gray-900">{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E05D43] text-white rounded-lg hover:bg-[#C04D33] disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              <Save className="w-5 h-5" />
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
