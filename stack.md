# LoudLayer Stack

## Frontend

1. React 19 with TypeScript 5.8, built with Vite 8 and styled with Tailwind CSS 4.
2. Animations powered by Motion (Framer Motion) 12 and Anime.js 4. Icons from Lucide React.
3. Client-side routing via React Router DOM 7. Google OAuth is disabled for now — the redirect
   flow is wired behind `GOOGLE_AUTH_ENABLED` in `src/lib/supabase.ts`.
4. Vite dev server runs on port 3000. There is no local API proxy: the browser talks to Supabase.

## Backend (Supabase)

1. Supabase Postgres is the only database. Schema, RLS policies, RPCs and the storage bucket live
   in `supabase/migrations/20261023000100_init.sql`.
2. Row Level Security replaces the old Express route guards. Admin access is derived from
   `profiles.role` through the `is_admin()` function.
3. Business logic is implemented as Postgres functions:
   - `create_order` — validates stock, decrements inventory and writes the order transactionally.
   - `replace_user_cart` / `replace_user_wishlist` — cart and wishlist sync.
   - `admin_update_order_status` — status changes with restock-on-cancel.
   - `admin_stats` — dashboard aggregates.
   - `get_product_reviews` — public reviews with reviewer names and aggregate stats.
4. Product images are stored in the public `product-images` Storage bucket. Legacy files live
   under `legacy/`; `resolveImage()` maps old `/uploads/...` paths.
5. Transactional email is sent by the `send-order-emails` Supabase Edge Function (SendGrid).
   Deploy with `supabase functions deploy send-order-emails`.
6. Auth is Supabase Auth (email + password). The SQLite users were imported with their existing
   bcrypt hashes by `scripts/migrate-to-supabase.mjs`.

## Testing

1. **Backend integration tests** — Vitest running against Supabase (RLS, RPCs, constraints) with
   isolated fixtures. 9 test files.
2. **Frontend tests** — Vitest + React Testing Library + jsdom for context, API and mapping logic.
3. **E2E tests** — Playwright with Chromium for the storefront, auth and admin smoke flows.
4. **Type checking** — `tsc --noEmit` via `npm run lint`.

### Commands

- `npm run dev` — Start the Vite dev server (http://localhost:3000)
- `npm test` — Run the Supabase-backed backend tests
- `npm run test:frontend` — Run frontend component/unit tests
- `npm run test:e2e` — Run Playwright E2E tests
- `npm run test:all` — Run both Vitest suites
- `npm run test:ci` — Lint + both Vitest suites
- `npm run lint` — TypeScript type check
- `npm run migrate:supabase` — One-time SQLite → Supabase data migration
- `npm run verify:supabase` — Check connectivity, schema and RPC availability

## Deployment

- Frontend: Vercel (static Vite build). Required env vars: `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`.
- Supabase project: schema via `supabase/migrations/`, Edge Function secrets via
  `supabase secrets set SENDGRID_API_KEY=... ADMIN_NOTIFY_EMAIL=...`.
- The Render Express service and SQLite database are decommissioned.
