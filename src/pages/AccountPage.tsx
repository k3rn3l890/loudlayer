import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { apiGet } from "../lib/userApi";
import { Package, ChevronRight, LogOut, ArrowLeft, Heart, ShoppingBag, X, Check } from "lucide-react";
import CartDrawer from "../components/CartDrawer";

interface OrderItem {
  id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  size: string;
  image: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items?: OrderItem[];
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  processing: "bg-blue-50 text-blue-600 border-blue-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  delivered: "bg-green-50 text-green-600 border-green-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
};

export default function AccountPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const {
    cartItems, wishlist, cartCount,
    addToCart, updateQuantity, removeFromCart, clearCart,
    removeFromWishlist
  } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) {
      apiGet<{ orders: Order[] }>("/orders/my")
        .then((data) => setOrders(data.orders))
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-200 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 font-sans tracking-tight antialiased text-neutral-900">
      <div className="relative w-full max-w-4xl mx-auto bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="font-sans text-sm font-light tracking-[0.25em] text-neutral-900 hover:opacity-80 transition-opacity">
              LOUDLAYER
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/store"
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back to Store</span>
              </Link>
              <button
                onClick={() => { logout(); setTimeout(() => navigate("/"), 0); }}
                className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-red-500 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-6 mb-6 border-b border-neutral-200">
            <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900">{user.name || "Customer"}</h1>
                <button
                  onClick={() => setShowWishlistModal(true)}
                  className="relative p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
                  aria-label="View Wishlist"
                >
                  <Heart className={`w-5 h-5 ${wishlist.length > 0 ? "fill-orange-500 text-orange-500" : "text-neutral-400"}`} />
                  {wishlist.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-neutral-900 text-[9px] font-mono font-bold text-white flex items-center justify-center px-1 rounded-full border border-zinc-50">
                      {wishlist.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-1.5 rounded-full hover:bg-neutral-200/50 transition-colors cursor-pointer"
                  aria-label="Open Shopping Cart"
                >
                  <ShoppingBag className={`w-5 h-5 ${cartCount > 0 ? "text-neutral-900" : "text-neutral-400"}`} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-neutral-900 text-[9px] font-mono font-bold text-white flex items-center justify-center px-1 rounded-full border border-zinc-50">
                      {cartCount}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
            </div>
          </div>

          <h2 className="text-sm font-bold text-neutral-700 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4" /> Order History
          </h2>

          {ordersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-zinc-100/50 rounded-2xl">
              <Package className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-sm text-neutral-500 font-medium">No orders yet</p>
              <Link
                to="/store"
                className="inline-block px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-full hover:bg-orange-500 transition"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-neutral-100 rounded-xl flex items-center justify-center">
                        <Package className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-neutral-900">{order.order_number}</p>
                        <p className="text-[10px] font-mono text-neutral-400">{order.created_at?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${statusStyles[order.status] || "bg-neutral-50 text-neutral-600"}`}>
                        {order.status}
                      </span>
                      <span className="text-sm font-black text-neutral-900">₵{order.total.toFixed(2)}</span>
                      <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform ${expandedOrder === order.id ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 space-y-2">
                      <div className="border-t border-neutral-100 pt-3 space-y-2">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-neutral-50 rounded-xl">
                            {item.image && (
                              <div className="w-10 h-12 bg-neutral-200 rounded-lg overflow-hidden shrink-0">
                                <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-neutral-900 truncate">{item.product_name}</p>
                              <p className="text-[10px] font-mono text-neutral-400">Qty: {item.quantity} {item.size ? `/ Size: ${item.size}` : ""}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-neutral-900">₵{(item.product_price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={(pid, size) => removeFromCart(pid, size)}
          onClearCart={clearCart}
          user={user}
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
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-1 text-orange-500 hover:bg-orange-50 rounded-full transition cursor-pointer"
                            title="Move to bag"
                          >
                            <Check className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded-full transition cursor-pointer"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
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
      </div>
    </div>
  );
}