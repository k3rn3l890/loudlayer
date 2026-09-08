import { Router, Request, Response } from "express";
import { query } from "../db";
import { authMiddleware, userAuthMiddleware } from "../middleware/auth";
import { sendOrderConfirmation, sendAdminAlert, sendStatusUpdate } from "../mail";
import { CreateOrderSchema, UpdateStatusSchema } from "../validation";

const router = Router();

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let sql = "SELECT * FROM orders WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (search) {
      sql += ` AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY created_at DESC";

    const result = query(sql, params);
    res.json({ orders: result.rows });
  } catch (err: any) {
    console.error("Orders GET error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/my", userAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const result = query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.user!.userId]
    );
    res.json({ orders: result.rows });
  } catch (err: any) {
    console.error("Orders GET /my error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/", userAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { items, customer_name, customer_phone, shipping_address, notes } = parsed.data;

    const userResult = query("SELECT * FROM users WHERE id = ?", [req.user!.userId]);
    const user = userResult.rows[0];
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const inStockItems: any[] = [];
    const skippedItems: any[] = [];

    for (const item of items) {
      const productResult = query("SELECT id, stock, name FROM products WHERE id = ?", [item.product_id]);
      const product = productResult.rows[0];
      if (!product) {
        skippedItems.push({ name: item.name || "Unknown", reason: "Product not found" });
        continue;
      }
      if ((product.stock ?? 0) < item.quantity) {
        skippedItems.push({ name: product.name, reason: `Only ${product.stock} available` });
        continue;
      }
      inStockItems.push({ ...item, dbProductId: product.id });
    }

    if (inStockItems.length === 0) {
      res.status(400).json({ error: "All items are out of stock", skipped_items: skippedItems });
      return;
    }

    const total = inStockItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

    query(
      `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, status, total, notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [orderNumber, user.id, customer_name || user.name, user.email, customer_phone || "", shipping_address || "", total, notes || ""]
    );

    const orderResult = query("SELECT * FROM orders WHERE order_number = ?", [orderNumber]);
    const orderId = orderResult.rows[0].id;

    for (const item of inStockItems) {
      query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, size, image)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, item.dbProductId, item.name, item.price, item.quantity, item.size || "", item.image || ""]
      );
      query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.dbProductId]);
    }

    const order = query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const orderItems = query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    res.json({ order: order.rows[0], items: orderItems.rows, skipped_items: skippedItems.length > 0 ? skippedItems : undefined });

    sendOrderConfirmation(user.email, order.rows[0], orderItems.rows).catch(() => {});
    sendAdminAlert(order.rows[0], orderItems.rows).catch(() => {});
  } catch (err: any) {
    console.error("Orders POST error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const orderResult = query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (orderResult.rows.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const itemsResult = query("SELECT * FROM order_items WHERE order_id = ?", [req.params.id]);
    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err: any) {
    console.error("Orders GET /:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.patch("/:id/status", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0].message });
      return;
    }
    const { status, notes } = parsed.data;

    const existingResult = query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    if (existingResult.rows.length === 0) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const existing = existingResult.rows[0];

    const updateNotes = notes !== undefined ? notes : existing.notes;

    if (status === "cancelled" && existing.status !== "cancelled") {
      const itemsResult = query("SELECT * FROM order_items WHERE order_id = ?", [existing.id]);
      for (const item of itemsResult.rows) {
        if (item.product_id) {
          query("UPDATE products SET stock = stock + ? WHERE id = ?", [item.quantity, item.product_id]);
        }
      }
    }

    query(
      "UPDATE orders SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?",
      [status, updateNotes, req.params.id]
    );

    const orderResult = query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
    res.json({ order: orderResult.rows[0] });

    if (["shipped", "delivered", "cancelled"].includes(status) && existing.status !== status) {
      sendStatusUpdate(orderResult.rows[0].customer_email, orderResult.rows[0], status).catch(() => {});
    }
  } catch (err: any) {
    console.error("Orders PATCH /:id/status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
