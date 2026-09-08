import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const app = createTestApp();

async function getCustomerToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: `cart-test-${Date.now()}@test.com`, password: "password123", name: "Cart Tester" });
  return res.body.token;
}

describe("Cart Routes", () => {
  describe("GET /api/cart", () => {
    it("returns empty cart for new user", async () => {
      const token = await getCustomerToken();
      const res = await request(app)
        .get("/api/cart")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/api/cart");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/cart", () => {
    it("adds items to cart", async () => {
      const token = await getCustomerToken();
      const products = await request(app).get("/api/products?visible=1");
      const product = products.body.products[0];

      const res = await request(app)
        .put("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{
            product: { id: product.id, price: product.price, name: product.name },
            quantity: 2,
            selectedSize: "M",
          }],
        });
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].quantity).toBe(2);
      expect(res.body.items[0].size).toBe("M");
    });

    it("replaces cart on PUT", async () => {
      const token = await getCustomerToken();
      const products = await request(app).get("/api/products?visible=1");

      // Add first item
      await request(app)
        .put("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{
            product: { id: products.body.products[0].id, price: products.body.products[0].price },
            quantity: 1,
          }],
        });

      // Replace with second item
      const res = await request(app)
        .put("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{
            product: { id: products.body.products[1].id, price: products.body.products[1].price },
            quantity: 3,
          }],
        });
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].quantity).toBe(3);
    });

    it("clears cart with empty items", async () => {
      const token = await getCustomerToken();
      const res = await request(app)
        .put("/api/cart")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });
  });
});
