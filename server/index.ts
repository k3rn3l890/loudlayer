import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import dashboardRoutes from "./routes/dashboard";
import uploadRoutes from "./routes/upload";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import reviewRoutes from "./routes/reviews";
import { initSchema, migrateSchema, seedDefaults } from "./db";

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

async function initializeDatabase() {
  try {
    await initSchema();
    await migrateSchema();
    await seedDefaults();
    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Database initialization failed:", err);
    process.exit(1);
  }
}

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://accounts.google.com"],
      frameSrc: ["https://accounts.google.com"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
    if (allowed.includes(origin) || origin.endsWith(".vercel.app") || origin.startsWith("http://localhost")) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const RATE_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;

const authLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: process.env.AUTH_RATE_MAX ? Number(process.env.AUTH_RATE_MAX) : 10,
  message: { error: "Too many attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: process.env.API_RATE_MAX ? Number(process.env.API_RATE_MAX) : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: RATE_WINDOW,
  max: process.env.UPLOAD_RATE_MAX ? Number(process.env.UPLOAD_RATE_MAX) : 20,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);
app.use("/api/upload", uploadLimiter);

app.use("/uploads", express.static(path.join(import.meta.dirname, "..", "uploads"), {
  setHeaders: (res) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    res.set("Access-Control-Allow-Origin", "*");
  },
}));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/products", reviewRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`LoudLayer API server running on http://localhost:${PORT}`);
  });
});
