// ============================================================================
// One-time migration: SQLite (data/loudlayer.db) → Supabase Postgres + Storage
//
// Usage:  node scripts/migrate-to-supabase.mjs
//
// Requirements:
//   1. supabase/migrations/20261023000100_init.sql has been applied to the project.
//   2. .env contains SUPABASE_SERVICE_ROLE_KEY (never commit this file).
//
// The script is idempotent: rows are upserted by their SQLite ids, images are
// uploaded with upsert, and auth users are matched by email.
// ============================================================================
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const SQLITE_PATH = process.env.SQLITE_DB_PATH || path.join(process.cwd(), "data", "loudlayer.db");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const BUCKET = "product-images";
const LEGACY_PREFIX = "legacy";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✖ Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
if (!fs.existsSync(SQLITE_PATH)) {
  console.error(`✖ SQLite database not found at ${SQLITE_PATH}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

const log = (...args) => console.log("  ", ...args);
const ok = (label, count) => console.log(`✔ ${label}: ${count}`);
let failures = 0;

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function parseTags(tags) {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toTimestamp(value) {
  if (!value) return new Date().toISOString();
  return String(value).includes("T") ? value : String(value).replace(" ", "T") + "Z";
}

async function fail(step, error) {
  failures++;
  console.error(`✖ ${step}:`, error?.message || error);
}

// ─── 1. Images ───────────────────────────────────────────────────────────────
async function migrateImages() {
  console.log("\n[1/8] Uploading images to Supabase Storage…");
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("  (no uploads directory — skipping)");
    return new Map();
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => fs.statSync(path.join(UPLOADS_DIR, f)).isFile());
  const urlMap = new Map();
  let uploaded = 0;

  for (const file of files) {
    const filePath = path.join(UPLOADS_DIR, file);
    const size = fs.statSync(filePath).size;
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    if (size > 5 * 1024 * 1024) {
      await fail(`image ${file}`, new Error(`too large (${(size / 1024 / 1024).toFixed(1)} MB, limit 5 MB)`));
      continue;
    }

    const storagePath = `${LEGACY_PREFIX}/${file}`;
    const { error } = await supabase.storage.from(BUCKET).upload(storagePath, fs.readFileSync(filePath), {
      contentType,
      upsert: true,
      cacheControl: "31536000",
    });

    if (error) {
      await fail(`image ${file}`, error);
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    urlMap.set(`/uploads/${file}`, data.publicUrl);
    uploaded++;
  }

  ok("images uploaded", `${uploaded}/${files.length}`);
  return urlMap;
}

function resolveLegacyImage(image, urlMap) {
  if (!image) return image;
  if (/^https?:\/\//i.test(image)) return image;
  if (urlMap.has(image)) return urlMap.get(image);
  if (image.startsWith("/uploads/")) {
    const name = image.slice("/uploads/".length);
    return urlMap.get(`/uploads/${name}`) || image;
  }
  return image;
}

// ─── 2. Users / Auth ─────────────────────────────────────────────────────────
async function migrateUsers(sqlite) {
  console.log("\n[2/8] Importing users into Supabase Auth…");
  const users = sqlite.prepare("SELECT * FROM users").all();
  const idMap = new Map(); // sqlite id → auth uuid

  let existingByEmail = new Map();
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;
    existingByEmail = new Map((data?.users || []).map((u) => [u.email?.toLowerCase(), u]));
  } catch (err) {
    await fail("list existing auth users", err);
  }

  let imported = 0;
  let reused = 0;
  let needsReset = 0;

  for (const user of users) {
    const email = String(user.email || "").toLowerCase();
    if (!email) continue;

    const existing = existingByEmail.get(email);
    if (existing) {
      idMap.set(user.id, existing.id);
      reused++;
    } else {
      const isBcrypt = /^\$2[aby]\$/.test(String(user.password || ""));
      const isGoogle = user.provider === "google";

      const payload = {
        email,
        email_confirm: true,
        user_metadata: { name: user.name || "" },
        app_metadata: { provider: isGoogle ? "google" : "email" },
        ...(isBcrypt && !isGoogle ? { password_hash: user.password } : {}),
      };

      const { data, error } = await supabase.auth.admin.createUser(payload);
      if (error) {
        await fail(`create user ${email}`, error);
        continue;
      }
      if (!isGoogle && !isBcrypt) needsReset++;
      idMap.set(user.id, data.user.id);
      imported++;
    }

    const authId = idMap.get(user.id);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        email,
        name: user.name || "",
        role: user.role === "admin" ? "admin" : "customer",
        provider: user.provider || "email",
      })
      .eq("id", authId);

    if (profileError) await fail(`update profile ${email}`, profileError);
  }

  ok("users", `${imported} imported, ${reused} already existed`);
  if (needsReset > 0) {
    log(`⚠ ${needsReset} user(s) had no importable password hash — they will need a password reset.`);
  }
  return idMap;
}

// ─── 3. Products ─────────────────────────────────────────────────────────────
async function migrateProducts(sqlite, urlMap) {
  console.log("\n[3/8] Migrating products…");
  const rows = sqlite.prepare("SELECT * FROM products ORDER BY id").all();
  const payload = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    discount_price: p.discount_price ?? null,
    discount_percentage: p.discount_percentage ?? null,
    image: resolveLegacyImage(p.image, urlMap) || "",
    category: p.category || "",
    code: p.code ?? null,
    description: p.description || "",
    tags: parseTags(p.tags),
    stock: p.stock ?? 0,
    visible: !!p.visible,
    created_at: toTimestamp(p.created_at),
    updated_at: toTimestamp(p.updated_at),
  }));

  for (const batch of chunk(payload, 100)) {
    const { error } = await supabase.from("products").upsert(batch, { onConflict: "id" });
    if (error) await fail("products batch", error);
  }
  ok("products", payload.length);
  return rows;
}

// ─── 4. Testimonials ─────────────────────────────────────────────────────────
async function migrateTestimonials(sqlite) {
  console.log("\n[4/8] Migrating testimonials…");
  const rows = sqlite.prepare("SELECT * FROM testimonials ORDER BY id").all();
  const payload = rows.map((t) => ({
    id: t.id,
    author: t.author || "",
    role: t.role || "",
    image: t.image || "",
    rating: t.rating ?? 5.0,
    reviews_count: t.reviews_count ?? 0,
    text: t.text || "",
    visible: !!t.visible,
  }));

  for (const batch of chunk(payload, 100)) {
    const { error } = await supabase.from("testimonials").upsert(batch, { onConflict: "id" });
    if (error) await fail("testimonials batch", error);
  }
  ok("testimonials", payload.length);
}

// ─── 5. Orders + items ───────────────────────────────────────────────────────
async function migrateOrders(sqlite, userIdMap, urlMap) {
  console.log("\n[5/8] Migrating orders…");
  const orders = sqlite.prepare("SELECT * FROM orders ORDER BY id").all();
  const orderPayload = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    user_id: o.user_id != null ? userIdMap.get(o.user_id) ?? null : null,
    customer_name: o.customer_name || "",
    customer_email: o.customer_email || "",
    customer_phone: o.customer_phone || "",
    shipping_address: o.shipping_address || "",
    status: o.status || "pending",
    total: o.total ?? 0,
    notes: o.notes || "",
    created_at: toTimestamp(o.created_at),
    updated_at: toTimestamp(o.updated_at),
  }));

  for (const batch of chunk(orderPayload, 100)) {
    const { error } = await supabase.from("orders").upsert(batch, { onConflict: "id" });
    if (error) await fail("orders batch", error);
  }

  const items = sqlite.prepare("SELECT * FROM order_items ORDER BY id").all();
  const itemPayload = items.map((i) => ({
    id: i.id,
    order_id: i.order_id,
    product_id: i.product_id ?? null,
    product_name: i.product_name,
    product_price: i.product_price,
    quantity: i.quantity ?? 1,
    size: i.size || "",
    image: resolveLegacyImage(i.image, urlMap) || "",
  }));

  for (const batch of chunk(itemPayload, 100)) {
    const { error } = await supabase.from("order_items").upsert(batch, { onConflict: "id" });
    if (error) await fail("order_items batch", error);
  }

  ok("orders", orders.length);
  ok("order items", items.length);
}

// ─── 6. Reviews ──────────────────────────────────────────────────────────────
async function migrateReviews(sqlite, userIdMap) {
  console.log("\n[6/8] Migrating reviews…");
  const rows = sqlite.prepare("SELECT * FROM reviews ORDER BY id").all();
  const payload = rows
    .filter((r) => userIdMap.has(r.user_id))
    .map((r) => ({
      id: r.id,
      product_id: r.product_id,
      user_id: userIdMap.get(r.user_id),
      rating: r.rating,
      body: r.body || "",
      created_at: toTimestamp(r.created_at),
    }));

  for (const batch of chunk(payload, 100)) {
    const { error } = await supabase.from("reviews").upsert(batch, { onConflict: "id" });
    if (error) await fail("reviews batch", error);
  }
  ok("reviews", payload.length);
}

// ─── 7. Cart + wishlist ──────────────────────────────────────────────────────
async function migrateCarts(sqlite, userIdMap, urlMap) {
  console.log("\n[7/8] Migrating carts and wishlists…");
  const productRows = sqlite.prepare("SELECT * FROM products").all();
  const productsById = new Map(productRows.map((p) => [String(p.id), p]));

  const hydrate = (productId, fallback) => {
    const row = productsById.get(String(productId));
    if (!row) return fallback;
    return {
      id: String(row.id),
      slug: row.slug || "",
      name: row.name,
      price: Number(row.price),
      discount_price: row.discount_price ?? null,
      discount_percentage: row.discount_percentage ?? null,
      image: resolveLegacyImage(row.image, urlMap) || "",
      category: row.category || "",
      code: row.code ?? null,
      description: row.description || "",
      tags: parseTags(row.tags),
      stock: row.stock ?? 0,
      visible: !!row.visible,
    };
  };

  const carts = sqlite.prepare("SELECT * FROM cart_items ORDER BY id").all().filter((c) => userIdMap.has(c.user_id));
  const cartPayload = carts.map((c) => ({
    user_id: userIdMap.get(c.user_id),
    product_id: String(c.product_id),
    product_data: hydrate(c.product_id, safeJson(c.product_data)),
    quantity: c.quantity ?? 1,
    size: c.size || "",
    created_at: toTimestamp(c.created_at),
  }));

  const wishlist = sqlite.prepare("SELECT * FROM wishlist_items ORDER BY id").all().filter((w) => userIdMap.has(w.user_id));
  const wishlistPayload = wishlist.map((w) => ({
    user_id: userIdMap.get(w.user_id),
    product_id: String(w.product_id),
    product_data: hydrate(w.product_id, safeJson(w.product_data)),
    created_at: toTimestamp(w.created_at),
  }));

  // Replace-style migration: clear these per-user tables first (they are session state).
  const { error: cartClear } = await supabase.from("cart_items").delete().neq("id", 0);
  if (cartClear) await fail("clear cart_items", cartClear);
  const { error: wishClear } = await supabase.from("wishlist_items").delete().neq("id", 0);
  if (wishClear) await fail("clear wishlist_items", wishClear);

  for (const batch of chunk(cartPayload, 100)) {
    const { error } = await supabase.from("cart_items").insert(batch);
    if (error) await fail("cart batch", error);
  }
  for (const batch of chunk(wishlistPayload, 100)) {
    const { error } = await supabase.from("wishlist_items").insert(batch);
    if (error) await fail("wishlist batch", error);
  }

  ok("cart items", cartPayload.length);
  ok("wishlist items", wishlistPayload.length);
}

function safeJson(value) {
  if (value == null) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

// ─── 8. Sequence reset + verification ────────────────────────────────────────
async function resetSequences() {
  console.log("\n[8/8] Resetting identity sequences…");
  const { error } = await supabase.rpc("migrate_reset_sequences");
  if (error) {
    await fail(
      "reset sequences",
      new Error(`${error.message} — apply supabase/migrations/20261023000100_init.sql first`)
    );
    return;
  }
  ok("sequences", "reset");
}

async function verify() {
  console.log("\nVerifying row counts…");
  const tables = ["profiles", "products", "testimonials", "orders", "order_items", "reviews", "cart_items", "wishlist_items"];
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    if (error) {
      await fail(`verify ${table}`, error);
    } else {
      console.log(`   ${table.padEnd(15)} ${count}`);
    }
  }
}

// ─── Run ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log("─".repeat(64));
  console.log("LoudLayer → Supabase migration");
  console.log(`SQLite:   ${SQLITE_PATH}`);
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log("─".repeat(64));

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  try {
    const urlMap = await migrateImages();
    const userIdMap = await migrateUsers(sqlite);
    await migrateProducts(sqlite, urlMap);
    await migrateTestimonials(sqlite);
    await migrateOrders(sqlite, userIdMap, urlMap);
    await migrateReviews(sqlite, userIdMap);
    await migrateCarts(sqlite, userIdMap, urlMap);
    await resetSequences();
    await verify();

    console.log("\n" + "─".repeat(64));
    if (failures > 0) {
      console.log(`⚠ Migration finished with ${failures} failure(s) — review the log above.`);
      process.exitCode = 1;
    } else {
      console.log("✔ Migration complete.");
      console.log("\nNext steps:");
      console.log("  1. Promote your admin account if needed:");
      console.log("     update public.profiles set role = 'admin' where email = 'loudlayer000@gmail.com';");
      console.log("  2. Test login, storefront, checkout and admin in the app.");
      console.log("  3. Shut down the Render service once everything is verified.");
    }
    console.log("─".repeat(64));
  } catch (err) {
    console.error("\n✖ Migration aborted:", err);
    process.exitCode = 1;
  } finally {
    sqlite.close();
  }
})();
