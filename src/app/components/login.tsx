import { useState } from "react";
import { LogIn, User, Lock, Store, WifiOff } from "lucide-react";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export function Login({ onLogin, error, loading }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loadUser } = useLocalStorage();
  const cachedUser = loadUser();
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-stone-200">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <img
            src="/avrilmart-app-icon.png"
            alt="Avril Mart"
            className="w-16 h-16 rounded-2xl object-cover shadow-md"
            onError={(e) => {
              // Fallback to vector icon if image fails
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Avril Mart POS</h1>
          <p className="text-stone-500 text-sm mt-1">Sistem Kasir & Manajemen Stok Offline</p>
        </div>

        {/* Offline cached user notice */}
        {cachedUser && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                {isOffline ? "Mode Offline Aktif" : "Sesi Lokal Tersedia"}
              </div>
              <div className="text-stone-800 font-medium truncate mt-0.5">{cachedUser.name || cachedUser.email}</div>
              <div className="text-stone-500 text-xs capitalize">{cachedUser.role}</div>
            </div>
            <button
              type="button"
              onClick={() => onLogin(cachedUser.email, "offline")}
              className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              Masuk Offline
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm leading-relaxed">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasir@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 rounded-xl hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors shadow-sm mt-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Masuk
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-stone-500">
          <p>Database & antarmuka tersimpan otomatis untuk akses tanpa internet</p>
        </div>
      </div>
    </div>
  );
}
