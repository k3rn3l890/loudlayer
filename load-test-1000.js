/**
 * Authenticated load test — Supabase Auth + PostgREST, targeting 1000 VUs.
 *
 *   k6 run -e SUPABASE_URL=https://<ref>.supabase.co \
 *          -e SUPABASE_ANON_KEY=<anon-key> \
 *          -e SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *          load-test-1000.js
 *
 * The service role key is used only in setup() to create confirmed load-test
 * users (Supabase requires email confirmation for normal signups). It is never
 * sent from the virtual-user loop. Pass it at runtime; do not commit it.
 */
import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const loginErrorRate = new Rate("login_errors");
const browseErrorRate = new Rate("browse_errors");
const loginDuration = new Trend("login_duration");
const browseDuration = new Trend("browse_duration");

const SUPABASE_URL = (__ENV.SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";
const SERVICE_ROLE_KEY = __ENV.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY before running this script.");
}

const USER_COUNT = 20;
const PASSWORD = "testpass123";

const testUsers = Array.from({ length: USER_COUNT }, (_, i) => ({
  email: `loadtest${i}@example.com`,
  password: PASSWORD,
}));

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "30s", target: 300 },
    { duration: "30s", target: 500 },
    { duration: "30s", target: 1000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    login_duration: ["p(95)<3000"],
    browse_duration: ["p(95)<1000"],
    login_errors: ["rate<0.1"],
    browse_errors: ["rate<0.05"],
  },
};

function anonHeaders() {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function bearerHeaders(token) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token}`,
  };
}

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function ensureUserExists(user) {
  if (!SERVICE_ROLE_KEY) return false;

  const res = http.post(
    `${SUPABASE_URL}/auth/v1/admin/users`,
    JSON.stringify({ ...user, email_confirm: true }),
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  // 200 = created, 422 = already registered — both are fine.
  return res.status === 200 || res.status === 422;
}

function login(user) {
  const res = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify(user),
    { headers: anonHeaders(), tags: { name: "login" } }
  );
  loginDuration.add(res.timings.duration);

  const passed = check(res, {
    "login status 200": (r) => r.status === 200,
    "access token returned": (r) => Boolean(r.json("access_token")),
  });
  loginErrorRate.add(!passed);
  return passed ? res.json("access_token") : null;
}

function browseProducts(token) {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/products?select=id,slug,name,price,image&visible=eq.true&order=created_at.desc`,
    { headers: bearerHeaders(token), tags: { name: "browse" } }
  );
  browseDuration.add(res.timings.duration);

  const passed = check(res, {
    "browse status 200": (r) => r.status === 200,
    "products array": (r) => Array.isArray(r.json()),
  });
  browseErrorRate.add(!passed);
  return passed ? res.json() : [];
}

function viewProduct(token, slug) {
  const res = http.get(
    `${SUPABASE_URL}/rest/v1/products?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    { headers: bearerHeaders(token), tags: { name: "view_product" } }
  );
  check(res, {
    "view product 200": (r) => r.status === 200,
    "product found": (r) => Array.isArray(r.json()) && r.json().length === 1,
  });
  return res;
}

export function setup() {
  if (!SERVICE_ROLE_KEY) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — users must already exist and be email-confirmed.");
  } else {
    console.log(`Ensuring ${USER_COUNT} load-test users exist...`);
    let ready = 0;
    for (const user of testUsers) {
      if (ensureUserExists(user)) ready++;
    }
    console.log(`${ready}/${USER_COUNT} users ready.`);
  }

  const res = http.get(
    `${SUPABASE_URL}/rest/v1/products?select=slug&visible=eq.true`,
    { headers: anonHeaders() }
  );
  const products = res.status === 200 ? res.json() : [];

  return { slugs: (Array.isArray(products) ? products : []).map((p) => p.slug).filter(Boolean) };
}

export default function (data) {
  const slugs = data.slugs || [];

  group("Authentication", () => {
    const token = login(getRandomUser());
    if (!token) {
      sleep(1);
      return;
    }

    group("Browsing", () => {
      const products = browseProducts(token);
      sleep(0.5);

      if (slugs.length > 0) {
        const slug = slugs[Math.floor(Math.random() * slugs.length)];
        viewProduct(token, slug);
      }
      sleep(0.5);
    });
  });
}
