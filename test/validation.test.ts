import { describe, it, expect } from "vitest";
import { createTestApp } from "./helpers";
import request from "supertest";

const app = createTestApp();

describe("Validation Schemas", () => {
  describe("CreateProductSchema", () => {
    it("accepts valid product data", async () => {
      const token = (await request(app).post("/api/auth/login").send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" })).body.token;
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          slug: "valid-product",
          name: "Valid Product",
          price: 100,
          category: "Test",
          stock: 50,
          tags: ["tag1", "tag2"],
        });
      expect(res.status).toBe(201);
    });

    it("rejects missing slug", async () => {
      const token = (await request(app).post("/api/auth/login").send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" })).body.token;
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "No Slug", price: 100 });
      expect(res.status).toBe(400);
    });

    it("rejects negative price", async () => {
      const token = (await request(app).post("/api/auth/login").send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" })).body.token;
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ slug: "neg-price", name: "Neg", price: -10 });
      expect(res.status).toBe(400);
    });
  });

  describe("CreateOrderSchema", () => {
    it("rejects empty items array", async () => {
      const token = (await request(app).post("/api/auth/register").send({ email: `val-test-${Date.now()}@test.com`, password: "password123" })).body.token;
      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });
  });

  describe("UpdateStatusSchema", () => {
    it("rejects invalid status value", async () => {
      const token = (await request(app).post("/api/auth/login").send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" })).body.token;
      const list = await request(app).get("/api/orders").set("Authorization", `Bearer ${token}`);
      if (list.body.orders.length > 0) {
        const id = list.body.orders[0].id;
        const res = await request(app)
          .patch(`/api/orders/${id}/status`)
          .set("Authorization", `Bearer ${token}`)
          .send({ status: "bogus" });
        expect(res.status).toBe(400);
      }
    });
  });
});
