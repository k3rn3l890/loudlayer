import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  anon,
  cleanup,
  createTestProduct,
  createTestUser,
  service,
  type TestUser,
} from "./supabase-helpers";

let admin: TestUser;
let customer: TestUser;
let otherCustomer: TestUser;
const orderIds: number[] = [];
const productIds: number[] = [];

beforeAll(async () => {
  admin = await createTestUser({ role: "admin" });
  customer = await createTestUser({ name: "Order Tester" });
  otherCustomer = await createTestUser({ name: "Other Customer" });
});

afterAll(async () => {
  await cleanup({
    userIds: [admin.id, customer.id, otherCustomer.id],
    productIds,
    orderIds,
  });
});

async function createProduct(stock = 5) {
  const product = await createTestProduct({ stock });
  productIds.push(product.id);
  return product;
}

async function placeOrder(user: TestUser, productId: number, quantity = 1) {
  const { data, error } = await user.client.rpc("create_order", {
    p_items: [{ product_id: productId, name: "Test Product", quantity, size: "M" }],
    p_customer_name: "Order Tester",
    p_customer_phone: "0240000000",
    p_shipping_address: "123 Test Street",
    p_notes: "Leave at the gate",
  });

  expect(error).toBeNull();
  if (data?.order?.id) orderIds.push(data.order.id);
  return data;
}

describe("Orders (create_order RPC)", () => {
  it("creates an order and its items for a signed-in customer", async () => {
    const product = await createProduct(5);

    const result = await placeOrder(customer, product.id, 2);

    expect(result.success).toBe(true);
    expect(result.order).toMatchObject({
      user_id: customer.id,
      customer_name: "Order Tester",
      customer_email: customer.email,
      shipping_address: "123 Test Street",
      status: "pending",
      total: 39.98,
      notes: "Leave at the gate",
    });
    expect(result.order.order_number).toMatch(/^ORD-/);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      product_id: product.id,
      product_name: "Test Product",
      quantity: 2,
      size: "M",
    });
    expect(Number(result.items[0].product_price)).toBe(19.99);
  });

  it("decrements product stock", async () => {
    const product = await createProduct(5);

    await placeOrder(customer, product.id, 3);

    const { data } = await service
      .from("products")
      .select("stock")
      .eq("id", product.id)
      .single();
    expect(data?.stock).toBe(2);
  });

  it("skips items that exceed available stock", async () => {
    const product = await createProduct(1);

    const result = await placeOrder(customer, product.id, 2);

    expect(result.success).toBe(false);
    expect(result.error).toBe("All items are out of stock");
    expect(result.skipped_items).toEqual([
      { name: "Test Product", reason: "Only 1 available" },
    ]);

    const { data } = await service.from("products").select("stock").eq("id", product.id).single();
    expect(data?.stock).toBe(1);
  });

  it("skips unknown products", async () => {
    const { data, error } = await customer.client.rpc("create_order", {
      p_items: [{ product_id: 999999999, name: "Ghost Product", quantity: 1, size: "M" }],
    });

    expect(error).toBeNull();
    expect(data.success).toBe(false);
    expect(data.skipped_items).toEqual([{ name: "Ghost Product", reason: "Product not found" }]);
  });

  it("rejects empty carts", async () => {
    const { data, error } = await customer.client.rpc("create_order", { p_items: [] });

    expect(error).toBeNull();
    expect(data).toMatchObject({ success: false, error: "All items are out of stock" });
  });

  it("rejects anonymous callers", async () => {
    const product = await createProduct();

    const { error } = await anon.rpc("create_order", {
      p_items: [{ product_id: product.id, quantity: 1 }],
    });

    expect(error).not.toBeNull();
  });
});

describe("Orders (RLS)", () => {
  it("shows customers only their own orders", async () => {
    const product = await createProduct();
    const result = await placeOrder(customer, product.id, 1);
    const orderId = result.order.id;

    const { data: ownOrders } = await customer.client
      .from("orders")
      .select("id")
      .eq("id", orderId);
    expect(ownOrders?.map((row) => row.id)).toContain(orderId);

    const { data: otherOrders } = await otherCustomer.client
      .from("orders")
      .select("id")
      .eq("id", orderId);
    expect(otherOrders).toEqual([]);

    const { data: otherItems } = await otherCustomer.client
      .from("order_items")
      .select("id")
      .eq("order_id", orderId);
    expect(otherItems).toEqual([]);
  });

  it("does not let customers change an order status directly", async () => {
    const product = await createProduct();
    const result = await placeOrder(customer, product.id, 1);

    const { data } = await customer.client
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", result.order.id)
      .select("id, status");
    expect(data).toEqual([]);

    const { data: stored } = await service
      .from("orders")
      .select("status")
      .eq("id", result.order.id)
      .single();
    expect(stored?.status).toBe("pending");
  });
});

describe("admin_update_order_status RPC", () => {
  it("lets an admin move an order through statuses", async () => {
    const product = await createProduct();
    const result = await placeOrder(customer, product.id, 1);

    const { data, error } = await admin.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "shipped",
    });

    expect(error).toBeNull();
    expect(data.status).toBe("shipped");
  });

  it("rejects invalid statuses", async () => {
    const product = await createProduct();
    const result = await placeOrder(customer, product.id, 1);

    const { error } = await admin.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "lost_in_transit",
    });

    expect(error?.message).toContain("Invalid status");
  });

  it("rejects customers calling it", async () => {
    const product = await createProduct();
    const result = await placeOrder(customer, product.id, 1);

    const { error } = await customer.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "shipped",
    });

    expect(error?.message).toContain("Admin access required");
  });

  it("restocks products when an order is cancelled", async () => {
    const product = await createProduct(4);
    const result = await placeOrder(customer, product.id, 3);

    const { data: afterOrder } = await service
      .from("products")
      .select("stock")
      .eq("id", product.id)
      .single();
    expect(afterOrder?.stock).toBe(1);

    const { error } = await admin.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "cancelled",
    });
    expect(error).toBeNull();

    const { data: afterCancel } = await service
      .from("products")
      .select("stock")
      .eq("id", product.id)
      .single();
    expect(afterCancel?.stock).toBe(4);
  });

  it("does not restock twice when cancelling an already cancelled order", async () => {
    const product = await createProduct(4);
    const result = await placeOrder(customer, product.id, 2);

    await admin.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "cancelled",
    });
    await admin.client.rpc("admin_update_order_status", {
      p_order_id: result.order.id,
      p_status: "cancelled",
    });

    const { data } = await service.from("products").select("stock").eq("id", product.id).single();
    expect(data?.stock).toBe(4);
  });
});
