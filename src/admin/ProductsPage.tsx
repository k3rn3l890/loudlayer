import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "./api";
import { resolveImage } from "../lib/supabase";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  PageMasthead, StatusTag, SkeletonRows, EmptyState,
  formatMoney, thClass, tdClass,
} from "./ui";

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
  visible: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    adminApi.getProducts(search)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <PageMasthead
        title="Products"
        meta={`Catalogue — ${products.length} ${products.length === 1 ? "entry" : "entries"}`}
        actions={
          <Link
            to="/admin/products/new"
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-500"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      {/* Search */}
      <div className="relative mb-6 flex items-center border-b border-neutral-200 transition-colors duration-200 focus-within:border-zinc-950">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search by name or code…"
          aria-label="Search products"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent py-2.5 pl-2.5 text-sm text-zinc-950 placeholder-zinc-400 focus:outline-none"
        />
      </div>

      {loading ? (
        <SkeletonRows rows={6} />
      ) : products.length === 0 ? (
        <EmptyState>No products yet. Add your first piece and the catalogue begins.</EmptyState>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th scope="col" className={thClass}>Product</th>
                  <th scope="col" className={`${thClass} hidden sm:table-cell`}>Code</th>
                  <th scope="col" className={`${thClass} hidden lg:table-cell`}>Category</th>
                  <th scope="col" className={`${thClass} text-right`}>Price</th>
                  <th scope="col" className={thClass}>Stock</th>
                  <th scope="col" className={`${thClass} hidden sm:table-cell`}>Status</th>
                  <th scope="col" className={`${thClass} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-neutral-100 transition-colors duration-200 last:border-b-0 hover:bg-zinc-50"
                  >
                    <td className={`${tdClass} max-w-[220px]`}>
                      <Link
                        to={`/admin/products/edit/${product.id}`}
                        className="group flex items-center gap-3"
                      >
                        <div className="h-11 w-9 shrink-0 overflow-hidden border border-neutral-200 bg-zinc-100 sm:h-12 sm:w-10">
                          <img
                            src={resolveImage(product.image)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="truncate text-xs font-medium text-zinc-950 underline-offset-4 group-hover:underline sm:text-sm">
                          {product.name}
                        </span>
                      </Link>
                    </td>
                    <td className={`${tdClass} hidden whitespace-nowrap font-mono text-[11px] text-zinc-500 sm:table-cell`}>
                      {product.code || "—"}
                    </td>
                    <td className={`${tdClass} hidden whitespace-nowrap lg:table-cell`}>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        {product.category || "—"}
                      </span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <span className="font-mono text-xs font-semibold text-zinc-950 tabular-nums sm:text-sm">
                        {formatMoney(product.price)}
                      </span>
                      {product.discount_percentage && (
                        <span className="ml-1.5 font-mono text-[10px] font-medium text-red-600">
                          −{product.discount_percentage}
                        </span>
                      )}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <span className="inline-flex items-center gap-2 font-mono text-xs text-zinc-950 tabular-nums">
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                            product.stock === 0
                              ? "bg-red-500"
                              : product.stock < 10
                              ? "bg-amber-500"
                              : "bg-green-600"
                          }`}
                        />
                        {product.stock}
                        {product.stock === 0 && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Out</span>
                        )}
                        {product.stock > 0 && product.stock < 10 && (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Low</span>
                        )}
                      </span>
                    </td>
                    <td className={`${tdClass} hidden whitespace-nowrap sm:table-cell`}>
                      <StatusTag
                        status={product.visible ? "active" : "hidden"}
                        dotColor={product.visible ? "bg-green-600" : "bg-zinc-400"}
                      />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/products/edit/${product.id}`}
                          aria-label={`Edit ${product.name}`}
                          className="grid h-9 w-9 cursor-pointer place-items-center text-zinc-400 transition-colors duration-200 hover:text-zinc-950"
                        >
                          <Edit className="h-4 w-4" strokeWidth={1.5} />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          aria-label={`Delete ${product.name}`}
                          className="grid h-9 w-9 cursor-pointer place-items-center text-zinc-400 transition-colors duration-200 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
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
