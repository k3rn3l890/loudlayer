import { describe, it, expect } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const app = createTestApp();

async function getCustomerToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: `wish-test-${Date.now()}@test.com`, password: "password123", name: "Wish Tester" });
  return res.body.token;
}

describe("Wishlist Routes", () => {
  describe("GET /api/wishlist", () => {
    it("returns empty wishlist for new user", async () => {
      const token = await getCustomerToken();
      const res = await request(app)
        .get("/api/wishlist")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/api/wishlist");
      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/wishlist", () => {
    it("adds items to wishlist", async () => {
      const token = await getCustomerToken();
      const products = await request(app).get("/api/products?visible=1");
      const product = products.body.products[0];

      const res = await request(app)
        .put("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ id: product.id, name: product.name, price: product.price }] });
      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
    });

    it("replaces wishlist on PUT", async () => {
      const token = await getCustomerToken();
      const products = await request(app).get("/api/products?visible=1");

      // Add first item
      await request(app)
        .put("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ id: products.body.products[0].id, name: "A" }] });

      // Replace with second item
      const res = await request(app)
        .put("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [{ id: products.body.products[1].id, name: "B" }] });
      expect(res.body.items.length).toBe(1);
    });

    it("clears wishlist with empty items", async () => {
      const token = await getCustomerToken();
      const res = await request(app)
        .put("/api/wishlist")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [] });
      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });
  });
});
