import { describe, it, expect } from "vitest";

// Test the mapDbProduct logic extracted from StorePage
// This is a pure function test - no rendering needed

interface DbProduct {
  id: number;
  slug: string;
  name: string;
  price: number;
  discount_price?: number | null;
  discount_percentage?: string | null;
  image?: string;
  category?: string;
  code?: string;
  tags?: string[] | string;
  description?: string;
  stock?: number;
}

function mapDbProduct(p: DbProduct) {
  let tags: string[] = [];
  if (Array.isArray(p.tags)) tags = p.tags;
  else if (typeof p.tags === "string") try { tags = JSON.parse(p.tags); } catch {}
  return {
    id: String(p.id),
    slug: p.slug || "",
    name: p.name,
    price: p.price,
    discountPrice: p.discount_price ?? undefined,
    discountPercentage: p.discount_percentage ?? undefined,
    image: p.image || "/placeholder-product.svg",
    category: p.category || "",
    code: p.code ?? undefined,
    tags,
    description: p.description ?? undefined,
    stock: p.stock ?? 0,
  };
}

describe("mapDbProduct", () => {
  it("maps a full DB product to frontend Product", () => {
    const dbProduct: DbProduct = {
      id: 1,
      slug: "test-product",
      name: "Test Product",
      price: 99.99,
      discount_price: 79.99,
      discount_percentage: "20%",
      image: "/uploads/test.jpg",
      category: "Jacket",
      code: "TST-01",
      tags: ["Premium", "Limited"],
      description: "A test product",
      stock: 10,
    };

    const result = mapDbProduct(dbProduct);
    expect(result.id).toBe("1");
    expect(result.name).toBe("Test Product");
    expect(result.price).toBe(99.99);
    expect(result.discountPrice).toBe(79.99);
    expect(result.discountPercentage).toBe("20%");
    expect(result.image).toBe("/uploads/test.jpg");
    expect(result.category).toBe("Jacket");
    expect(result.code).toBe("TST-01");
    expect(result.tags).toEqual(["Premium", "Limited"]);
    expect(result.stock).toBe(10);
  });

  it("handles null/undefined fields gracefully", () => {
    const dbProduct: DbProduct = {
      id: 2,
      slug: "minimal",
      name: "Minimal",
      price: 50,
    };

    const result = mapDbProduct(dbProduct);
    expect(result.discountPrice).toBeUndefined();
    expect(result.discountPercentage).toBeUndefined();
    expect(result.image).toBe("/placeholder-product.svg");
    expect(result.category).toBe("");
    expect(result.code).toBeUndefined();
    expect(result.tags).toEqual([]);
    expect(result.stock).toBe(0);
  });

  it("parses JSON string tags", () => {
    const dbProduct: DbProduct = {
      id: 3,
      slug: "json-tags",
      name: "JSON Tags",
      price: 30,
      tags: '["tag1", "tag2"]',
    };

    const result = mapDbProduct(dbProduct);
    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  it("handles invalid JSON tags gracefully", () => {
    const dbProduct: DbProduct = {
      id: 4,
      slug: "bad-tags",
      name: "Bad Tags",
      price: 30,
      tags: "not-json",
    };

    const result = mapDbProduct(dbProduct);
    expect(result.tags).toEqual([]);
  });

  it("handles numeric id conversion to string", () => {
    const dbProduct: DbProduct = {
      id: 999,
      slug: "num-id",
      name: "Num ID",
      price: 10,
    };

    const result = mapDbProduct(dbProduct);
    expect(typeof result.id).toBe("string");
    expect(result.id).toBe("999");
  });
});
