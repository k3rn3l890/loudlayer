import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiGet, apiPost, apiPut } from "../../src/lib/userApi";

const API_URL = "http://localhost:3001";

describe("userApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("apiGet", () => {
    it("fetches data successfully", async () => {
      const mockData = { products: [{ id: 1, name: "Test" }] };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await apiGet("/products");
      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/products`, {
        credentials: "include",
      });
    });

    it("throws on non-ok response", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Not found" }),
      });

      await expect(apiGet("/nonexistent")).rejects.toThrow("Not found");
    });

    it("throws generic error when body has no error field", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiGet("/fail")).rejects.toThrow("Request failed: 500");
    });
  });

  describe("apiPost", () => {
    it("sends POST with JSON body", async () => {
      const mockResponse = { success: true };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPost("/auth/login", { email: "test@test.com", password: "pass" });
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/auth/login`,
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        })
      );
    });

    it("throws on auth failure", async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Invalid credentials" }),
      });

      await expect(apiPost("/auth/login", {})).rejects.toThrow("Invalid credentials");
    });
  });

  describe("apiPut", () => {
    it("sends PUT with JSON body", async () => {
      const mockResponse = { product: { id: 1, name: "Updated" } };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiPut("/products/1", { name: "Updated" });
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/products/1`,
        expect.objectContaining({ method: "PUT" })
      );
    });
  });
});
