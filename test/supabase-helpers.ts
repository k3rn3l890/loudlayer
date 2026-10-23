import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(url && serviceKey && anonKey);

if (!hasSupabaseEnv) {
  throw new Error(
    "Supabase tests need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY) in .env"
  );
}

export const supabaseUrl = url!;
export const service = createClient(url!, serviceKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const anon = createClient(url!, anonKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Unique per test file/worker so parallel files never collide. */
export const runId = `${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;

let seq = 0;
export function unique(prefix: string): string {
  seq += 1;
  return `${prefix}-${runId}-${seq}`;
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient;
}

/**
 * Creates a confirmed auth user through the service role, then signs in with
 * the anon key so every query carries a real user JWT (exercising RLS).
 */
export async function createTestUser(options: { role?: "admin" | "customer"; name?: string } = {}): Promise<TestUser> {
  const email = `${options.role === "admin" ? "test-admin" : "test-user"}-${runId}-${randomUUID().slice(0, 8)}@example.com`;
  const password = `Test-${randomUUID()}`;

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: options.name || "Test User" },
  });
  if (error) throw error;
  const id = data.user.id;

  if (options.role === "admin") {
    const { error: profileError } = await service
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", id);
    if (profileError) throw profileError;
  }

  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  return { id, email, password, client };
}

export interface TestProduct {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
}

export async function createTestProduct(overrides: Record<string, unknown> = {}): Promise<TestProduct> {
  const slug = (overrides.slug as string) || unique("test-product");
  const { data, error } = await service
    .from("products")
    .insert({
      slug,
      name: "Test Product",
      price: 19.99,
      stock: 5,
      category: "Test",
      image: "",
      visible: true,
      ...overrides,
    })
    .select("id, slug, name, price, stock")
    .single();

  if (error) throw error;
  return { ...data, price: Number(data.price) } as TestProduct;
}

export interface CleanupOptions {
  userIds?: string[];
  productIds?: number[];
  orderIds?: number[];
}

/** Deletes fixtures in FK-safe order. Safe to call with partial data. */
export async function cleanup(options: CleanupOptions): Promise<void> {
  const { userIds = [], productIds = [], orderIds = [] } = options;

  if (orderIds.length > 0) {
    await service.from("order_items").delete().in("order_id", orderIds);
    await service.from("orders").delete().in("id", orderIds);
  }
  if (userIds.length > 0) {
    // Orders owned by these users were removed above; remaining references are
    // profiles/cart/wishlist/reviews, all of which cascade from auth.users.
    await service.from("orders").delete().in("user_id", userIds);
  }
  if (productIds.length > 0) {
    await service.from("products").delete().in("id", productIds);
  }
  for (const id of userIds) {
    await service.auth.admin.deleteUser(id);
  }
}

/** Convenience: sign in a client for an already-created user. */
export async function signIn(email: string, password: string): Promise<SupabaseClient> {
  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}
