import { supabase, PRODUCT_IMAGES_BUCKET } from "../lib/supabase";

export interface ProductInput {
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null;
  discount_percentage?: string | null;
  image?: string;
  category?: string;
  code?: string | null;
  description?: string;
  tags?: string[];
  stock?: number;
  visible?: boolean;
}

export interface AdminOrderQuery {
  status?: string;
  search?: string;
}

async function requireAdmin(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) throw new Error("Unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || profile?.role !== "admin") {
    await supabase.auth.signOut();
    throw new Error("Admin access required");
  }
  return user.id;
}

async function uploadProductImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const storagePath = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export const adminApi = {
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const message = error.message.toLowerCase().includes("invalid login credentials")
        ? "Invalid email or password"
        : error.message;
      throw new Error(message);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      throw new Error("This account does not have admin access");
    }
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },

  async isAdmin(): Promise<boolean> {
    try {
      await requireAdmin();
      return true;
    } catch {
      return false;
    }
  },

  async getStats(): Promise<{ stats: any; recentOrders: any[] }> {
    const { data, error } = await supabase.rpc("admin_stats");
    if (error) throw new Error(error.message);
    return data as { stats: any; recentOrders: any[] };
  },

  async getProducts(search?: string): Promise<any[]> {
    let request = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (search) {
      request = request.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    const { data, error } = await request;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getProduct(id: number | string): Promise<any> {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) throw new Error(error.message);
    return data;
  },

  async saveProduct(
    id: number | string | null,
    input: ProductInput,
    imageFile?: File | null
  ): Promise<any> {
    const payload: Record<string, any> = { ...input };

    if (imageFile) {
      payload.image = await uploadProductImage(imageFile);
    } else if (id) {
      // Preserve the existing image on edit when no new file is selected.
      delete payload.image;
    } else {
      payload.image = payload.image || "";
    }

    if (id) {
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data;
  },

  async deleteProduct(id: number | string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async getOrders(query: AdminOrderQuery = {}): Promise<any[]> {
    let request = supabase.from("orders").select("*").order("created_at", { ascending: false });

    if (query.status && query.status !== "all") {
      request = request.eq("status", query.status);
    }
    if (query.search) {
      request = request.or(
        `order_number.ilike.%${query.search}%,customer_name.ilike.%${query.search}%,customer_email.ilike.%${query.search}%`
      );
    }

    const { data, error } = await request;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async getOrder(id: number | string): Promise<{ order: any; items: any[] }> {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();
    if (orderError) throw new Error(orderError.message);

    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("id", { ascending: true });
    if (itemsError) throw new Error(itemsError.message);

    return { order, items: items || [] };
  },

  async updateOrderStatus(id: number | string, status: string): Promise<any> {
    const { data, error } = await supabase.rpc("admin_update_order_status", {
      p_order_id: Number(id),
      p_status: status,
      p_notes: null,
    });
    if (error) throw new Error(error.message);
    return data;
  },
};
