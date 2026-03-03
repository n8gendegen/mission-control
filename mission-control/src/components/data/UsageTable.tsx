import type { BreakdownEntry } from "../../lib/data/usage";

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

type UsageTableProps = {
  title: string;
  rows: BreakdownEntry[];
  emptyLabel: string;
};

export function UsageTable({ title, rows, emptyLabel }: UsageTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/60">{title}</div>
      <div className="mt-3 divide-y divide-white/5 text-sm">
        {rows.length === 0 && <div className="py-4 text-white/40">{emptyLabel}</div>}
        {rows.slice(0, 5).map((row) => (
          <div key={row.name} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-white">{row.name}</div>
              {row.taskUrl && (
                <a href={row.taskUrl} className="text-xs text-violet-300 hover:underline" target="_blank" rel="noreferrer">
                  Task link
                </a>
              )}
            </div>
            <div className="flex items-center gap-6 text-white/70">
              <span className="tabular-nums">{formatTokens(row.tokens)}</span>
              <span className="tabular-nums">${row.costUsd.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
