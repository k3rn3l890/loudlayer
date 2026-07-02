import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { apiGet, apiPost } from "../lib/userApi";
import { Product, CartItem } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Sparkles, X, Check, ShoppingBag, ShoppingCart, Search, Eye } from "lucide-react";
import AddToCartModal from "../components/AddToCartModal";

function mapDbProduct(p: any): Product {
  let tags: string[] = [];
  try { tags = JSON.parse(p.tags || "[]"); } catch {}
  return {
    id: String(p.id),
    slug: p.slug || "",
    name: p.name,
    price: p.price,
    discountPrice: p.discount_price ?? undefined,
    discountPercentage: p.discount_percentage ?? undefined,
    image: p.image || "/placeholder-product.svg",
    category: p.category || "",
    code: p.code ?? undefined,
    tags,
    description: p.description ?? undefined,
    stock: p.stock ?? 0,
  };
}

export default function StorePage() {
  const { user } = useAuth();
  const {
    cartItems, wishlist, cartCount,
    addToCart, updateQuantity, removeFromCart, clearCart,
    addToWishlist, removeFromWishlist, isInWishlist
  } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    apiGet<{ products: any[] }>("/products?visible=1")
      .then((data) => setProducts(data.products.map(mapDbProduct)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddToCart = (product: Product, size: string) => {
    const existing = cartItems.find(
      (item) => item.product.id === product.id && item.selectedSize === size
    );
    if (existing) {
      triggerToast(`Updated quantity of ${product.name} [${size}] in your bag.`);
    } else {
      triggerToast(`Added ${product.name} [${size}] to your shopping bag!`);
    }
    addToCart(product, size);
  };

  const handleRemoveFromCart = (productId: string, selectedSize?: string) => {
    const item = cartItems.find((it) => it.product.id === productId && (!selectedSize || it.selectedSize === selectedSize));
    if (item) triggerToast(`Removed ${item.product.name} from your shopping bag.`, "info");
    removeFromCart(productId, selectedSize);
  };

  const handleAddToWishlist = (product: Product) => {
    addToWishlist(product);
    triggerToast(`Pinned ${product.name} into your editorial wishlist archive!`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
    triggerToast("Removed item from editorial wishlist.", "info");
  };

  const handleCheckout = async (items: CartItem[], address: string) => {
    const payload = {
      items: items.map((i) => ({
        product_id: parseInt(i.product.id.replace(/\D/g, "")) || null,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        size: i.selectedSize || "M",
        image: i.product.image,
      })),
      customer_name: user?.name || "",
      shipping_address: address,
    };
    try {
      const data = await apiPost<{ order: any; skipped_items?: { name: string; reason: string }[] }>("/orders", payload);
      const skippedNames = data.skipped_items?.map((s) => s.name).join(", ");
      if (data.skipped_items && data.skipped_items.length > 0) {
        const skippedIds = items
          .filter((i) => data.skipped_items?.some((s) => s.name === i.product.name))
          .map((i) => i.product.id);
        skippedIds.forEach((id) => removeFromCart(id));
        triggerToast(`Order placed! Skipped (out of stock): ${skippedNames}`, "info");
      } else {
        clearCart();
        triggerToast("Order placed successfully!", "success");
      }
    } catch (err: any) {
      triggerToast(err.message || "Checkout failed", "info");
      throw err;
    }
  };

  const filtered = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-start justify-center font-sans tracking-tight antialiased text-neutral-900 select-none">
      <div className="relative w-full max-w-7xl bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300 flex flex-col min-h-[calc(100vh-40px)]">
        <Header
          cartItemsCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onWishlistClick={() => setShowWishlistModal(true)}
          onSearch={(q) => setSearchQuery(q)}
          user={user}
        />

        <main className="flex-1 px-6 md:px-12 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-orange-500 mb-1">
                  / Collection 2026
                </p>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-sans font-black tracking-tighter text-neutral-900 leading-none">
                  {selectedCategory === "all" ? "All Products" : selectedCategory}
                </h1>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                  }`}
                >
                  {cat === "all" ? "All" : cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
                <p className="text-sm text-neutral-500 font-medium">No products found</p>
                <p className="text-xs text-neutral-400">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-white rounded-2xl border border-neutral-200/60 overflow-hidden hover:shadow-xl hover:border-neutral-300 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                      <img
                        src={product.image || "/placeholder-product.svg"}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${product.stock && product.stock > 0 ? 'group-hover:scale-105' : 'opacity-60'}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.discountPercentage && (
                          <span className="bg-orange-500 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {product.discountPercentage} OFF
                          </span>
                        )}
                        {product.stock !== undefined && product.stock === 0 && (
                          <span className="bg-neutral-900 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                            OUT OF STOCK
                          </span>
                        )}
                        {product.stock !== undefined && product.stock > 0 && product.stock < 5 && (
                          <span className="bg-amber-500 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                      {product.stock !== undefined && product.stock > 0 ? (
                        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                          <button
                            onClick={() => setModalProduct(product)}
                            className="flex-1 h-9 bg-white text-neutral-900 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:bg-orange-500 hover:text-white transition cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Add to Bag
                          </button>
                          <Link
                            to={`/products/${product.slug}`}
                            className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (isInWishlist(product.id)) {
                                handleRemoveFromWishlist(product.id);
                              } else {
                                handleAddToWishlist(product);
                              }
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer ${
                              isInWishlist(product.id)
                                ? "bg-orange-500 text-white"
                                : "bg-white/90 text-neutral-900 hover:bg-orange-500 hover:text-white"
                            }`}
                            title={isInWishlist(product.id) ? "Remove from wishlist" : "Save to wishlist"}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? "fill-white" : ""}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="absolute inset-x-0 bottom-0 p-3">
                          <Link
                            to={`/products/${product.slug}`}
                            className="flex-1 h-9 bg-white/90 text-neutral-900 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-1.5 hover:bg-orange-500 hover:text-white transition cursor-pointer w-full"
                          >
                            <Eye className="w-3.5 h-3.5" /> VIEW DETAILS
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-orange-500 font-bold mb-1">
                        {product.category}
                      </span>
                      <h3 className="text-sm font-sans font-semibold text-neutral-900 leading-tight mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="mt-auto pt-3 flex items-center justify-between">
                        <span className="text-lg font-sans font-black text-neutral-900">
                          ₵{product.price}
                        </span>
                        {product.tags && product.tags.length > 0 && (
                          <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                            {product.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>

        <Footer />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={clearCart}
          user={user}
          onCheckout={handleCheckout}
        />

        <AnimatePresence>
          {showWishlistModal && (
            <div className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-50 rounded-[32px] p-6 sm:p-8 max-w-md w-full relative border border-neutral-200/50 shadow-2xl flex flex-col justify-between"
              >
                <button
                  onClick={() => setShowWishlistModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-200 transition text-neutral-500 hover:text-neutral-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200">
                  <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />
                  <span className="font-sans font-bold text-neutral-900">Your Saved Editorial List</span>
                  <span className="bg-orange-500/10 text-orange-500 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ml-auto">
                    {wishlist.length} Saved
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-3 py-2">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-xs text-neutral-500 tracking-wide font-light">No saved pieces found.</p>
                    </div>
                  ) : (
                    wishlist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-neutral-200/40">
                        <div className="w-12 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">{item.name}</h4>
                          <span className="text-[10px] font-mono text-neutral-400 block">₵{item.price} RETAIL</span>
                        </div>
                        <div className="flex gap-1">
                          <Link
                            to={`/products/${item.slug}`}
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="p-1 text-orange-500 hover:bg-orange-50 rounded-full transition cursor-pointer"
                            title="Move to bag"
                          >
                            <Check className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleRemoveFromWishlist(item.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded-full transition cursor-pointer"
                            title="Remove"
                          >
                            <span className="text-[11px] font-sans hover:underline">✕</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowWishlistModal(false)}
                  className="w-full h-11 bg-neutral-950 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-xl mt-6 hover:bg-orange-500 transition cursor-pointer"
                >
                  CLOSE WISHLIST
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsCartOpen(true)}
            className="relative w-12 h-12 rounded-full bg-neutral-950 hover:bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-neutral-950/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            aria-label="Open Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-orange-500 text-[10px] font-mono font-bold text-white flex items-center justify-center px-1 rounded-full border-2 border-neutral-950">
                {cartCount}
              </span>
            )}
          </motion.button>
          <AnimatePresence>
            {wishlist.length > 0 && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => setShowWishlistModal(true)}
                className="relative w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                aria-label="Open Wishlist"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-neutral-950 text-[10px] font-mono font-bold text-white flex items-center justify-center px-1 rounded-full border-2 border-orange-500">
                  {wishlist.length}
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 text-white font-mono text-[11px] tracking-wide px-5 py-3 rounded-full flex items-center gap-2.5 shadow-xl border ${
                toastType === "success"
                  ? "bg-neutral-950 border-white/10"
                  : "bg-orange-500 border-orange-600 shadow-orange-500/20"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin-slow text-orange-400" />
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="hover:opacity-80 ml-2 border-l border-white/20 pl-2 cursor-pointer font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <AddToCartModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
        />
      </div>
    </div>
  );
}