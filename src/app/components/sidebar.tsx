import { Store, Package, BarChart3, Users, LogOut, Menu, X, FileText, Tag, Settings } from "lucide-react";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  userRole: "admin" | "cashier";
  userName: string;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeMenu, onMenuChange, userRole, userName, onLogout, collapsed, onToggleCollapse }: SidebarProps) {
  const menuItems = [
    { id: "pos", label: "Kasir", icon: Store, allowCashier: true },
    { id: "inventory", label: "Inventori", icon: Package, allowCashier: false },
    { id: "categories", label: "Kategori", icon: Tag, allowCashier: false },
    { id: "sales", label: "Riwayat Penjualan", icon: BarChart3, allowCashier: true },
    { id: "reports", label: "Laporan", icon: FileText, allowCashier: false },
    { id: "users", label: "Pengguna", icon: Users, allowCashier: false },
    { id: "settings", label: "Pengaturan", icon: Settings, allowCashier: false },
  ];

  const filteredMenuItems = menuItems.filter(
    (item) => userRole === "admin" || item.allowCashier
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        } hidden md:block`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-medium text-gray-900">POS System</h1>
              <p className="text-xs text-gray-500">Sistem Kasir</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 rounded-full bg-[#E05D43] flex items-center justify-center font-medium text-white flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">
                  {userRole === "admin" ? "Administrator" : "Kasir"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onMenuChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-[#E05D43] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Keluar</span>}
          </button>
        </div>
      </aside>
    </>
  );
}