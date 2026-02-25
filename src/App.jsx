import { Routes, Route, Link, useLocation } from "react-router-dom";
import EntryPage from "./pages/EntryPage";
import Consolidate from "./pages/Consolidate";

function App() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-5 py-3 flex justify-center gap-1">
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
      </nav>

      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/consolidate" element={<Consolidate />} />
      </Routes>
    </div>
  );
}

export default App;
