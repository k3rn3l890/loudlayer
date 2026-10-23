import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  cleanup,
  createTestProduct,
  createTestUser,
  service,
  unique,
  type TestUser,
} from "./supabase-helpers";

let customer: TestUser;
const productIds: number[] = [];

beforeAll(async () => {
  customer = await createTestUser({ name: "Constraint Tester" });
});

afterAll(async () => {
  await cleanup({ userIds: [customer.id], productIds });
});

describe("Database constraints (replace server-side validation)", () => {
  it("rejects negative product prices", async () => {
    const { error } = await service
      .from("products")
      .insert({ slug: unique("negative-price"), name: "Bad", price: -1, stock: 1 });

    expect(error?.code).toBe("23514");
  });

  it("rejects negative stock", async () => {
    const { error } = await service
      .from("products")
      .insert({ slug: unique("negative-stock"), name: "Bad", price: 10, stock: -1 });

    expect(error?.code).toBe("23514");
  });

  it("rejects duplicate product slugs", async () => {
    const product = await createTestProduct();
    productIds.push(product.id);

    const { error } = await service
      .from("products")
      .insert({ slug: product.slug, name: "Duplicate", price: 10, stock: 1 });

    expect(error?.code).toBe("23505");
  });

  it("requires a product name", async () => {
    const { error } = await service
      .from("products")
      .insert({ slug: unique("no-name"), price: 10, stock: 1 });

    expect(error?.code).toBe("23502");
  });

  it("rejects invalid order statuses", async () => {
    const { error } = await service.from("orders").insert({
      order_number: unique("ORD-BAD"),
      customer_name: "Bad Status",
      status: "lost_in_transit",
      total: 10,
    });

    expect(error?.code).toBe("23514");
  });

  it("rejects duplicate order numbers", async () => {
    const orderNumber = unique("ORD-DUP");
    const { data } = await service
      .from("orders")
      .insert({ order_number: orderNumber, customer_name: "First", total: 10 })
      .select("id")
      .single();

    const { error } = await service
      .from("orders")
      .insert({ order_number: orderNumber, customer_name: "Second", total: 10 });

    expect(error?.code).toBe("23505");

    if (data?.id) await service.from("orders").delete().eq("id", data.id);
  });

  it("rejects review ratings outside 1-5", async () => {
    const product = await createTestProduct();
    productIds.push(product.id);

    const { error } = await service.from("reviews").insert({
      product_id: product.id,
      user_id: customer.id,
      rating: 0,
      body: "Zero stars",
    });

    expect(error?.code).toBe("23514");
  });

  it("rejects invalid profile roles", async () => {
    const { error } = await service
      .from("profiles")
      .update({ role: "superadmin" })
      .eq("id", customer.id);

    expect(error?.code).toBe("23514");
  });

  it("rejects zero-quantity cart rows", async () => {
    const product = await createTestProduct();
    productIds.push(product.id);

    const { error } = await service.from("cart_items").insert({
      user_id: customer.id,
      product_id: String(product.id),
      product_data: { id: String(product.id), name: product.name },
      quantity: 0,
      size: "M",
    });

    expect(error?.code).toBe("23514");
  });

  it("rejects zero-quantity order items", async () => {
    const { data: order } = await service
      .from("orders")
      .insert({ order_number: unique("ORD-ITEM"), customer_name: "Items", total: 0 })
      .select("id")
      .single();

    const { error } = await service.from("order_items").insert({
      order_id: order!.id,
      product_name: "Bad item",
      product_price: 10,
      quantity: 0,
    });

    expect(error?.code).toBe("23514");

    await service.from("orders").delete().eq("id", order!.id);
  });
});
