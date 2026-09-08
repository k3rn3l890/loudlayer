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

describe("Dashboard Routes", () => {
  describe("GET /api/dashboard/stats", () => {
    it("returns stats as admin", async () => {
      const token = await getAdminToken();
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.totalProducts).toBe("number");
      expect(typeof res.body.stats.totalOrders).toBe("number");
      expect(typeof res.body.stats.totalRevenue).toBe("number");
      expect(typeof res.body.stats.totalCustomers).toBe("number");
      expect(Array.isArray(res.body.stats.ordersByStatus)).toBe(true);
      expect(Array.isArray(res.body.recentOrders)).toBe(true);
    });

    it("rejects unauthenticated request", async () => {
      const res = await request(app).get("/api/dashboard/stats");
      expect(res.status).toBe(401);
    });

    it("rejects customer token", async () => {
      const custRes = await request(app)
        .post("/api/auth/register")
        .send({ email: `dash-test-${Date.now()}@test.com`, password: "password123" });
      const token = custRes.body.token;

      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});
