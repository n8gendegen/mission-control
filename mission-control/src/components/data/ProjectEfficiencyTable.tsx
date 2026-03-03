import type { ProjectEfficiencyRow } from "../../lib/data/usage";

type ProjectEfficiencyTableProps = {
  rows: ProjectEfficiencyRow[];
};

export function ProjectEfficiencyTable({ rows }: ProjectEfficiencyTableProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm text-white/60">Project cost efficiency</div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm text-white/80">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-white/40">
              <th className="py-2">Project</th>
              <th className="py-2">Tokens</th>
              <th className="py-2">Spend</th>
              <th className="py-2">Revenue</th>
              <th className="py-2">Profit</th>
              <th className="py-2">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-white/50">
                  No project attribution captured yet.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.project}>
                <td className="py-3">
                  <div className="font-medium text-white">{row.project}</div>
                  {row.notes && <div className="text-xs text-white/40">{row.notes}</div>}
                </td>
                <td className="py-3 tabular-nums">{row.tokens.toLocaleString()}</td>
                <td className="py-3 tabular-nums">${row.costUsd.toFixed(2)}</td>
                <td className="py-3 tabular-nums">{row.revenueUsd != null ? `$${row.revenueUsd.toFixed(2)}` : "—"}</td>
                <td className="py-3 tabular-nums">{row.profitUsd != null ? `$${row.profitUsd.toFixed(2)}` : "—"}</td>
                <td className="py-3 tabular-nums">{row.marginPct != null ? `${row.marginPct.toFixed(1)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
