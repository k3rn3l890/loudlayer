import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp } from "./helpers";

const app = createTestApp();

describe("Auth Routes", () => {
  describe("POST /api/auth/register", () => {
    it("registers a new customer", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@test.com", password: "password123", name: "Test User" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("new@test.com");
      expect(res.body.user.role).toBe("customer");
    });

    it("rejects duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@test.com", password: "password123", name: "Test User" });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already registered");
    });

    it("rejects invalid email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "not-an-email", password: "password123" });
      expect(res.status).toBe(400);
    });

    it("rejects short password", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test2@test.com", password: "123" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe("admin");
    });

    it("rejects wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "loudlayer000@gmail.com", password: "wrongpassword" });
      expect(res.status).toBe(401);
    });

    it("rejects non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "password123" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user info with valid token", async () => {
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "loudlayer000@gmail.com", password: "12Flowers$$$" });
      const token = loginRes.body.token;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("loudlayer000@gmail.com");
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("clears the cookie", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
