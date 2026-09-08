import { Router, Request, Response } from "express";
import { query } from "../db";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const totalProducts = query("SELECT COUNT(*) as c FROM products");
    const totalOrders = query("SELECT COUNT(*) as c FROM orders");
    const totalRevenue = query("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status != 'cancelled'");
    const totalCustomers = query("SELECT COUNT(*) as c FROM users WHERE role = 'customer'");
    const ordersByStatus = query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
    const recentOrders = query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");

    res.json({
      stats: {
        totalProducts: parseInt(totalProducts.rows[0].c),
        totalOrders: parseInt(totalOrders.rows[0].c),
        totalRevenue: parseFloat(totalRevenue.rows[0].t),
        totalCustomers: parseInt(totalCustomers.rows[0].c),
        ordersByStatus: ordersByStatus.rows,
      },
      recentOrders: recentOrders.rows,
    });
  } catch (err: any) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
