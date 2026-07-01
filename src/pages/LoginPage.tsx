import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../lib/AuthContext";
import logo from "../../loudlayer_assets/logo.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const from = new URLSearchParams(window.location.search).get("redirect") || "/";
      // Defer navigation so React commits auth state before route changes
      setTimeout(() => navigate(from), 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-zinc-200 p-3 sm:p-5 flex items-center justify-center font-sans tracking-tight antialiased text-neutral-900">
      <div className="relative w-full max-w-md bg-zinc-50 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-neutral-300 p-6 sm:p-8">
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 mx-auto mb-3 overflow-hidden rounded-xl">
              <img src={logo} alt="LoudLayer" className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900">Sign In</h1>
          <p className="text-xs text-neutral-400 font-mono mt-1">Welcome back to LoudLayer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-medium text-neutral-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition"
            />
          </div>
          <div>
            <label className="text-[11px] font-medium text-neutral-500 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 py-2.5 rounded-xl">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-orange-500 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-zinc-50 px-3 text-neutral-400 font-mono">OR</span></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (res) => {
              if (res.credential) {
                try {
                  await loginWithGoogle(res.credential);
                  setTimeout(() => navigate("/"), 0);
                } catch (err: any) {
                  setError(err.message);
                }
              }
            }}
            onError={() => setError("Google sign-in failed")}
            theme="outline"
            size="large"
            shape="rectangular"
            text="signin_with"
          />
        </div>

        <p className="text-xs text-neutral-400 text-center mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-neutral-900 font-bold hover:underline">Create one</Link>
        </p>

        <div className="text-center mt-4 pt-4 border-t border-neutral-100">
          <Link to="/store" className="text-xs text-neutral-500 hover:text-neutral-900 font-mono font-medium transition">
            ← Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}