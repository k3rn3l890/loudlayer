import { Router, Request, Response } from "express";
import { query } from "../db-pg";
import { userAuthMiddleware } from "../middleware/auth";

const router = Router();

router.use(userAuthMiddleware);

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT * FROM wishlist_items WHERE user_id = $1 ORDER BY created_at",
      [req.user!.userId]
    );
    res.json({ items: result.rows.map((i) => ({ ...i, product_data: i.product_data })) });
  } catch (err: any) {
    console.error("Wishlist GET error:", err);
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const userId = req.user!.userId;

    await query("DELETE FROM wishlist_items WHERE user_id = $1", [userId]);

    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          "INSERT INTO wishlist_items (user_id, product_id, product_data) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO UPDATE SET product_data = EXCLUDED.product_data",
          [userId, item.id, JSON.stringify(item)]
        );
      }
    }

    const saved = await query("SELECT * FROM wishlist_items WHERE user_id = $1 ORDER BY created_at", [userId]);
    res.json({ items: saved.rows.map((i) => ({ ...i, product_data: i.product_data })) });
  } catch (err: any) {
    console.error("Wishlist PUT error:", err);
    res.status(500).json({ error: "Failed to update wishlist" });
  }
});

export default router;