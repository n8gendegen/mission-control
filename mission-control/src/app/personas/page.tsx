export const revalidate = 0;

const STATUS_BADGE = {
  active: "border-emerald-400/60 bg-emerald-400/10 text-emerald-100",
  idle: "border-slate-400/40 bg-slate-400/10 text-slate-200",
  blocked: "border-amber-400/60 bg-amber-400/10 text-amber-100",
} as const;

const STATUS_LABEL = {
  active: "Active",
  idle: "Idle",
  blocked: "Blocked",
} as const;

type PersonaStatusKey = keyof typeof STATUS_LABEL;

type HierarchyColumn = {
  label: string;
  helper?: string;
  personaIds: string[];
};

type HierarchySection =
  | {
      id: string;
      label: string;
      subtitle: string;
      layout: "hero" | "grid";
      personaIds: string[];
    }
  | {
      id: string;
      label: string;
      subtitle: string;
      layout: "columns";
      columns: HierarchyColumn[];
    };

const HIERARCHY: HierarchySection[] = [
  {
    id: "orchestrator",
    label: "Jean / Orchestrator",
    subtitle: "Sets tempo, routes work, clears escalations",
    layout: "hero",
    personaIds: ["jean-orchestrator"],
  },
  {
    id: "operations",
    label: "Operations Layer",
    subtitle: "Builders + reviewers keep the runway clear",
    layout: "columns",
    columns: [
      {
        label: "Builders",
        helper: "Specs + code drops",
        personaIds: ["ops-builders"],
      },
      {
        label: "Reviewers",
        helper: "QA + doc polish",
        personaIds: ["ops-reviewers"],
      },
    ],
  },
  {
    id: "input-signal",
    label: "Input Signal Personas",
    subtitle: "They vacuum raw signals into the mission stack",
    layout: "grid",
    personaIds: ["concierge-installs", "bounty-connectors"],
  },
  {
    id: "output-action",
    label: "Output Action Personas",
    subtitle: "Force-multipliers that ship visible work",
    layout: "grid",
    personaIds: ["marketing-ops", "launch-agent-health"],
  },
];

function formatRelativeTime(timestamp?: string | null) {
  if (!timestamp) return "just now";
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(Math.floor(deltaMs / 60000), 0);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toTitle(columnId?: string | null) {
  if (!columnId) return "backlog";
  return columnId
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatRoutingTags(sources?: string[]) {
  if (!sources || sources.length === 0) return "auto";
  return sources.join(", ");
}

export default async function PersonasPage() {
  const [{ assignments, error }, availableGithubPersonas] = await Promise.all([
    fetchPersonaAssignments(),
    Promise.resolve(getAvailablePersonas()),
  ]);

  const personaMap = new Map(assignments.map((persona) => [persona.id, persona] as const));

  const activeCount = assignments.filter((persona) => persona.status === "active").length;
  const blockedCount = assignments.filter((persona) => persona.status === "blocked").length;
  const trackedTasks = assignments.reduce((sum, persona) => sum + persona.queueLength, 0);

  const stats = [
    { label: "Personas Active", value: activeCount, detail: "Working a live card" },
    { label: "Personas Blocked", value: blockedCount, detail: "Waiting on deps" },
    { label: "Tracked Tasks", value: trackedTasks, detail: "Across all personas" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-10 px-8 py-6">
        <header className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">Persona hierarchy</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Live operator stack</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/60">
              Supabase-backed status for every persona lane Nate sketched: Jean on top, operations in the middle, inputs feeding outputs.
              Each card shows role, focus, live status, the current task pulled from Supabase, and how much work is stacked behind it.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                <p className="text-xs uppercase tracking-[0.35em] text-white/30">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.detail}</p>
              </div>
            ))}
          </div>
        </header>

        {error && (
          <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            Live Supabase fetch warning: {error}. Showing cached persona registry instead.
          </div>
        )}

        {HIERARCHY.map((section) => (
          <section key={section.id} className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">{section.label}</p>
              <p className="text-base text-white/60">{section.subtitle}</p>
            </div>

            {section.layout === "columns" && "columns" in section ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {section.columns.map((column) => (
                  <div key={column.label} className="space-y-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/40">
                      <span>{column.label}</span>
                      {column.helper && <span className="text-white/30">{column.helper}</span>}
                    </div>
                    {column.personaIds.map((id) => {
                      const persona = personaMap.get(id);
                      if (!persona) return null;
                      return <PersonaCard key={id} persona={persona} />;
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={
                  section.layout === "hero"
                    ? "grid"
                    : "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                }
              >
                {section.personaIds.map((id) => {
                  const persona = personaMap.get(id);
                  if (!persona) return null;
                  return (
                    <PersonaCard key={id} persona={persona} variant={section.layout === "hero" ? "hero" : "standard"} />
                  );
                })}
              </div>
            )}
          </section>
        ))}

        <section className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Available GitHub personas</p>
            <p className="text-base text-white/60">Ready-to-plug operators sitting on the bench.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableGithubPersonas.map((persona) => (
              <article
                key={persona.id}
                className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#111424] via-[#0c101a] to-[#090c14] p-5 text-sm text-white/70"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/30">{persona.codename}</p>
                    <p className="mt-1 text-lg font-semibold text-white">{persona.label}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/60">
                    {persona.readiness === "now" ? "Ready" : persona.readiness === "next" ? "Next" : "Incubating"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/60">{persona.focus}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.3em] text-white/40">
                  <span>{persona.domain}</span>
                  <span>{persona.timezone}</span>
                  <span>{persona.capacity}</span>
                </div>
                {persona.currentInitiatives.length > 0 && (
                  <p className="mt-3 text-xs text-white/50">
                    Active: <span className="text-white/70">{persona.currentInitiatives.join(" • ")}</span>
                  </p>
                )}
                {persona.signatureMoves.length > 0 && (
                  <p className="mt-2 text-xs text-white/50">
                    Signature: <span className="text-white/70">{persona.signatureMoves.join(" • ")}</span>
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

type PersonaCardProps = {
  persona: Awaited<ReturnType<typeof fetchPersonaAssignments>>["assignments"][number];
  variant?: "standard" | "hero";
};

function PersonaCard({ persona, variant = "standard" }: PersonaCardProps) {
  const badgeStyle = STATUS_BADGE[persona.status as PersonaStatusKey];
  const statusLabel = STATUS_LABEL[persona.status as PersonaStatusKey];
  const primaryTask = persona.primaryTask;
  const backupTask = persona.backupTask;

  return (
    <article
      className={`rounded-3xl border border-white/10 bg-gradient-to-b from-[#101320] via-[#0c0f19] to-[#080b12] ${
        variant === "hero" ? "p-6 shadow-[0_20px_40px_rgba(0,0,0,0.45)]" : "p-5 shadow-[0_15px_30px_rgba(0,0,0,0.35)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/30">{persona.codename ?? "Mission persona"}</p>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
            {persona.icon && <span className="text-xl">{persona.icon}</span>}
            <span>{persona.label}</span>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeStyle}`}
          aria-label={`Live status: ${statusLabel}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 space-y-1 text-sm text-white/60">
        <p>{persona.focus}</p>
        {persona.spotlight && <p className="text-xs text-white/40">Focus: {persona.spotlight}</p>}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.35em] text-white/40">
          <span>Current Task</span>
          {primaryTask && <span>{formatRelativeTime(primaryTask.updated_at)}</span>}
        </div>

        {primaryTask ? (
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/50">
              <p>{toTitle(primaryTask.column_id)}</p>
              {primaryTask.owner_initials && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.3em] text-white/60">
                  {primaryTask.owner_initials}
                </span>
              )}
            </div>
            <p className="text-base font-semibold text-white">{primaryTask.title}</p>
            {primaryTask.description && <p className="text-sm text-white/60">{primaryTask.description}</p>}
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
              {primaryTask.source && <span>{primaryTask.source}</span>}
              {primaryTask.project && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/60">{primaryTask.project}</span>
              )}
              {primaryTask.lane && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/60">{primaryTask.lane}</span>
              )}
            </div>
            {backupTask && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-xs text-white/60">
                Next up: <span className="text-white">{backupTask.title}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-white/50">
            Queue is empty. Tag a task with {formatRoutingTags(persona.filters.sources)} to feed this lane.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
        <span>Queue: {persona.queueLength} open task{persona.queueLength === 1 ? "" : "s"}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em]">
          Feed: {formatRoutingTags(persona.filters.sources)}
        </span>
      </div>
    </article>
  );
}
