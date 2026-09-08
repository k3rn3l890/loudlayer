import express from "express";
import cookieParser from "cookie-parser";
import { initSchema, migrateSchema, seedDefaults } from "../server/db";
import authRoutes from "../server/routes/auth";
import productRoutes from "../server/routes/products";
import orderRoutes from "../server/routes/orders";
import dashboardRoutes from "../server/routes/dashboard";
import cartRoutes from "../server/routes/cart";
import wishlistRoutes from "../server/routes/wishlist";
import reviewRoutes from "../server/routes/reviews";

let app: express.Express | null = null;

export function createTestApp(): express.Express {
  if (app) return app;

  app = express();
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/wishlist", wishlistRoutes);
  app.use("/api/products", reviewRoutes);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Initialize DB (schema uses IF NOT EXISTS, seed checks before inserting)
  initSchema();
  migrateSchema();
  seedDefaults();

  return app;
}

export function resetApp(): void {
  app = null;
}
