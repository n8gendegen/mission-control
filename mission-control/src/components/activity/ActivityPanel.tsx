type ActivityItem = {
  id: string;
  owner: string;
  text: string;
  timeAgo: string;
};

const items: ActivityItem[] = [
  {
    id: "act-1",
    owner: "Henry",
    text: "Started last30days research: challenges people are having with OpenClaw.",
    timeAgo: "4 minutes",
  },
  {
    id: "act-2",
    owner: "Alex",
    text: "Fixed memory path bug in Supabase heartbeat worker.",
    timeAgo: "12 minutes",
  },
  {
    id: "act-3",
    owner: "Henry",
    text: "Redesigned activity feed for sidebar — full height, compact cards.",
    timeAgo: "42 minutes",
  },
  {
    id: "act-4",
    owner: "Alex",
    text: "Synced Revenue Lab backlog tags with Ops board cards.",
    timeAgo: "about 1 hour",
  },
  {
    id: "act-5",
    owner: "Henry",
    text: "Shared Brave search results for Musk-scale AI news.",
    timeAgo: "2 hours",
  },
  {
    id: "act-6",
    owner: "Alex",
    text: "Filed Mission Control UI spec recap in docs/ui-15min-spec.md.",
    timeAgo: "3 hours",
  },
];

export function ActivityPanel() {
  return (
    <aside className="w-80 shrink-0 space-y-3 rounded-3xl border border-white/5 bg-[#0b0f16] p-5 text-white/80">
      <div className="text-xs uppercase tracking-[0.35em] text-white/40">Live Activity</div>
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-sm shadow-sm shadow-black/30 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#151823]"
          >
            <header className="flex items-center justify-between text-xs text-white/40">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                  {item.owner.slice(0, 1)}
                </span>
                <span>{item.owner}</span>
              </div>
              <span>{item.timeAgo}</span>
            </header>
            <p className="mt-3 text-white/80">{item.text}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}
