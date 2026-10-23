// ============================================================================
// Supabase connectivity / schema smoke test
//
// Usage: node scripts/verify-supabase.mjs
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env. Never prints keys.
// Exits non-zero when the schema, an RPC or the storage bucket is missing.
// ============================================================================
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("✖ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failures = 0;
const ok = (label, detail = "") => console.log(`✔ ${label}${detail ? ` — ${detail}` : ""}`);
const bad = (label, detail = "") => {
  failures++;
  console.error(`✖ ${label}${detail ? ` — ${detail}` : ""}`);
};

const tables = [
  "profiles",
  "products",
  "testimonials",
  "orders",
  "order_items",
  "reviews",
  "cart_items",
  "wishlist_items",
];

console.log("─".repeat(64));
console.log(`Supabase: ${url}`);
console.log("─".repeat(64));

console.log("\nTables");
for (const table of tables) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) bad(table, error.message);
  else ok(table, `${count ?? 0} rows`);
}

console.log("\nRPCs");
const rpcCalls = {
  create_order: { p_items: [] },
  replace_user_cart: { p_items: [] },
  replace_user_wishlist: { p_product_ids: [] },
  admin_update_order_status: { p_order_id: 0, p_status: "pending" },
  admin_stats: {},
  get_product_reviews: { p_slug: "__verify__" },
  is_admin: {},
};

for (const [name, args] of Object.entries(rpcCalls)) {
  const { error } = await supabase.rpc(name, args);
  if (error?.code === "PGRST202") {
    bad(name, "function not found");
  } else {
    // Any permission/validation error still proves the function exists.
    ok(name);
  }
}

console.log("\nStorage");
const { data: bucket, error: bucketError } = await supabase.storage.getBucket("product-images");
if (bucketError) bad("product-images bucket", bucketError.message);
else ok("product-images bucket", bucket.public ? "public" : "private");

console.log("\nData");
const { count: admins, error: adminError } = await supabase
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("role", "admin");
if (adminError) bad("admin profiles", adminError.message);
else if ((admins ?? 0) === 0) bad("admin profiles", "no admin user — promote one with SQL");
else ok("admin profiles", String(admins));

console.log("\n" + "─".repeat(64));
if (failures > 0) {
  console.error(`✖ ${failures} check(s) failed. Apply supabase/migrations/20261023000100_init.sql first.`);
  process.exitCode = 1;
} else {
  console.log("✔ Supabase schema looks good.");
}
