import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { apiGet, apiPost } from "../lib/userApi";
import { Product, CartItem, Review, ReviewStats } from "../types";
import { Heart, ShoppingBag, ShoppingCart, Star, ArrowLeft, Sparkles } from "lucide-react";

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

const SIZES = ["S", "M", "L", "XL"];

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const {
    cartItems, wishlist, cartCount,
    addToCart, updateQuantity, removeFromCart, clearCart,
    addToWishlist, removeFromWishlist, isInWishlist,
  } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const triggerToast = (msg: string, type: "success" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      apiGet<{ product: any }>(`/products/slug/${slug}`),
      apiGet<{ reviews: any[]; stats: any }>(`/products/${slug}/reviews`),
    ])
      .then(([pData, rData]) => {
        const p = mapDbProduct(pData.product);
        setProduct(p);
        setReviews(rData.reviews);
        setReviewStats(rData.stats);

        if (p.category) {
          apiGet<{ products: any[] }>(`/products?category=${encodeURIComponent(p.category)}&visible=1`)
            .then((data) => {
              setRelated(data.products.map(mapDbProduct).filter((r) => r.slug !== p.slug).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedSize);
    triggerToast(`Added ${product.name} [${selectedSize}] to your shopping bag!`);
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      triggerToast("Removed from editorial wishlist.", "info");
    } else {
      addToWishlist(product);
      triggerToast("Pinned to your editorial wishlist archive!");
    }
  };

  const handleSubmitReview = async () => {
    if (!slug || !user) return;
    setSubmittingReview(true);
    try {
      const data = await apiPost<{ review: any }>(`/products/${slug}/reviews`, {
        rating: reviewRating,
        body: reviewBody,
      });
      setReviews((prev) => [{
        id: data.review.id,
        rating: data.review.rating,
        body: data.review.body,
        user_name: data.review.user_name,
        created_at: data.review.created_at,
      }, ...prev]);
      setReviewStats((prev) => ({
        count: prev.count + 1,
        average: Math.round(((prev.average * prev.count) + reviewRating) / (prev.count + 1) * 10) / 10,
      }));
      setReviewBody("");
      setReviewRating(5);
      triggerToast("Review submitted successfully!");
    } catch (err: any) {
      triggerToast(err.message || "Failed to submit review", "info");
    } finally {
      setSubmittingReview(false);
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

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-neutral-500 font-medium">Product not found</p>
          <Link to="/store" className="text-xs font-mono text-orange-500 hover:underline">Back to Store</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-start justify-center font-sans tracking-tight antialiased text-neutral-900 select-none">
      <div className="relative w-full max-w-7xl bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300 flex flex-col min-h-[calc(100vh-40px)]">
        <Header
          cartItemsCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onWishlistClick={() => {}}
          onSearch={() => {}}
          user={user}
        />

        <main className="flex-1 px-4 sm:px-6 md:px-12 py-8 sm:py-10">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-orange-500 transition mb-4 sm:mb-8"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-12 md:mb-16">
              <div className="aspect-[4/5] bg-neutral-100 rounded-2xl sm:rounded-[32px] overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                      {product.category}
                    </span>
                    {product.code && (
                      <span className="font-mono text-[10px] text-neutral-400">CODE: {product.code}</span>
                    )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-sans font-black text-neutral-900 leading-tight mb-4">
                    {product.name}
                  </h1>

                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-2xl sm:text-3xl font-sans font-black text-neutral-900">
                      ₵{product.price}
                    </span>
                    {product.discountPercentage && (
                      <span className="bg-orange-500 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
                        {product.discountPercentage} OFF
                      </span>
                    )}
                  </div>

                  <div className="mb-6">
                    {product.stock !== undefined && product.stock > 5 ? (
                      <span className="text-[11px] font-mono text-green-600">In Stock ({product.stock} available)</span>
                    ) : product.stock !== undefined && product.stock > 0 ? (
                      <span className="text-[11px] font-mono text-amber-600">Low Stock — only {product.stock} left</span>
                    ) : (
                      <span className="text-[11px] font-mono text-red-500">Out of Stock</span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-sm text-neutral-600 font-light leading-relaxed mb-8">
                      {product.description}
                    </p>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {product.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mb-8">
                    <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider block mb-3">
                      SELECT SIZE
                    </span>
                    <div className="flex gap-2">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={`w-11 h-11 rounded-full font-mono text-sm font-bold transition flex items-center justify-center border cursor-pointer ${
                            selectedSize === s
                              ? "bg-neutral-950 border-neutral-950 text-white"
                              : "border-neutral-200 hover:border-neutral-500 text-neutral-800"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-6 border-t border-neutral-200 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock !== undefined && product.stock === 0}
                    className={`flex-1 h-12 font-mono text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center text-center gap-2 transition cursor-pointer ${
                      product.stock !== undefined && product.stock === 0
                        ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                        : "bg-neutral-950 hover:bg-orange-500 text-white"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" /> <span className="truncate">{product.stock !== undefined && product.stock === 0 ? "OUT OF STOCK" : "ADD TO BAG"}</span>
                  </button>
                  <Link
                    to="/store"
                    className="flex-1 h-12 font-mono text-[9px] sm:text-xs font-bold uppercase tracking-widest rounded-full flex items-center justify-center text-center border border-neutral-200 hover:border-neutral-500 text-neutral-600 hover:text-neutral-900 transition"
                  >
                    CONTINUE SHOPPING
                  </Link>
                  <button
                    onClick={handleToggleWishlist}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      isInWishlist(product.id)
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "border-neutral-200 hover:border-neutral-500 text-neutral-600"
                    }`}
                    title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist(product.id) ? "fill-white" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-12 md:mb-16">
              <h2 className="text-xl sm:text-2xl font-sans font-black text-neutral-900 mb-6">Customer Reviews</h2>

              <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-2xl border border-neutral-200/60">
                <div className="text-center">
                  <span className="text-4xl font-sans font-black text-neutral-900">{reviewStats.average}</span>
                  <div className="flex items-center gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(reviewStats.average)
                            ? "fill-orange-500 text-orange-500"
                            : "text-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 mt-1 block">
                    {reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {user ? (
                <div className="mb-8 p-4 sm:p-6 bg-white rounded-2xl border border-neutral-200/60">
                  <h3 className="text-sm font-sans font-bold text-neutral-900 mb-4">Write a Review</h3>
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? "fill-orange-500 text-orange-500"
                              : "text-neutral-300 hover:text-orange-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition resize-none mb-4"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="h-10 px-6 bg-neutral-950 hover:bg-orange-500 disabled:bg-neutral-400 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    {submittingReview ? "SUBMITTING..." : "SUBMIT REVIEW"}
                  </button>
                </div>
              ) : (
                <div className="mb-8 p-4 sm:p-6 bg-neutral-100 rounded-2xl text-center">
                  <p className="text-sm text-neutral-500 mb-2">Sign in to leave a review</p>
                  <Link
                    to={`/login?redirect=/products/${slug}`}
                    className="inline-flex h-10 px-6 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full items-center justify-center transition"
                  >
                    SIGN IN
                  </Link>
                </div>
              )}

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-8">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 sm:p-5 bg-white rounded-2xl border border-neutral-200/60">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-600">
                          {review.user_name?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-neutral-900">{review.user_name}</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= review.rating ? "fill-orange-500 text-orange-500" : "text-neutral-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="ml-auto text-[10px] font-mono text-neutral-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.body && (
                        <p className="text-sm text-neutral-600 font-light leading-relaxed mt-2">{review.body}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {related.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl sm:text-2xl font-sans font-black text-neutral-900 mb-6">Related Products</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {related.map((rp) => (
                    <Link
                      key={rp.id}
                      to={`/products/${rp.slug}`}
                      className="group bg-white rounded-2xl border border-neutral-200/60 overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all"
                    >
                      <div className="aspect-[4/5] bg-neutral-100 overflow-hidden">
                        <img
                          src={rp.image}
                          alt={rp.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-3">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-orange-500 font-bold">
                          {rp.category}
                        </span>
                        <h3 className="text-xs font-sans font-semibold text-neutral-900 mt-1 line-clamp-2">{rp.name}</h3>
                        <span className="text-sm font-sans font-black text-neutral-900 mt-1 block">₵{rp.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
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
          onRemoveItem={(pid, size) => removeFromCart(pid, size)}
          onClearCart={clearCart}
          user={user}
          onCheckout={handleCheckout}
        />

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
      </div>
    </div>
  );
}