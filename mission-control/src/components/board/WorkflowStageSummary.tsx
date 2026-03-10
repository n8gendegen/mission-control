import type { TaskStageDefinition } from "../../lib/data/taskStages";

export function WorkflowStageSummary({
  stages,
  total,
}: {
  stages: Array<TaskStageDefinition & { count: number }>;
  total: number;
}) {
  return (
    <div className="rounded-3xl border border-white/5 bg-[#0d1018] p-5 text-white/70">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
        <span>Workflow stages</span>
        <span>{total} active</span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:flex xl:flex-wrap">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className={`flex flex-1 min-w-[200px] items-center justify-between rounded-2xl border px-4 py-3 ${stage.panelClass}`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{stage.label}</p>
              <p className="text-2xl font-semibold text-white">{stage.count}</p>
            </div>
            <p className="ml-4 text-right text-xs text-white/40">{stage.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
