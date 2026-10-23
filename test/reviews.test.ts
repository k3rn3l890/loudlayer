import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  anon,
  cleanup,
  createTestProduct,
  createTestUser,
  service,
  type TestUser,
} from "./supabase-helpers";

let first: TestUser;
let second: TestUser;
const productIds: number[] = [];

beforeAll(async () => {
  first = await createTestUser({ name: "First Reviewer" });
  second = await createTestUser({ name: "Second Reviewer" });
});

afterAll(async () => {
  await cleanup({ userIds: [first.id, second.id], productIds });
});

async function product() {
  const row = await createTestProduct();
  productIds.push(row.id);
  return row;
}

describe("Reviews (Supabase)", () => {
  it("lets a signed-in customer review a product once", async () => {
    const jacket = await product();

    const { data, error } = await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 5, body: "Excellent jacket" })
      .select("id, rating, body, user_id")
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({ rating: 5, body: "Excellent jacket", user_id: first.id });
  });

  it("rejects a second review by the same customer", async () => {
    const jacket = await product();

    await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 4, body: "First" });

    const { error } = await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 5, body: "Second" });

    expect(error?.code).toBe("23505");
  });

  it("rejects reviews written in another user's name", async () => {
    const jacket = await product();

    const { error } = await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: second.id, rating: 5, body: "Impersonation" });

    expect(error).not.toBeNull();
    expect(error?.code).toBe("42501");
  });

  it("rejects anonymous reviews", async () => {
    const jacket = await product();

    const { error } = await anon
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 5, body: "Anon" });

    expect(error).not.toBeNull();
  });

  it("rejects ratings outside 1-5", async () => {
    const jacket = await product();

    const { error } = await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 6, body: "Too good" });

    expect(error?.code).toBe("23514");
  });

  it("returns public reviews with names and aggregate stats", async () => {
    const jacket = await product();

    await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 4, body: "Nice" });
    await second.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: second.id, rating: 5, body: "Great" });

    const { data, error } = await anon.rpc("get_product_reviews", { p_slug: jacket.slug });

    expect(error).toBeNull();
    expect(data.stats).toEqual({ count: 2, average: 4.5 });
    expect(data.reviews).toHaveLength(2);
    expect(data.reviews.map((review: any) => review.user_name).sort()).toEqual([
      "First Reviewer",
      "Second Reviewer",
    ]);
    expect(data.reviews[0]).toHaveProperty("created_at");
  });

  it("returns zeroed stats for an unreviewed product", async () => {
    const jacket = await product();

    const { data, error } = await anon.rpc("get_product_reviews", { p_slug: jacket.slug });

    expect(error).toBeNull();
    expect(data).toEqual({ reviews: [], stats: { count: 0, average: 0 } });
  });

  it("errors for an unknown product slug", async () => {
    const { error } = await anon.rpc("get_product_reviews", { p_slug: "does-not-exist" });

    expect(error?.message).toContain("Product not found");
  });

  it("lets admins read reviews but hides profile details from the public", async () => {
    const jacket = await product();
    await first.client
      .from("reviews")
      .insert({ product_id: jacket.id, user_id: first.id, rating: 5, body: "Admin check" });

    const { data: publicReviews } = await anon
      .from("reviews")
      .select("id, rating, body, user_id")
      .eq("product_id", jacket.id);
    expect(publicReviews).toHaveLength(1);

    const { data: publicProfiles } = await anon
      .from("profiles")
      .select("id")
      .eq("id", first.id);
    expect(publicProfiles).toEqual([]);

    const { data: serviceProfiles } = await service
      .from("profiles")
      .select("id")
      .eq("id", first.id);
    expect(serviceProfiles).toHaveLength(1);
  });
});
