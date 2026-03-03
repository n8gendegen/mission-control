import type { DailySeriesPoint } from "../../lib/data/usage";

function buildPolyline(points: DailySeriesPoint[]) {
  if (points.length === 0) {
    return "";
  }
  const maxCost = Math.max(...points.map((point) => point.totalCostUsd));
  if (maxCost === 0) {
    return "";
  }
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1 || 1)) * 100;
      const y = 100 - (point.totalCostUsd / maxCost) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

type DailySpendChartProps = {
  data: DailySeriesPoint[];
};

export function DailySpendChart({ data }: DailySpendChartProps) {
  const path = buildPolyline(data);
  const maxCost = Math.max(0, ...data.map((point) => point.totalCostUsd));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between text-sm text-white/60">
        <span>Daily spend</span>
        <span>{maxCost ? `Peak $${maxCost.toFixed(2)}` : "No spend yet"}</span>
      </div>
      <div className="mt-4 h-48 w-full">
        {path ? (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full text-violet-400">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={path}
            />
          </svg>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">No data for selected range.</div>
        )}
      </div>
      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/60 md:grid-cols-4">
          {data.slice(-4).map((point) => (
            <div key={point.date} className="rounded-lg border border-white/5 bg-white/5 p-2">
              <div className="text-white/40">{point.date}</div>
              <div className="font-semibold text-white">${point.totalCostUsd.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
