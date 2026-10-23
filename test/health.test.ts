import { describe, it, expect } from "vitest";
import { supabaseUrl } from "./supabase-helpers";

const anonKey =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

describe("Supabase project health", () => {
  it("serves the REST API to the anon key", async () => {
    const response = await fetch(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("exposes the auth settings endpoint", async () => {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("external");
  });
});
