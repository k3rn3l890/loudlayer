import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import PartnerRail from "./components/PartnerRail";
import MomentsSection from "./components/MomentsSection";
import StatsSection from "./components/StatsSection";
import TestimonialSlider from "./components/TestimonialSlider";
import JacketMomentoCarousel from "./components/JacketMomentoCarousel";
import CollectionsDirectory from "./components/CollectionsDirectory";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import { Product, CartItem } from "./types";
import { DISCOVER_PRODUCTS, MOMENTS_PRODUCTS } from "./data";
import { Heart, Sparkles, X, Check } from "lucide-react";

export default function App() {
  // E-commerce Global States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  
  // Custom Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  // Show dynamic toast notification
  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // E-commerce Action Handlers
  const handleAddToCart = (product: Product, size: string = "M") => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existing) {
        triggerToast(`Updated quantity of ${product.name} [${size}] in your bag.`);
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      triggerToast(`Added ${product.name} [${size}] to your shopping bag!`);
      return [...prev, { product, quantity: 1, selectedSize: size }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    const item = cartItems.find((it) => it.product.id === productId);
    if (item) {
      triggerToast(`Removed ${item.product.name} from your shopping bag.`, "info");
    }
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleAddToWishlist = (product: Product) => {
    const alreadySaved = wishlist.some((item) => item.id === product.id);
    if (alreadySaved) {
      triggerToast(`${product.name} is already saved in your wishlist.`, "info");
      return;
    }
    setWishlist((prev) => [...prev, product]);
    triggerToast(`Pinned ${product.name} into your editorial wishlist archive!`);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    triggerToast("Removed item from editorial wishlist.", "info");
  };

  // Curated look builder (Hero Center Action)
  const handleAddCuratedOutfit = () => {
    // Curate a set: jacket c3 and jacket c1
    const parts = [DISCOVER_PRODUCTS[2], DISCOVER_PRODUCTS[0]];
    parts.forEach((p) => {
      setCartItems((prev) => {
        const existing = prev.find((item) => item.product.id === p.id && item.selectedSize === "M");
        if (existing) {
          return prev.map((item) =>
            item.product.id === p.id && item.selectedSize === "M"
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { product: p, quantity: 1, selectedSize: "M" }];
      });
    });
    triggerToast("Premium Curated Street Set added to your bag successfully!");
    setIsCartOpen(true);
  };

  // Search trigger alert callback
  const handleSearchAction = (query: string) => {
    triggerToast(`Searching directory catalogue for "${query}". Matching garments displayed below.`, "info");
    // Scroll smoothly to Jacket momento catalogue gallery 
    const section = document.getElementById("moments-section") || document.getElementById("btn-see-product");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-center justify-center font-sans tracking-tight antialiased text-neutral-900 select-none">
      
      {/* Outer Editorial Shell Container (Simulating the clean border of Frame 00:00) */}
      <div className="relative w-full max-w-7xl bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300 flex flex-col justify-between">
        
        {/* Real-time Header */}
        <Header
          cartItemsCount={cartItems.reduce((acc, it) => acc + it.quantity, 0)}
          onCartClick={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onWishlistClick={() => setShowWishlistModal(true)}
          onSearch={handleSearchAction}
        />

        {/* Hero Section */}
        <Hero
          onAddCurated={handleAddCuratedOutfit}
          onExploreClick={() => {
            const section = document.getElementById("moments-section");
            if (section) section.scrollIntoView({ behavior: "smooth" });
          }}
        />

        {/* Brand partners Rail logo loop */}
        <PartnerRail />

        {/* Moments Section Grid */}
        <div id="moments-section">
          <MomentsSection
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>

        {/* Technical categories stats slider section */}
        <StatsSection
          onCategorySelect={(cat) => triggerToast(`Visualizer target adjusted to category: "${cat}"`)}
        />

        {/* Emma Williams testominationals slideshow banner */}
        <TestimonialSlider />

        {/* Jacket Momento scrollable horizontal card slider */}
        <JacketMomentoCarousel
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />

        {/* Collections Bento Directory with dynamic timeline accordion triggers */}
        <CollectionsDirectory />

        {/* High contrast visual dark footer */}
        <Footer />

        {/* Sidebar Shopping Cart Overlay Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={handleClearCart}
        />

        {/* Editorial Wishlist Popover Modal */}
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
                            ${item.price} RETAIL
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              handleAddToCart(item, "M");
                              handleRemoveFromWishlist(item.id);
                            }}
                            className="p-1 text-orange-500 hover:bg-orange-50 rounded-full transition cursor-pointer"
                            title="Move to bag"
                          >
                            <Check className="w-4 h-4" />
                          </button>
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

        {/* Global Toast Notifier */}
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
