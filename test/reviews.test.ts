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

describe("Review Routes", () => {
  describe("GET /api/products/:slug/reviews", () => {
    it("returns reviews for a product", async () => {
      const products = await request(app).get("/api/products");
      const slug = products.body.products[0].slug;

      const res = await request(app).get(`/api/products/${slug}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.reviews).toBeDefined();
      expect(res.body.stats).toBeDefined();
    });

    it("returns 404 for non-existent product", async () => {
      const res = await request(app).get("/api/products/nonexistent/reviews");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/products/:slug/reviews", () => {
    it("creates a review as admin", async () => {
      const token = await getAdminToken();
      const products = await request(app).get("/api/products");
      const slug = products.body.products[0].slug;

      const res = await request(app)
        .post(`/api/products/${slug}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 5, body: "Great product!" });
      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);
    });

    it("rejects duplicate review", async () => {
      const token = await getAdminToken();
      const products = await request(app).get("/api/products");
      const slug = products.body.products[0].slug;

      const res = await request(app)
        .post(`/api/products/${slug}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 4, body: "Another review" });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already reviewed");
    });

    it("rejects invalid rating", async () => {
      const token = await getAdminToken();
      const products = await request(app).get("/api/products");
      const slug = products.body.products[0].slug;

      const res = await request(app)
        .post(`/api/products/${slug}/reviews`)
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 6, body: "Too high" });
      expect(res.status).toBe(400);
    });

    it("rejects unauthenticated review", async () => {
      const products = await request(app).get("/api/products");
      const slug = products.body.products[0].slug;

      const res = await request(app)
        .post(`/api/products/${slug}/reviews`)
        .send({ rating: 5, body: "Anonymous" });
      expect(res.status).toBe(401);
    });
  });
});
