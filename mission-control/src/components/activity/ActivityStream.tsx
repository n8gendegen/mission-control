"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActivityLogEntry } from "../../lib/activity/logActivity";
import { subscribeToActivity } from "../../lib/activity/logActivity";

const MAX_ITEMS = 30;

function formatTimeAgo(timestamp: string) {
  const date = new Date(timestamp);
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

type Props = {
  initialItems: ActivityLogEntry[];
};

export function ActivityStream({ initialItems }: Props) {
  const [items, setItems] = useState<ActivityLogEntry[]>(initialItems ?? []);

  useEffect(() => {
    const subscription = subscribeToActivity((entry) => {
      setItems((prev) => {
        const map = new Map<string, ActivityLogEntry>();
        [entry, ...prev].forEach((item) => {
          map.set(item.id, item);
        });
        const deduped = Array.from(map.values()).sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return deduped.slice(0, MAX_ITEMS);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const displayItems = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      actor: item.actor ?? "Agent",
      summary: item.summary ?? "",
      created_at: item.created_at,
    }));
  }, [items]);

  if (!displayItems.length) {
    return (
      <div className="text-sm text-white/40">No activity logged yet. Assign a task to kick things off.</div>
    );
  }

  return (
    <div className="space-y-3">
      {displayItems.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-white/5 bg-[#11131a] p-4 text-sm shadow-sm shadow-black/30 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-[#151823]"
        >
          <header className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
                {item.actor.slice(0, 1).toUpperCase()}
              </span>
              <span>{item.actor}</span>
            </div>
            <time>{formatTimeAgo(item.created_at)}</time>
          </header>
          <p className="mt-3 text-white/80">{item.summary}</p>
        </article>
      ))}
    </div>
  );
}
