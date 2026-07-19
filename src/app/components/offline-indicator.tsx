import { Wifi, WifiOff, RefreshCw, AlertCircle, X } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  onRetrySync?: () => void;
  failedCount?: number;
}

export function OfflineIndicator({
  isOnline,
  isSyncing,
  queuedCount,
  onRetrySync,
  failedCount = 0,
}: OfflineIndicatorProps) {
  if (isOnline && !isSyncing && queuedCount === 0 && failedCount === 0) {
    return null; // Hide when everything is fine
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-2 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-semibold">Mode Offline</p>
            <p className="text-xs">Transaksi akan disinkronkan otomatis</p>
          </div>
        </div>
      )}

      {/* Syncing Indicator */}
      {isOnline && isSyncing && (
        <div className="bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <div>
            <p className="font-semibold">Menyinkronkan...</p>
            <p className="text-xs">Mengirim {queuedCount} transaksi</p>
          </div>
        </div>
      )}

      {/* Queued Transactions Indicator */}
      {isOnline && !isSyncing && queuedCount > 0 && (
        <div className="bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 mb-2">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <p className="font-semibold">{queuedCount} Transaksi Tertunda</p>
            <p className="text-xs">Klik untuk sinkronkan sekarang</p>
          </div>
          {onRetrySync && (
            <button
              onClick={onRetrySync}
              className="bg-white text-orange-500 px-3 py-1 rounded font-medium text-sm hover:bg-orange-50 transition-colors"
            >
              Sync
            </button>
          )}
        </div>
      )}

      {/* Failed Transactions */}
      {failedCount > 0 && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <X className="w-5 h-5" />
          <div>
            <p className="font-semibold">{failedCount} Transaksi Gagal</p>
            <p className="text-xs">Cek riwayat untuk detail</p>
          </div>
        </div>
      )}

      {/* Online Indicator (auto-hide after sync) */}
      {isOnline && !isSyncing && queuedCount === 0 && (
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <Wifi className="w-5 h-5" />
          <div>
            <p className="font-semibold">Online</p>
            <p className="text-xs">Semua data tersinkronisasi</p>
          </div>
        </div>
      )}
    </div>
  );
}
