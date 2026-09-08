import { Router, Request, Response } from "express";
import { query } from "../db";
import { authMiddleware } from "../middleware/auth";
import { CreateReviewSchema } from "../validation";

const router = Router();

router.get("/:slug/reviews", async (req: Request, res: Response) => {
  try {
    const productResult = query("SELECT id FROM products WHERE slug = ?", [req.params.slug]);
    if (productResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const productId = productResult.rows[0].id;

    const reviewsResult = query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC`,
      [productId]
    );

    const statsResult = query(
      `SELECT COUNT(*) as count, COALESCE(ROUND(AVG(rating), 1), 0) as average
       FROM reviews WHERE product_id = ?`,
      [productId]
    );

    res.json({ reviews: reviewsResult.rows, stats: statsResult.rows[0] });
  } catch (err: any) {
    console.error("Reviews GET error:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/:slug/reviews", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = CreateReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const user = (req as any).admin;

    const productResult = query("SELECT id FROM products WHERE slug = ?", [req.params.slug]);
    if (productResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const productId = productResult.rows[0].id;

    const { rating, body } = parsed.data;

    const existingResult = query(
      "SELECT id FROM reviews WHERE product_id = ? AND user_id = ?",
      [productId, user.userId]
    );
    if (existingResult.rows.length > 0) {
      res.status(400).json({ error: "You have already reviewed this product" });
      return;
    }

    query(
      `INSERT INTO reviews (product_id, user_id, rating, body)
       VALUES (?, ?, ?, ?)`,
      [productId, user.userId, rating, body || ""]
    );

    const reviewResult = query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.user_id = ?
       ORDER BY r.created_at DESC LIMIT 1`,
      [productId, user.userId]
    );

    res.status(201).json({ review: reviewResult.rows[0] });
  } catch (err: any) {
    console.error("Reviews POST error:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
