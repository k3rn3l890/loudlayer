import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const latency = new Trend("latency");

const BASE_URL = "http://localhost:3001";

export let options = {
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

export default function () {
  const endpoints = [
    "/api/products",
    "/api/products?visible=1",
    "/api/health",
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${ep}`, { tags: { name: ep } });
  latency.add(res.timings.duration);

  const passed = check(res, {
    "status 200": (r) => r.status === 200,
    "valid json": (r) => r.headers["Content-Type"]?.includes("json"),
  });
  errorRate.add(!passed);

  sleep(Math.random() * 0.5 + 0.1);
}
