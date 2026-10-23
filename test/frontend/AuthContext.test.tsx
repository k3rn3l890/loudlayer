import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const { authMock, fromMock } = vi.hoisted(() => ({
  authMock: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
  fromMock: vi.fn(),
}));

vi.mock("../../src/lib/supabase", () => ({
  supabase: { auth: authMock, from: fromMock },
  GOOGLE_AUTH_ENABLED: false,
}));

import { AuthProvider, useAuth } from "../../src/lib/AuthContext";

function profileQuery(profile: unknown) {
  const query: any = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn(() => Promise.resolve({ data: profile, error: null }));
  return query;
}

function TestConsumer() {
  const { user, loading, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{loading ? "loading" : "ready"}</span>
      <span data-testid="user">{user ? user.email : "null"}</span>
      <span data-testid="role">{user ? user.role : "none"}</span>
      <button onClick={() => login("test@test.com", "password123")}>Login</button>
      <button onClick={() => register("new@test.com", "password123", "New User")}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

const sessionUser = { id: "uuid-1", email: "test@test.com" };
const profile = { id: "uuid-1", email: "test@test.com", name: "Test", role: "customer" };

describe("AuthContext (Supabase)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getSession.mockResolvedValue({ data: { session: null } });
    authMock.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    authMock.signOut.mockResolvedValue({ error: null });
    fromMock.mockReturnValue(profileQuery(null));
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

  it("restores an existing session and loads the profile", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { user: sessionUser } } });
    fromMock.mockReturnValue(profileQuery(profile));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });
    expect(screen.getByTestId("role").textContent).toBe("customer");
  });

  it("login sets the user on success", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: sessionUser, session: { user: sessionUser } },
      error: null,
    });
    fromMock.mockReturnValue(profileQuery(profile));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });
    expect(authMock.signInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password123",
    });
  });

  it("login surfaces a friendly error on bad credentials", async () => {
    authMock.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
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
      expect(screen.getByTestId("error").textContent).toBe("Invalid email or password");
    });
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("register sets the user when a session is returned", async () => {
    const newUser = { id: "uuid-2", email: "new@test.com" };
    authMock.signUp.mockResolvedValue({
      data: { user: newUser, session: { user: newUser } },
      error: null,
    });
    fromMock.mockReturnValue(
      profileQuery({ id: "uuid-2", email: "new@test.com", name: "New User", role: "customer" })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("ready");
    });

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("new@test.com");
    });
    expect(authMock.signUp).toHaveBeenCalledWith({
      email: "new@test.com",
      password: "password123",
      options: { data: { name: "New User" } },
    });
  });

  it("register explains when email confirmation is required", async () => {
    authMock.signUp.mockResolvedValue({
      data: { user: { id: "uuid-2", email: "new@test.com" }, session: null },
      error: null,
    });

    function RegisterConsumer() {
      const { register } = useAuth();
      const [error, setError] = React.useState("");
      return (
        <div>
          <span data-testid="error">{error}</span>
          <button
            onClick={async () => {
              try {
                await register("new@test.com", "password123", "New User");
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Register
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <RegisterConsumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByTestId("error").textContent).toContain("check your email");
    });
  });

  it("logout clears the user", async () => {
    authMock.getSession.mockResolvedValue({ data: { session: { user: sessionUser } } });
    fromMock.mockReturnValue(profileQuery(profile));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("test@test.com");
    });

    fireEvent.click(screen.getByText("Logout"));

    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("null");
    });
    expect(authMock.signOut).toHaveBeenCalled();
  });
});
