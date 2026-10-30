import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "./api";
import logo from "../../loudlayer_assets/logo.jpg";
import { MonoCaption } from "./ui";

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
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-4xl border border-neutral-200 bg-white">
        <div className="grid md:grid-cols-2">
          {/* Brand column (desktop) */}
          <div className="hidden flex-col justify-between border-r border-neutral-200 bg-neutral-50 p-10 md:flex lg:p-12">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 overflow-hidden rounded-md">
                <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
              </div>
              <MonoCaption className="text-[10px]">Admin</MonoCaption>
            </div>
            <div>
              <h1 className="font-display text-4xl leading-[1.04] tracking-tight text-zinc-950 lg:text-5xl">
                LoudLayer
              </h1>
              <p className="mt-4 max-w-[24ch] font-display text-lg italic leading-relaxed text-zinc-500">
                Quiet on the outside. Loud underneath.
              </p>
            </div>
            <MonoCaption className="text-[10px]">LoudLayer CMS — Restricted access</MonoCaption>
          </div>

          {/* Form column */}
          <div className="p-6 sm:p-10 lg:p-12">
            {/* Mobile brand */}
            <div className="mb-8 text-center md:hidden">
              <div className="mx-auto mb-3 h-12 w-12 overflow-hidden rounded-md">
                <img src={logo} alt="LoudLayer" className="h-full w-full object-cover" />
              </div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-950">Admin Login</h1>
              <MonoCaption className="mt-1 block">LoudLayer CMS</MonoCaption>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-600">
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
                  className="h-11 w-full rounded-none border border-neutral-200 bg-white px-3.5 text-sm text-zinc-950 placeholder-zinc-400 transition-colors duration-200 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-1.5 block font-mono text-[11px] font-medium uppercase tracking-widest text-zinc-600">
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
                  className="h-11 w-full rounded-none border border-neutral-200 bg-white px-3.5 text-sm text-zinc-950 placeholder-zinc-400 transition-colors duration-200 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {error && (
                <div role="alert" className="border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="h-11 w-full cursor-pointer rounded-full bg-neutral-950 text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              LoudLayer CMS — Restricted
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
