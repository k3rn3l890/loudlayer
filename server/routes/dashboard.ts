import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/stats", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();

  const totalProducts = (db.prepare("SELECT COUNT(*) as c FROM products").get() as any).c;
  const totalOrders = (db.prepare("SELECT COUNT(*) as c FROM orders").get() as any).c;
  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status != 'cancelled'").get() as any).t;
  const totalCustomers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get() as any).c;

  const ordersByStatus = db.prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status").all();

  const recentOrders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5").all();

  res.json({ stats: { totalProducts, totalOrders, totalRevenue, totalCustomers, ordersByStatus }, recentOrders });
});

export default router;
