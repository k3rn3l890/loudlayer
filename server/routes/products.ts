import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { query } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CreateProductSchema, UpdateProductSchema } from "../validation";

const storage = multer.diskStorage({
  destination: path.join(import.meta.dirname, "..", "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

const router = Router();

function fullImageUrl(req: Request, path: string): string {
  if (!path || path.startsWith("http")) return path;
  return `${req.protocol}://${req.get("host")}${path}`;
}

function mapProduct(req: Request, p: any) {
  return { ...p, image: fullImageUrl(req, p.image || ""), tags: p.tags ? JSON.parse(p.tags) : [] };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, visible } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params: any[] = [];

    if (visible === "1") {
      sql += ` AND visible = 1`;
    } else if (visible === "0") {
      sql += ` AND visible = 0`;
    }
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (name LIKE ? OR code LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY created_at DESC";

    const result = query(sql, params);
    const products = result.rows.map((p) => mapProduct(req, p));
    res.json({ products });
  } catch (err: any) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const result = query("SELECT * FROM products WHERE slug = ? AND visible = 1", [req.params.slug]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product: mapProduct(req, result.rows[0]) });
  } catch (err: any) {
    console.error("GET /products/slug error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const result = query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ product: mapProduct(req, result.rows[0]) });
  } catch (err: any) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock } = parsed.data;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : image;

    query(
      `INSERT INTO products (slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, name, price, discount_price || null, discount_percentage || null, imageUrl, category, code || null, description, JSON.stringify(tags), stock]
    );

    const result = query("SELECT * FROM products WHERE slug = ?", [slug]);
    res.status(201).json({ product: mapProduct(req, result.rows[0]) });
  } catch (err: any) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", authMiddleware, upload.single("image"), async (req: Request, res: Response) => {
  try {
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const existingResult = query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const existing = existingResult.rows[0];

    const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock, visible } = parsed.data;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : image;

    query(
      `UPDATE products SET
        slug = ?, name = ?, price = ?, discount_price = ?, discount_percentage = ?,
        image = ?, category = ?, code = ?, description = ?, tags = ?,
        stock = ?, visible = ?, updated_at = datetime('now')
       WHERE id = ?`,
      [
        slug ?? existing.slug,
        name ?? existing.name,
        price ?? existing.price,
        discount_price !== undefined ? discount_price : existing.discount_price,
        discount_percentage !== undefined ? discount_percentage : existing.discount_percentage,
        imageUrl ?? existing.image,
        category ?? existing.category,
        code !== undefined ? code : existing.code,
        description ?? existing.description,
        tags ? JSON.stringify(tags) : existing.tags,
        stock ?? existing.stock,
        visible !== undefined ? (visible ? 1 : 0) : existing.visible,
        req.params.id
      ]
    );

    const productResult = query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json({ product: mapProduct(req, productResult.rows[0]) });
  } catch (err: any) {
    console.error("PUT /products/:id error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const existingResult = query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
