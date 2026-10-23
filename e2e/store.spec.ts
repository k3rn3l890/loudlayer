import { test, expect } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL || "";
const adminPassword = process.env.E2E_ADMIN_PASSWORD || "";
const hasAdminCredentials = Boolean(adminEmail && adminPassword);

test.describe("Storefront", () => {
  test("loads the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/LOUDLAYER/i);
    await expect(page.getByText("LOUDLAYER").first()).toBeVisible();
  });

  test("displays store products from Supabase", async ({ page }) => {
    const productsResponse = page.waitForResponse(
      (response) => response.url().includes("/rest/v1/products") && response.status() === 200
    );

    await page.goto("/store");
    await productsResponse;

    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("opens a product detail page", async ({ page }) => {
    await page.goto("/store");

    const firstProduct = page.locator('a[href*="/products/"]').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    await firstProduct.click();

    await expect(page).toHaveURL(/\/products\/[^/]+/);
    await expect(page.getByText(/add to bag|add to cart/i).first()).toBeVisible();
  });
});

test.describe("Customer authentication", () => {
  test("login page renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("rejects a wrong password", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").fill(adminEmail || "nobody@example.com");
    await page.locator("input[type='password']").fill("definitely-wrong");
    await page.locator("button[type='submit']").click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Admin dashboard", () => {
  test("redirects unauthenticated visitors to the admin login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
  });

  test("signs an admin in", async ({ page }) => {
    test.skip(!hasAdminCredentials, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run this test.");

    await page.goto("/admin/login");
    await page.locator("input[type='email'], input[name='email']").fill(adminEmail);
    await page.locator("input[type='password']").fill(adminPassword);
    await page.locator("button[type='submit']").click();

    await expect(page).toHaveURL(/\/admin$/, { timeout: 20000 });
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });
});

test.describe("Supabase REST health", () => {
  test("serves products with the anon key", async ({ request }) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    expect(url, "SUPABASE_URL is required for e2e health checks").toBeTruthy();
    expect(key, "SUPABASE_ANON_KEY is required for e2e health checks").toBeTruthy();

    const response = await request.get(`${url}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: key!, Authorization: `Bearer ${key}` },
    });

    expect(response.ok()).toBeTruthy();
    expect(Array.isArray(await response.json())).toBe(true);
  });
});
