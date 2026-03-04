import type { AgentWorkSession } from "../../lib/data/workSessions";

function relativeTime(from: string) {
  const date = new Date(from);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusStyles(status: string) {
  if (status === "started")
    return {
      label: "In progress",
      className: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
    };
  return {
    label: "Queued",
    className: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  };
}

export function AgentWorkSessionsPanel({ sessions }: { sessions: AgentWorkSession[] }) {
  const activeCount = sessions.filter((session) => session.status === "started").length;
  const waitingCount = sessions.length - activeCount;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0d1118] p-6 text-white/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Agent Queue</p>
          <p className="text-sm text-white/60">Who’s working now</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
            {activeCount} active
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/50">
            {waitingCount} waiting
          </span>
        </div>
      </div>

      {sessions.length === 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
          No agents are currently dispatched. Auto-assign will populate this list on the next run.
        </div>
      )}

      <div className="mt-4 space-y-3">
        {sessions.map((session) => {
          const styles = statusStyles(session.status);
          return (
            <article
              key={session.id}
              className="rounded-2xl border border-white/10 bg-[#111622] p-4 shadow-inner shadow-black/30"
            >
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{session.agent_name}</p>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                    {session.task_slug ?? session.task_title ?? session.task_id}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.className}`}>
                  {styles.label}
                </span>
              </header>
              {session.task_title && (
                <p className="mt-3 text-sm text-white/70">{session.task_title}</p>
              )}
              <div className="mt-3 flex items-center justify-between text-xs text-white/50">
                <span>Triggered {relativeTime(session.triggered_at)}</span>
                {session.started_at && session.status === "started" ? (
                  <span>Working since {relativeTime(session.started_at)}</span>
                ) : (
                  <span>Waiting to start</span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
