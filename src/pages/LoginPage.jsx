import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Something went wrong");
      } else {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        navigate("/");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-sm p-8">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {mode === "login" ? "Sign in" : "Create account"}
          </h1>
          <img src="/milk_bucket.webp" alt="Milk Bucket" className="h-8" />

        </div>
        <p className="text-xs text-gray-400 mb-6">Milk Calculator</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="your_name"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs"
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-5">
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
            className="text-gray-900 font-semibold underline underline-offset-2"
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
