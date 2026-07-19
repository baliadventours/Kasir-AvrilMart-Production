import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, FolderOpen, Tag } from "lucide-react";
import { supabase } from "../../services/supabase";

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      setMessage({ type: "error", text: "Gagal memuat kategori" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingCategory) {
        // Update category
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
          })
          .eq("id", editingCategory.id);

        if (error) throw error;
        setMessage({ type: "success", text: `Kategori "${formData.name}" berhasil diupdate!` });
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert([
            {
              name: formData.name,
              description: formData.description || null,
            },
          ]);

        if (error) throw error;
        setMessage({ type: "success", text: `Kategori "${formData.name}" berhasil dibuat!` });
      }

      setFormData({ name: "", description: "" });
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error: any) {
      console.error("Error saving category:", error);
      setMessage({
        type: "error",
        text: error.message || "Gagal menyimpan kategori.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${categoryName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      setMessage({ type: "success", text: `Kategori "${categoryName}" berhasil dihapus!` });
      fetchCategories();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      setMessage({
        type: "error",
        text: error.message || "Gagal menghapus kategori.",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-medium text-gray-900">Manajemen Kategori</h2>
          <p className="text-sm text-gray-500">Kelola kategori produk Anda</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({ name: "", description: "" });
            setShowForm(true);
          }}
          className="bg-[#E05D43] text-white px-4 py-2 rounded-lg hover:bg-[#C54D33] flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Kategori
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white border-2 border-dashed border-gray-300 rounded-lg">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada kategori. Tambahkan kategori pertama Anda.</p>
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#E05D43] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-[#E05D43]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">{category.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id, category.name)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Category Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43]"
                  placeholder="Contoh: Elektronik"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Deskripsi (Opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E05D43] resize-none"
                  placeholder="Deskripsi kategori..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                    setFormData({ name: "", description: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-[#E05D43] text-white rounded-lg hover:bg-[#C54D33] disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Menyimpan..." : editingCategory ? "Update" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
