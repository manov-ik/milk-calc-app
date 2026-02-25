export default function DailyInput({ day, fn, an, index, handleValueUpdate }) {
  const displayDay = String(day).includes("-")
    ? String(day).split("-").pop()
    : day;

  const total = (fn || 0) + (an || 0);

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-all">
      {/* Day Badge */}
      <span className="text-xs font-semibold text-gray-400 w-6 shrink-0 text-center">
        {displayDay}
      </span>

      <div className="w-px h-6 bg-gray-100 shrink-0" />

      {/* Inputs */}
      <div className="flex flex-1 gap-2">
        <div className="flex flex-col flex-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Morn
          </span>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-300"
            placeholder="0"
            value={fn === 0 ? "" : fn}
            onChange={(e) =>
              handleValueUpdate(
                index,
                "fn",
                e.target.value === "" ? 0 : Number(e.target.value),
              )
            }
          />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
            Eve
          </span>
          <input
            type="number"
            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 focus:bg-white transition-all placeholder:text-gray-300"
            placeholder="0"
            value={an === 0 ? "" : an}
            onChange={(e) =>
              handleValueUpdate(
                index,
                "an",
                e.target.value === "" ? 0 : Number(e.target.value),
              )
            }
          />
        </div>
      </div>

      {/* Total */}
      <div className="text-right shrink-0 w-14">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">
          Total
        </p>
        <p
          className={`text-xs font-semibold ${total > 0 ? "text-gray-700" : "text-gray-300"}`}
        >
          {total > 0 ? `${total}ml` : "—"}
        </p>
      </div>
    </div>
  );
}
