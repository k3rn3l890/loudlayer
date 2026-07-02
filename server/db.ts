import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== "production") {
    console.log("Executed query", { text: text.substring(0, 100), duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient(): Promise<pg.PoolClient> {
  return pool.connect();
}

export async function initSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(50) NOT NULL DEFAULT 'admin',
      provider VARCHAR(50) DEFAULT 'email',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      discount_price DECIMAL(10,2),
      discount_percentage VARCHAR(50),
      image TEXT NOT NULL DEFAULT '',
      category VARCHAR(255) NOT NULL DEFAULT '',
      code VARCHAR(255),
      description TEXT DEFAULT '',
      tags JSONB DEFAULT '[]',
      stock INTEGER NOT NULL DEFAULT 0,
      visible BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number VARCHAR(255) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      customer_name VARCHAR(255) NOT NULL DEFAULT '',
      customer_email VARCHAR(255) NOT NULL DEFAULT '',
      customer_phone VARCHAR(50) DEFAULT '',
      shipping_address TEXT DEFAULT '',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER,
      product_name VARCHAR(255) NOT NULL,
      product_price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(50) DEFAULT '',
      image TEXT DEFAULT ''
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      author VARCHAR(255) NOT NULL DEFAULT '',
      role VARCHAR(255) NOT NULL DEFAULT '',
      image TEXT DEFAULT '',
      rating DECIMAL(3,1) NOT NULL DEFAULT 5.0,
      reviews_count INTEGER DEFAULT 0,
      text TEXT NOT NULL DEFAULT '',
      visible BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      body TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_data JSONB NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      size VARCHAR(50) DEFAULT '',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, product_id, size)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    );
  `);
}

export async function migrateSchema(): Promise<void> {
  // Add provider column to users if missing
  const userCols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
  if (!userCols.rows.find((c) => c.column_name === "provider")) {
    await query("ALTER TABLE users ADD COLUMN provider VARCHAR(50) DEFAULT 'email'");
  }

  // Update admin email if needed
  const adminUpdate = await query("SELECT id FROM users WHERE email = $1", ["admin@loudlayer.com"]);
  if (adminUpdate.rows.length > 0) {
    await query("UPDATE users SET email = $1 WHERE email = $2", ["loudlayer000@gmail.com", "admin@loudlayer.com"]);
  }

  // Add user_id to orders if missing
  const orderCols = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'");
  if (!orderCols.rows.find((c) => c.column_name === "user_id")) {
    await query("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)");
  }

  // Create cart_items and wishlist_items if they don't exist (handled by initSchema)
}

export async function seedDefaults(): Promise<void> {
  const adminCount = await query("SELECT COUNT(*) as c FROM users WHERE role = 'admin'");
  if (parseInt(adminCount.rows[0].c) === 0) {
    const hash = bcrypt.hashSync("admin123", 10);
    await query(
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)",
      ["loudlayer000@gmail.com", hash, "Admin", "admin"]
    );
  }

  const customerCount = await query("SELECT COUNT(*) as c FROM users WHERE role = 'customer'");
  if (parseInt(customerCount.rows[0].c) === 0) {
    const hash = bcrypt.hashSync("customer123", 10);
    await query(
      "INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)",
      ["customer@test.com", hash, "Test Customer", "customer"]
    );
  }

  const productCount = await query("SELECT COUNT(*) as c FROM products");
  if (parseInt(productCount.rows[0].c) === 0) {
    const seed = `
      INSERT INTO products (slug, name, price, discount_percentage, image, category, code, description, tags, stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await query(seed, [
      "international-going-distance-2026",
      "©International - going distance 2026",
      120,
      null,
      "/uploads/momentsImage_1.jpg",
      "Outer",
      "G-DIST-01",
      "Where Elegance Meets Sustainability, Luxury Made Accessible",
      JSON.stringify(["Premium"]),
      50
    ]);
    await query(seed, [
      "international-just-do-it-2026",
      "©International - just do it 2026",
      180,
      "45%",
      "/uploads/momentsImage_2.jpg",
      "Jacket",
      "JD-JKT-26",
      "Every item combines meticulous stitching with heavy cotton details, customized for optimal street insulation.",
      JSON.stringify(["Limited Edition"]),
      30
    ]);
    await query(seed, [
      "velour-orange-trek-shell",
      "velour - Orange Trek Shell",
      195,
      null,
      "/uploads/heroSection_image-.png",
      "Jacket",
      "VEL-OTR-01",
      "Technical shell with active insulation.",
      JSON.stringify(["Technical", "Active Insulation"]),
      25
    ]);
    await query(seed, [
      "velour-sage-windshield",
      "velour - Sage Windshield",
      210,
      null,
      "/uploads/mementoJacket.jpg",
      "Outer",
      "VEL-SW-02",
      "Waterproof with adjustable cords.",
      JSON.stringify(["Waterproof", "Adjustable Cords"]),
      20
    ]);
    await query(seed, [
      "velour-premium-heavy-tshirt",
      "velour - Premium Heavy T-Shirt",
      85,
      null,
      "/uploads/mementofemaleJacket.jpg",
      "Shirt",
      "VEL-HTS-03",
      "Oversized 100% organic cotton.",
      JSON.stringify(["Oversized", "100% Organic Cotton"]),
      100
    ]);
    await query(seed, [
      "velour-block-field-track",
      "velour - Block Field Track",
      240,
      null,
      "/uploads/mementoshirtsfemaleShirts.jpg",
      "Jacket",
      "VEL-BFT-04",
      "Modular fit with breathable mesh.",
      JSON.stringify(["Modular Fit", "Breathable Mesh"]),
      15
    ]);

    const testimonials = `
      INSERT INTO testimonials (author, role, image, rating, reviews_count, text)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await query(testimonials, [
      "",
      "Fashion Stylist",
      "/placeholder-testimonial.svg",
      5.0,
      49,
      "Everything is absolutely perfect! From the fabric quality to the flawless fit every piece feels premium. This brand has completely transformed my wardrobe."
    ]);
    await query(testimonials, [
      "",
      "Global Creative Lead",
      "/placeholder-testimonial.svg",
      5.0,
      32,
      "The technical zippers, taped seams, and oversized visual structure capture active urban energy like no other label. High craftsmanship combined with pure wearability."
    ]);
    await query(testimonials, [
      "",
      "Senior Apparel Buyer",
      "/placeholder-testimonial.svg",
      4.9,
      56,
      "Meticulous focus on modern technical silhouettes. Customers consistently highlight the drape and raw styling appeal. Easily our fastest-selling quarterly collection."
    ]);
  }
}