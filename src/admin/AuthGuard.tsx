import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "./api";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const location = useLocation();

  useEffect(() => {
    api.get("/auth/me")
      .then(() => setStatus("valid"))
      .catch(() => setStatus("invalid"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500 font-mono">Authenticating...</span>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
