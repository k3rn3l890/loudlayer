import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcryptjs";

const DB_PATH = path.join(import.meta.dirname, "..", "loudlayer.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
    migrateSchema();
    seedDefaults();
  }
  return db;
}

function migrateSchema() {
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!userCols.find((c) => c.name === "provider")) {
    db.exec("ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'email'");
  }
  const adminUpdate = db.prepare("SELECT id FROM users WHERE email = ?").get("admin@loudlayer.com");
  if (adminUpdate) {
    db.prepare("UPDATE users SET email = ? WHERE email = ?").run("loudlayer000@gmail.com", "admin@loudlayer.com");
  }

  const tCols = db.prepare("PRAGMA table_info(orders)").all() as { name: string }[];
  if (!tCols.find((c) => c.name === "user_id")) {
    db.exec("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }
  const cartCols = db.prepare("PRAGMA table_info(cart_items)").all() as { name: string }[];
  if (cartCols.length === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        product_data TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        size TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, product_id, size)
      );
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        product_data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, product_id)
      );
    `);
  }
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      discount_price REAL,
      discount_percentage TEXT,
      image TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      code TEXT,
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      stock INTEGER NOT NULL DEFAULT 0,
      visible INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      customer_name TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_phone TEXT DEFAULT '',
      shipping_address TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      total REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size TEXT DEFAULT '',
      image TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT '',
      image TEXT DEFAULT '',
      rating REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      text TEXT NOT NULL DEFAULT '',
      visible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      body TEXT NOT NULL DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedDefaults() {
  const adminCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get() as { c: number };
  if (adminCount.c === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      "loudlayer000@gmail.com", hash, "Admin", "admin"
    );
  }

  const customerCount = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get() as { c: number };
  if (customerCount.c === 0) {
    const hash = bcrypt.hashSync("customer123", 10);
    db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(
      "customer@test.com", hash, "Test Customer", "customer"
    );
  }

  const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number };
  if (productCount.c === 0) {
    const seed = db.prepare(`
      INSERT INTO products (slug, name, price, discount_percentage, image, category, code, description, tags, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seed.run("international-going-distance-2026", "©International - going distance 2026", 120, null, "/uploads/momentsImage_1.jpg", "Outer", "G-DIST-01", "Where Elegance Meets Sustainability, Luxury Made Accessible", '["Premium"]', 50);
    seed.run("international-just-do-it-2026", "©International - just do it 2026", 180, "45%", "/uploads/momentsImage_2.jpg", "Jacket", "JD-JKT-26", "Every item combines meticulous stitching with heavy cotton details, customized for optimal street insulation.", '["Limited Edition"]', 30);
    seed.run("velour-orange-trek-shell", "velour - Orange Trek Shell", 195, null, "/uploads/heroSection_image-.png", "Jacket", "VEL-OTR-01", "Technical shell with active insulation.", '["Technical","Active Insulation"]', 25);
    seed.run("velour-sage-windshield", "velour - Sage Windshield", 210, null, "/uploads/mementoJacket.jpg", "Outer", "VEL-SW-02", "Waterproof with adjustable cords.", '["Waterproof","Adjustable Cords"]', 20);
    seed.run("velour-premium-heavy-tshirt", "velour - Premium Heavy T-Shirt", 85, null, "/uploads/mementofemaleJacket.jpg", "Shirt", "VEL-HTS-03", "Oversized 100% organic cotton.", '["Oversized","100% Organic Cotton"]', 100);
    seed.run("velour-block-field-track", "velour - Block Field Track", 240, null, "/uploads/mementoshirtsfemaleShirts.jpg", "Jacket", "VEL-BFT-04", "Modular fit with breathable mesh.", '["Modular Fit","Breathable Mesh"]', 15);

    const testimonials = db.prepare(`
      INSERT INTO testimonials (author, role, image, rating, reviews_count, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    testimonials.run("", "Fashion Stylist", "/placeholder-testimonial.svg", 5.0, 49, "Everything is absolutely perfect! From the fabric quality to the flawless fit every piece feels premium. This brand has completely transformed my wardrobe.");
    testimonials.run("", "Global Creative Lead", "/placeholder-testimonial.svg", 5.0, 32, "The technical zippers, taped seams, and oversized visual structure capture active urban energy like no other label. High craftsmanship combined with pure wearability.");
    testimonials.run("", "Senior Apparel Buyer", "/placeholder-testimonial.svg", 4.9, 56, "Meticulous focus on modern technical silhouettes. Customers consistently highlight the drape and raw styling appeal. Easily our fastest-selling quarterly collection.");
  }
}
