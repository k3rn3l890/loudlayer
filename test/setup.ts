import path from "path";
import fs from "fs";

// Set env before any server imports
process.env.JWT_SECRET = "test-secret-key-for-testing-only";

// Use unique DB per worker to avoid lock conflicts
const workerId = process.env.VITEST_WORKER_ID || "0";
const dbDir = path.join(import.meta.dirname, "..", "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, `test-worker-${workerId}.db`);
process.env.SQLITE_DB_PATH = dbPath;
process.env.SENDGRID_API_KEY = ""; // Disable email sending in tests

// Clean up test DB
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
