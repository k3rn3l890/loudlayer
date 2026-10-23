import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  anon,
  cleanup,
  createTestUser,
  type TestUser,
} from "./supabase-helpers";

let admin: TestUser;
let customer: TestUser;

beforeAll(async () => {
  admin = await createTestUser({ role: "admin" });
  customer = await createTestUser();
});

afterAll(async () => {
  await cleanup({ userIds: [admin.id, customer.id] });
});

describe("Admin dashboard RPC", () => {
  it("returns aggregate stats and recent orders to an admin", async () => {
    const { data, error } = await admin.client.rpc("admin_stats");

    expect(error).toBeNull();
    expect(data.stats).toEqual(
      expect.objectContaining({
        totalProducts: expect.any(Number),
        totalOrders: expect.any(Number),
        totalRevenue: expect.anything(),
        totalCustomers: expect.any(Number),
        ordersByStatus: expect.any(Array),
      })
    );
    expect(Array.isArray(data.recentOrders)).toBe(true);
    expect(data.recentOrders.length).toBeLessThanOrEqual(5);

    for (const row of data.stats.ordersByStatus) {
      expect(row).toEqual(
        expect.objectContaining({ status: expect.any(String), count: expect.any(Number) })
      );
    }
  });

  it("rejects customers", async () => {
    const { error } = await customer.client.rpc("admin_stats");
    expect(error?.message).toContain("Admin access required");
  });

  it("rejects anonymous callers", async () => {
    const { error } = await anon.rpc("admin_stats");
    expect(error).not.toBeNull();
  });
});
