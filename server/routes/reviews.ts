import { Router, Request, Response } from "express";
import { query } from "../db-pg";
import { authMiddleware } from "../middleware/auth";
import { CreateReviewSchema } from "../validation";

const router = Router();

router.get("/:slug/reviews", async (req: Request, res: Response) => {
  try {
    const productResult = await query("SELECT id FROM products WHERE slug = $1", [req.params.slug]);
    if (productResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const productId = productResult.rows[0].id;

    const reviewsResult = await query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    const statsResult = await query(
      `SELECT COUNT(*) as count, COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average
       FROM reviews WHERE product_id = $1`,
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
    const user = (req as any).user;

    const productResult = await query("SELECT id FROM products WHERE slug = $1", [req.params.slug]);
    if (productResult.rows.length === 0) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    const productId = productResult.rows[0].id;

    const { rating, body } = parsed.data;

    const existingResult = await query(
      "SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2",
      [productId, user.id]
    );
    if (existingResult.rows.length > 0) {
      res.status(400).json({ error: "You have already reviewed this product" });
      return;
    }

    const result = await query(
      `INSERT INTO reviews (product_id, user_id, rating, body)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, user.id, rating, body || ""]
    );

    const reviewResult = await query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ review: reviewResult.rows[0] });
  } catch (err: any) {
    console.error("Reviews POST error:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;