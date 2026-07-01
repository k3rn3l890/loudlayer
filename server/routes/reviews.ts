import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CreateReviewSchema } from "../validation";

const router = Router();

router.get("/:slug/reviews", (req: Request, res: Response) => {
  const db = getDb();

  const product = db.prepare("SELECT id FROM products WHERE slug = ?").get(req.params.slug) as any;
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const reviews = db.prepare(`
    SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ?
    ORDER BY r.created_at DESC
  `).all(product.id);

  const stats = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(ROUND(AVG(rating), 1), 0) as average
    FROM reviews WHERE product_id = ?
  `).get(product.id) as any;

  res.json({ reviews, stats });
});

router.post("/:slug/reviews", authMiddleware, (req: Request, res: Response) => {
  const parsed = CreateReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const db = getDb();
  const user = (req as any).user;

  const product = db.prepare("SELECT id FROM products WHERE slug = ?").get(req.params.slug) as any;
  if (!product) { res.status(404).json({ error: "Product not found" }); return; }

  const { rating, body } = parsed.data;

  const existing = db.prepare("SELECT id FROM reviews WHERE product_id = ? AND user_id = ?").get(product.id, user.id);
  if (existing) {
    res.status(400).json({ error: "You have already reviewed this product" });
    return;
  }

  const result = db.prepare(`
    INSERT INTO reviews (product_id, user_id, rating, body)
    VALUES (?, ?, ?, ?)
  `).run(product.id, user.id, rating, body || "");

  const review = db.prepare(`
    SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ review });
});

export default router;