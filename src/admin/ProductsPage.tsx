import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "./api";
import { Plus, Edit, Trash2, Search } from "lucide-react";

interface Product {
  id: number;
  slug: string;
  name: string;
  price: number;
  discount_percentage: string | null;
  image: string;
  category: string;
  code: string | null;
  stock: number;
  visible: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    api.get<{ products: Product[] }>(`/products${params}`)
      .then((data) => setProducts(data.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.del(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Products</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center">
          <p className="text-sm text-neutral-400">No products found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] sm:text-xs text-neutral-400 font-mono uppercase tracking-wider border-b border-neutral-100 bg-neutral-50/50">
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Product</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Code</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Category</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Price</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Stock</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition">
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-10 sm:w-10 sm:h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={product.image || "/placeholder-product.svg"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="font-medium text-neutral-900 truncate max-w-[120px] sm:max-w-[200px] text-xs sm:text-sm">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-[11px] sm:text-xs text-neutral-500 whitespace-nowrap">{product.code || "—"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-neutral-100 text-neutral-600 uppercase tracking-wider">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono font-bold text-xs sm:text-sm whitespace-nowrap">
                      ₵{product.price.toFixed(2)}
                      {product.discount_percentage && (
                        <span className="ml-1 sm:ml-2 text-[9px] sm:text-[10px] font-bold text-red-500">-{product.discount_percentage}</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 font-mono text-xs whitespace-nowrap">
                      <span className={`font-bold ${product.stock === 0 ? "text-red-500" : product.stock < 10 ? "text-orange-500" : "text-green-600"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                      <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider ${
                        product.visible ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-400"
                      }`}>
                        {product.visible ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
