import { useEffect, useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  useEffect(() => {
    const fetchMonth = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/api/milk/month?user_id=${userId}&year=${selectedYear}&month=${selectedMonth + 1}`,
        );
        const data = await response.json();
        if (data.daily_entries?.length > 0) {
          setDailyInputs(data.daily_entries);
          setMilkPrice(data.milk_price);
        } else {
          setDailyInputs(
            Array.from({ length: daysInMonth }, (_, i) => ({
              day: i + 1,
              an: 0,
              fn: 0,
            })),
          );
          setMilkPrice(0);
        }
      } catch {
        setDailyInputs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMonth();
  }, [selectedYear, selectedMonth, daysInMonth]);

  const handleValueUpdate = (index, field, value) => {
    setDailyInputs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: Number(value) };
      return updated;
    });
  };

  const totalMilk = dailyInputs.reduce(
    (sum, i) => sum + (i.an || 0) + (i.fn || 0),
    0,
  );
  const totalAmount = (totalMilk / 1000) * milkPrice;

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/milk/month`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: Number(userId),
          year: selectedYear,
          month: selectedMonth + 1,
          milk_price: milkPrice,
          daily_entries: dailyInputs,
        }),
      });
      setMessage("Saved");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Error saving");
    } finally {
      setSaving(false);
    }
  };

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
                onChange={(e) => setMilkPrice(Number(e.target.value))}
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
                  placeholder="ml"
                  value={todayData.fn === 0 ? "" : todayData.fn}
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
                  placeholder="ml"
                  value={todayData.an === 0 ? "" : todayData.an}
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

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <div className="max-w-sm mx-auto flex items-center justify-between">
          <div>
            {message && (
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                {message}
              </p>
            )}
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
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-widest px-6 py-2.5 rounded active:scale-95 transition-all hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "..." : "Save"}
          </button>
        </div>
      </footer>
    </div>
  );
}
