import { useState, useEffect } from "react";
import { UserPlus, Users, Shield, User, Edit2, Trash2 } from "lucide-react";
import { supabase } from "../../services/supabase";

interface UserManagementProps {
  accessToken: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier";
  created_at?: string;
}

export function UserManagement({ accessToken }: UserManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "cashier" as "admin" | "cashier",
  });

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setMessage({ type: "error", text: "Gagal memuat daftar user" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingUser) {
        // Update existing user
        const { error: updateError } = await supabase
          .from("users")
          .update({
            name: formData.name,
            role: formData.role,
          })
          .eq("id", editingUser.id);

        if (updateError) throw updateError;

        // Also update auth metadata
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user?.user_metadata?.role === 'admin') {
            await supabase.rpc('update_user_metadata', {
              user_id: editingUser.id,
              metadata: {
                name: formData.name,
                role: formData.role
              }
            });
          }
        } catch (e) {
          console.warn('Could not update auth metadata:', e);
        }
        
        setMessage({ type: "success", text: `User ${formData.name} berhasil diupdate!` });
      } else {
        // Create new user via Edge Function
        const { data, error: functionError } = await supabase.functions.invoke('create-user', {
          body: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
          }
        });

        if (functionError) {
          throw functionError;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        setMessage({ type: "success", text: `User ${formData.name} berhasil dibuat!` });
      }

      setFormData({ name: "", email: "", password: "", role: "cashier" });
      setShowForm(false);
      setEditingUser(null);
      
      // Reload users after a short delay
      setTimeout(() => fetchUsers(), 1000);
      
    } catch (error: any) {
      console.error("Error saving user:", error);
      
      let errorMessage = "Gagal menyimpan user.";
      
      if (error.message?.includes('duplicate') || error.message?.includes('already exists')) {
        errorMessage = "Email sudah terdaftar. Gunakan email lain.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ type: "error", text: errorMessage });
      
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${userName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setMessage({ type: "success", text: `User ${userName} berhasil dihapus!` });
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      setMessage({ 
        type: "error", 
        text: error.message || "Gagal menghapus user." 
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">Kelola akses kasir dan administrator</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ name: "", email: "", password: "", role: "cashier" });
            setShowForm(true);
          }}
          className="bg-[#E05D43] text-white px-4 py-2 rounded-lg hover:bg-[#C54D33] flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Tambah User
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* User List Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Belum ada user. Tambahkan user pertama Anda.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === "admin" ? "bg-blue-100" : "bg-green-100"
                      }`}>
                        {user.role === "admin" ? (
                          <Shield className="w-5 h-5 text-blue-600" />
                        ) : (
                          <User className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {user.role === "admin" ? "Administrator" : "Kasir"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-bold text-blue-900">Administrator</h3>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Akses penuh ke semua fitur</li>
            <li>• Kelola inventory dan produk</li>
            <li>• Lihat sales history dan laporan</li>
            <li>• Kelola user kasir</li>
            <li>• Akses Point of Sale</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <User className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-bold text-green-900">Kasir</h3>
          </div>
          <ul className="space-y-2 text-sm text-green-800">
            <li>• Akses Point of Sale</li>
            <li>• Proses transaksi penjualan</li>
            <li>• Scan barcode produk</li>
            <li>• Lihat stok produk</li>
            <li>• Tidak bisa edit inventory</li>
          </ul>
        </div>
      </div>



      {/* Add/Edit User Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Email tidak bisa diubah</p>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "admin" | "cashier" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                >
                  <option value="cashier">Kasir</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingUser(null);
                    setFormData({ name: "", email: "", password: "", role: "cashier" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : editingUser ? "Update User" : "Tambah User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}