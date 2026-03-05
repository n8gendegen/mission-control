import type {
  ContentApprovalRequest,
  ContentQueueItem,
  PublishingEntry,
} from "../../data/content";

const TAB_LABELS = {
  queue: "Queue",
  approvals: "Approvals",
  publishing: "Publishing",
  metrics: "Metrics",
} as const;

type OpsTab = keyof typeof TAB_LABELS;

export function ContentOpsPanel({
  activeTab,
  onTabChange,
  queue,
  approvals,
  publishing,
}: {
  activeTab: OpsTab;
  onTabChange: (tab: OpsTab) => void;
  queue: ContentQueueItem[];
  approvals: ContentApprovalRequest[];
  publishing: PublishingEntry[];
}) {
  return (
    <aside className="flex w-[320px] flex-shrink-0 flex-col space-y-4 rounded-3xl border border-white/5 bg-[#0b0f16] p-5">
      <nav className="grid grid-cols-2 gap-2 text-sm">
        {(Object.keys(TAB_LABELS) as OpsTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={
              activeTab === tab
                ? "rounded-2xl border border-violet-400/40 bg-violet-400/10 px-3 py-2 text-white"
                : "rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white/60 hover:border-white/30"
            }
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto text-sm text-white/70">
        {activeTab === "queue" && <QueueList items={queue} />}
        {activeTab === "approvals" && <ApprovalsList items={approvals} />}
        {activeTab === "publishing" && <PublishingList items={publishing} />}
        {activeTab === "metrics" && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/50">
            Metrics automation arrives in Phase 2. Stub for retention + CTR trends.
          </div>
        )}
      </div>
    </aside>
  );
}

function QueueList({ items }: { items: ContentQueueItem[] }) {
  if (!items.length) {
    return <EmptyState label="Queue is clear" />;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{item.stage}</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]">
              {item.priority}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{item.action}</p>
          <p className="text-xs text-white/50">{item.instructions}</p>
          <p className="mt-2 text-xs text-white/40">Owner: {item.owner}</p>
        </li>
      ))}
    </ul>
  );
}

function ApprovalsList({ items }: { items: ContentApprovalRequest[] }) {
  if (!items.length) {
    return <EmptyState label="No approvals pending" />;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">{item.title}</p>
          <p className="text-xs text-white/50">{item.summary}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-white/40">
            <span>Stage: {item.stage}</span>
            <span>By {item.requestedBy}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PublishingList({ items }: { items: PublishingEntry[] }) {
  if (!items.length) {
    return <EmptyState label="No publishing activity" />;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{item.platform}</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]">
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
          {item.status === "scheduled" && item.scheduledFor && (
            <p className="text-xs text-white/50">Scheduled {new Date(item.scheduledFor).toLocaleString()}</p>
          )}
          {item.status === "published" && item.publishedAt && (
            <p className="text-xs text-white/50">Published {new Date(item.publishedAt).toLocaleString()}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex text-xs text-violet-300"
            >
              View post ↗
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-xs text-white/30">
      {label}
    </div>
  );
}

export type { OpsTab };
