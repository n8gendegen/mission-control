import { ActivityStream } from "./ActivityStream";
import { getActivityFeed } from "../../lib/data/activity";

export async function ActivityPanel() {
  const items = await getActivityFeed();

  return (
    <aside className="w-80 shrink-0 space-y-3 rounded-3xl border border-white/5 bg-[#0b0f16] p-5 text-white/80">
      <div className="text-xs uppercase tracking-[0.35em] text-white/40">Live Activity</div>
      <ActivityStream initialItems={items} />
    </aside>
  );
}
