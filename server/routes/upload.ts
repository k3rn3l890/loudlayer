import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/auth";

const storage = multer.diskStorage({
  destination: path.join(import.meta.dirname, "..", "..", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
    cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
  }
});

const router = Router();

router.post("/", authMiddleware, upload.single("image"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  const url = "/uploads/" + req.file.filename;
  res.json({ url });
});

export default router;
