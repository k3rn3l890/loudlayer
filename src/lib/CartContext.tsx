import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { Product, CartItem } from "../types";
import { useAuth } from "./AuthContext";
import { apiGet, apiPut } from "./userApi";

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

function mapCartForApi(items: CartItem[]) {
  return items.map((i) => ({
    product: { ...i.product },
    quantity: i.quantity,
    selectedSize: i.selectedSize || "",
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prevUserId = useRef<number | null>(userId);
  const loadingServer = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(false);
  const localMutationCount = useRef(0);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Load data when user ID changes (login / logout / initial mount)
  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      if (userId !== null) {
        // Logged in: migrate guest items, then fetch from server
        loadingServer.current = true;
        ready.current = false;

        const gCart = loadFromStorage<CartItem[]>(GUEST_CART_KEY, []);
        const gWish = loadFromStorage<Product[]>(GUEST_WISHLIST_KEY, []);
        if (gCart.length > 0 || gWish.length > 0) {
          await Promise.all([
            apiPut("/cart", { items: mapCartForApi(gCart) }),
            apiPut("/wishlist", { items: gWish.map((p) => ({ ...p })) }),
          ]);
          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }

        const mutationSnapshot = localMutationCount.current;

        try {
          const [cRes, wRes] = await Promise.all([
            apiGet<{ items: any[] }>("/cart"),
            apiGet<{ items: any[] }>("/wishlist"),
          ]);
          // Only apply server data if no local mutations happened during fetch
          // (prevents overwriting items the user added while loading)
          if (localMutationCount.current === mutationSnapshot) {
            setCartItems(
              cRes.items.map((i: any) => ({
                product: i.product_data as Product,
                quantity: i.quantity,
                selectedSize: i.size || undefined,
              }))
            );
            setWishlist(wRes.items.map((i: any) => i.product_data as Product));
          }
        } catch {
          if (localMutationCount.current === mutationSnapshot) {
            setCartItems([]);
            setWishlist([]);
          }
        } finally {
          loadingServer.current = false;
          ready.current = true;
        }
      } else {
        // Guest: load from localStorage (no server persistence)
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
    apiPut("/cart", { items: mapCartForApi(cartItems) }).catch(() => {});
    apiPut("/wishlist", { items: wishlist.map((p) => ({ ...p })) }).catch(() => {});
  }, [cartItems, wishlist, userId]);

  const cartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  const addToCart = (product: Product, size: string) => {
    localMutationCount.current++;
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
    localMutationCount.current++;
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
    localMutationCount.current++;
    setCartItems((prev) =>
      selectedSize !== undefined
        ? prev.filter((item) => !(item.product.id === productId && item.selectedSize === selectedSize))
        : prev.filter((item) => item.product.id !== productId)
    );
  };

  const clearCart = () => {
    localMutationCount.current++;
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