import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { userAuthMiddleware } from "../middleware/auth";

const router = Router();

router.use(userAuthMiddleware);

router.get("/", (req: Request, res: Response) => {
  const db = getDb();
  const items = db.prepare("SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY created_at").all(req.user!.userId) as any[];
  res.json({ items: items.map((i) => ({ ...i, product_data: JSON.parse(i.product_data) })) });
});

router.put("/", (req: Request, res: Response) => {
  const db = getDb();
  const { items } = req.body;
  const del = db.prepare("DELETE FROM wishlist_items WHERE user_id = ?");
  const ins = db.prepare("INSERT OR REPLACE INTO wishlist_items (user_id, product_id, product_data) VALUES (?, ?, ?)");
  const tx = db.transaction(() => {
    del.run(req.user!.userId);
    if (items) {
      for (const item of items) {
        ins.run(req.user!.userId, item.id, JSON.stringify(item));
      }
    }
  });
  tx();
  const saved = db.prepare("SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY created_at").all(req.user!.userId) as any[];
  res.json({ items: saved.map((i) => ({ ...i, product_data: JSON.parse(i.product_data) })) });
});

export default router;
