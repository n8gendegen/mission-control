"use client";

import { useMemo, useState } from "react";
import { ContentBoard } from "../../components/content/ContentBoard";
import { ContentOpsPanel, type OpsTab } from "../../components/content/ContentOpsPanel";
import {
  WORKSTREAM_CONFIG,
  contentApprovals,
  contentItems,
  contentPublishing,
  contentQueue,
  type ContentItem,
  type WorkstreamConfig,
  type WorkstreamId,
} from "../../data/content";
import { Sidebar } from "../../components/layout/Sidebar";

const kpiAccent = ["text-emerald-300", "text-sky-300", "text-amber-300", "text-violet-300"] as const;

function computeKpis(items: ContentItem[], config: WorkstreamConfig) {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const pipeline = items.filter((item) => item.stage !== config.publishedStage).length;
  const inEdit = items.filter((item) => config.editStages.includes(item.stage)).length;
  const scheduled = items.filter((item) => item.stage === config.scheduledStage).length;
  const published = items.filter((item) => {
    if (item.stage !== config.publishedStage) return false;
    const publishedAt = item.publish?.publishedAt ?? item.updatedAt;
    return now - new Date(publishedAt).getTime() <= sevenDays;
  }).length;

  return [
    { label: "Pipeline", value: pipeline },
    { label: "In Edit", value: inEdit },
    { label: "Scheduled", value: scheduled },
    { label: "Published (7d)", value: published },
  ];
}

export default function ContentPage() {
  const [workstream, setWorkstream] = useState<WorkstreamId>("shorts");
  const [opsTab, setOpsTab] = useState<OpsTab>("queue");

  const config = WORKSTREAM_CONFIG[workstream];
  const workstreamItems = useMemo(
    () => contentItems.filter((item) => item.workstream === workstream),
    [workstream]
  );

  const stats = computeKpis(workstreamItems, config);
  const itemsById = useMemo(() => new Map(workstreamItems.map((item) => [item.id, item])), [workstreamItems]);

  const queue = contentQueue.filter((entry) => itemsById.has(entry.itemId));
  const approvals = contentApprovals.filter((entry) => itemsById.has(entry.itemId));
  const publishing = contentPublishing.filter((entry) => itemsById.has(entry.itemId));

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex flex-1 flex-col space-y-6 px-8 py-6">
        <section className="rounded-3xl border border-white/5 bg-[#0b0d12] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.5em] text-white/40">Content</p>
              <h1 className="text-2xl font-semibold text-white">Content Command Center</h1>
              <p className="text-sm text-white/50">{config.description}</p>
            </div>
            <div className="flex gap-2">
              {(Object.keys(WORKSTREAM_CONFIG) as WorkstreamId[]).map((id) => {
                const ws = WORKSTREAM_CONFIG[id];
                const active = id === workstream;
                return (
                  <button
                    key={id}
                    onClick={() => setWorkstream(id)}
                    className={
                      active
                        ? "rounded-2xl border border-violet-400/40 bg-violet-400/20 px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:border-white/30"
                    }
                  >
                    {ws.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="rounded-2xl border border-white/5 bg-[#11131a] px-4 py-3">
                <p className={`text-3xl font-semibold ${kpiAccent[index]}`}>{stat.value}</p>
                <p className="text-xs uppercase tracking-[0.4em] text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="flex gap-6">
          <ContentBoard config={config} items={workstreamItems} />
          <ContentOpsPanel
            activeTab={opsTab}
            onTabChange={setOpsTab}
            queue={queue}
            approvals={approvals}
            publishing={publishing}
          />
        </section>
      </main>
    </div>
  );
}
