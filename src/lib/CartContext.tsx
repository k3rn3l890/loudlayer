import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { Product, CartItem } from "../types";
import { useAuth } from "./AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const GUEST_CART_KEY = "loudlayer_guest_cart";
const GUEST_WISHLIST_KEY = "loudlayer_guest_wishlist";

interface CartContextType {
  cartItems: CartItem[];
  wishlist: Product[];
  cartCount: number;
  addToCart: (product: Product, size: string) => void;
  updateQuantity: (productId: string, qty: number, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  clearCart: () => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prevUserId = useRef<string | null>(userId);
  const loadingServer = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Load data when user ID changes (login / logout / initial mount)
  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      if (userId !== null) {
        loadingServer.current = true;
        ready.current = false;

        // Migrate guest items to server
        const gCart = loadFromStorage<CartItem[]>(GUEST_CART_KEY, []);
        const gWish = loadFromStorage<Product[]>(GUEST_WISHLIST_KEY, []);
        if (gCart.length > 0 || gWish.length > 0) {
          try {
            // Sync cart items
            if (gCart.length > 0) {
              await fetch(`${API_URL}/api/cart`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  items: gCart.map((item) => ({
                    product: { id: parseInt(item.product.id.replace(/\D/g, "")) || 0, price: item.product.price },
                    quantity: item.quantity,
                    selectedSize: item.selectedSize || "",
                  })),
                }),
              });
            }
            // Sync wishlist items
            if (gWish.length > 0) {
              await fetch(`${API_URL}/api/wishlist`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ items: gWish.map((item) => ({ id: parseInt(item.id.replace(/\D/g, "")) || 0, ...item })) }),
              });
            }
          } catch {}
          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }

        try {
          const [cartRes, wishRes] = await Promise.all([
            fetch(`${API_URL}/api/cart`, { credentials: "include" }),
            fetch(`${API_URL}/api/wishlist`, { credentials: "include" }),
          ]);

          if (cartRes.ok) {
            const cartData = await cartRes.json();
            setCartItems(
              cartData.items.map((i: any) => ({
                product: typeof i.product_data === "string" ? JSON.parse(i.product_data) : i.product_data,
                quantity: i.quantity,
                selectedSize: i.size || undefined,
              }))
            );
          }
          if (wishRes.ok) {
            const wishData = await wishRes.json();
            setWishlist(wishData.items.map((i: any) => typeof i.product_data === "string" ? JSON.parse(i.product_data) : i.product_data));
          }
        } catch {
          setCartItems([]);
          setWishlist([]);
        } finally {
          loadingServer.current = false;
          ready.current = true;
        }
      } else {
        setCartItems(loadFromStorage<CartItem[]>(GUEST_CART_KEY, []));
        setWishlist(loadFromStorage<Product[]>(GUEST_WISHLIST_KEY, []));
        ready.current = true;
      }
    };

    const prev = prevUserId.current;
    if (prev !== userId) {
      prevUserId.current = userId;
      load();
    }
  }, [userId]);

  // Persist guest data to localStorage
  useEffect(() => {
    if (!ready.current || userId !== null || !mounted.current) return;
    saveToStorage(GUEST_CART_KEY, cartItems);
  }, [cartItems, userId]);

  useEffect(() => {
    if (!ready.current || userId !== null || !mounted.current) return;
    saveToStorage(GUEST_WISHLIST_KEY, wishlist);
  }, [wishlist, userId]);

  // Sync to server when logged in and state changes
  useEffect(() => {
    if (userId === null || loadingServer.current || !ready.current || !mounted.current) return;

    const syncCart = async () => {
      try {
        await fetch(`${API_URL}/api/cart`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              product: { id: parseInt(item.product.id.replace(/\D/g, "")) || 0, price: item.product.price },
              quantity: item.quantity,
              selectedSize: item.selectedSize || "",
            })),
          }),
        });
      } catch {}
    };

    const syncWishlist = async () => {
      try {
        await fetch(`${API_URL}/api/wishlist`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ items: wishlist.map((item) => ({ id: parseInt(item.id.replace(/\D/g, "")) || 0, ...item })) }),
        });
      } catch {}
    };

    syncCart();
    syncWishlist();
  }, [cartItems, wishlist, userId]);

  const cartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  const addToCart = (product: Product, size: string) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.selectedSize === size
      );
      if (existing) {
        if (existing.quantity >= (product.stock ?? 0)) return prev;
        return prev.map((item) =>
          item.product.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      if (product.stock !== undefined && product.stock <= 0) return prev;
      return [...prev, { product, quantity: 1, selectedSize: size }];
    });
  };

  const updateQuantity = (productId: string, qty: number, selectedSize?: string) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        if (selectedSize !== undefined && item.selectedSize !== selectedSize) return item;
        const maxQty = item.product.stock ?? qty;
        return { ...item, quantity: Math.min(qty, maxQty) };
      })
    );
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    setCartItems((prev) =>
      selectedSize !== undefined
        ? prev.filter((item) => !(item.product.id === productId && item.selectedSize === selectedSize))
        : prev.filter((item) => item.product.id !== productId)
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId: string) => wishlist.some((item) => item.id === productId);

  return (
    <CartContext.Provider value={{
      cartItems, wishlist, cartCount,
      addToCart, updateQuantity, removeFromCart, clearCart,
      addToWishlist, removeFromWishlist, isInWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
