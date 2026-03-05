import type { ContentItem, ContentStage, WorkstreamConfig } from "../../data/content";

const priorityColor: Record<ContentItem["priority"], string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

function formatDueLabel(date?: string) {
  if (!date) return "—";
  const target = new Date(date).getTime();
  const now = Date.now();
  const diff = target - now;
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days > 0) return `in ${days}d`;
  return `${Math.abs(days)}d ago`;
}

function ContentCard({ item }: { item: ContentItem }) {
  return (
    <article className="space-y-3 rounded-2xl border border-white/5 bg-gradient-to-br from-[#11131a] to-[#0b0d12] p-4 text-white/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">{item.title}</p>
          <p className="text-xs text-white/40">
            {item.sourceType === "episode" ? "Episode" : "Source"}: {item.sourceRef}
          </p>
        </div>
        <div className="text-right text-xs text-white/50">
          <p className="uppercase tracking-[0.35em] text-white/30">Due</p>
          <p>{formatDueLabel(item.targetPublishDate)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-white/50">
        <span className={`h-2 w-2 rounded-full ${priorityColor[item.priority]}`} />
        <span>{item.owner}</span>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em] text-white/40">
          {item.priority}
        </span>
      </div>
      <p className="text-sm text-white/60">Next: {item.nextAction}</p>
      <div className="flex flex-wrap gap-2 text-xs">
        <button className="rounded-full border border-white/10 px-3 py-1 text-white/70">View</button>
        <button className="rounded-full border border-white/10 px-3 py-1 text-white/50">Move</button>
        {item.approvalsRequired && (
          <button className="rounded-full border border-violet-400/40 px-3 py-1 text-violet-300/80">
            Approve
          </button>
        )}
      </div>
    </article>
  );
}

export function ContentBoard({ config, items }: { config: WorkstreamConfig; items: ContentItem[] }) {
  const grouped = config.columns.reduce<Record<ContentStage, ContentItem[]>>((acc, column) => {
    acc[column.id] = items.filter((item) => item.stage === column.id);
    return acc;
  }, {} as Record<ContentStage, ContentItem[]>);

  return (
    <section className="flex flex-1 items-start gap-5 overflow-x-auto pb-4">
      {config.columns.map((column) => (
        <div
          key={column.id}
          className="flex min-w-[260px] max-w-[320px] flex-1 flex-col space-y-4 rounded-3xl border border-white/5 bg-[#0b0f16] p-5"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/40">
            <span>{column.title}</span>
            <span>{grouped[column.id]?.length ?? 0}</span>
          </div>
          <div className="space-y-4">
            {grouped[column.id]?.length ? (
              grouped[column.id]!.map((item) => <ContentCard key={item.id} item={item} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-6 text-center text-xs text-white/30">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
