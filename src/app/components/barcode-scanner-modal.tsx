import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = "Scan Barcode Produk"
}: BarcodeScannerModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "camera-scanner-preview-element";

  // Request cameras and permission
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    setErrorMsg(null);

    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        setHasPermission(true);
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera (contains 'back', 'rear', or environment facing)
          const backCam = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
          );
          setSelectedCameraId(backCam ? backCam.id : devices[0].id);
        } else {
          setErrorMsg("Kamera tidak ditemukan di perangkat ini.");
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setHasPermission(false);
        setErrorMsg(
          "Izin kamera ditolak atau tidak didukung. Silakan periksa pengaturan browser Anda."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Start scanner when camera is selected
  useEffect(() => {
    if (!isOpen || !selectedCameraId || !hasPermission) return;

    let isMounted = true;
    setIsLoading(true);

    // Give DOM a small moment to render target container
    const timeout = setTimeout(() => {
      if (!isMounted) return;

      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop()
            .then(() => startScanning(selectedCameraId))
            .catch((err) => {
              console.error("Failed to stop scanner before switching:", err);
              startScanning(selectedCameraId);
            });
        } else {
          startScanning(selectedCameraId);
        }
      } catch (err) {
        console.error("Setup scanner error:", err);
        setIsLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isOpen, selectedCameraId, hasPermission]);

  const startScanning = (cameraId: string) => {
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      // Configurations
      const config = {
        fps: 15,
        qrbox: (width: number, height: number) => {
          // Responsive target box for standard linear barcodes (wider than taller)
          const boxWidth = Math.min(width * 0.85, 280);
          const boxHeight = Math.min(height * 0.45, 140);
          return { x: (width - boxWidth) / 2, y: (height - boxHeight) / 2, width: boxWidth, height: boxHeight };
        },
        aspectRatio: 1.777778 // Widescreen
      };

      scanner
        .start(
          cameraId,
          config,
          (decodedText) => {
            // Success
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Verbose error from frame analyzer, safe to ignore
          }
        )
        .then(() => {
          setIsLoading(false);
          // Check for torch/flashlight support
          const state = scanner.getRunningTrackCameraCapabilities();
          if (state && (state as any).torch) {
            setHasFlash(true);
          } else {
            setHasFlash(false);
          }
        })
        .catch((err) => {
          console.error("Failed to start html5-qrcode scanner:", err);
          setErrorMsg("Gagal mengaktifkan kamera. Pastikan kamera tidak digunakan oleh aplikasi lain.");
          setIsLoading(false);
        });
    } catch (err) {
      console.error("Html5Qrcode initialization error:", err);
      setErrorMsg("Sistem pemindai gagal diinisialisasi.");
      setIsLoading(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
  };

  const handleSuccessfulScan = async (code: string) => {
    // 1. Play feedback haptics if supported
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }

    // 2. Stop camera first so it's not locked
    await stopScanner();

    // 3. Callback
    onScan(code);
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
    setIsFlashOn(false);
  };

  const toggleFlash = async () => {
    if (!scannerRef.current || !hasFlash) return;
    try {
      const nextFlashState = !isFlashOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextFlashState } as any]
      });
      setIsFlashOn(nextFlashState);
    } catch (err) {
      console.error("Failed to toggle flashlight:", err);
      toast.error("Gagal menyalakan senter.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-950/60">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5 text-[#E05D43] animate-pulse" />
            <h3 className="font-semibold text-sm tracking-wide">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Stage */}
        <div className="relative flex-1 bg-black min-h-[320px] max-h-[480px] flex items-center justify-center overflow-hidden">
          
          {/* Main camera div targeting html5-qrcode preview */}
          <div
            id={containerId}
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-950 gap-3">
              <div className="w-10 h-10 border-4 border-[#E05D43] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Menghubungkan ke kamera...</p>
            </div>
          )}

          {/* Error Message Screen */}
          {errorMsg && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950 px-6 py-4 text-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-white">Kesalahan Kamera</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">{errorMsg}</p>
              </div>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setIsLoading(true);
                  Html5Qrcode.getCameras()
                    .then((devices) => {
                      if (devices && devices.length > 0) {
                        setCameras(devices);
                        setSelectedCameraId(devices[0].id);
                      } else {
                        setErrorMsg("Kamera tidak ditemukan.");
                      }
                    })
                    .catch((err) => {
                      setErrorMsg("Izin kamera ditolak.");
                    });
                }}
                className="px-4 py-2 bg-[#E05D43] hover:bg-[#C54D33] text-white text-xs font-medium rounded-xl transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* HUD Overlay (Only when running without errors/loading) */}
          {!isLoading && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
              
              {/* Scan box borders overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-[280px] h-[140px] border border-white/20 rounded-xl overflow-hidden shadow-[0_0_0_100vmax_rgba(0,0,0,0.65)]">
                  {/* Laser line animation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 animate-[bounce_2s_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  
                  {/* Glowing corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#E05D43]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#E05D43]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#E05D43]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#E05D43]" />
                </div>
              </div>

              {/* Guide Text */}
              <div className="w-full text-center py-4 bg-gradient-to-b from-black/70 to-transparent z-10">
                <span className="text-[11px] font-medium tracking-wide text-white bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Posisikan Barcode di dalam area kotak
                </span>
              </div>

              {/* Interactive Camera Action Controls Overlay */}
              <div className="w-full flex items-center justify-center gap-6 py-4 bg-gradient-to-t from-black/85 to-transparent pointer-events-auto z-10">
                {/* Switch Camera Button */}
                {cameras.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white border border-gray-700/50 backdrop-blur-md transition-all active:scale-90"
                    title="Ganti Kamera"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}

                {/* Torch/Flash Button */}
                {hasFlash && (
                  <button
                    onClick={toggleFlash}
                    className={`p-3 rounded-full border backdrop-blur-md transition-all active:scale-90 ${
                      isFlashOn
                        ? "bg-[#E05D43] text-white border-[#E05D43] shadow-[0_0_12px_rgba(224,93,67,0.4)]"
                        : "bg-gray-800/80 text-gray-300 border-gray-700/50 hover:bg-gray-700"
                    }`}
                    title="Senter"
                  >
                    <Zap className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>Mendukung EAN-13, EAN-8, Code 128, QR, dll.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
