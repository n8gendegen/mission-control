import { Sidebar } from "../../components/layout/Sidebar";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type CronJob = {
  key: string;
  name: string;
  cadence: string;
  description: string;
  script: string;
  badgeClass: string;
  schedule: Partial<Record<DayKey, string[]>>;
};

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const ALL_DAYS: DayKey[] = DAYS.map((day) => day.key);
const WEEKDAYS: DayKey[] = DAYS.slice(0, 5).map((day) => day.key);

function buildSchedule(days: DayKey[], times: string[]): Partial<Record<DayKey, string[]>> {
  return days.reduce<Partial<Record<DayKey, string[]>>>((acc, day) => {
    acc[day] = times.map((time) => `${time} ET`);
    return acc;
  }, {});
}

// Keep this in sync with actual cron jobs so the calendar stays accurate.
const CRON_JOBS: CronJob[] = [
  {
    key: "usage-ingest",
    name: "Usage ingest & Supabase sync",
    cadence: "02:15 ET · daily",
    description: "Runs scripts/ingest-openai-usage.mjs so usage_daily_aggregates reflects the previous day’s spend before Nate wakes up.",
    script: "scripts/ingest-openai-usage.mjs",
    badgeClass: "border-violet-500/40 bg-violet-500/10 text-violet-100",
    schedule: buildSchedule(ALL_DAYS, ["02:15"]),
  },
  {
    key: "api-key-guard",
    name: "API key & usage audit",
    cadence: "04:00 ET · daily",
    description: "Validates provider keys (currently OPENAI_API_KEY), checks billing usage/caps, and pings Telegram with the spend summary.",
    script: "scripts/api-key-check.sh",
    badgeClass: "border-sky-400/40 bg-sky-400/10 text-sky-100",
    schedule: buildSchedule(ALL_DAYS, ["04:00"]),
  },
  {
    key: "cron-monitor",
    name: "Cron health monitor",
    cadence: "06:00 ET · daily",
    description: "Scans LaunchAgents + openclaw cron jobs, restarts anything stale, and ships a health report to Telegram.",
    script: "scripts/meta-cron-check.sh",
    badgeClass: "border-lime-400/40 bg-lime-400/10 text-lime-100",
    schedule: buildSchedule(ALL_DAYS, ["06:00"]),
  },
  {
    key: "security-audit",
    name: "Security audit sweep",
    cadence: "07:30 ET · daily",
    description: "Runs scripts/security-audit.sh for firewall, SSH, gateway, and port checks before the workday starts.",
    script: "scripts/security-audit.sh",
    badgeClass: "border-rose-400/40 bg-rose-400/10 text-rose-100",
    schedule: buildSchedule(ALL_DAYS, ["07:30"]),
  },
  {
    key: "security-fix",
    name: "Security fix & notifications",
    cadence: "08:00 ET · daily",
    description: "Auto-runs openclaw security audit --fix for criticals and notifies Telegram about medium/low findings.",
    script: "scripts/security-fix.sh",
    badgeClass: "border-red-500/40 bg-red-500/10 text-red-100",
    schedule: buildSchedule(ALL_DAYS, ["08:00"]),
  },
  {
    key: "workspace-backup",
    name: "Workspace backup push",
    cadence: "Every 4 hours",
    description: "Mirrors .openclaw/workspace into the private GitHub backup repo so we can recover instantly if the Mini dies.",
    script: "scripts/backup-workspace.sh",
    badgeClass: "border-slate-400/40 bg-slate-400/10 text-slate-100",
    schedule: buildSchedule(ALL_DAYS, ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]),
  },
  {
    key: "spy-scan",
    name: "Spy scan (bounty radar)",
    cadence: "08:45 & 16:45 ET · Mon–Fri",
    description: "Pulls fresh GitHub bounty issues, scores them, and seeds spy_opportunities + approvals so revenue plays stay stocked.",
    script: "scripts/spy-scan.mjs",
    badgeClass: "border-amber-400/40 bg-amber-400/10 text-amber-100",
    schedule: buildSchedule(WEEKDAYS, ["08:45", "16:45"]),
  },
  {
    key: "spy-claims",
    name: "Spy claim sweeps",
    cadence: "09:00 & 17:00 ET · Mon–Fri",
    description: "Posts /claim comments for high-fit approvals so we stay at the front of the payout queue.",
    script: "scripts/spy-claims.mjs",
    badgeClass: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    schedule: buildSchedule(WEEKDAYS, ["09:00", "17:00"]),
  },

  {
    key: "splitter-runner",
    name: "Splitter spec runner",
    cadence: "Every hour · 24/7",
    description:
      "LaunchAgent + GitHub workflow that runs scripts/agent-runner.mjs --agent Splitter so every backlog item gets a spec before hitting Steve/Sweeper.",
    script: "scripts/run-agent-runner-splitter.sh",
    badgeClass: "border-cyan-400/40 bg-cyan-400/10 text-cyan-100",
    schedule: buildSchedule(ALL_DAYS, ["Every hour"]),
  },
  {
    key: "builder-runner",
    name: "Builder harness session",
    cadence: "Hourly · GitHub auto-assign window",
    description:
      "Part of auto-assign.yml; after Splitter finishes, scripts/builder-session-runner.mjs picks the next Steve/Spy session, opens a PR, and logs completion.",
    script: "scripts/builder-session-runner.mjs",
    badgeClass: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100",
    schedule: buildSchedule(ALL_DAYS, ["Every hour"]),
  },
];

function CronScheduleGrid() {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-900/30">
      <div className="grid grid-cols-[220px_repeat(7,minmax(0,1fr))] border-b border-white/10 text-xs font-semibold uppercase tracking-[0.35em] text-white/30">
        <div className="p-4">Job</div>
        {DAYS.map((day) => (
          <div key={day.key} className="border-l border-white/10 p-4 text-center">
            {day.label}
          </div>
        ))}
      </div>
      {CRON_JOBS.map((job, index) => (
        <div
          key={job.key}
          className={`grid grid-cols-[220px_repeat(7,minmax(0,1fr))] border-b border-white/5 text-sm last:border-b-0 ${index % 2 === 1 ? "bg-white/2" : ""}`}
        >
          <div className="p-4">
            <p className="text-base font-semibold text-white">{job.name}</p>
            <p className="text-xs text-white/60">{job.cadence}</p>
            <p className="mt-2 text-xs text-white/40">{job.description}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30">{job.script}</p>
          </div>
          {DAYS.map((day) => {
            const slots = job.schedule[day.key];
            return (
              <div key={`${job.key}-${day.key}`} className="border-l border-white/5 p-3">
                {slots && slots.length ? (
                  <div className="flex flex-col gap-2">
                    {slots.map((slot) => (
                      <span
                        key={slot}
                        className={`inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${job.badgeClass}`}
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-white/25">—</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/40">Automation schedule</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Cron control room</h1>
            <p className="mt-2 text-sm text-white/60">All times listed in Eastern Time. Use this view to see when each automation fires throughout the week and to spot gaps or collisions at a glance.</p>
          </div>
          <CronScheduleGrid />
        </section>
      </main>
    </div>
  );
}
