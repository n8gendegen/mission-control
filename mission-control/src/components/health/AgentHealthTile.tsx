import type { AgentHealthRecord } from "../../lib/data/agentHealth";

const STATUS_STYLES: Record<string, { label: string; badge: string }> = {
  error: {
    label: "Failing",
    badge: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
  },
  warning: {
    label: "Warning",
    badge: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  },
  ok: {
    label: "Healthy",
    badge: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  },
  dry_run: {
    label: "Dry run",
    badge: "bg-indigo-500/15 text-indigo-200 border border-indigo-500/30",
  },
  unknown: {
    label: "Unknown",
    badge: "bg-slate-500/15 text-slate-200 border border-slate-500/30",
  },
};

function formatTimeAgo(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDuration(ms?: number | null) {
  if (!ms) return "–";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function extractMetric(record: AgentHealthRecord, key: string) {
  const value = record.metadata?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

export function AgentHealthTile({ records }: { records: AgentHealthRecord[] }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0d1018] p-5 text-white/80 shadow-inner shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Agent Health</p>
          <p className="text-sm text-white/60">Latest automation heartbeats</p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          Live
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {records.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/50">
            No heartbeat data yet. The tile will populate after the next automation run.
          </div>
        )}
        {records.map((record) => {
          const status = STATUS_STYLES[record.status] ?? STATUS_STYLES.unknown;
          const assigned = extractMetric(record, "assigned");
          const skipped = extractMetric(record, "skipped");
          const approvals = extractMetric(record, "approvals_blocked");
          return (
            <article
              key={record.id}
              className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4"
            >
              <header className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">{record.lane ?? "General"}</p>
                  <p className="text-lg font-semibold text-white">{record.agent_name}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                  {status.label}
                </span>
              </header>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-white/60">
                <div className="rounded-xl border border-white/5 bg-white/5 px-2 py-1">
                  <dt className="text-[10px] uppercase tracking-[0.2em]">Assigned</dt>
                  <dd className="text-base text-white">{assigned}</dd>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 px-2 py-1">
                  <dt className="text-[10px] uppercase tracking-[0.2em]">Skipped</dt>
                  <dd className="text-base text-white">{skipped}</dd>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 px-2 py-1">
                  <dt className="text-[10px] uppercase tracking-[0.2em]">Approvals</dt>
                  <dd className="text-base text-white">{approvals}</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between text-xs text-white/50">
                <div>
                  <p className="font-semibold text-white/70">Last run</p>
                  <p>{formatTimeAgo(record.last_run_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white/70">Duration</p>
                  <p>{formatDuration(record.last_duration_ms)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-white/40">
                Next run ~ {record.next_run_eta ? new Date(record.next_run_eta).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "–"}
              </div>
              {record.error_context && (
                <p className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-2 text-xs text-rose-200">
                  {record.error_context}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
