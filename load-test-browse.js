/**
 * Public storefront load test — Supabase PostgREST (anon key).
 *
 *   k6 run -e SUPABASE_URL=https://<ref>.supabase.co \
 *          -e SUPABASE_ANON_KEY=<anon-key> load-test-browse.js
 *
 * The anon key is public and safe to pass on the command line. Never use the
 * service role key here.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const latency = new Trend("latency");

const SUPABASE_URL = (__ENV.SUPABASE_URL || "").replace(/\/$/, "");
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY, e.g. k6 run -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... load-test-browse.js");
}

export const options = {
  stages: [
    { duration: "30s", target: 200 },
    { duration: "30s", target: 500 },
    { duration: "30s", target: 1000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    errors: ["rate<0.05"],
  },
};

const HEADERS = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

const ENDPOINTS = [
  {
    name: "products",
    path: "/rest/v1/products?select=id,slug,name,price,image&visible=eq.true&order=created_at.desc",
  },
  {
    name: "products_page",
    path: "/rest/v1/products?select=id,slug,name,price,image,stock&visible=eq.true&limit=12",
  },
  {
    name: "testimonials",
    path: "/rest/v1/testimonials?select=*&visible=eq.true",
  },
  {
    name: "reviews",
    path: "/rest/v1/reviews?select=id,product_id,rating,comment,created_at&limit=10",
  },
  {
    name: "auth_health",
    path: "/auth/v1/health",
  },
];

export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const res = http.get(`${SUPABASE_URL}${endpoint.path}`, {
    headers: HEADERS,
    tags: { name: endpoint.name },
  });
  latency.add(res.timings.duration);

  const passed = check(res, {
    "status 200": (r) => r.status === 200,
    "valid json": (r) => (r.headers["Content-Type"] || "").includes("json"),
  });
  errorRate.add(!passed);

  sleep(Math.random() * 0.5 + 0.1);
}
