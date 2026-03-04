import { ActivityStream } from "./ActivityStream";
import { AlertInbox } from "../alerts/AlertInbox";
import { getActivityFeed } from "../../lib/data/activity";
import { getAlertInbox } from "../../lib/data/alerts";

export async function ActivityPanel() {
  const [items, alerts] = await Promise.all([getActivityFeed(), getAlertInbox()]);

  return (
    <aside className="w-80 shrink-0 space-y-6 rounded-3xl border border-white/5 bg-[#0b0f16] p-5 text-white/80">
      <AlertInbox alerts={alerts} />
      <div className="border-t border-white/5 pt-4">
        <div className="text-xs uppercase tracking-[0.35em] text-white/40">Live Activity</div>
        <ActivityStream initialItems={items} />
      </div>
    </aside>
  );
}
