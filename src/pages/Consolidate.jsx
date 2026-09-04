import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Consolidate() {
  const today = new Date();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramYear = searchParams.get("year");
  const paramMonth = searchParams.get("month");

  const selectedYear =
    paramYear !== null && !isNaN(Number(paramYear))
      ? Number(paramYear)
      : today.getFullYear();
  const selectedMonth =
    paramMonth !== null && !isNaN(Number(paramMonth))
      ? Number(paramMonth)
      : today.getMonth();

  const setSelectedYear = (year) => {
    setSearchParams(
      { year: String(year), month: String(selectedMonth) },
      { replace: true }
    );
  };

  const setSelectedMonth = (month) => {
    setSearchParams(
      { year: String(selectedYear), month: String(month) },
      { replace: true }
    );
  };

  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [rawEntries, setRawEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = import.meta.env.VITE_API_URL;
  const userId = localStorage.getItem("user_id");
  // console.log("API_BASE:", API_BASE);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [consolidateRes, monthRes] = await Promise.all([
          fetch(
            `${API_BASE}/api/milk/consolidate?user_id=${userId}&year=${selectedYear}&month=${selectedMonth + 1}`,
          ),
          fetch(
            `${API_BASE}/api/milk/month?user_id=${userId}&year=${selectedYear}&month=${selectedMonth + 1}`,
          ),
        ]);

        if (!consolidateRes.ok || !monthRes.ok) throw new Error("Fetch failed");

        const consolidate = await consolidateRes.json();
        const month = await monthRes.json();

        setData(consolidate);

        const entries = month.daily_entries || [];
        setRawEntries(entries);
        const daily = entries.map((e) => ({
          day: e.day,
          total: (e.fn || 0) + (e.an || 0),
        }));
        setChartData(daily);
      } catch (error) {
        console.error("Fetch error:", error);
        setData(null);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedYear, selectedMonth]);

  const maxCount =
    data && Object.keys(data.quantity_frequency).length > 0
      ? Math.max(...Object.values(data.quantity_frequency))
      : 1;

  const activeDays = rawEntries.filter((e) => (e.fn || 0) + (e.an || 0) > 0);
  const totalMorning = rawEntries.reduce((s, e) => s + (e.fn || 0), 0);
  const totalEvening = rawEntries.reduce((s, e) => s + (e.an || 0), 0);
  const avgDaily =
    activeDays.length > 0
      ? Math.round((totalMorning + totalEvening) / activeDays.length)
      : 0;
  const topDay = rawEntries.reduce(
    (best, e) => {
      const t = (e.fn || 0) + (e.an || 0);
      return t > best.total ? { day: e.day, total: t } : best;
    },
    { day: null, total: 0 },
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-sm">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
            Day {label}
          </p>
          <p className="text-xs font-semibold text-gray-800">
            {payload[0].value} ml
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-8">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Milk Report
          </span>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString("default", { month: "short" })}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
            >
              {Array.from({ length: 13 }, (_, i) => {
                const year = today.getFullYear() + 2 - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {loading ? (
            <p className="text-xs text-gray-400 text-center py-6 tracking-widest">
              Loading...
            </p>
          ) : !data ? (
            <p className="text-xs text-gray-400 text-center py-6">
              No data for this period.
            </p>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Milk</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {data.total_milk}
                    <span className="text-sm font-normal text-gray-400 ml-1">
                      L
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                  <p className="text-xl font-semibold text-gray-800">
                    ₹{data.total_amount}
                  </p>
                </div>
              </div>

              {/* Line Chart */}

              {/* Frequency */}
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
                Quantity Breakdown
              </p>

              {Object.keys(data.quantity_frequency).length === 0 ? (
                <p className="text-xs text-gray-400">
                  No entries for this month.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {Object.entries(data.quantity_frequency)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([qty, count]) => (
                      <div key={qty} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0">
                          {qty} ml
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-gray-700 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-12 text-right shrink-0">
                          {count}x
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {chartData.length > 0 && (
                <div className="mt-6">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-3">
                    Daily Total
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f0f0f0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 9, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                        interval={4}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#9ca3af" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#111827"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 3, fill: "#111827", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Extra Stats */}
              {activeDays.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-5 flex flex-col gap-3">
                  <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-1">
                    Insights
                  </p>
                  {[
                    { label: "Daily Avg", value: `${avgDaily} ml` },
                    { label: "Morning Total", value: `${totalMorning} ml` },
                    { label: "Evening Total", value: `${totalEvening} ml` },
                    {
                      label: "Total Quantity",
                      value: `${totalMorning + totalEvening} ml`,
                    },
                    {
                      label: "Top Day",
                      value: topDay.day
                        ? `Day ${topDay.day} · ${topDay.total} ml`
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs text-gray-400">{label}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
