import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiPost, apiGet } from "./userApi";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiPost<{ token: string; user: User }>("/auth/login", { email, password });
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const data = await apiPost<{ token: string; user: User }>("/auth/register", { email, password, name });
    setUser(data.user);
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await apiPost<{ token: string; user: User }>("/auth/google", { credential });
    setUser(data.user);
  };

  const logout = async () => {
    try { await apiPost("/auth/logout", {}); } catch {}
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await apiGet<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}