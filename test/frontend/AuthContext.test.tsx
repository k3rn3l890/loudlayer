import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/lib/AuthContext";

// Test component that exposes auth context
function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? "loading" : "ready"}</span>
      <span data-testid="user">{user ? user.email : "null"}</span>
      <button onClick={() => login("test@test.com", "password123")}>Login</button>
      <button onClick={() => register("new@test.com", "password123", "New User")}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Mock /api/auth/me to return 401 (not logged in)
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in loading state and resolves to no user", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("loading");

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("login sets user on success", async () => {
    // First call is /api/auth/me (401)
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    // Second call is /api/auth/login (success)
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "abc",
        user: { id: "1", email: "test@test.com", name: "Test", role: "customer" },
      }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    screen.getByText("Login").click();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });
  });

  it("login throws on failure", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    // Login fails
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid credentials" }),
    });

    function LoginFailsConsumer() {
      const { user, loading, login } = useAuth();
      const [error, setError] = React.useState("");
      const handleLogin = async () => {
        try {
          await login("test@test.com", "wrong");
        } catch (e: any) {
          setError(e.message);
        }
      };
      return (
        <div>
          <span data-testid="loading">{loading ? "loading" : "ready"}</span>
          <span data-testid="user">{user ? user.email : "null"}</span>
          <span data-testid="error">{error}</span>
          <button onClick={handleLogin}>Login</button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <LoginFailsConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toBe("Invalid credentials");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("register sets user on success", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: "abc",
        user: { id: "2", email: "new@test.com", name: "New User", role: "customer" },
      }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    screen.getByText("Register").click();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("new@test.com");
    });
  });

  it("logout clears user", async () => {
    // Start logged in
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: "1", email: "test@test.com", name: "Test", role: "customer" },
      }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });

    // Mock logout call
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    screen.getByText("Logout").click();

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
  });
});
