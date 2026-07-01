import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import PartnerRail from "../components/PartnerRail";
import MomentsSection from "../components/MomentsSection";
import StatsSection from "../components/StatsSection";
import TestimonialSlider from "../components/TestimonialSlider";
import JacketMomentoCarousel from "../components/JacketMomentoCarousel";
import CollectionsDirectory from "../components/CollectionsDirectory";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { apiPost } from "../lib/userApi";
import { Product, CartItem } from "../types";
import { Heart, Sparkles, X, Check, ShoppingBag } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems, wishlist, cartCount,
    addToCart, updateQuantity, removeFromCart, clearCart,
    addToWishlist, removeFromWishlist, isInWishlist
  } = useCart();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  const handleUpdateCartQuantity = (productId: string, qty: number, selectedSize?: string) => {
    updateQuantity(productId, qty, selectedSize);
  };

  const handleRemoveFromCart = (productId: string, selectedSize?: string) => {
    const item = cartItems.find((it) => it.product.id === productId && (!selectedSize || it.selectedSize === selectedSize));
    if (item) {
      triggerToast(`Removed ${item.product.name} from your shopping bag.`, "info");
    }
    removeFromCart(productId, selectedSize);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleAddToWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      triggerToast(`${product.name} is already saved in your wishlist.`, "info");
      return;
    }
    addToWishlist(product);
    triggerToast(`Pinned ${product.name} into your editorial wishlist archive!`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
    triggerToast("Removed item from editorial wishlist.", "info");
  };

  const handleSearchAction = (query: string) => {
    triggerToast(`Searching directory catalogue for "${query}". Matching garments displayed below.`, "info");
    const section = document.getElementById("moments-section") || document.getElementById("btn-see-product");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
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
      await apiPost("/orders", payload);
      clearCart();
      triggerToast("Order placed successfully!", "success");
    } catch (err: any) {
      triggerToast(err.message || "Checkout failed", "info");
      throw err;
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-center justify-center font-sans tracking-tight antialiased text-neutral-900 select-none">
      <div className="relative w-full max-w-7xl bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300 flex flex-col justify-between">
        <Header
          cartItemsCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onWishlistClick={() => setShowWishlistModal(true)}
          onSearch={handleSearchAction}
          user={user}
        />

        <Hero
          onExploreClick={() => {
            const section = document.getElementById("moments-section");
            if (section) section.scrollIntoView({ behavior: "smooth" });
          }}
          onViewStore={() => navigate("/store")}
        />

        <PartnerRail />

        <div id="moments-section">
          <MomentsSection
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>

        <StatsSection
          onCategorySelect={(cat) => triggerToast(`Visualizer target adjusted to category: "${cat}"`)}
        />

        <TestimonialSlider />

        <JacketMomentoCarousel
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />

        <CollectionsDirectory />

        <Footer />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
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
                  <span className="font-sans font-bold text-neutral-900">
                    Your Saved Editorial List
                  </span>
                  <span className="bg-orange-500/10 text-orange-500 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ml-auto">
                    {wishlist.length} Saved
                  </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-3 py-2">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-10 space-y-2">
                      <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
                      <p className="text-xs text-neutral-500 tracking-wide font-light">
                        No saved pieces found. Press "+ Save List" on moments or carousel cards.
                      </p>
                    </div>
                  ) : (
                    wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-white rounded-2xl border border-neutral-200/40 hover:border-neutral-200 transition"
                      >
                        <div className="w-12 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-400 block">
                            ₵{item.price} RETAIL
                          </span>
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
                            <TrashButton />
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
            {cartCount > 0 && (
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
              <button
                onClick={() => setToastMessage(null)}
                className="hover:opacity-80 ml-2 border-l border-white/20 pl-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrashButton() {
  return (
    <span className="text-[11px] font-sans hover:underline">✕</span>
  );
}