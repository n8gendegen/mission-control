import type { TaskRecord } from "../../lib/data/types";

export function TaskCard({ task }: { task: TaskRecord }) {
  return (
    <article className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-white/80 shadow-sm shadow-black/30 transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#151823]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className={`h-2.5 w-2.5 rounded-full ${task.statusColor}`} />
          <span>{task.source}</span>
        </div>
        <button className="text-white/30">•••</button>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-white">{task.title}</h3>
      <p className="mt-1 text-xs text-white/50">{task.description}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white text-xs font-semibold">
            {task.ownerInitials}
          </span>
          <span>{task.timeAgo} ago</span>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-widest">
          {task.source}
        </span>
      </div>
    </article>
  );
}
