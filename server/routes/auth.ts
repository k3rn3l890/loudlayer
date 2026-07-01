import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { getDb } from "../db";
import { generateToken, setTokenCookie, clearTokenCookie, userAuthMiddleware } from "../middleware/auth";
import { RegisterSchema, LoginSchema, GoogleAuthSchema } from "../validation";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function checkLoginLockout(key: string): string | null {
  const record = loginAttempts.get(key);
  if (record && record.lockedUntil > Date.now()) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return `Too many failed attempts. Try again in ${remaining} minute(s).`;
  }
  if (record && record.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
  }
  return null;
}

function recordFailedAttempt(key: string): void {
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count++;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
    record.count = 0;
  }
  loginAttempts.set(key, record);
}

function clearLoginAttempts(key: string): void {
  loginAttempts.delete(key);
}

const router = Router();

router.post("/register", (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password, name } = parsed.data;
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, 'customer')").run(email, hash, name || "");
  const token = generateToken({ userId: Number(result.lastInsertRowid), email, role: "customer" });
  setTokenCookie(res, token);
  res.json({ token, user: { id: Number(result.lastInsertRowid), email, name: name || "", role: "customer" } });
});

router.post("/login", (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { email, password } = parsed.data;
  const lockoutKey = `login:${req.ip}:${email}`;
  const lockMsg = checkLoginLockout(lockoutKey);
  if (lockMsg) {
    res.status(429).json({ error: lockMsg });
    return;
  }
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  if (user.provider === "google") {
    recordFailedAttempt(lockoutKey);
    res.status(401).json({ error: "This account uses Google sign-in. Please log in with Google." });
    return;
  }
  if (!bcrypt.compareSync(password, user.password)) {
    recordFailedAttempt(lockoutKey);
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  clearLoginAttempts(lockoutKey);
  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  setTokenCookie(res, token);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post("/google", async (req: Request, res: Response) => {
  const parsed = GoogleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }
  const { credential } = parsed.data;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google credential" });
      return;
    }
    const db = getDb();
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(payload.email) as any;
    if (user) {
      if (user.provider === "email") {
        res.status(400).json({ error: "This email is registered with a password. Please log in with your email and password instead." });
        return;
      }
      if (user.provider !== "google") {
        db.prepare("UPDATE users SET provider = 'google' WHERE id = ?").run(user.id);
      }
    } else {
      const result = db.prepare("INSERT INTO users (email, password, name, role, provider) VALUES (?, '', ?, 'customer', 'google')").run(
        payload.email, payload.name || ""
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid) as any;
    }
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    setTokenCookie(res, token);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch {
    console.error("Google authentication error");
    res.status(401).json({ error: "Google authentication failed. Please try again." });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  clearTokenCookie(res);
  res.json({ success: true });
});

router.get("/me", userAuthMiddleware, (req: Request, res: Response) => {
  const db = getDb();
  const user = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(req.user!.userId) as any;
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  res.json({ user });
});

export default router;
