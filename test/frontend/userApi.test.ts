import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: { getUser: vi.fn() },
    storage: { from: vi.fn() },
  },
  resolveImage: (image?: string | null, fallback = "/placeholder-product.svg") => {
    if (!image) return fallback;
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("/uploads/")) {
      return `https://project.supabase.co/storage/v1/object/public/product-images/legacy/${image.slice("/uploads/".length)}`;
    }
    return image;
  },
  PRODUCT_IMAGES_BUCKET: "product-images",
}));

import { supabase } from "../../src/lib/supabase";
import {
  getProducts,
  getProductBySlug,
  getProductReviews,
  createReview,
  createOrder,
  getMyOrders,
} from "../../src/lib/userApi";

const from = supabase.from as unknown as ReturnType<typeof vi.fn>;
const rpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;
const getUser = supabase.auth.getUser as unknown as ReturnType<typeof vi.fn>;

interface QueryResult {
  data?: unknown;
  error?: { message: string; code?: string } | null;
}

/** Minimal thenable stand-in for a PostgREST query builder. */
function createQuery(result: QueryResult) {
  const query: any = {};
  query.select = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.or = vi.fn(() => query);
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.maybeSingle = vi.fn(() => Promise.resolve(result));
  query.single = vi.fn(() => Promise.resolve(result));
  query.then = (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve);
  return query;
}

const dbRow = {
  id: 7,
  slug: "test-jacket",
  name: "Test Jacket",
  price: "120.00",
  discount_price: null,
  discount_percentage: null,
  image: "/uploads/test.jpg",
  category: "Jacket",
  code: "TST-01",
  description: "A jacket",
  tags: ["Premium"],
  stock: 4,
  visible: true,
};

describe("userApi (Supabase)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProducts", () => {
    it("queries visible products, newest first, and maps the rows", async () => {
      const query = createQuery({ data: [dbRow], error: null });
      from.mockReturnValue(query);

      const products = await getProducts({ visible: true });

      expect(from).toHaveBeenCalledWith("products");
      expect(query.select).toHaveBeenCalledWith("*");
      expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(query.eq).toHaveBeenCalledWith("visible", true);
      // "120.00" arrives as a numeric string from PostgREST
      expect(products[0]).toMatchObject({
        id: "7",
        name: "Test Jacket",
        price: 120,
        image:
          "https://project.supabase.co/storage/v1/object/public/product-images/legacy/test.jpg",
        stock: 4,
      });
    });

    it("applies a case-insensitive search across name and code", async () => {
      const query = createQuery({ data: [], error: null });
      from.mockReturnValue(query);

      await getProducts({ search: "jacket" });

      expect(query.or).toHaveBeenCalledWith("name.ilike.%jacket%,code.ilike.%jacket%");
    });

    it("throws the Supabase error message", async () => {
      from.mockReturnValue(createQuery({ data: null, error: { message: "relation missing" } }));

      await expect(getProducts()).rejects.toThrow("relation missing");
    });
  });

  describe("getProductBySlug", () => {
    it("returns the mapped product", async () => {
      const query = createQuery({ data: dbRow, error: null });
      from.mockReturnValue(query);

      const product = await getProductBySlug("test-jacket");

      expect(query.eq).toHaveBeenCalledWith("slug", "test-jacket");
      expect(query.eq).toHaveBeenCalledWith("visible", true);
      expect(product.id).toBe("7");
    });

    it("throws when the product does not exist", async () => {
      from.mockReturnValue(createQuery({ data: null, error: null }));

      await expect(getProductBySlug("missing")).rejects.toThrow("Product not found");
    });
  });

  describe("getProductReviews", () => {
    it("calls the get_product_reviews RPC", async () => {
      const payload = { reviews: [{ id: 1 }], stats: { count: 1, average: 5 } };
      rpc.mockResolvedValue({ data: payload, error: null });

      await expect(getProductReviews("test-jacket")).resolves.toEqual(payload);
      expect(rpc).toHaveBeenCalledWith("get_product_reviews", { p_slug: "test-jacket" });
    });

    it("throws when the RPC fails", async () => {
      rpc.mockResolvedValue({ data: null, error: { message: "Product not found" } });

      await expect(getProductReviews("missing")).rejects.toThrow("Product not found");
    });
  });

  describe("createReview", () => {
    it("inserts a review for the signed-in user", async () => {
      from
        .mockReturnValueOnce(createQuery({ data: { id: 7 }, error: null }))
        .mockReturnValueOnce(
          createQuery({ data: { id: 3, rating: 5, body: "Great", created_at: "2026-01-01" }, error: null })
        )
        .mockReturnValueOnce(createQuery({ data: { name: "Devin" }, error: null }));

      getUser.mockResolvedValue({ data: { user: { id: "uuid-1" } } });

      const review = await createReview("test-jacket", 5, "Great");

      expect(review).toEqual({
        id: 3,
        rating: 5,
        body: "Great",
        created_at: "2026-01-01",
        user_name: "Devin",
      });
      expect(rpc).not.toHaveBeenCalled();
    });

    it("friendly-errors on the one-review-per-product constraint", async () => {
      from
        .mockReturnValueOnce(createQuery({ data: { id: 7 }, error: null }))
        .mockReturnValueOnce(
          createQuery({ data: null, error: { message: "duplicate key", code: "23505" } })
        );

      getUser.mockResolvedValue({ data: { user: { id: "uuid-1" } } });

      await expect(createReview("test-jacket", 4, "Again")).rejects.toThrow(
        "You have already reviewed this product"
      );
    });

    it("requires a signed-in user", async () => {
      from.mockReturnValueOnce(createQuery({ data: { id: 7 }, error: null }));
      getUser.mockResolvedValue({ data: { user: null } });

      await expect(createReview("test-jacket", 5, "Hi")).rejects.toThrow(
        "Please sign in to review this product"
      );
    });
  });

  describe("createOrder", () => {
    it("sends the checkout payload to the create_order RPC", async () => {
      const result = {
        success: true,
        order: { id: 12, order_number: "ORD-1" },
        items: [{ id: 1 }],
        skipped_items: null,
      };
      rpc.mockResolvedValue({ data: result, error: null });

      const response = await createOrder({
        items: [{ product_id: 5, name: "Jacket", quantity: 2, size: "M" }],
        customer_name: "Devin",
        shipping_address: "1 Test Street",
      });

      expect(response).toEqual(result);
      expect(rpc).toHaveBeenCalledWith("create_order", {
        p_items: [{ product_id: 5, name: "Jacket", quantity: 2, size: "M" }],
        p_customer_name: "Devin",
        p_customer_phone: null,
        p_shipping_address: "1 Test Street",
        p_notes: null,
      });
    });

    it("throws with skipped items when the order cannot be placed", async () => {
      const skipped = [{ name: "Jacket", reason: "Only 0 available" }];
      rpc.mockResolvedValue({
        data: { success: false, error: "All items are out of stock", skipped_items: skipped },
        error: null,
      });

      try {
        await createOrder({ items: [{ product_id: 5, quantity: 1 }] });
        expect.unreachable("createOrder should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("All items are out of stock");
        expect(error.skipped_items).toEqual(skipped);
      }
    });

    it("throws when the RPC itself fails", async () => {
      rpc.mockResolvedValue({ data: null, error: { message: "Unauthorized" } });

      await expect(createOrder({ items: [] })).rejects.toThrow("Unauthorized");
    });
  });

  describe("getMyOrders", () => {
    it("returns the signed-in customer's orders", async () => {
      const query = createQuery({ data: [{ id: 1, order_number: "ORD-1" }], error: null });
      from.mockReturnValue(query);

      await expect(getMyOrders()).resolves.toEqual([{ id: 1, order_number: "ORD-1" }]);
      expect(from).toHaveBeenCalledWith("orders");
      expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    });

    it("throws on query errors", async () => {
      from.mockReturnValue(createQuery({ data: null, error: { message: "permission denied" } }));

      await expect(getMyOrders()).rejects.toThrow("permission denied");
    });
  });
});
