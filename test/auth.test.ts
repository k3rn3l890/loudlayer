import { describe, it, expect, afterAll } from "vitest";
import { anon, createTestUser, service, unique, cleanup } from "./supabase-helpers";

const createdUserIds: string[] = [];

afterAll(async () => {
  await cleanup({ userIds: createdUserIds });
});

describe("Auth (Supabase)", () => {
  describe("registration", () => {
    it("creates a confirmed customer with an auto-generated profile", async () => {
      const user = await createTestUser({ name: "New Customer" });
      createdUserIds.push(user.id);

      const { data: profile, error } = await service
        .from("profiles")
        .select("id, email, name, role, provider")
        .eq("id", user.id)
        .single();

      expect(error).toBeNull();
      expect(profile).toMatchObject({
        id: user.id,
        email: user.email,
        name: "New Customer",
        role: "customer",
        provider: "email",
      });
    });

    it("rejects invalid email addresses", async () => {
      const { error } = await anon.auth.signUp({
        email: "not-an-email",
        password: "password123",
      });

      expect(error).not.toBeNull();
    });

    it("rejects passwords shorter than the project minimum", async () => {
      const { error } = await anon.auth.signUp({
        email: `${unique("short-password")}@example.com`,
        password: "123",
      });

      expect(error).not.toBeNull();
    });

    it("rejects a duplicate email", async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);

      const { error } = await service.auth.admin.createUser({
        email: user.email,
        password: "AnotherPassword123!",
        email_confirm: true,
      });

      expect(error).not.toBeNull();
      expect(error?.message.toLowerCase()).toContain("already");
    });
  });

  describe("sign in", () => {
    it("signs in with valid credentials and exposes the profile", async () => {
      const user = await createTestUser({ name: "Sign In User" });
      createdUserIds.push(user.id);

      const { data: authData, error: authError } = await user.client.auth.getUser();
      expect(authError).toBeNull();
      expect(authData.user?.email).toBe(user.email);

      const { data: profile } = await user.client
        .from("profiles")
        .select("email, name, role")
        .eq("id", user.id)
        .single();

      expect(profile).toMatchObject({ email: user.email, name: "Sign In User", role: "customer" });
    });

    it("rejects a wrong password", async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);

      const { error } = await anon.auth.signInWithPassword({
        email: user.email,
        password: "definitely-wrong",
      });

      expect(error?.message.toLowerCase()).toContain("invalid login credentials");
    });

    it("rejects an unknown email", async () => {
      const { error } = await anon.auth.signInWithPassword({
        email: `${unique("nobody")}@example.com`,
        password: "password123",
      });

      expect(error?.message.toLowerCase()).toContain("invalid login credentials");
    });
  });

  describe("roles and RLS", () => {
    it("marks an admin account and lets is_admin() see it", async () => {
      const admin = await createTestUser({ role: "admin" });
      createdUserIds.push(admin.id);

      const { data: isAdmin } = await admin.client.rpc("is_admin");
      expect(isAdmin).toBe(true);
    });

    it("reports false for regular customers", async () => {
      const customer = await createTestUser();
      createdUserIds.push(customer.id);

      const { data: isAdmin } = await customer.client.rpc("is_admin");
      expect(isAdmin).toBe(false);
    });

    it("hides other users' profiles", async () => {
      const first = await createTestUser({ name: "First" });
      const second = await createTestUser({ name: "Second" });
      createdUserIds.push(first.id, second.id);

      const { data } = await first.client
        .from("profiles")
        .select("id, name")
        .eq("id", second.id);

      expect(data).toEqual([]);
    });

    it("returns nothing for anonymous profile reads", async () => {
      const user = await createTestUser();
      createdUserIds.push(user.id);

      const { data, error } = await anon.from("profiles").select("id, email");

      // Anonymous callers have no SELECT grant/policy; both an empty result and
      // a permission error are acceptable as long as no row leaks.
      expect(error ? [] : data).toEqual([]);
    });
  });
});
