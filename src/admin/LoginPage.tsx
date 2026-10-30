import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import logo from "../../loudlayer_assets/logo.jpg";
import { MonoCaption } from "./ui";

const fieldInput =
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 placeholder-zinc-400 transition-colors duration-150 focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10";

const fieldLabel =
  "mb-1.5 block cursor-pointer text-sm font-medium text-zinc-700";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminApi.login(email, password);
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-950/5">
        <div className="p-6 sm:p-8">
          {/* Brand row */}
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 overflow-hidden rounded-xl">
              <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
            </div>
            <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">
              LoudLayer Admin
            </h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in to manage the store</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className={fieldLabel}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
                className={fieldInput}
              />
            </div>
            <div>
              <label htmlFor="admin-password" className={fieldLabel}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
                className={fieldInput}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white transition-colors duration-150 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center">
            <MonoCaption className="text-[10px]">LoudLayer CMS — Restricted access</MonoCaption>
          </p>
        </div>
      </div>
    </main>
  );
}
