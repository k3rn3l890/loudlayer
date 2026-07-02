import { Router, Request, Response } from "express";
import { query } from "../db-pg";
import { authMiddleware } from "../middleware/auth";
import { CreateProductSchema, UpdateProductSchema } from "../validation";

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
    let paramIndex = 1;

    if (visible === "1") {
      sql += ` AND visible = TRUE`;
    } else if (visible === "0") {
      sql += ` AND visible = FALSE`;
    }
    if (category) {
      sql += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    sql += " ORDER BY created_at DESC";

    const result = await query(sql, params);
    const products = result.rows.map((p) => mapProduct(req, p));
    res.json({ products });
  } catch (err: any) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/slug/:slug", async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM products WHERE slug = $1 AND visible = TRUE", [req.params.slug]);
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
    const result = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
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

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock } = parsed.data;

    const result = await query(
      `INSERT INTO products (slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [slug, name, price, discount_price || null, discount_percentage || null, image, category, code || null, description, JSON.stringify(tags), stock]
    );

    res.status(201).json({ product: mapProduct(req, result.rows[0]) });
  } catch (err: any) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const existingResult = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const existing = existingResult.rows[0];

    const { slug, name, price, discount_price, discount_percentage, image, category, code, description, tags, stock, visible } = parsed.data;

    await query(
      `UPDATE products SET
        slug = $1, name = $2, price = $3, discount_price = $4, discount_percentage = $5,
        image = $6, category = $7, code = $8, description = $9, tags = $10,
        stock = $11, visible = $12, updated_at = NOW()
       WHERE id = $13`,
      [
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
        visible !== undefined ? visible : existing.visible,
        req.params.id
      ]
    );

    const productResult = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    res.json({ product: mapProduct(req, productResult.rows[0]) });
  } catch (err: any) {
    console.error("PUT /products/:id error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const existingResult = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    await query("DELETE FROM products WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;