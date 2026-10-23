import { supabase } from "./supabase";
import { mapDbProduct } from "./productMapper";
import type { Product } from "../types";

export interface ProductQuery {
  visible?: boolean;
  category?: string;
  search?: string;
}

export interface ReviewRecord {
  id: number;
  rating: number;
  body: string;
  created_at: string;
  user_name: string;
}

export interface ReviewStats {
  count: number;
  average: number;
}

export interface OrderItemInput {
  product_id: number | null;
  name?: string;
  price?: number;
  quantity: number;
  size?: string;
  image?: string;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  order: any;
  items: any[];
  skipped_items?: { name: string; reason: string }[] | null;
}

/** Storefront product list (replaces GET /api/products). */
export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  let request = supabase.from("products").select("*").order("created_at", { ascending: false });

  if (query.visible !== undefined) request = request.eq("visible", query.visible);
  if (query.category) request = request.eq("category", query.category);
  if (query.search) {
    request = request.or(`name.ilike.%${query.search}%,code.ilike.%${query.search}%`);
  }

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data || []).map(mapDbProduct);
}

/** Single visible product by slug (replaces GET /api/products/slug/:slug). */
export async function getProductBySlug(slug: string): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Product not found");
  return mapDbProduct(data);
}

/** Reviews + stats for a product (replaces GET /api/products/:slug/reviews). */
export async function getProductReviews(
  slug: string
): Promise<{ reviews: ReviewRecord[]; stats: ReviewStats }> {
  const { data, error } = await supabase.rpc("get_product_reviews", { p_slug: slug });
  if (error) throw new Error(error.message);
  return data as { reviews: ReviewRecord[]; stats: ReviewStats };
}

/** Submit a review (replaces POST /api/products/:slug/reviews). */
export async function createReview(
  slug: string,
  rating: number,
  body: string
): Promise<ReviewRecord> {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (productError) throw new Error(productError.message);
  if (!product) throw new Error("Product not found");

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) throw new Error("Please sign in to review this product");

  const { data, error } = await supabase
    .from("reviews")
    .insert({ product_id: product.id, user_id: authUser.id, rating, body })
    .select("id, rating, body, created_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("You have already reviewed this product");
    throw new Error(error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", authUser.id)
    .maybeSingle();

  return { ...(data as any), user_name: profile?.name || "" };
}

/** Place an order through the transactional create_order RPC. */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const { data, error } = await supabase.rpc("create_order", {
    p_items: input.items.map((item) => ({
      product_id: item.product_id,
      name: item.name ?? "",
      quantity: item.quantity,
      size: item.size ?? "",
    })),
    p_customer_name: input.customer_name ?? null,
    p_customer_phone: input.customer_phone ?? null,
    p_shipping_address: input.shipping_address ?? null,
    p_notes: input.notes ?? null,
  });

  if (error) throw new Error(error.message);

  const result = data as CreateOrderResult;
  if (!result.success) {
    const failure = new Error(result.error || "Checkout failed");
    (failure as any).skipped_items = result.skipped_items;
    throw failure;
  }
  return result;
}

/**
 * Fire-and-forget transactional email trigger (Supabase Edge Function).
 * Never blocks checkout — email failures are logged, not surfaced to the buyer.
 */
export async function notifyOrderEmails(
  orderId: number,
  type: "created" | "status",
  status?: string
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-order-emails", {
      body: { orderId, type, status },
    });
    if (error) console.warn("Order email notification failed:", error.message);
  } catch (error) {
    console.warn("Order email notification failed:", error);
  }
}

/** Signed-in customer's orders (replaces GET /api/orders/my). */
export async function getMyOrders(): Promise<any[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
