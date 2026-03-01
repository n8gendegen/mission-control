import { getActivityFeed } from "../../lib/data/activity";

const items = getActivityFeed();

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
