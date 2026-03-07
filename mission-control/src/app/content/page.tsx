/* eslint-disable @next/next/no-img-element */
import type { YoutubeTaskRow } from "../../lib/data/youtubeTasks";
import { fetchYoutubeTasks } from "../../lib/data/youtubeTasks";

export const dynamic = "force-dynamic";

const PROJECT_ID = "youtube-content-engine";

type KnownLane = (typeof LANE_CONFIG)[number]["id"];
type DisplayLane = KnownLane | "ready" | "published";

type DisplayTask = {
  id: string;
  title: string;
  description: string;
  ownerInitials: string;
  lane: DisplayLane | null;
  priority?: "high" | "medium" | "low";
  videoSlug?: string | null;
  targetPublishAt?: string | null;
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  assetLinks?: { label: string; url: string }[];
  metrics?: { ctr?: number; retention?: number; views?: number } | null;
};

const LANE_CONFIG = [
  { id: "ideas", title: "Ideas", subtitle: "Trend Scanner output" },
  { id: "script", title: "Scripts", subtitle: "Hooks + narration" },
  { id: "assets", title: "Assets", subtitle: "Clips, thumbs, voice" },
  { id: "scheduled", title: "Ship", subtitle: "Publish queue" },
] as const;

const priorityBadge: Record<string, string> = {
  high: "bg-rose-400/30 text-rose-200",
  medium: "bg-amber-400/30 text-amber-200",
  low: "bg-emerald-400/30 text-emerald-200",
};

function formatTarget(date?: string | null) {
  if (!date) return "—";
  const target = new Date(date).getTime();
  const diff = target - Date.now();
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours === 0) return "today";
  if (hours > 0) return `in ${hours}h`;
  return `${Math.abs(hours)}h ago`;
}

function normalizeLane(lane?: string | null): KnownLane | null {
  if (!lane) return null;
  return LANE_CONFIG.some((config) => config.id === lane)
    ? (lane as (typeof LANE_CONFIG)[number]["id"])
    : null;
}

function mapRows(rows: YoutubeTaskRow[]): DisplayTask[] {
  return rows.map((row) => ({
    id: row.slug ?? row.id,
    title: row.title ?? row.slug ?? row.id,
    description: row.description ?? "",
    ownerInitials: row.owner_initials ?? "—",
    lane: normalizeLane(row.lane),
    priority: (row.priority as DisplayTask["priority"]) ?? undefined,
    videoSlug: row.video_slug,
    targetPublishAt: row.target_publish_at,
    youtubeVideoId: row.youtube_video_id ?? undefined,
    youtubeUrl: row.youtube_url ?? undefined,
    assetLinks: row.asset_links ?? undefined,
    metrics: row.metrics ?? undefined,
  }));
}

function groupTasks(tasks: DisplayTask[]) {
  const map: Record<KnownLane, DisplayTask[]> = {
    ideas: [],
    script: [],
    assets: [],
    scheduled: [],
  };

  tasks.forEach((task) => {
    if (task.lane) {
      map[task.lane].push(task);
    }
  });

  return map;
}

function getStats(tasks: DisplayTask[]) {
  const scheduledNext24h = tasks.filter(
    (task) => task.lane === "scheduled" && task.targetPublishAt && new Date(task.targetPublishAt).getTime() - Date.now() <= 24 * 60 * 60 * 1000
  ).length;
  const ready = tasks.filter((task) => task.lane === "ready").length;
  const published = tasks.filter((task) => task.lane === "published").length;

  return [
    { label: "Active videos", value: tasks.filter((task) => task.lane !== "published").length, detail: "Ideas → Scheduled" },
    { label: "Ready for slot", value: ready, detail: "Awaiting schedule/approval" },
    { label: "Next 24h", value: scheduledNext24h, detail: "Locked upload window" },
    { label: "Live queue", value: published, detail: "Analyzing performance" },
  ];
}

export default async function ContentPage() {
  const rows = await fetchYoutubeTasks(PROJECT_ID);
  const projectTasks = mapRows(rows);
  const stats = getStats(projectTasks);
  const grouped = groupTasks(projectTasks);

  return (
    <main className="min-h-screen bg-[#05060a] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="space-y-6 rounded-3xl border border-white/5 bg-[#0b0f16] p-8 shadow-[0_30px_80px_-40px_rgba(15,118,246,0.5)]">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-cyan-300/70">Project · {PROJECT_ID}</p>
            <h1 className="text-4xl font-semibold">Content Ops Command Deck</h1>
            <p className="mt-2 text-white/60">
              Filtered directly off tasks + agent_work_sessions. Lanes mirror auto-assign stages so agents can see the pipeline at a glance.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                <p className="text-xs uppercase tracking-[0.35em] text-white/30">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-white/40">{stat.detail}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="rounded-3xl border border-white/5 bg-[#080b12] p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/30">
            <span>Pipeline · auto-assign lanes</span>
            <span>{projectTasks.length} tasks</span>
          </div>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {LANE_CONFIG.map((lane) => (
              <div key={lane.id} className="flex min-w-[260px] max-w-[320px] flex-1 flex-col gap-4 rounded-3xl border border-white/5 bg-[#0b0f16] p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">{lane.title}</p>
                  <p className="text-[11px] text-white/30">{lane.subtitle}</p>
                  <p className="text-lg font-semibold text-white">{grouped[lane.id].length}</p>
                </div>
                <div className="space-y-3">
                  {grouped[lane.id].length ? (
                    grouped[lane.id].map((task) => {
                      const videoLink = task.assetLinks?.find((link) => /mp4|video|draft/i.test(link.label) || link.url.endsWith('.mp4'));
                      const thumbLink = task.assetLinks?.find((link) => /thumb|preview/i.test(link.label) || link.url.toLowerCase().includes('thumb'));
                      return (
                      <article key={task.id} className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-white/70">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{task.title}</p>
                            <p className="text-xs text-white/40">{task.videoSlug ?? task.id}</p>
                          </div>
                          <div className="text-right text-xs text-white/40">
                            <p>Target</p>
                            <p className="text-white/70">{formatTarget(task.targetPublishAt)}</p>
                          </div>
                        </div>
                        <p className="text-sm text-white/60">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-white/40">
                          <span>{task.ownerInitials}</span>
                          {task.priority && (
                            <span className={`rounded-full px-2 py-0.5 ${priorityBadge[task.priority]}`}>{task.priority}</span>
                          )}
                          {task.youtubeVideoId && <span className="text-white/50">{task.youtubeVideoId}</span>}
                        </div>
                        {thumbLink && (
                          <a href={thumbLink.url} target="_blank" rel="noreferrer">
                            <img src={thumbLink.url} alt={`${task.title} thumbnail`} className="w-full rounded-xl border border-white/10" />
                          </a>
                        )}
                        {(videoLink || thumbLink || task.youtubeUrl) && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {videoLink && (
                              <a href={videoLink.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-1 text-white/80 hover:border-cyan-300">
                                Preview
                              </a>
                            )}
                            {thumbLink && (
                              <a href={thumbLink.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/20 px-3 py-1 text-white/60 hover:border-cyan-300">
                                Thumbnail
                              </a>
                            )}
                            {task.youtubeUrl && (
                              <a href={task.youtubeUrl} target="_blank" rel="noreferrer" className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-200 hover:border-emerald-300">
                                YouTube
                              </a>
                            )}
                          </div>
                        )}
                        {task.metrics && (
                          <div className="flex items-center gap-4 text-xs text-white/50">
                            {task.metrics.ctr !== undefined && <span>CTR {task.metrics.ctr}%</span>}
                            {task.metrics.retention !== undefined && <span>Ret {task.metrics.retention}%</span>}
                            {task.metrics.views !== undefined && <span>{task.metrics.views.toLocaleString()} views</span>}
                          </div>
                        )}
                      </article>
                    );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-6 text-center text-xs text-white/30">
                      Empty lane
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/5 bg-[#0b0f16] p-6 lg:col-span-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/30">
              <span>Daily Runbook</span>
              <span>Trend → Publish in 90 min</span>
            </div>
            <ol className="mt-4 space-y-3 text-white/70">
              {[
                "Trend sweep populates Ideas lane (Spy)",
                "Auto-assign spawns Script task (Steve)",
                "Builder handles Assets + Editing",
                "Packaging finalizes metadata and approvals",
                "Publisher schedules via YouTube API",
                "Analytics agent watches CTR/retention",
              ].map((item, idx) => (
                <li key={item} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-sm font-semibold text-white/50">{idx + 1}</span>
                  <span className="text-sm text-white/70">{item}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-white/30">Alerts</p>
            <h3 className="mt-2 text-2xl font-semibold">Content flags</h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Hook bank below 5 ready hooks.</li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Need approval on Base chain sprint before scheduling.</li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Retention alert triggered on Treasury rumor follow-up.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
