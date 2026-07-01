import React, { useState } from "react";
import { Link } from "react-router-dom";
import { X, Trash2, Plus, Minus, CreditCard, ShoppingBag, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CartItem } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  onRemoveItem: (productId: string, selectedSize?: string) => void;
  onClearCart: () => void;
  user?: { id: number; email: string; name: string } | null;
  onCheckout?: (items: CartItem[], address: string) => Promise<void>;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  user,
  onCheckout,
}: CartDrawerProps) {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);

  // Math
  const itemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const shippingFees = 20;
  const grandTotal = subtotal + shippingFees;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !city || !zip) return;
    if (onCheckout && user) {
      try {
        await onCheckout(cartItems, `${address}, ${city}, ${zip}`);
        setOrderCompleted(true);
        setAddress("");
        setCity("");
        setZip("");
      } catch {
        // error handled by parent
      }
    }
  };

  const resetFlow = () => {
    setOrderCompleted(false);
    setIsCheckingOut(false);
    onClearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs z-50 cursor-pointer"
          />

          {/* Side Panel Drawer wrapper container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", mass: 0.6, damping: 20 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-neutral-100"
          >
            {/* Header section with itemsCount */}
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-neutral-800" />
                <h3 className="font-sans font-bold text-lg text-neutral-900">
                  Your Shopping Bag
                </h3>
                <span className="bg-neutral-900 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {itemsCount}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 -mr-1.5 rounded-full hover:bg-neutral-200 transition text-neutral-500 hover:text-neutral-900 cursor-pointer"
                aria-label="Close Bag"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle section body: toggle items vs Checkout form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {orderCompleted ? (
                /* Order Completion screens */
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <CheckCircle className="w-16 h-16 text-orange-500 animate-bounce mb-4" />
                  <h3 className="text-2xl font-sans font-black text-neutral-900 tracking-tight">
                    Order Secured!
                  </h3>
                  <p className="text-xs text-neutral-500 mt-2 font-mono uppercase tracking-wider">
                    Receipt #VL-{Math.floor(1000 + Math.random() * 9000)}-2026
                  </p>
                  
                  <div className="p-4 bg-zinc-50 border border-neutral-200 rounded-2xl w-full mt-6 text-left space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
                      DELIVERY ADDRESS DETAILS:
                    </span>
                    <p className="text-xs font-semibold text-neutral-800">
                      LoudLayer Shipping
                    </p>
                    <p className="text-xs text-neutral-600">
                      Expected shipment arrival in 3-5 business days. Notification code sent to verified email.
                    </p>
                  </div>

                  <button
                    onClick={resetFlow}
                    className="mt-8 w-full h-11 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full transition cursor-pointer"
                  >
                    CONTINUE EXPLORING
                  </button>
                </div>
              ) : isCheckingOut ? (
                /* Checkout details form info */
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  <div className="pb-2">
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(false)}
                      className="text-xs font-mono text-neutral-400 hover:text-neutral-900 underline"
                    >
                      ← Back to Bag Items
                    </button>
                  </div>

                  <h4 className="text-base font-sans font-extrabold text-neutral-900 pb-2 border-b border-neutral-100">
                    Shipping & Billing Address
                  </h4>

                  <div className="space-y-3 pt-2">
                    <div>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block mb-1">
                        Street Address
                      </span>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Fashion Ave"
                        className="w-full px-3 py-2 border border-neutral-200 text-xs rounded-xl focus:outline-none focus:border-neutral-950 text-neutral-900"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block mb-1">
                          City
                        </span>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="New York"
                          className="w-full px-3 py-2 border border-neutral-200 text-xs rounded-xl focus:outline-none focus:border-neutral-950 text-neutral-900"
                        />
                      </div>
                      
                      <div>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400 block mb-1">
                          ZIP / Postal Code
                        </span>
                        <input
                          type="text"
                          required
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          placeholder="10001"
                          className="w-full px-3 py-2 border border-neutral-200 text-xs rounded-xl focus:outline-none focus:border-neutral-950 text-neutral-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 px-4 py-3 rounded-2xl border border-neutral-200/50 mt-6 space-y-1">
                    <span className="font-mono text-[8px] text-orange-500 font-bold uppercase tracking-wider">
                      SIMULATE SECURE TRANSACTION
                    </span>
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      We accept all major mock currencies. Billing will be securely simulated upon hitting Submit.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-6 h-12 bg-orange-500 hover:bg-orange-600 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full transition flex items-center justify-center gap-2 cursor-pointer shadow shadow-orange-500/20"
                  >
                    <CreditCard className="w-4 h-4" /> CONCLUDE PAYMENT
                  </button>
                </form>
              ) : cartItems.length === 0 ? (
                /* Cart Empty states */
                <div className="flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-neutral-400" />
                  </div>
                  <h4 className="font-sans font-bold text-neutral-950">Your Bag is empty</h4>
                  <p className="text-xs text-neutral-500 max-w-[200px]">
                    Browse our premium jackets or shirts collections and add them to carry in your active bag.
                  </p>
                  <button
                    onClick={onClose}
                    className="h-10 px-5 rounded-full bg-neutral-950 text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-orange-500 transition cursor-pointer"
                  >
                    CONTINUE SHOPPING
                  </button>
                </div>
              ) : (
                /* Standard Bag items list */
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <Link
                      key={`${item.product.id}-${item.selectedSize}`}
                      to={`/products/${item.product.slug}`}
                      onClick={onClose}
                      className="flex gap-4 p-3 bg-neutral-50 border border-neutral-100 rounded-2xl hover:border-neutral-200 transition group cursor-pointer"
                    >
                      {/* Item pic */}
                      <div className="w-20 aspect-[4/5] rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Description column */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-neutral-900 leading-tight pr-4 line-clamp-1">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRemoveItem(item.product.id, item.selectedSize); }}
                              className="text-neutral-400 hover:text-red-500 p-1 rounded-full transition cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <span className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider block mt-0.5">
                            SIZE: <span className="text-neutral-800 font-bold underline">{item.selectedSize || "M"}</span>
                          </span>
                          {item.product.stock !== undefined && (
                            <span className={`font-mono text-[8px] mt-1 block ${item.product.stock === 0 ? "text-red-500" : item.product.stock < 5 ? "text-amber-500" : "text-green-600"}`}>
                              {item.product.stock === 0 ? "Out of Stock" : `${item.product.stock} available`}
                            </span>
                          )}
                        </div>

                        {/* Increment counters and prices */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100/50">
                          {/* Counter */}
                          <div className="flex items-center gap-1 border border-neutral-200 bg-white rounded-full p-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedSize); }}
                              className="p-1 hover:bg-neutral-100 rounded-full transition text-neutral-500 cursor-pointer"
                              aria-label="Decrease"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs font-bold px-2 text-neutral-800 min-w-[14px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onUpdateQuantity(item.product.id, Math.min((item.product.stock ?? item.quantity), item.quantity + 1), item.selectedSize); }}
                              disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                              className={`p-1 rounded-full transition cursor-pointer ${
                                item.product.stock !== undefined && item.quantity >= item.product.stock
                                  ? "text-neutral-300 cursor-not-allowed"
                                  : "hover:bg-neutral-100 text-neutral-500"
                              }`}
                              aria-label="Increase"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-sm font-sans font-black text-neutral-900">
                            ₵{(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

            </div>

            {/* Bottom calculation blocks of standard drawer */}
            {!orderCompleted && cartItems.length > 0 && (
              <div className="p-6 border-t border-neutral-100 bg-zinc-50 space-y-4">
                <div className="space-y-1.5 text-xs font-sans text-neutral-600">
                  <div className="flex justify-between">
                    <span>Products Subtotal</span>
                    <span className="font-mono text-neutral-800 font-semibold">₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LoudLayer Shipping</span>
                    <span className="font-mono text-neutral-800 font-semibold">
                      ₵{shippingFees.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm text-neutral-900 font-bold">
                    <span>Grand Estimated Total</span>
                    <span className="font-mono text-neutral-950 font-black text-base">₵{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {!isCheckingOut ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full h-12 bg-neutral-950 hover:bg-orange-500 text-white font-mono text-xs font-bold uppercase tracking-widest rounded-full transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-neutral-950/10"
                  >
                    PROCEED TO SHIPMENT →
                  </button>
                ) : null}
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
