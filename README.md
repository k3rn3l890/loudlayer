

## What You Need

- Node.js 18 or higher
- That's it. The database is SQLite (no server needed).

## Getting Started

### 1. Install dependencies

npm install


### 2. Set up environment variables

Copy the example env file and fill in the values:

cp .env.example .env


### 3. Start the app

```
npm run dev
```

This runs both the frontend (port 3000) and the backend (port 3001) at the same time.

Open http://localhost:3000 in browser.

### 4. Log in

The database creates an admin account on first run:

- **Email:** loudlayer000@gmail.com
- **Password:** 12Flowers$$$

Go to http://localhost:3000/admin to access the admin panel.

## Project Structure

```
server/                 # Express backend (port 3001)
  index.ts              # Server entry point
  db.ts                 # SQLite database setup, schema, seeds
  routes/               # API routes (auth, products, orders, cart, etc.)
  middleware/            # JWT auth middleware
  mail.ts               # SendGrid email notifications
 validation.ts         # Zod request validation

src/                    # React frontend (port 3000)
  pages/                # Store, product detail, login, signup pages
  components/           # Header, footer, cart drawer, etc.
  lib/                  # Auth context, cart context, API helpers
  admin/                # Admin panel (products, orders, dashboard)
```

## How It Works

- The frontend talks to the backend through `/api` requests.
- Vite proxies those requests to the Express server during development.
- The backend stores everything in a single SQLite file at `data/loudlayer.db`.
- The database schema, tables, and seed data are created automatically on first run.
- Product images are uploaded to the `uploads/` folder and served as static files.

## Available Scripts

| Command              | What it does |
|---                   |---                                  |
| `npm run dev`        | Start frontend + backend together   |
| `npm run dev:client` | Start only the frontend (port 3000) |
| `npm run dev:server` | Start only the backend (port 3001)  |
| `npm run build`      | Build the frontend for production   |
| `npm run lint`       | Type-check with TypeScript          |
