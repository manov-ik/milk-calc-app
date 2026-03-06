import { useEffect, useState, useRef, useCallback } from "react";
import DailyInput from "../components/dailyInput";

export default function EntryPage() {
  const todayDate = new Date();
  const currentDay = todayDate.getDate();
  const API_BASE = import.meta.env.VITE_API_URL;
  const userId = localStorage.getItem("user_id");

  const [selectedYear, setSelectedYear] = useState(todayDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(todayDate.getMonth());
  const [dailyInputs, setDailyInputs] = useState([]);
  const [milkPrice, setMilkPrice] = useState(0);
  const [loading, setLoading] = useState(true);

  // Auto-save status: "idle" | "saving" | "saved" | "error"
  const [saveStatus, setSaveStatus] = useState("idle");

  // Dirty-tracking refs (persist across renders without re-rendering)
  const dirtyDays = useRef(new Set());
  const isPriceDirty = useRef(false);
  const debounceTimer = useRef(null);
  // Snapshot of server data to compare against
  const serverSnapshot = useRef([]);
  const serverPrice = useRef(0);
  // Refs to hold latest state so debounced save never reads stale closures
  const latestInputs = useRef([]);
  const latestPrice = useRef(0);
  const latestYear = useRef(selectedYear);
  const latestMonth = useRef(selectedMonth);

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  // ── Fetch month data ──────────────────────────────────────────────
  useEffect(() => {
    const fetchMonth = async () => {
      setLoading(true);
      // Clear dirty state on month change
      dirtyDays.current.clear();
      isPriceDirty.current = false;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setSaveStatus("idle");

      try {
        const response = await fetch(
          `${API_BASE}/api/milk/month?user_id=${userId}&year=${selectedYear}&month=${selectedMonth + 1}`,
        );
        const data = await response.json();

        // Build full month template (all days default to 0)
        const fullMonth = Array.from({ length: daysInMonth }, (_, i) => ({
          day: i + 1,
          an: 0,
          fn: 0,
        }));

        // Merge server entries into the template
        if (data.daily_entries?.length > 0) {
          for (const entry of data.daily_entries) {
            const idx = entry.day - 1;
            if (idx >= 0 && idx < fullMonth.length) {
              fullMonth[idx] = { ...entry };
            }
          }
        }

        setDailyInputs(fullMonth);
        setMilkPrice(data.milk_price || 0);
        serverSnapshot.current = fullMonth.map((e) => ({ ...e }));
        serverPrice.current = data.milk_price || 0;
      } catch {
        setDailyInputs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMonth();
  }, [selectedYear, selectedMonth, daysInMonth]);

  // ── Keep refs in sync with latest state ────────────────────────────
  useEffect(() => {
    latestInputs.current = dailyInputs;
  }, [dailyInputs]);
  useEffect(() => {
    latestPrice.current = milkPrice;
  }, [milkPrice]);
  useEffect(() => {
    latestYear.current = selectedYear;
  }, [selectedYear]);
  useEffect(() => {
    latestMonth.current = selectedMonth;
  }, [selectedMonth]);

  // ── Auto-save function (reads from refs, never stale) ─────────────
  const autoSave = useCallback(async () => {
    const hasDirtyEntries = dirtyDays.current.size > 0;
    const hasDirtyPrice = isPriceDirty.current;

    if (!hasDirtyEntries && !hasDirtyPrice) return;

    setSaveStatus("saving");

    // Read latest values from refs
    const currentInputs = latestInputs.current;
    const currentPrice = latestPrice.current;
    const currentYear = latestYear.current;
    const currentMonth = latestMonth.current;

    // Build payload with only changed entries
    const changedEntries = [];
    const savedIndices = new Set(dirtyDays.current);
    for (const idx of savedIndices) {
      const entry = currentInputs[idx];
      if (entry) changedEntries.push(entry);
    }

    try {
      const body = {
        user_id: Number(userId),
        year: currentYear,
        month: currentMonth + 1,
        daily_entries: changedEntries,
      };
      if (hasDirtyPrice) {
        body.milk_price = currentPrice;
      }

      const res = await fetch(`${API_BASE}/api/milk/month`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");

      // Update snapshot to reflect saved state
      for (const idx of savedIndices) {
        const entry = currentInputs[idx];
        if (entry && serverSnapshot.current[idx]) {
          serverSnapshot.current[idx] = { ...entry };
        }
      }
      if (hasDirtyPrice) {
        serverPrice.current = currentPrice;
      }

      // Clear only the indices we just saved (new edits during save are kept)
      for (const idx of savedIndices) {
        dirtyDays.current.delete(idx);
      }
      if (hasDirtyPrice) {
        isPriceDirty.current = false;
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [userId, API_BASE]);

  // ── Schedule debounced auto-save ──────────────────────────────────
  const scheduleSave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      autoSave();
    }, 2500); // 2.5s after last edit — ensures last keystroke is captured
  }, [autoSave]);

  // ── Handle value updates with dirty tracking ──────────────────────
  const handleValueUpdate = (index, field, value) => {
    setDailyInputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) };

      // Check if the value actually differs from server snapshot
      const snap = serverSnapshot.current[index];
      if (snap && snap[field] !== Number(value)) {
        dirtyDays.current.add(index);
      } else if (snap) {
        // Value reverted — check if the whole entry matches snapshot
        const otherField = field === "an" ? "fn" : "an";
        if (updated[index][otherField] === snap[otherField]) {
          dirtyDays.current.delete(index);
        }
      }

      return updated;
    });

    scheduleSave();
  };

  // ── Handle milk price changes ─────────────────────────────────────
  const handlePriceChange = (value) => {
    const numVal = Number(value);
    setMilkPrice(numVal);
    isPriceDirty.current = numVal !== serverPrice.current;
    scheduleSave();
  };

  // ── Cleanup debounce timer on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const totalMilk = dailyInputs.reduce(
    (sum, i) => sum + (i.an || 0) + (i.fn || 0),
    0,
  );
  const totalAmount = (totalMilk / 1000) * milkPrice;

  const isCurrentMonth =
    selectedMonth === todayDate.getMonth() &&
    selectedYear === todayDate.getFullYear();
  const todayIndex = dailyInputs.findIndex(
    (d) => d.day === currentDay && isCurrentMonth,
  );
  const todayData = todayIndex !== -1 ? dailyInputs[todayIndex] : null;

  const historyData = dailyInputs
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter((item) => !(isCurrentMonth && item.day === currentDay));

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xs text-gray-400 tracking-widest uppercase">
          Loading...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-5 py-4">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-gray-800">MilkTrack</h1>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">
              {new Date(0, selectedMonth).toLocaleString("default", {
                month: "long",
              })}{" "}
              {selectedYear}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Month / Year */}
            <div className="flex gap-1">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "short",
                    })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
              >
                {Array.from({ length: 13 }, (_, i) => {
                  const year = todayDate.getFullYear() + 2 - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            {/* Price */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-1 gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                ₹
              </span>
              <input
                type="number"
                className="w-10 bg-transparent text-xs font-semibold text-gray-700 outline-none"
                value={milkPrice}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handlePriceChange(e.target.value)}
              />
              <span className="text-[9px] text-gray-400">/L</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-sm mx-auto px-5 pt-5 space-y-4">
        {/* Today Card */}
        {todayData && isCurrentMonth && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Today
              </span>
              <span className="text-[10px] font-semibold text-gray-400">
                Day {todayData.day}
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Morning
                </p>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="0"
                  value={todayData.fn}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    handleValueUpdate(
                      todayIndex,
                      "fn",
                      e.target.value === "" ? 0 : e.target.value,
                    )
                  }
                />
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Evening
                </p>
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-300"
                  placeholder="0"
                  value={todayData.an}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    handleValueUpdate(
                      todayIndex,
                      "an",
                      e.target.value === "" ? 0 : e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Monthly Log */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Monthly Log
          </p>
          <div className="flex flex-col gap-2">
            {historyData.map((input) => (
              <DailyInput
                key={input.day}
                index={input.originalIndex}
                day={input.day}
                fn={input.fn}
                an={input.an}
                handleValueUpdate={handleValueUpdate}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Footer – totals + auto-save indicator */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              Amount
            </p>
            <p className="text-xl font-semibold text-gray-800">
              ₹{Math.round(totalAmount)}
              <span className="text-xs font-normal text-gray-400 ml-1">
                · {totalMilk}ml
              </span>
            </p>
          </div>
          {/* Auto-save status indicator */}
          <div className="flex items-center gap-1.5">
            {saveStatus === "saving" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                  Saving…
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-emerald-500 uppercase tracking-widest">
                  Saved
                </span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[10px] text-red-500 uppercase tracking-widest">
                  Error
                </span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
