import type { AgentHealthRecord } from "../../lib/data/agentHealth";

function getCounts(record: AgentHealthRecord) {
  const assigned = Number(record.metadata?.assigned ?? 0);
  const skipped = Number(record.metadata?.skipped ?? 0);
  const total = assigned + skipped;
  const ratio = total > 0 ? assigned / total : 0;
  return { assigned, skipped, total, ratio };
}

const STATUS_COLORS: Record<string, string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-400",
  error: "bg-rose-500",
  dry_run: "bg-indigo-400",
  unknown: "bg-slate-500",
};

export function AgentCapacityMeter({ records }: { records: AgentHealthRecord[] }) {
  const rows = records
    .map((record) => ({
      record,
      ...getCounts(record),
    }))
    .filter((row) => row.total > 0 || row.record.status === "dry_run")
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="rounded-3xl border border-white/5 bg-[#0d1018] p-5 text-white/80 shadow-inner shadow-black/30">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Agent Capacity</p>
          <p className="text-sm text-white/60">Load based on the last runner stats</p>
        </div>
      </div>
      {rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Heartbeats haven&apos;t reported assigned/skipped metrics yet.
        </p>
      )}
      <div className="space-y-3">
        {rows.map(({ record, ratio, assigned, skipped }) => {
          const color = STATUS_COLORS[record.status] ?? STATUS_COLORS.unknown;
          const percent = Math.round(ratio * 100);
          return (
            <div key={record.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs text-white/60">
                <div>
                  <p className="text-sm font-semibold text-white">{record.agent_name}</p>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/40">{record.lane ?? "General"}</p>
                </div>
                <span className="text-sm font-semibold text-white/70">{percent}% load</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5">
                <div
                  className={`h-2 rounded-full ${color}`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">
                Assigned {assigned} · Skipped {skipped}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
