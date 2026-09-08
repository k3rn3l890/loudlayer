# LoudLayer Stack

## Frontend

1. React 19 with TypeScript 5.8, built with Vite 8 and styled with Tailwind CSS 4. 
2. Animations powered by Motion (Framer Motion) 12 and Anime.js 4. Icons from Lucide React. 
3. Client-side routing via React Router DOM 7. Google OAuth handled through `@react-oauth/google`. 
4. Vite dev server runs on port 3000 and proxies `/api` and `/uploads` to the backend on port 3001.

## API

1. Express 4.21 REST server on port 3001, executed via `tsx watch` with hot reload. 
2. Eight route modules: auth (register, login, logout, Google OAuth), products (CRUD + slug lookup), orders (create, status updates, stock management), cart, wishlist, dashboard (admin stats), reviews, and file upload. 
3. Authentication uses JWT stored in httpOnly cookies. Request validation through Zod. Security via Helmet (CSP headers), CORS, and express-rate-limit.

## Backend

1. SQLite via better-sqlite3, file-based at `data/loudlayer.db` with WAL mode for concurrent reads. 
2. Schema auto-creates on startup with eight tables: users, products, orders, order_items, testimonials, reviews, cart_items, wishlist_items. 
3. Seeds with 6 products and an admin user on first run. bcryptjs for password hashing. 
4. Multer handles image uploads to `uploads/`. 
5. SendGrid sends order confirmation and admin alert emails.

## Testing

1. **Unit/Integration tests** — Vitest with Supertest for backend API route testing (12 test files, 79 tests).
2. **Frontend tests** — Vitest + React Testing Library + jsdom for component and utility testing (4 test files, 24 tests).
3. **E2E tests** — Playwright with Chromium for full user journey testing (10 tests).
4. **Type checking** — `tsc --noEmit` via `npm run lint`.

### Commands

- `npm test` — Run backend API tests
- `npm run test:frontend` — Run frontend component tests
- `npm run test:e2e` — Run Playwright E2E tests (requires dev servers running)
- `npm run test:all` — Run all Vitest tests (backend + frontend)
- `npm run lint` — TypeScript type check
