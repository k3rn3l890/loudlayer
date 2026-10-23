import type { Product } from "../types";
import { resolveImage } from "./supabase";

/**
 * Maps a `products` row (Supabase/Postgres, snake_case) to the storefront
 * `Product` shape. Kept in one place — previously duplicated in three files.
 */
export function mapDbProduct(row: any): Product {
  let tags: string[] = [];
  if (Array.isArray(row?.tags)) {
    tags = row.tags;
  } else if (typeof row?.tags === "string") {
    try {
      const parsed = JSON.parse(row.tags);
      if (Array.isArray(parsed)) tags = parsed;
    } catch {
      // ignore malformed tags
    }
  }

  return {
    id: String(row.id),
    slug: row.slug || "",
    name: row.name || "",
    price: Number(row.price ?? 0),
    discountPrice: row.discount_price != null ? Number(row.discount_price) : undefined,
    discountPercentage: row.discount_percentage ?? undefined,
    image: resolveImage(row.image),
    category: row.category || "",
    code: row.code ?? undefined,
    tags,
    description: row.description ?? undefined,
    stock: row.stock ?? 0,
  };
}
