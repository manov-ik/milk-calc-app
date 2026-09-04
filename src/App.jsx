import { useRef } from "react";
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import EntryPage from "./pages/EntryPage";
import Consolidate from "./pages/Consolidate";
import LoginPage from "./pages/LoginPage";

function RequireAuth({ children }) {
  const userId = localStorage.getItem("user_id");
  return userId ? children : <Navigate to="/login" replace />;
}

function App() {
  const location = useLocation();
  const { pathname, search } = location;
  const navigate = useNavigate();
  const username = localStorage.getItem("username");

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Minimum swipe threshold & ensure predominantly horizontal swipe
    const minSwipeDistance = 50;
    if (
      Math.abs(deltaX) > minSwipeDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.4
    ) {
      if (deltaX < 0 && pathname === "/") {
        // Swiped Left on Entry page -> Go to Consolidate with same month/year params
        navigate({ pathname: "/consolidate", search });
      } else if (deltaX > 0 && pathname === "/consolidate") {
        // Swiped Right on Consolidate page -> Go to Entry with same month/year params
        navigate({ pathname: "/", search });
      }
    }
  };

  function logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    window.location.href = "/login";
  }

  const isAuth = !!localStorage.getItem("user_id");

  return (
    <div
      className="min-h-screen bg-gray-50 touch-pan-y"
      onTouchStart={isAuth ? handleTouchStart : undefined}
      onTouchEnd={isAuth ? handleTouchEnd : undefined}
    >
      {isAuth && (
        <nav className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-1">
          <Link
            to={{ pathname: "/", search }}
            className={`text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded transition-all ${
              pathname === "/"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-700"
            }`}
          >
            Entry
          </Link>
          <Link
            to={{ pathname: "/consolidate", search }}
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

