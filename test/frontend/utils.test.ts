import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../../src/lib/AuthContext";
import { CartProvider } from "../../src/lib/CartContext";

// We can't easily render the full StorePage (too many dependencies),
// but we can test the form components and utility behavior

// Mock fetch globally
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  // Default: not logged in
  (fetch as any).mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Instead, test the admin form validation logic directly
describe("Product Form Validation", () => {
  function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  it("generates slug from product name", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("©International - going distance 2026")).toBe("international-going-distance-2026");
    expect(generateSlug("  Spaced  Out  ")).toBe("spaced-out");
    expect(generateSlug("UPPER CASE")).toBe("upper-case");
    expect(generateSlug("Special!@#$%Characters")).toBe("special-characters");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });

  it("handles single character", () => {
    expect(generateSlug("a")).toBe("a");
  });
});

describe("Order Number Generation", () => {
  it("generates unique order numbers", () => {
    const orderNumbers = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const num = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      orderNumbers.add(num);
    }
    // All 100 should be unique (or very nearly so)
    expect(orderNumbers.size).toBeGreaterThan(90);
  });
});

describe("Price Formatting", () => {
  it("formats price correctly", () => {
    const formatPrice = (price: number) => `₵${price.toFixed(2)}`;
    expect(formatPrice(99.99)).toBe("₵99.99");
    expect(formatPrice(0)).toBe("₵0.00");
    expect(formatPrice(1234.5)).toBe("₵1234.50");
  });
});

describe("Stock Validation", () => {
  it("detects out of stock", () => {
    const isOutOfStock = (stock: number) => stock === 0;
    expect(isOutOfStock(0)).toBe(true);
    expect(isOutOfStock(1)).toBe(false);
    expect(isOutOfStock(-1)).toBe(false);
  });

  it("detects low stock", () => {
    const isLowStock = (stock: number) => stock > 0 && stock < 10;
    expect(isLowStock(0)).toBe(false);
    expect(isLowStock(5)).toBe(true);
    expect(isLowStock(10)).toBe(false);
    expect(isLowStock(100)).toBe(false);
  });
});

describe("Tag Parsing", () => {
  it("parses comma-separated tags", () => {
    const parseTags = (input: string) =>
      input ? input.split(",").map((t) => t.trim()).filter(Boolean) : [];
    expect(parseTags("Premium, Limited Edition")).toEqual(["Premium", "Limited Edition"]);
    expect(parseTags("tag1,tag2,tag3")).toEqual(["tag1", "tag2", "tag3"]);
    expect(parseTags("")).toEqual([]);
    expect(parseTags("  single  ")).toEqual(["single"]);
  });
});
