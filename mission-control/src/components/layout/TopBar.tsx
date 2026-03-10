import { AgentHealthTile } from "../health/AgentHealthTile";
import { AgentRosterPanel } from "../health/AgentRosterPanel";
import { WorkflowStageSummary } from "../board/WorkflowStageSummary";
import { getAgentHealth } from "../../lib/data/agentHealth";
import { getActiveWorkSessions } from "../../lib/data/workSessions";
import { getSupabaseClient } from "../../lib/supabase/client";
import { determineStageFromTask, TASK_STAGE_DEFINITIONS, type StageSnapshot } from "../../lib/data/taskStages";

type TaskMetrics = {
  total: number;
  inProgress: number;
  completed: number;
  completedThisWeek: number;
  completionPct: number;
};


async function getStageSnapshot(): Promise<StageSnapshot> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      total: 0,
      stages: TASK_STAGE_DEFINITIONS.map((stage) => ({ ...stage, count: 0 })),
    };
  }

  const { data, error } = await client
    .from("tasks")
    .select("id, owner_initials, column_id, input_payload, lane");

  if (error || !data) {
    console.error("Failed to load stage snapshot", error);
    return {
      total: 0,
      stages: TASK_STAGE_DEFINITIONS.map((stage) => ({ ...stage, count: 0 })),
    };
  }

  const counts: Record<string, number> = {};
  data.forEach((task) => {
    const stage = determineStageFromTask({
      ownerInitials: (task as any).owner_initials,
      columnId: (task as any).column_id,
      inputPayload: (task as any).input_payload,
      lane: (task as any).lane,
    });
    counts[stage.key] = (counts[stage.key] ?? 0) + 1;
  });

  return {
    total: data.length,
    stages: TASK_STAGE_DEFINITIONS.map((stage) => ({ ...stage, count: counts[stage.key] ?? 0 })),
  };
}

async function getTaskMetrics(): Promise<TaskMetrics> {
  const client = getSupabaseClient();
  if (!client) {
    return { total: 0, inProgress: 0, completed: 0, completedThisWeek: 0, completionPct: 0 };
  }

  const { data, error } = await client.from("tasks").select("column_id, updated_at, created_at");

  if (error || !data) {
    console.error("Failed to load task metrics", error);
    return { total: 0, inProgress: 0, completed: 0, completedThisWeek: 0, completionPct: 0 };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let inProgress = 0;
  let completed = 0;
  let completedThisWeek = 0;

  data.forEach((task) => {
    const updatedAt = task.updated_at ? new Date(task.updated_at) : null;
    if (task.column_id === "in-progress") {
      inProgress += 1;
    }
    if (task.column_id === "rev") {
      completed += 1;
      if (updatedAt && updatedAt >= sevenDaysAgo) {
        completedThisWeek += 1;
      }
    }
  });

  const total = data.length;
  const completionPct = total ? Math.round((completed / total) * 100) : 0;

  return { total, inProgress, completed, completedThisWeek, completionPct };
}

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#11131a] px-4 py-3">
      <p className={`text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="text-xs uppercase tracking-[0.4em] text-white/40">{label}</p>
    </div>
  );
}

export async function TopBar() {
  const [agentHealth, workSessions, taskMetrics, stageSnapshot] = await Promise.all([
    getAgentHealth(),
    getActiveWorkSessions(),
    getTaskMetrics(),
    getStageSnapshot(),
  ]);
  return (
    <header className="rounded-3xl border border-white/5 bg-[#0b0d12] p-6 text-white">
      <div className="flex items-center justify-between gap-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.5em] text-white/40">Tasks</p>
          <h1 className="text-2xl font-semibold text-white">Mission Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            Pause
          </button>
          <button className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80">
            Ping Henry
          </button>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/50">
            Search…
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <MetricCard label="Completed (7d)" value={taskMetrics.completedThisWeek} accent="text-emerald-300" />
        <MetricCard label="In progress" value={taskMetrics.inProgress} accent="text-sky-300" />
        <MetricCard label="Total" value={taskMetrics.total} accent="text-orange-300" />
        <MetricCard label="Completion" value={`${taskMetrics.completionPct}%`} accent="text-violet-300" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <WorkflowStageSummary stages={stageSnapshot.stages} total={stageSnapshot.total} />
        <AgentRosterPanel sessions={workSessions} />
      </div>
      <div className="mt-6">
        <AgentHealthTile records={agentHealth} />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <button className="rounded-full bg-violet-500 px-5 py-3 text-sm font-semibold text-white shadow shadow-violet-500/40">
          + New task
        </button>
        <div className="flex items-center gap-3 text-sm text-white/60">
          <div className="flex gap-2">
            {['Alex', 'Henry'].map((person) => (
              <span
                key={person}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs"
              >
                {person}
              </span>
            ))}
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            All projects
          </div>
        </div>
      </div>
    </header>
  );
}
