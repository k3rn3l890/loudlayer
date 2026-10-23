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

async function product(overrides: Record<string, unknown> = {}) {
  const row = await createTestProduct(overrides);
  productIds.push(row.id);
  return row;
}

describe("Wishlist (replace_user_wishlist RPC)", () => {
  it("starts empty for a new user", async () => {
    const { data, error } = await customer.client.from("wishlist_items").select("*");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("adds products by id", async () => {
    const jacket = await product();
    const shirt = await product();

    const { data, error } = await customer.client.rpc("replace_user_wishlist", {
      p_product_ids: [jacket.id, shirt.id],
    });

    expect(error).toBeNull();
    expect(data).toHaveLength(2);
    expect(data.map((row: any) => row.product_id).sort()).toEqual(
      [String(jacket.id), String(shirt.id)].sort()
    );
    expect(data[0].product_data.name).toBe("Test Product");
  });

  it("replaces the whole wishlist", async () => {
    const first = await product();
    const second = await product();

    await customer.client.rpc("replace_user_wishlist", { p_product_ids: [first.id] });
    const { data } = await customer.client.rpc("replace_user_wishlist", {
      p_product_ids: [second.id],
    });

    expect(data).toHaveLength(1);
    expect(data[0].product_id).toBe(String(second.id));
  });

  it("clears the wishlist with an empty array", async () => {
    const jacket = await product();
    await customer.client.rpc("replace_user_wishlist", { p_product_ids: [jacket.id] });

    const { data } = await customer.client.rpc("replace_user_wishlist", { p_product_ids: [] });
    expect(data).toEqual([]);
  });

  it("ignores invisible products", async () => {
    const hidden = await product({ visible: false });

    const { data } = await customer.client.rpc("replace_user_wishlist", {
      p_product_ids: [hidden.id],
    });

    expect(data).toEqual([]);
  });

  it("ignores duplicate ids", async () => {
    const jacket = await product();

    const { data } = await customer.client.rpc("replace_user_wishlist", {
      p_product_ids: [jacket.id, jacket.id],
    });

    expect(data).toHaveLength(1);
  });

  it("keeps each customer's wishlist private", async () => {
    const jacket = await product();
    await customer.client.rpc("replace_user_wishlist", { p_product_ids: [jacket.id] });

    const { data: own } = await customer.client.from("wishlist_items").select("id");
    const { data: others } = await otherCustomer.client.from("wishlist_items").select("id");

    expect(own?.length).toBe(1);
    expect(others).toEqual([]);
  });

  it("rejects anonymous RPC calls", async () => {
    const jacket = await product();

    const { error } = await anon.rpc("replace_user_wishlist", {
      p_product_ids: [jacket.id],
    });

    expect(error).not.toBeNull();
  });
});
