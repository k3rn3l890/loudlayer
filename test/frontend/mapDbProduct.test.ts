import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/lib/supabase", () => ({
  resolveImage: (image?: string | null, fallback = "/placeholder-product.svg") => {
    if (!image) return fallback;
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("/uploads/")) {
      return `https://project.supabase.co/storage/v1/object/public/product-images/legacy/${image.slice("/uploads/".length)}`;
    }
    return image;
  },
}));

import { mapDbProduct } from "../../src/lib/productMapper";

describe("mapDbProduct", () => {
  it("maps a full DB product to the frontend Product shape", () => {
    const result = mapDbProduct({
      id: 1,
      slug: "test-product",
      name: "Test Product",
      price: "99.99",
      discount_price: "79.99",
      discount_percentage: "20%",
      image: "/uploads/test.jpg",
      category: "Jacket",
      code: "TST-01",
      tags: ["Premium", "Limited"],
      description: "A test product",
      stock: 10,
    });

    expect(result).toEqual({
      id: "1",
      slug: "test-product",
      name: "Test Product",
      price: 99.99,
      discountPrice: 79.99,
      discountPercentage: "20%",
      image:
        "https://project.supabase.co/storage/v1/object/public/product-images/legacy/test.jpg",
      category: "Jacket",
      code: "TST-01",
      tags: ["Premium", "Limited"],
      description: "A test product",
      stock: 10,
    });
  });

  it("handles null/undefined fields gracefully", () => {
    const result = mapDbProduct({ id: 2, slug: "minimal", name: "Minimal", price: 50 });

    expect(result.discountPrice).toBeUndefined();
    expect(result.discountPercentage).toBeUndefined();
    expect(result.image).toBe("/placeholder-product.svg");
    expect(result.category).toBe("");
    expect(result.code).toBeUndefined();
    expect(result.tags).toEqual([]);
    expect(result.stock).toBe(0);
  });

  it("parses JSON string tags", () => {
    const result = mapDbProduct({
      id: 3,
      slug: "json-tags",
      name: "JSON Tags",
      price: 30,
      tags: '["tag1", "tag2"]',
    });

    expect(result.tags).toEqual(["tag1", "tag2"]);
  });

  it("handles malformed JSON tags gracefully", () => {
    const result = mapDbProduct({
      id: 4,
      slug: "bad-tags",
      name: "Bad Tags",
      price: 30,
      tags: "not-json",
    });

    expect(result.tags).toEqual([]);
  });

  it("keeps absolute image URLs untouched", () => {
    const result = mapDbProduct({
      id: 5,
      slug: "cdn",
      name: "CDN",
      price: 10,
      image: "https://cdn.example.com/jacket.jpg",
    });

    expect(result.image).toBe("https://cdn.example.com/jacket.jpg");
  });

  it("converts numeric ids to strings", () => {
    const result = mapDbProduct({ id: 999, slug: "num-id", name: "Num ID", price: 10 });

    expect(typeof result.id).toBe("string");
    expect(result.id).toBe("999");
  });
});
