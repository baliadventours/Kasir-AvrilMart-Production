import { useState, useEffect } from 'react';
import { X, Download, RefreshCw, Share2, PlusSquare, MoreVertical, Smartphone, Info } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect if device is iOS (iPhone, iPad, iPod) or Safari macOS mimicking iPad
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
    };
    checkIsIOS();

    // Check if app is already installed / standalone
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
        return true;
      }
      if ((navigator as any).standalone) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show install prompt after 30 seconds
      const timer = setTimeout(() => {
        // Only show if not recently dismissed
        const dismissedTime = localStorage.getItem('pwa-install-dismissed');
        if (dismissedTime) {
          const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
          if (daysSinceDismissed < 7) {
            return;
          }
        }
        setShowInstallPrompt(true);
      }, 30000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowGuideModal(false);
      console.log('PWA was installed');
    });

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Listen for controller change (new service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Set up the global trigger function
  useEffect(() => {
    const handleTriggerInstall = () => {
      // Re-evaluate standalone check
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (navigator as any).standalone;
      
      if (isStandalone) {
        setIsInstalled(true);
        alert("Aplikasi Avril Mart sudah terpasang di perangkat Anda!");
        return;
      }

      if (deferredPrompt) {
        // Native installation prompt for Chrome/Android
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }) => {
          console.log(`PWA native install prompt outcome: ${outcome}`);
          if (outcome === 'accepted') {
            setShowInstallPrompt(false);
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
        }).catch((err) => {
          console.error("PWA Prompt error:", err);
          setShowGuideModal(true);
        });
      } else {
        // Fallback: iOS Safari instructions or custom manual browser installation manual
        setShowGuideModal(true);
      }
    };

    // Bind to window for easy access from other components (like mobile nav drawer)
    (window as any).triggerPWAInstall = handleTriggerInstall;
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    return () => {
      delete (window as any).triggerPWAInstall;
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowGuideModal(true);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdateClick = () => {
    if (!registration || !registration.waiting) return;
    
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setShowUpdatePrompt(false);
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  // Check if install prompt was recently dismissed (on initial render only)
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  // Do not hide the component completely if the guide modal needs to be rendered
  if (isInstalled && !showUpdatePrompt && !showGuideModal) {
    return null;
  }

  return (
    <>
      {/* Install Prompt Banner */}
      {showInstallPrompt && deferredPrompt && !showGuideModal && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-[#E05D43] rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm md:text-base">
                Pasang Avril Mart
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                Pasang aplikasi di layar utama untuk akses lebih cepat dan stabil serta dukungan offline!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-3 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] text-xs font-medium transition-colors"
                >
                  Pasang Sekarang
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-xs text-gray-700 transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissInstall}
              className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Update Prompt Banner */}
      {showUpdatePrompt && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-blue-600 text-white rounded-xl shadow-xl p-4 z-50 animate-in slide-in-from-top-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1 text-sm md:text-base">
                Pembaruan Tersedia
              </h3>
              <p className="text-xs md:text-sm text-blue-100 mb-3">
                Versi baru aplikasi sudah siap. Perbarui sekarang?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateClick}
                  className="flex-1 px-3 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-medium transition-colors"
                >
                  Update Sekarang
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="px-3 py-2 border border-white/30 rounded-lg hover:bg-white/10 text-xs transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>
            <button
              onClick={handleDismissUpdate}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step-by-Step Installation Guide Modal (PWA Guide) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowGuideModal(false)}
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-10 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#E05D43]" />
                <h3 className="font-bold text-gray-900 text-lg">
                  Cara Pasang Aplikasi
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content for iOS Device */}
            {isIOS ? (
              <div className="space-y-5">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-[#E05D43] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Aplikasi Web (PWA) di perangkat iOS/Apple harus dipasang secara manual melalui browser <strong>Safari</strong> bawaan.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Buka Menu Bagikan (Share)</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Di browser Safari Anda, ketuk tombol <strong>Bagikan</strong> (<Share2 className="inline w-3.5 h-3.5 mx-0.5 text-blue-500" />) pada bilah navigasi di bagian bawah atau atas layar.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pilih Tambahkan ke Layar Utama</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Gulir ke bawah dan ketuk pilihan <strong>Tambahkan ke Layar Utama</strong> (<PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-gray-700" />) atau <strong>Add to Home Screen</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Konfirmasi dan Pasang</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Ketuk tombol <strong>Tambah</strong> atau <strong>Add</strong> di pojok kanan atas. Ikon aplikasi Avril Mart akan muncul di layar utama perangkat Anda!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Content for Android / Chrome or Fallback browsers */
              <div className="space-y-5">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 text-[#E05D43] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Jika tombol pasang otomatis tidak merespon, Anda dapat memasangnya secara manual melalui menu browser Anda.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Buka Menu Browser</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Ketuk ikon <strong>Menu</strong> atau <strong>Opsi</strong> (<MoreVertical className="inline w-3.5 h-3.5 mx-0.5 text-gray-700" /> berupa tiga titik di sudut atas atau bawah browser Anda).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Pilih Pasang Aplikasi / Tambahkan</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Cari dan ketuk pilihan <strong>Pasang aplikasi</strong> (Install app) atau <strong>Tambahkan ke Layar Utama</strong> (Add to Home screen).
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 text-[#E05D43] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Selesaikan Pemasangan</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                        Ketuk tombol <strong>Pasang</strong> atau <strong>Tambahkan</strong> pada pop-up konfirmasi. Aplikasi siap digunakan kapan saja dari beranda HP Anda!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Close Button */}
            <div className="mt-6 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#E05D43] text-white rounded-xl hover:bg-[#C54D33] text-sm font-semibold transition-colors shadow-lg shadow-orange-100"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

