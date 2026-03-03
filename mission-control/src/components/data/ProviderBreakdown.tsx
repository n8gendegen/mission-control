import type { BreakdownEntry } from "../../lib/data/usage";

type ProviderBreakdownProps = {
  data: BreakdownEntry[];
};

export function ProviderBreakdown({ data }: ProviderBreakdownProps) {
  const max = Math.max(0, ...data.map((entry) => entry.costUsd));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/60">Spend by provider</div>
      <div className="mt-4 space-y-3">
        {data.length === 0 && <div className="text-sm text-white/40">No provider data.</div>}
        {data.slice(0, 5).map((entry) => {
          const width = max > 0 ? (entry.costUsd / max) * 100 : 0;
          return (
            <div key={entry.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-white/70">
                <span className="font-medium text-white">{entry.name}</span>
                <span>${entry.costUsd.toFixed(2)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-violet-400" style={{ width: `${width}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
