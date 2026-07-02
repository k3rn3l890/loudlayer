import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "../types";
import { useCart } from "../lib/CartContext";

const SIZES = ["S", "M", "L", "XL"] as const;

interface AddToCartModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function AddToCartModal({ product, onClose }: AddToCartModalProps) {
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<typeof SIZES[number]>("M");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

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
  const displayPrice = product.discountPrice ?? product.price;

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedSize);
    }
    setAdded(true);
    setTimeout(() => onClose(), 800);
  };

  const spring = { type: "spring", stiffness: 180, damping: 22 } as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal - Double-Bezel Architecture */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 24 }}
          transition={spring}
          className="relative w-full max-w-4xl overflow-hidden"
        >
          {/* Outer Shell */}
          <div className="bg-neutral-950/5 ring-1 ring-white/10 rounded-[2rem] p-1.5">
            {/* Inner Core */}
            <div className="bg-zinc-50 rounded-[calc(2rem-0.375rem)] overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-neutral-100 transition cursor-pointer shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]"
              >
                <X className="w-4 h-4 text-neutral-700" />
              </button>

              {/* Split Layout: Image Left | Content Right */}
              <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] min-h-[520px]">
                {/* IMAGE PANEL */}
                <div className="relative bg-neutral-100 md:min-h-[520px]">
                  <img
                    src={product.image || "/placeholder-product.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Subtle gradient fade at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    {product.discountPercentage && (
                      <span className="bg-orange-500 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full shadow-[0_4px_16px_-4px_rgba(249,115,22,0.4)]">
                        {product.discountPercentage} OFF
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="bg-neutral-900 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full shadow-[0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                        OUT OF STOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* CONTENT PANEL */}
                <div className="p-6 md:p-8 flex flex-col justify-center overflow-y-auto max-h-[90vh]">
                  {/* Product Meta */}
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-orange-500 font-bold">
                      {product.category}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-sans font-bold text-neutral-950 leading-tight tracking-tight">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-3">
                      {product.discountPrice ? (
                        <>
                          <span className="text-2xl md:text-3xl font-sans font-black text-orange-500">
                            ₵{product.discountPrice}
                          </span>
                          <span className="text-lg font-sans text-neutral-400 line-through">
                            ₵{product.price}
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl md:text-3xl font-sans font-black text-neutral-950">
                          ₵{product.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Size Selector */}
                  <div className="pt-2 md:pt-4">
                    <label className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.15em] block mb-3">
                      SELECT SIZE
                    </label>
                    <div className="flex gap-2.5" role="radiogroup" aria-label="Select size">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          disabled={isOutOfStock}
                          role="radio"
                          aria-checked={selectedSize === s}
                          className={`relative w-12 h-12 rounded-full font-mono text-xs font-bold transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-center border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group ${
                            selectedSize === s
                              ? "bg-neutral-950 border-neutral-950 text-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.25)]"
                              : "bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)]"
                          }`}
                        >
                          {s}
                          {/* Magnetic inner ring */}
                          <span className="absolute inset-0 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="pt-4 md:pt-6">
                    <label className="font-mono text-[10px] text-neutral-500 uppercase tracking-[0.15em] block mb-3">
                      QUANTITY
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="w-12 h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:border-neutral-400 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-14 text-center font-mono text-lg font-bold text-neutral-950 tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty || isOutOfStock}
                        className="w-12 h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:border-neutral-400 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-neutral-700 hover:text-neutral-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {maxQty < 10 && maxQty > 0 && (
                        <span className="text-[10px] font-mono text-amber-600 ml-1">
                          Only {maxQty} left
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Bag Button - Button-in-Button Pattern */}
                  <motion.button
                    onClick={handleAdd}
                    disabled={isOutOfStock || added}
                    whileHover={isOutOfStock || added ? undefined : { scale: 1.01 }}
                    whileTap={isOutOfStock || added ? undefined : { scale: 0.98 }}
                    className={`relative w-full h-14 rounded-full font-mono text-xs font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] cursor-pointer disabled:cursor-not-allowed overflow-hidden ${
                      added
                        ? "bg-emerald-500 text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.4)]"
                        : isOutOfStock
                        ? "bg-neutral-200 text-neutral-400"
                        : "bg-neutral-950 text-white hover:bg-orange-500 hover:shadow-[0_12px_32px_-8px_rgba(249,115,22,0.4)]"
                    }`}
                  >
                    {/* Main Label */}
                    <span className="relative z-10 flex items-center gap-2">
                      {added ? (
                        <>
                          <ShoppingBag className="w-4.5 h-4.5" />
                          ADDED TO BAG
                        </>
                      ) : isOutOfStock ? (
                        "OUT OF STOCK"
                      ) : (
                        <>
                          <ShoppingBag className="w-4.5 h-4.5" />
                          ADD TO BAG
                        </>
                      )}
                    </span>
                  </motion.button>
                <div className="pt-3 text-center">
                    <button
                      onClick={onClose}
                      className="font-mono text-[10px] text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-[0.15em]"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}