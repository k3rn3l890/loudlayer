import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  anon,
  cleanup,
  createTestProduct,
  createTestUser,
  type TestUser,
} from "./supabase-helpers";

let customer: TestUser;
let otherCustomer: TestUser;
const productIds: number[] = [];

beforeAll(async () => {
  customer = await createTestUser();
  otherCustomer = await createTestUser();
});

afterAll(async () => {
  await cleanup({
    userIds: [customer.id, otherCustomer.id],
    productIds,
  });
});

async function product(stock = 5) {
  const row = await createTestProduct({ stock });
  productIds.push(row.id);
  return row;
}

describe("Cart (replace_user_cart RPC)", () => {
  it("starts empty for a new user", async () => {
    const { data, error } = await customer.client.from("cart_items").select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("adds items with quantity and size", async () => {
    const jacket = await product();

    const { data, error } = await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: jacket.id, quantity: 2, size: "M" }],
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ product_id: String(jacket.id), quantity: 2, size: "M" });
    expect(data[0].product_data.name).toBe("Test Product");
  });

  it("replaces the whole cart", async () => {
    const first = await product();
    const second = await product();

    await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: first.id, quantity: 1, size: "S" }],
    });
    const { data } = await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: second.id, quantity: 3, size: "L" }],
    });

    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ product_id: String(second.id), quantity: 3, size: "L" });
  });

  it("clears the cart with an empty array", async () => {
    const jacket = await product();
    await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: jacket.id, quantity: 1, size: "M" }],
    });

    const { data } = await customer.client.rpc("replace_user_cart", { p_items: [] });
    expect(data).toEqual([]);

    const { data: stored } = await customer.client.from("cart_items").select("id");
    expect(stored).toEqual([]);
  });

  it("clamps quantity to available stock", async () => {
    const scarce = await product(2);

    const { data } = await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: scarce.id, quantity: 10, size: "M" }],
    });

    expect(data[0].quantity).toBe(2);
  });

  it("skips out-of-stock products", async () => {
    const soldOut = await product(0);

    const { data } = await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: soldOut.id, quantity: 1, size: "M" }],
    });

    expect(data).toEqual([]);
  });

  it("keeps each customer's cart private", async () => {
    const jacket = await product();
    await customer.client.rpc("replace_user_cart", {
      p_items: [{ product_id: jacket.id, quantity: 1, size: "M" }],
    });

    const { data: own } = await customer.client.from("cart_items").select("id");
    const { data: others } = await otherCustomer.client.from("cart_items").select("id");

    expect(own?.length).toBeGreaterThan(0);
    expect(others).toEqual([]);
  });

  it("rejects writing a row for another user", async () => {
    const jacket = await product();

    const { error } = await customer.client.from("cart_items").insert({
      user_id: otherCustomer.id,
      product_id: String(jacket.id),
      product_data: { id: String(jacket.id), name: "Stolen" },
      quantity: 1,
      size: "M",
    });

    expect(error).not.toBeNull();
  });

  it("rejects anonymous RPC calls", async () => {
    const jacket = await product();

    const { error } = await anon.rpc("replace_user_cart", {
      p_items: [{ product_id: jacket.id, quantity: 1, size: "M" }],
    });

    expect(error).not.toBeNull();
  });
});
