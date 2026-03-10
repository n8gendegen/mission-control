import type { AgentWorkSession } from "../../lib/data/workSessions";
import { STAGE_BY_KEY } from "../../lib/data/taskStages";

const AGENT_ROSTER: Array<{ name: string; initials: string; stageKey: string }> = [
  { name: "Splitter", initials: "Spl", stageKey: "spec" },
  { name: "Steve", initials: "St", stageKey: "builder" },
  { name: "Spy", initials: "Sp", stageKey: "intel" },
  { name: "Sweeper", initials: "Sw", stageKey: "ops" },
  { name: "Henry", initials: "H", stageKey: "ops" },
  { name: "Janet", initials: "J", stageKey: "ops" },
];

function timeAgo(value?: string | null) {
  if (!value) return "—";
  const deltaMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AgentRosterPanel({ sessions }: { sessions: AgentWorkSession[] }) {
  const sessionByAgent = new Map<string, AgentWorkSession>();
  sessions.forEach((session) => {
    if (!sessionByAgent.has(session.agent_name)) {
      sessionByAgent.set(session.agent_name, session);
    }
  });

  return (
    <div className="rounded-3xl border border-white/5 bg-[#0d1118] p-6 text-white/80">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Agent roster</p>
          <p className="text-sm text-white/60">Current assignments</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          {sessions.length} active
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {AGENT_ROSTER.map((agent) => {
          const session = sessionByAgent.get(agent.name);
          const stage = STAGE_BY_KEY[agent.stageKey];
          const status = session
            ? session.status === "started"
              ? "In progress"
              : "Queued"
            : "Idle";
          const statusClass = session
            ? session.status === "started"
              ? "text-emerald-300"
              : "text-amber-300"
            : "text-white/40";
          return (
            <article
              key={agent.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111622] p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-white">
                  {agent.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{agent.name}</p>
                  <p className={`text-xs ${statusClass}`}>{status}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col items-end gap-1 text-right">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${stage.badgeClass}`}
                >
                  {stage.shortLabel}
                </span>
                <p className="text-xs text-white/60">
                  {session ? session.task_title ?? session.task_slug ?? "—" : "No assignment"}
                </p>
                <p className="text-[11px] text-white/30">
                  {session ? `Triggered ${timeAgo(session.triggered_at)}` : ""}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
