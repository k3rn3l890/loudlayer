import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { userAuthMiddleware } from "../middleware/auth";

const router = Router();

router.use(userAuthMiddleware);

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare("SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at").all(req.user!.userId) as any[];
  res.json({ items: items.map((i) => ({ ...i, product_data: JSON.parse(i.product_data) })) });
});

router.put("/", (req: Request, res: Response) => {
  const db = getDb();
  const { items } = req.body;
  const getStock = db.prepare("SELECT stock FROM products WHERE id = ?");
  const del = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const ins = db.prepare("INSERT OR REPLACE INTO cart_items (user_id, product_id, product_data, quantity, size) VALUES (?, ?, ?, ?, ?)");
  const tx = db.transaction(() => {
    del.run(req.user!.userId);
    if (items) {
      for (const item of items) {
        const product = getStock.get(item.product.id) as any;
        const available = product ? (product.stock ?? 0) : 0;
        if (available > 0) {
          const qty = Math.min(item.quantity, available);
          ins.run(req.user!.userId, item.product.id, JSON.stringify(item.product), qty, item.selectedSize || "");
        }
      }
    }
  });
  tx();
  const saved = db.prepare("SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at").all(req.user!.userId) as any[];
  res.json({ items: saved.map((i) => ({ ...i, product_data: JSON.parse(i.product_data) })) });
});

export default router;
