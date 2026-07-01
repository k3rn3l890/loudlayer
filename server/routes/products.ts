import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CreateProductSchema, UpdateProductSchema } from "../validation";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const { category, search, visible } = req.query;

  let sql = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];

  if (visible === "1") {
    sql += " AND visible = 1";
  } else if (visible === "0") {
    sql += " AND visible = 0";
  }
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  if (search) {
    sql += " AND (name LIKE ? OR code LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY created_at DESC";

  const products = db.prepare(sql).all(...params);
  res.json({ products });
});

router.get("/slug/:slug", (req: Request, res: Response) => {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE slug = ? AND visible = 1").get(req.params.slug);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ product });
});

router.get("/:id", (req: Request, res: Response) => {
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }
  res.json({ product });
});

router.post("/", authMiddleware, (req: Request, res: Response) => {
  const parsed = CreateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock } = parsed.data;
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO products (slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug, name, price,
    discount_price || null,
    discount_percentage || null,
    image,
    category,
    code || null,
    description,
    JSON.stringify(tags),
    stock
  );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json({ product });
});

router.put("/:id", authMiddleware, (req: Request, res: Response) => {
  const parsed = UpdateProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const db = getDb();
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: "Product not found" }); return; }

  const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock, visible } = parsed.data;

  db.prepare(`
    UPDATE products SET
      slug = ?, name = ?, price = ?, discount_price = ?, discount_percentage = ?,
      image = ?, category = ?, code = ?, description = ?, tags = ?,
      stock = ?, visible = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    slug ?? existing.slug,
    name ?? existing.name,
    price ?? existing.price,
    discount_price !== undefined ? discount_price : existing.discount_price,
    discount_percentage !== undefined ? discount_percentage : existing.discount_percentage,
    image ?? existing.image,
    category ?? existing.category,
    code !== undefined ? code : existing.code,
    description ?? existing.description,
    tags ? JSON.stringify(tags) : existing.tags,
    stock ?? existing.stock,
    visible !== undefined ? (visible ? 1 : 0) : existing.visible,
    req.params.id
  );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json({ product });
});

router.delete("/:id", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!existing) { res.status(404).json({ error: "Product not found" }); return; }
  db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
