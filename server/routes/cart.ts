import { Router, Request, Response } from "express";
import { query } from "../db";
import { userAuthMiddleware } from "../middleware/auth";

const router = Router();

router.use(userAuthMiddleware);

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = query(
      "SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at",
      [req.user!.userId]
    );
    res.json({ items: result.rows.map((i) => ({ ...i, product_data: typeof i.product_data === "string" ? JSON.parse(i.product_data) : i.product_data })) });
  } catch (err: any) {
    console.error("Cart GET error:", err);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.put("/", async (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const userId = req.user!.userId;

    query("DELETE FROM cart_items WHERE user_id = ?", [userId]);

    if (items && items.length > 0) {
      for (const item of items) {
        const stockResult = query("SELECT stock FROM products WHERE id = ?", [item.product.id]);
        const available = stockResult.rows[0]?.stock ?? 0;
        if (available > 0) {
          const qty = Math.min(item.quantity, available);
          // Upsert: delete existing then insert
          query("DELETE FROM cart_items WHERE user_id = ? AND product_id = ? AND size = ?", [userId, item.product.id, item.selectedSize || ""]);
          query(
            "INSERT INTO cart_items (user_id, product_id, product_data, quantity, size) VALUES (?, ?, ?, ?, ?)",
            [userId, item.product.id, JSON.stringify(item.product), qty, item.selectedSize || ""]
          );
        }
      }
    }

    const saved = query("SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at", [userId]);
    res.json({ items: saved.rows.map((i) => ({ ...i, product_data: typeof i.product_data === "string" ? JSON.parse(i.product_data) : i.product_data })) });
  } catch (err: any) {
    console.error("Cart PUT error:", err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

export default router;
