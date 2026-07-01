import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { authMiddleware, userAuthMiddleware } from "../middleware/auth";
import { sendOrderConfirmation, sendAdminAlert, sendStatusUpdate } from "../mail";
import { CreateOrderSchema, UpdateStatusSchema } from "../validation";

const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const { status, search } = req.query;

  let sql = "SELECT * FROM orders WHERE 1=1";
  const params: any[] = [];

  if (status && status !== "all") {
    sql += " AND status = ?";
    params.push(status);
  }
  if (search) {
    sql += " AND (order_number LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY created_at DESC";

  const orders = db.prepare(sql).all(...params);
  res.json({ orders });
});

router.get("/my", userAuthMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(req.user!.userId);
  res.json({ orders });
});

router.post("/", userAuthMiddleware, (req: Request, res: Response) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { items, customer_name, customer_phone, shipping_address, notes } = parsed.data;
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.userId) as any;
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  const getStock = db.prepare("SELECT id, stock, name FROM products WHERE id = ?");

  const inStockItems: any[] = [];
  const skippedItems: any[] = [];

  for (const item of items) {
    const product = getStock.get(item.product_id) as any;
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

  const decrementStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

  const orderResult = db.prepare(
    "INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, shipping_address, status, total, notes) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)"
  ).run(orderNumber, user.id, customer_name || user.name, user.email, customer_phone || "", shipping_address || "", total, notes || "");

  const orderId = Number(orderResult.lastInsertRowid);
  const insertItem = db.prepare(
    "INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, size, image) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );

  for (const item of inStockItems) {
    insertItem.run(orderId, item.dbProductId, item.name, item.price, item.quantity, item.size || "", item.image || "");
    decrementStock.run(item.quantity, item.dbProductId);
  }

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  const orderItems = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId);
  res.json({ order, items: orderItems, skipped_items: skippedItems.length > 0 ? skippedItems : undefined });

  sendOrderConfirmation(user.email, order, orderItems).catch(() => {});
  sendAdminAlert(order, orderItems).catch(() => {});
});

router.get("/:id", authMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
  res.json({ order, items });
});

router.patch("/:id/status", authMiddleware, (req: Request, res: Response) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { status, notes } = parsed.data;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
  if (!existing) { res.status(404).json({ error: "Order not found" }); return; }

  const updateNotes = notes !== undefined ? notes : existing.notes;

  if (status === "cancelled" && existing.status !== "cancelled") {
    const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(existing.id) as any[];
    const restoreStock = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
    for (const item of items) {
      if (item.product_id) {
        restoreStock.run(item.quantity, item.product_id);
      }
    }
  }

  db.prepare("UPDATE orders SET status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, updateNotes, req.params.id);

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
  res.json({ order });

  if (["shipped", "delivered", "cancelled"].includes(status) && existing.status !== status) {
    sendStatusUpdate(order.customer_email, order, status).catch(() => {});
  }
});

export default router;
