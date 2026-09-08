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

describe("Product Routes", () => {
  describe("GET /api/products", () => {
    it("returns all products", async () => {
      const res = await request(app).get("/api/products");
      expect(res.status).toBe(200);
      expect(res.body.products).toBeDefined();
      expect(res.body.products.length).toBeGreaterThan(0);
    });

    it("filters by visible=1", async () => {
      const res = await request(app).get("/api/products?visible=1");
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(p.visible).toBe(1);
      }
    });

    it("filters by category", async () => {
      const res = await request(app).get("/api/products?category=Jacket");
      expect(res.status).toBe(200);
      for (const p of res.body.products) {
        expect(p.category).toBe("Jacket");
      }
    });

    it("searches by name", async () => {
      const res = await request(app).get("/api/products?search=velour");
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/products/:id", () => {
    it("returns a single product", async () => {
      const list = await request(app).get("/api/products");
      const firstId = list.body.products[0].id;
      const res = await request(app).get(`/api/products/${firstId}`);
      expect(res.status).toBe(200);
      expect(res.body.product.id).toBe(firstId);
    });

    it("returns 404 for non-existent product", async () => {
      const res = await request(app).get("/api/products/99999");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/products/slug/:slug", () => {
    it("returns product by slug", async () => {
      const list = await request(app).get("/api/products");
      const slug = list.body.products[0].slug;
      const res = await request(app).get(`/api/products/slug/${slug}`);
      expect(res.status).toBe(200);
      expect(res.body.product.slug).toBe(slug);
    });

    it("returns 404 for non-existent slug", async () => {
      const res = await request(app).get("/api/products/slug/non-existent-slug");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/products", () => {
    it("creates a product as admin", async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({
          slug: "test-product",
          name: "Test Product",
          price: 99.99,
          category: "Test",
          stock: 10,
        });
      expect(res.status).toBe(201);
      expect(res.body.product.name).toBe("Test Product");
      expect(res.body.product.price).toBe(99.99);
    });

    it("rejects creation without auth", async () => {
      const res = await request(app)
        .post("/api/products")
        .send({ slug: "test2", name: "Test 2", price: 50 });
      expect(res.status).toBe(401);
    });

    it("rejects creation with customer token", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" });
      // Now login as customer
      const custRes = await request(app)
        .post("/api/auth/register")
        .send({ email: "cust-test@test.com", password: "password123" });
      const custToken = custRes.body.token;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${custToken}`)
        .send({ slug: "test3", name: "Test 3", price: 50 });
      expect(res.status).toBe(403);
    });

    it("rejects invalid data", async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "No slug" });
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/products/:id", () => {
    it("updates product fields", async () => {
      const token = await getAdminToken();
      const list = await request(app).get("/api/products");
      const product = list.body.products[0];

      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name", visible: false });
      expect(res.status).toBe(200);
      expect(res.body.product.name).toBe("Updated Name");
      expect(res.body.product.visible).toBe(0);
    });

    it("toggles visible to false and back", async () => {
      const token = await getAdminToken();
      const list = await request(app).get("/api/products");
      const product = list.body.products[0];

      // Set to false
      await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ visible: false });

      const afterFalse = await request(app).get(`/api/products/${product.id}`);
      expect(afterFalse.body.product.visible).toBe(0);

      // Set back to true
      await request(app)
        .put(`/api/products/${product.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ visible: true });

      const afterTrue = await request(app).get(`/api/products/${product.id}`);
      expect(afterTrue.body.product.visible).toBe(1);
    });

    it("rejects update without auth", async () => {
      const list = await request(app).get("/api/products");
      const product = list.body.products[0];
      const res = await request(app)
        .put(`/api/products/${product.id}`)
        .send({ name: "Hacked" });
      expect(res.status).toBe(401);
    });
  });

  describe("DELETE /api/products/:id", () => {
    it("deletes a product as admin", async () => {
      const token = await getAdminToken();
      // Create then delete
      const createRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${token}`)
        .send({ slug: "to-delete", name: "Delete Me", price: 10 });
      const id = createRes.body.product.id;

      const res = await request(app)
        .delete(`/api/products/${id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Confirm deleted
      const getRes = await request(app).get(`/api/products/${id}`);
      expect(getRes.status).toBe(404);
    });
  });
});
