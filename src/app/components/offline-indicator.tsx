import { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, X, ExternalLink } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  onRetrySync?: () => void;
  failedCount?: number;
  onDismissFailed?: () => void;
  onViewHistory?: () => void;
}

export function OfflineIndicator({
  isOnline,
  isSyncing,
  queuedCount,
  onRetrySync,
  failedCount = 0,
  onDismissFailed,
  onViewHistory,
}: OfflineIndicatorProps) {
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);
  const [isFailedDismissed, setIsFailedDismissed] = useState(false);
  const [isOfflineDismissed, setIsOfflineDismissed] = useState(false);

  const prevOnlineRef = useRef(isOnline);
  const prevSyncingRef = useRef(isSyncing);
  const prevFailedCountRef = useRef(failedCount);
  const isFirstMountRef = useRef(true);

  // Re-enable failed notification if new failures occur
  useEffect(() => {
    if (failedCount > prevFailedCountRef.current && failedCount > 0) {
      setIsFailedDismissed(false);
    }
    prevFailedCountRef.current = failedCount;
  }, [failedCount]);

  // When connection status changes or sync completes
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevOnlineRef.current = isOnline;
      prevSyncingRef.current = isSyncing;
      return;
    }

    const wasOffline = !prevOnlineRef.current;
    const wasSyncing = prevSyncingRef.current;

    // Show temporary "Online" notice ONLY when:
    // 1. Recovered from offline to online, OR
    // 2. Just completed syncing while online
    if ((wasOffline && isOnline) || (wasSyncing && !isSyncing && isOnline && queuedCount === 0)) {
      setShowOnlineNotice(true);
      const timer = setTimeout(() => {
        setShowOnlineNotice(false);
      }, 4000);

      return () => clearTimeout(timer);
    }

    if (!isOnline) {
      setIsOfflineDismissed(false);
    }

    prevOnlineRef.current = isOnline;
    prevSyncingRef.current = isSyncing;
  }, [isOnline, isSyncing, queuedCount]);

  const handleDismissFailed = () => {
    setIsFailedDismissed(true);
    if (onDismissFailed) {
      onDismissFailed();
    }
  };

  const showFailed = failedCount > 0 && !isFailedDismissed;
  const showOffline = !isOnline && !isOfflineDismissed;
  const showSyncing = isOnline && isSyncing;
  const showQueued = isOnline && !isSyncing && queuedCount > 0;

  // Don't render anything if there are no active visible notifications
  if (!showOffline && !showSyncing && !showQueued && !showFailed && !showOnlineNotice) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full sm:w-auto pointer-events-auto">
      {/* Failed Transactions Error Dialog */}
      {showFailed && (
        <div className="bg-red-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-white" />
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{failedCount} Transaksi Gagal</p>
              <p className="text-xs text-red-100 leading-tight truncate">Cek riwayat untuk detail</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onViewHistory && (
              <button
                type="button"
                onClick={onViewHistory}
                className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                title="Buka Riwayat Penjualan"
              >
                <span>Lihat</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleDismissFailed}
              className="p-1.5 hover:bg-red-600 rounded-lg text-white/80 hover:text-white transition-colors"
              title="Tutup pemberitahuan"
              aria-label="Tutup pemberitahuan transaksi gagal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Temporary Online Indicator (with manual close button and auto-hide) */}
      {showOnlineNotice && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-emerald-500 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Wifi className="w-4 h-4 flex-shrink-0" />
            <div>
              <p className="font-semibold text-xs sm:text-sm leading-tight">Online</p>
              <p className="text-[11px] text-emerald-100 leading-tight">Semua data tersinkronisasi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowOnlineNotice(false)}
            className="p-1 hover:bg-emerald-700/60 rounded-lg text-emerald-100 hover:text-white transition-colors flex-shrink-0"
            title="Tutup pemberitahuan online"
            aria-label="Tutup pemberitahuan online"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Offline Indicator */}
      {showOffline && (
        <div className="bg-amber-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-amber-400 animate-pulse">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm leading-tight">Mode Offline</p>
              <p className="text-xs text-amber-100 leading-tight">Transaksi tersimpan lokal & sinkron saat online</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOfflineDismissed(true)}
            className="p-1.5 hover:bg-amber-600/60 rounded-lg text-amber-100 hover:text-white transition-colors flex-shrink-0"
            title="Sembunyikan peringatan offline"
            aria-label="Sembunyikan peringatan offline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Syncing Indicator */}
      {showSyncing && (
        <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 border border-blue-500">
          <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
          <div>
            <p className="font-semibold text-xs sm:text-sm leading-tight">Menyinkronkan...</p>
            <p className="text-[11px] text-blue-100 leading-tight">Mengirim {queuedCount} transaksi ke cloud</p>
          </div>
        </div>
      )}

      {/* Queued Transactions Indicator */}
      {showQueued && (
        <div className="bg-orange-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-orange-400">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-xs sm:text-sm leading-tight">{queuedCount} Transaksi Tertunda</p>
              <p className="text-[11px] text-orange-100 leading-tight">Belum terunggah ke database</p>
            </div>
          </div>
          {onRetrySync && (
            <button
              type="button"
              onClick={onRetrySync}
              className="bg-white text-orange-600 px-3 py-1 rounded-lg font-bold text-xs hover:bg-orange-50 transition-colors shadow-sm flex-shrink-0"
            >
              Sync Sekarang
            </button>
          )}
        </div>
      )}
    </div>
  );
}
