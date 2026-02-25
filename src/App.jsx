import { Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import EntryPage from "./pages/EntryPage";
import Consolidate from "./pages/Consolidate";
import LoginPage from "./pages/LoginPage";

function RequireAuth({ children }) {
  const userId = localStorage.getItem("user_id");
  return userId ? children : <Navigate to="/login" replace />;
}

function App() {
  const { pathname } = useLocation();
  const username = localStorage.getItem("username");

  function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    window.location.href = "/login";
  }

  const isAuth = !!localStorage.getItem("user_id");

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuth && (
        <nav className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-1">
          <Link
            to="/"
            className={`text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded transition-all ${
              pathname === "/"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Entry
          </Link>
          <Link
            to="/consolidate"
            className={`text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded transition-all ${
              pathname === "/consolidate"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Consolidate
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-400">{username}</span>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <EntryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/consolidate"
          element={
            <RequireAuth>
              <Consolidate />
            </RequireAuth>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
