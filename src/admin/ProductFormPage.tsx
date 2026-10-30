import { useEffect, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import { Upload, X, ArrowLeft } from "lucide-react";
import { PageMasthead, MonoCaption, Skeleton } from "./ui";

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

const fieldLabel =
  "mb-1.5 block cursor-pointer font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-600";

const fieldInput =
  "w-full rounded-none border border-neutral-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder-zinc-400 transition-colors duration-200 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-500";

const fieldHelper = "mt-1.5 text-xs text-zinc-500";

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
    adminApi.getProduct(id!)
      .then((p) => {
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
      const input = {
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
      await adminApi.saveProduct(isEdit ? id! : null, input, imageFile);
      navigate("/admin/products");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-6 border-b border-neutral-200 pb-5 sm:mb-8 sm:pb-6">
          <Skeleton className="h-8 w-48 sm:h-10 sm:w-60" />
          <Skeleton className="mt-3 h-2.5 w-52" />
        </div>
        <div className="grid grid-cols-1 gap-5 border border-neutral-200 bg-white p-4 sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div className="space-y-2.5 sm:col-span-2"><Skeleton className="h-2.5 w-14" /><Skeleton className="h-11 w-full" /></div>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2.5"><Skeleton className="h-2.5 w-14" /><Skeleton className="h-11 w-full" /></div>
          ))}
          <div className="sm:col-span-2"><Skeleton className="h-44 w-full" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => navigate("/admin/products")}
        className="mb-5 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors duration-200 hover:text-zinc-950 sm:text-[11px]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All products
      </button>

      <PageMasthead
        title={isEdit ? "Edit Product" : "Add Product"}
        meta={isEdit ? "Editing catalogue entry" : "New catalogue entry"}
      />

      <form onSubmit={handleSubmit} className="space-y-6 border border-neutral-200 bg-white p-4 sm:p-6 mb-10">
        {error && (
          <div role="alert" className="border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="product-name" className={fieldLabel}>Name *</label>
            <input id="product-name" name="name" value={form.name} onChange={handleChange} required className={fieldInput} />
          </div>
          <div>
            <label htmlFor="product-price" className={fieldLabel}>Price (₵) *</label>
            <input id="product-price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required className={`${fieldInput} tabular-nums`} />
          </div>
          <div>
            <label htmlFor="product-discount" className={fieldLabel}>Discount (%)</label>
            <input
              id="product-discount"
              name="discount_percentage"
              value={form.discount_percentage}
              onChange={handleChange}
              placeholder="e.g. 45"
              aria-describedby="product-discount-helper"
              className={fieldInput}
            />
            <p id="product-discount-helper" className={fieldHelper}>
              Shown on the storefront as a reduction from the price.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className={fieldLabel}>Image</label>
            {imagePreview ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden border border-neutral-200 bg-zinc-50">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute right-2 top-2 cursor-pointer p-1.5 text-white transition-colors duration-200 bg-neutral-950/80 hover:bg-red-600"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                className={`flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center border border-neutral-200 bg-white transition-colors duration-200 hover:border-zinc-950 hover:bg-zinc-50 ${
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
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                    <MonoCaption className="text-[10px]">Uploading</MonoCaption>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200">
                      <Upload className="h-4 w-4 text-zinc-500" strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <MonoCaption className="text-[10px] sm:text-[11px]">Upload image</MonoCaption>
                      <p className="mt-1 font-mono text-[10px] text-zinc-400">JPG · PNG · WebP · GIF · SVG · max 5MB</p>
                    </div>
                  </div>
                )}
              </label>
            )}
          </div>
          <div>
            <label htmlFor="product-category" className={fieldLabel}>Category</label>
            <input id="product-category" name="category" value={form.category} onChange={handleChange} className={fieldInput} />
          </div>
          <div>
            <label htmlFor="product-stock" className={fieldLabel}>Stock</label>
            <input
              id="product-stock"
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              aria-describedby="product-stock-helper"
              className={`${fieldInput} tabular-nums`}
            />
            <p id="product-stock-helper" className={fieldHelper}>
              Set to 0 to show as sold out.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="product-tags" className={fieldLabel}>Tags</label>
            <input
              id="product-tags"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Premium, Limited Edition"
              aria-describedby="product-tags-helper"
              className={fieldInput}
            />
            <p id="product-tags-helper" className={fieldHelper}>
              Separate tags with commas.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="product-description" className={fieldLabel}>Description</label>
            <textarea
              id="product-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className={`${fieldInput} resize-none`}
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <input
              id="product-visible"
              type="checkbox"
              name="visible"
              checked={form.visible}
              onChange={handleChange}
              className="h-4 w-4 cursor-pointer accent-neutral-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <label htmlFor="product-visible" className="cursor-pointer text-sm text-zinc-700">
              Visible on storefront
            </label>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={saving || uploading}
            className="h-11 shrink-0 cursor-pointer rounded-full bg-neutral-950 px-7 text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Update Product" : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="h-11 cursor-pointer rounded-full border border-neutral-200 px-6 text-sm font-medium text-zinc-600 transition-colors duration-200 hover:border-zinc-950 hover:text-zinc-950"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
