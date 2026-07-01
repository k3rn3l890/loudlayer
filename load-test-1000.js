import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

const loginErrorRate = new Rate("login_errors");
const browseErrorRate = new Rate("browse_errors");
const loginDuration = new Trend("login_duration");
const browseDuration = new Trend("browse_duration");

const BASE_URL = "http://localhost:3001";

const testUsers = Array.from({ length: 20 }, (_, i) => ({
  email: `loadtest${i}@test.com`,
  password: "testpass123",
}));

export let options = {
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

function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function ensureUserExists(user) {
  const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
  });
  // 409 means already exists, that's fine
  return res.status === 201 || res.status === 409;
}

function login(user) {
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "login" },
  });
  loginDuration.add(res.timings.duration);
  const passed = check(res, {
    "login status 200": (r) => r.status === 200,
  });
  loginErrorRate.add(!passed);
  return passed ? res.json("token") : null;
}

function browseProducts(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  const res = http.get(`${BASE_URL}/api/products`, { headers, tags: { name: "browse" } });
  browseDuration.add(res.timings.duration);
  const passed = check(res, {
    "browse status 200": (r) => r.status === 200,
    "products array": (r) => Array.isArray(r.json("products")),
  });
  browseErrorRate.add(!passed);
  return passed ? res.json("products") : [];
}

function viewProduct(token, slug) {
  const res = http.get(`${BASE_URL}/api/products/slug/${slug}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: "view_product" },
  });
  check(res, { "view product 200": (r) => r.status === 200 });
}

export function setup() {
  console.log("Ensuring test users exist...");
  let created = 0;
  for (const user of testUsers) {
    if (ensureUserExists(user)) created++;
  }
  console.log(`Setup complete. ${created} users ready.`);

  const productsRes = http.get(`${BASE_URL}/api/products`);
  const products = productsRes.json("products") || [];
  return { slugs: products.map((p) => p.slug).filter(Boolean) };
}

export default function (data) {
  const slugs = data.slugs || [];

  group("Authentication", () => {
    const user = getRandomUser();
    const token = login(user);
    if (!token) {
      sleep(1);
      return;
    }

    group("Browsing", () => {
      const products = browseProducts(token);
      sleep(0.5);

      if (products.length > 0) {
        const product = products[Math.floor(Math.random() * products.length)];
        if (product.slug) {
          viewProduct(token, product.slug);
        }
      }
      sleep(0.5);
    });
  });
}
