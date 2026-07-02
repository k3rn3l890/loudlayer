import { Router, Request, Response } from "express";
import { query } from "../db-pg";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const [totalProducts, totalOrders, totalRevenue, totalCustomers, ordersByStatus, recentOrders] = await Promise.all([
      query("SELECT COUNT(*) as c FROM products"),
      query("SELECT COUNT(*) as c FROM orders"),
      query("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status != 'cancelled'"),
      query("SELECT COUNT(*) as c FROM users WHERE role = 'customer'"),
      query("SELECT status, COUNT(*) as count FROM orders GROUP BY status"),
      query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5"),
    ]);

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