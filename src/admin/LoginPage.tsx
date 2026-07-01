import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "./api";
import logo from "../../loudlayer_assets/logo.jpg";

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
      await api.post("/auth/login", { email, password });
      navigate("/admin");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl sm:rounded-[24px] border border-neutral-200 p-6 sm:p-8 shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 overflow-hidden rounded-xl sm:rounded-2xl">
            <img src={logo} alt="LoudLayer" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Admin Login</h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-mono mt-1">LoudLayer CMS</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="text-[11px] sm:text-xs font-medium text-neutral-500 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
               placeholder="you@company.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-900 transition"
            />
          </div>
          <div>
            <label className="text-[11px] sm:text-xs font-medium text-neutral-500 mb-1.5 block">Password</label>
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
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 sm:px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-neutral-900 text-white text-sm font-bold rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}
