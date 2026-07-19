// src/app/components/mobile-nav.tsx
import React from "react";
import { Store, BarChart3, Grid3x3, MoreHorizontal } from "lucide-react";

interface MobileNavProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onOpenDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeMenu, onMenuChange, onOpenDrawer }) => {
  const tabs = [
    { id: "pos", label: "Kasir", icon: Store },
    { id: "inventory", label: "Stok", icon: Grid3x3 },
    { id: "sales", label: "Penjualan", icon: BarChart3 },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 md:hidden z-40 bg-white/90 backdrop-blur-lg border-t border-gray-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeMenu === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onMenuChange(tab.id)}
            aria-label={tab.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors ${
              isActive ? "text-[#E05D43]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : ""}`} />
            <span className="text-[11px] font-medium">{tab.label}</span>
            {isActive && (
              <span className="absolute -bottom-1 w-8 h-0.5 bg-[#E05D43] rounded-full" />
            )}
          </button>
        );
      })}

      {/* More / Hamburger */}
      <button
        onClick={onOpenDrawer}
        aria-label="More menu"
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreHorizontal className="w-6 h-6" />
        <span className="text-[11px] font-medium">Menu</span>
      </button>
    </nav>
  );
};
