import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "../types";
import { useCart } from "../lib/CartContext";

const SIZES = ["S", "M", "L", "XL"];

interface AddToCartModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function AddToCartModal({ product, onClose }: AddToCartModalProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState("M");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize("M");
      setQuantity(1);
      setAdded(false);
    }
  }, [product]);

  if (!product) return null;

  const maxQty = product.stock ?? 99;
  const isOutOfStock = maxQty <= 0;

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize);
    }
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  const displayPrice = product.discountPrice ?? product.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-zinc-50 rounded-3xl w-full max-w-md overflow-hidden border border-neutral-200/60 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-neutral-200 transition cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4 text-neutral-700" />
          </button>

          {/* Image section */}
          <div className="relative aspect-[4/3] bg-neutral-100">
            <img
              src={product.image || "/placeholder-product.svg"}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.discountPercentage && (
                <span className="bg-orange-500 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                  {product.discountPercentage} OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="bg-neutral-900 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full shadow-lg">
                  OUT OF STOCK
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Product info */}
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-orange-500 font-bold">
                {product.category}
              </span>
              <h3 className="text-lg font-sans font-bold text-neutral-900 mt-0.5">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {product.discountPrice ? (
                  <>
                    <span className="text-xl font-sans font-black text-orange-500">
                      ₵{product.discountPrice}
                    </span>
                    <span className="text-sm font-sans text-neutral-400 line-through">
                      ₵{product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-sans font-black text-neutral-900">
                    ₵{product.price}
                  </span>
                )}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider block mb-2.5">
                SELECT SIZE
              </span>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    disabled={isOutOfStock}
                    className={`w-10 h-10 rounded-full font-mono text-xs font-bold transition flex items-center justify-center border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
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

            {/* Quantity selector */}
            <div>
              <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-wider block mb-2.5">
                QUANTITY
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center hover:border-neutral-500 transition text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-mono text-sm font-bold text-neutral-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty || isOutOfStock}
                  className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center hover:border-neutral-500 transition text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {maxQty < 10 && maxQty > 0 && (
                  <span className="text-[10px] font-mono text-amber-600 ml-2">
                    Only {maxQty} left
                  </span>
                )}
              </div>
            </div>

            {/* Add to bag button */}
            <motion.button
              onClick={handleAdd}
              disabled={isOutOfStock || added}
              whileTap={isOutOfStock || added ? undefined : { scale: 0.97 }}
              className={`w-full h-12 rounded-2xl font-mono text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition cursor-pointer disabled:cursor-not-allowed ${
                added
                  ? "bg-emerald-500 text-white"
                  : isOutOfStock
                  ? "bg-neutral-300 text-neutral-500"
                  : "bg-neutral-950 text-white hover:bg-orange-500"
              }`}
            >
              {added ? (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  ADDED TO BAG!
                </>
              ) : isOutOfStock ? (
                "OUT OF STOCK"
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  ADD TO BAG — ₵{(displayPrice * quantity).toFixed(2)}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
