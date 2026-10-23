import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, GOOGLE_AUTH_ENABLED } from "./supabase";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function friendlyAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Invalid email or password";
  if (normalized.includes("already registered") || normalized.includes("user already exists")) {
    return "Email already registered";
  }
  if (normalized.includes("password should be at least")) return "Password must be at least 8 characters";
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in";
  return message;
}

async function loadProfile(authUserId: string, authEmail?: string): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .eq("id", authUserId)
    .maybeSingle();

  if (error) return null;
  if (!data) {
    return authEmail ? { id: authUserId, email: authEmail, name: "", role: "customer" } : null;
  }

  return {
    id: data.id,
    email: data.email || authEmail || "",
    name: data.name || "",
    role: data.role || "customer",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      setUser(null);
      return;
    }
    setUser(await loadProfile(session.user.id, session.user.email || undefined));
  }, []);

  useEffect(() => {
    let mounted = true;

    refreshUser().finally(() => {
      if (mounted) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      // Avoid awaiting Supabase calls inside this callback (it can deadlock).
      setTimeout(async () => {
        if (!mounted) return;
        if (!session?.user) {
          setUser(null);
          return;
        }
        setUser(await loadProfile(session.user.id, session.user.email || undefined));
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(friendlyAuthError(error.message));
    setUser(await loadProfile(data.user.id, data.user.email || undefined));
  };

  const register = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(friendlyAuthError(error.message));

    if (!data.session) {
      throw new Error("Account created. Please check your email to confirm it, then sign in.");
    }
    setUser(await loadProfile(data.user!.id, data.user!.email || undefined));
  };

  const loginWithGoogle = async () => {
    if (!GOOGLE_AUTH_ENABLED) {
      throw new Error("Google sign-in is not enabled yet.");
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
    if (error) throw new Error(friendlyAuthError(error.message));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
