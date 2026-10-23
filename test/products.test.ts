import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  anon,
  createTestProduct,
  createTestUser,
  cleanup,
  service,
  unique,
  type TestUser,
} from "./supabase-helpers";

let admin: TestUser;
let customer: TestUser;
let visibleProduct: Awaited<ReturnType<typeof createTestProduct>>;
let hiddenProduct: Awaited<ReturnType<typeof createTestProduct>>;
const productIds: number[] = [];

beforeAll(async () => {
  admin = await createTestUser({ role: "admin" });
  customer = await createTestUser();
  visibleProduct = await createTestProduct({ name: "Visible Test Jacket", category: "Jacket" });
  hiddenProduct = await createTestProduct({ name: "Hidden Test Jacket", visible: false });
  productIds.push(visibleProduct.id, hiddenProduct.id);
});

afterAll(async () => {
  await cleanup({
    userIds: [admin.id, customer.id],
    productIds,
  });
});

describe("Products (Supabase + RLS)", () => {
  describe("public reads", () => {
    it("returns visible products to anonymous visitors", async () => {
      const { data, error } = await anon
        .from("products")
        .select("id, name, visible")
        .in("id", [visibleProduct.id, hiddenProduct.id]);

      expect(error).toBeNull();
      expect(data?.map((row) => row.id)).toEqual([visibleProduct.id]);
    });

    it("filters by visible and category", async () => {
      const { data, error } = await anon
        .from("products")
        .select("id, category, visible")
        .eq("visible", true)
        .eq("category", "Jacket")
        .in("id", [visibleProduct.id, hiddenProduct.id]);

      expect(error).toBeNull();
      expect(data).toEqual([
        expect.objectContaining({ id: visibleProduct.id, category: "Jacket", visible: true }),
      ]);
    });

    it("searches by name with ilike", async () => {
      const { data, error } = await anon
        .from("products")
        .select("id, name")
        .ilike("name", "%visible test jacket%")
        .in("id", [visibleProduct.id, hiddenProduct.id]);

      expect(error).toBeNull();
      expect(data).toEqual([expect.objectContaining({ id: visibleProduct.id })]);
    });

    it("fetches a single product by slug", async () => {
      const { data, error } = await anon
        .from("products")
        .select("id, slug")
        .eq("slug", visibleProduct.slug)
        .maybeSingle();

      expect(error).toBeNull();
      expect(data?.id).toBe(visibleProduct.id);
    });

    it("returns null for a non-existent slug", async () => {
      const { data } = await anon
        .from("products")
        .select("id")
        .eq("slug", "non-existent-slug")
        .maybeSingle();

      expect(data).toBeNull();
    });

    it("hides invisible products from visitors but not from admins", async () => {
      const { data: publicRows } = await anon
        .from("products")
        .select("id")
        .eq("id", hiddenProduct.id);
      expect(publicRows).toEqual([]);

      const { data: adminRows } = await admin.client
        .from("products")
        .select("id, visible")
        .eq("id", hiddenProduct.id)
        .maybeSingle();
      expect(adminRows?.id).toBe(hiddenProduct.id);
      expect(adminRows?.visible).toBe(false);
    });
  });

  describe("admin writes", () => {
    it("lets an admin create, update and delete a product", async () => {
      const slug = unique("admin-created");
      const { data: created, error: createError } = await admin.client
        .from("products")
        .insert({ slug, name: "Admin Created", price: 42.5, category: "Test", stock: 3 })
        .select("id, name, price, visible")
        .single();

      expect(createError).toBeNull();
      expect(created).toMatchObject({ name: "Admin Created", price: 42.5, visible: true });
      productIds.push(created.id);

      const { data: updated, error: updateError } = await admin.client
        .from("products")
        .update({ name: "Admin Updated", visible: false })
        .eq("id", created.id)
        .select("id, name, visible")
        .single();

      expect(updateError).toBeNull();
      expect(updated).toMatchObject({ name: "Admin Updated", visible: false });

      const { error: deleteError } = await admin.client
        .from("products")
        .delete()
        .eq("id", created.id);
      expect(deleteError).toBeNull();

      const { data: gone } = await service.from("products").select("id").eq("id", created.id);
      expect(gone).toEqual([]);
    });

    it("rejects product creation by a customer", async () => {
      const { error } = await customer.client
        .from("products")
        .insert({ slug: unique("customer-created"), name: "Nope", price: 10 });

      expect(error).not.toBeNull();
      expect(error?.code).toBe("42501");
    });

    it("rejects product creation by anonymous visitors", async () => {
      const { error } = await anon
        .from("products")
        .insert({ slug: unique("anon-created"), name: "Nope", price: 10 });

      expect(error).not.toBeNull();
    });

    it("prevents a customer from updating a product", async () => {
      const { data } = await customer.client
        .from("products")
        .update({ name: "Hacked" })
        .eq("id", visibleProduct.id)
        .select("id, name");

      expect(data).toEqual([]);

      const { data: stored } = await service
        .from("products")
        .select("name")
        .eq("id", visibleProduct.id)
        .single();
      expect(stored?.name).toBe(visibleProduct.name);
    });

    it("prevents a customer from deleting a product", async () => {
      const { data } = await customer.client
        .from("products")
        .delete()
        .eq("id", visibleProduct.id)
        .select("id");

      expect(data).toEqual([]);

      const { data: stored } = await service
        .from("products")
        .select("id")
        .eq("id", visibleProduct.id);
      expect(stored).toHaveLength(1);
    });
  });
});
