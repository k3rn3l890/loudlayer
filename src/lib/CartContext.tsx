import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import { Product, CartItem } from "../types";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase";
import { mapDbProduct } from "./productMapper";

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

function numericProductId(id: string | number): number {
  if (typeof id === "number") return id;
  const parsed = Number(String(id).replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function rowToCartItem(row: any): CartItem {
  return {
    product: mapDbProduct(row.product_data),
    quantity: row.quantity,
    selectedSize: row.size || undefined,
  };
}

function rowToWishlistItem(row: any): Product {
  return mapDbProduct(row.product_data);
}

async function fetchServerCart(): Promise<CartItem[] | null> {
  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return null;
  return (data || []).map(rowToCartItem);
}

async function fetchServerWishlist(): Promise<Product[] | null> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return null;
  return (data || []).map(rowToWishlistItem);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prevUserId = useRef<string | null>(userId);
  const loadingServer = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(false);
  const syncChain = useRef<Promise<unknown>>(Promise.resolve());

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Serialize server writes so rapid cart updates cannot land out of order.
  const enqueue = (fn: () => PromiseLike<unknown>) => {
    syncChain.current = syncChain.current.then(fn).catch(() => {});
  };

  // Load data when user ID changes (login / logout / initial mount)
  useEffect(() => {
    mounted.current = true;
    const load = async () => {
      if (userId !== null) {
        loadingServer.current = true;
        ready.current = false;

        const guestCart = loadFromStorage<CartItem[]>(GUEST_CART_KEY, []);
        const guestWishlist = loadFromStorage<Product[]>(GUEST_WISHLIST_KEY, []);

        // Merge the browsing-session cart into the account's saved cart.
        if (guestCart.length > 0) {
          const serverCart = (await fetchServerCart()) || [];
          const merged = new Map<string, { product_id: number; quantity: number; size: string; stock: number }>();

          for (const item of [...serverCart, ...guestCart]) {
            const productId = numericProductId(item.product.id);
            if (!productId) continue;
            const size = item.selectedSize || "";
            const key = `${productId}::${size}`;
            const existing = merged.get(key);
            const stock = item.product.stock ?? Number.MAX_SAFE_INTEGER;
            if (existing) {
              existing.quantity = Math.min(existing.quantity + item.quantity, stock);
              existing.stock = stock;
            } else {
              merged.set(key, {
                product_id: productId,
                quantity: Math.min(item.quantity, stock),
                size,
                stock,
              });
            }
          }

          await supabase.rpc("replace_user_cart", {
            p_items: Array.from(merged.values()).map(({ product_id, quantity, size }) => ({
              product_id,
              quantity,
              size,
            })),
          });
        }

        if (guestWishlist.length > 0) {
          const ids = Array.from(
            new Set(
              guestWishlist
                .map((item) => numericProductId(item.id))
                .filter((id) => id > 0)
            )
          );
          await supabase.rpc("replace_user_wishlist", { p_product_ids: ids });
        }

        const [cart, wish] = await Promise.all([fetchServerCart(), fetchServerWishlist()]);
        setCartItems(cart ?? []);
        setWishlist(wish ?? []);

        if (guestCart.length > 0 || guestWishlist.length > 0) {
          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem(GUEST_WISHLIST_KEY);
        }

        loadingServer.current = false;
        ready.current = true;
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

  // Sync to Supabase when logged in and state changes
  useEffect(() => {
    if (userId === null || loadingServer.current || !ready.current || !mounted.current) return;

    const payload = cartItems
      .map((item) => ({
        product_id: numericProductId(item.product.id),
        quantity: item.quantity,
        size: item.selectedSize || "",
      }))
      .filter((item) => item.product_id > 0);

    enqueue(() => supabase.rpc("replace_user_cart", { p_items: payload }));
  }, [cartItems, userId]);

  useEffect(() => {
    if (userId === null || loadingServer.current || !ready.current || !mounted.current) return;

    const ids = wishlist
      .map((item) => numericProductId(item.id))
      .filter((id) => id > 0);

    enqueue(() => supabase.rpc("replace_user_wishlist", { p_product_ids: ids }));
  }, [wishlist, userId]);

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
