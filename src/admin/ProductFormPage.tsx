import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "./api";
import { Upload, X, ImageIcon } from "lucide-react";

interface ProductForm {
  name: string;
  price: string;
  discount_price: string;
  discount_percentage: string;
  image: string;
  category: string;
  description: string;
  tags: string;
  stock: string;
  visible: boolean;
}

const emptyForm: ProductForm = {
  name: "", price: "", discount_price: "", discount_percentage: "",
  image: "", category: "", description: "", tags: "", stock: "0", visible: true
};

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get<{ product: any }>(`/products/${id}`)
      .then((data) => {
        const p = data.product;
        setForm({
          name: p.name || "",
          price: String(p.price || ""),
          discount_price: p.discount_price ? String(p.discount_price) : "",
          discount_percentage: p.discount_percentage || "",
          image: "",
          category: p.category || "",
          description: p.description || "",
          tags: p.tags ? (Array.isArray(p.tags) ? p.tags.join(", ") : p.tags) : "",
          stock: String(p.stock ?? "0"),
          visible: !!p.visible,
        });
        if (p.image) {
          setImagePreview(p.image);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setForm((prev) => ({ ...prev, image: "" }));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

    try {
      if (isEdit && !imageFile) {
        const body = {
          slug,
          name: form.name,
          price: parseFloat(form.price) || 0,
          ...(form.discount_price ? { discount_price: parseFloat(form.discount_price) } : {}),
          ...(form.discount_percentage ? { discount_percentage: form.discount_percentage } : {}),
          category: form.category || "",
          description: form.description || "",
          stock: parseInt(form.stock) || 0,
          visible: !!form.visible,
          tags,
        };
        await api.put(`/products/${id}`, body);
      } else {
        const fd = new FormData();
        fd.append("slug", slug);
        fd.append("name", form.name);
        fd.append("price", String(parseFloat(form.price) || 0));
        if (form.discount_price) fd.append("discount_price", String(parseFloat(form.discount_price)));
        if (form.discount_percentage) fd.append("discount_percentage", form.discount_percentage);
        fd.append("category", form.category || "");
        fd.append("description", form.description || "");
        fd.append("stock", String(parseInt(form.stock) || 0));
        fd.append("visible", String(!!form.visible));
        fd.append("tags", JSON.stringify(tags));
        if (imageFile) fd.append("image", imageFile);

        if (isEdit) {
          await api.put(`/products/${id}`, fd);
        } else {
          await api.post("/products", fd);
        }
      }
      navigate("/admin/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-3 sm:mb-4">
        {isEdit ? "Edit Product" : "Add Product"}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-4 sm:p-5 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 sm:px-4 py-2 rounded-xl">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Price *</label>
            <input name="price" type="number" step="0.01" value={form.price} onChange={handleChange} required
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Discount %</label>
            <input name="discount_percentage" value={form.discount_percentage} onChange={handleChange} placeholder="e.g. 45%"
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Image</label>
            {imagePreview ? (
              <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-neutral-200 bg-zinc-50">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-neutral-900/80 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center w-full aspect-[16/9] rounded-xl border-2 border-dashed border-neutral-300 bg-zinc-50 hover:bg-zinc-100 hover:border-neutral-400 transition cursor-pointer ${
                  uploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-neutral-500 font-mono">Uploading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-medium text-neutral-600">Click to upload image</span>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">JPG, PNG, WebP, GIF, SVG (max 5MB)</p>
                    </div>
                  </div>
                )}
              </label>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Category</label>
            <input name="category" value={form.category} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Stock</label>
            <input name="stock" type="number" value={form.stock} onChange={handleChange}
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} placeholder="Premium, Limited Edition"
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-neutral-500 mb-1 block">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={2}
              className="w-full px-4 py-2 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 resize-none" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" name="visible" checked={form.visible} onChange={handleChange}
              className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900" />
            <label className="text-sm text-neutral-600">Visible (shown on storefront)</label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-1">
          <button type="submit" disabled={saving || uploading}
            className="px-6 py-2.5 sm:py-2 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer">
            {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </button>
          <button type="button" onClick={() => navigate("/admin/products")}
            className="px-6 py-2.5 sm:py-2 border border-neutral-200 text-neutral-600 text-sm font-medium rounded-xl hover:bg-neutral-50 transition cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
