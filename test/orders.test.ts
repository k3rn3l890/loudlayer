import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const app = createTestApp();

async function getAdminToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" });
  return res.body.token;
}

async function getCustomerToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: `order-test-${Date.now()}@test.com`, password: "password123", name: "Order Tester" });
  return res.body.token;
}

describe("Order Routes", () => {
  describe("GET /api/orders", () => {
    it("returns orders as admin", async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.orders).toBeDefined();
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/api/orders");
      expect(res.status).toBe(401);
    });

    it("filters by status", async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .get("/api/orders?status=pending")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      for (const o of res.body.orders) {
        expect(o.status).toBe("pending");
      }
    });
  });

  describe("POST /api/orders", () => {
    it("creates an order as customer", async () => {
      const token = await getCustomerToken();
      const products = await request(app).get("/api/products?visible=1");
      const product = products.body.products[0];

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ product_id: product.id, name: product.name, price: product.price, quantity: 1 }],
          customer_name: "Order Tester",
          shipping_address: "123 Test St",
        });
      expect(res.status).toBe(200);
      expect(res.body.order).toBeDefined();
      expect(res.body.order.order_number).toBeDefined();
      expect(res.body.items.length).toBe(1);
    });

    it("rejects empty items", async () => {
      const token = await getCustomerToken();
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });

    it("rejects without auth", async () => {
      const res = await request(app)
        .post("/api/orders")
        .send({ items: [{ product_id: 1, price: 10, quantity: 1 }] });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orders/:id", () => {
    it("returns order details as admin", async () => {
      const token = await getAdminToken();
      const listRes = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);

      if (listRes.body.orders.length > 0) {
        const orderId = listRes.body.orders[0].id;
        const res = await request(app)
          .get(`/api/orders/${orderId}`)
          .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.order.id).toBe(orderId);
        expect(res.body.items).toBeDefined();
      }
    });
  });

  describe("PATCH /api/orders/:id/status", () => {
    it("updates order status as admin", async () => {
      const token = await getAdminToken();
      const listRes = await request(app)
        .get("/api/orders?status=pending")
        .set("Authorization", `Bearer ${token}`);

      if (listRes.body.orders.length > 0) {
        const orderId = listRes.body.orders[0].id;
        const res = await request(app)
          .patch(`/api/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "processing" });
        expect(res.status).toBe(200);
        expect(res.body.order.status).toBe("processing");
      }
    });

    it("rejects invalid status", async () => {
      const token = await getAdminToken();
      const listRes = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);

      if (listRes.body.orders.length > 0) {
        const orderId = listRes.body.orders[0].id;
        const res = await request(app)
          .patch(`/api/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "invalid_status" });
        expect(res.status).toBe(400);
      }
    });
  });
});
