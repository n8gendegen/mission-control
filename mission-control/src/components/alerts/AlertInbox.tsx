'use client';

import type { AlertItem } from "../../lib/data/alerts";
import { useState } from "react";
import { logAction } from "../../lib/actions/logAction";

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  critical: {
    badge: "bg-rose-500/15 text-rose-200",
    border: "border-rose-500/30",
  },
  warning: {
    badge: "bg-amber-500/15 text-amber-200",
    border: "border-amber-500/30",
  },
  info: {
    badge: "bg-sky-500/15 text-sky-200",
    border: "border-sky-500/30",
  },
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    month: "short",
    day: "numeric",
  });
}

export function AlertInbox({ alerts }: { alerts: AlertItem[] }) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  const visibleAlerts = alerts.filter((alert) => !hiddenIds.has(alert.id));

  async function handleAction(alertId: string, action: "ack" | "snooze") {
    setPending(alertId);
    try {
      await logAction({ entityType: "alert", entityId: alertId, action });
      setHiddenIds((prev) => {
        const next = new Set(prev);
        next.add(alertId);
        return next;
      });
    } catch (error) {
      console.error("Failed to log alert action", error);
    } finally {
      setPending((current) => (current === alertId ? null : current));
    }
  }

  const list = visibleAlerts;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/40">Alert Inbox</p>
          <p className="text-sm text-white/60">Critical items that need a human nudge</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          {list.length} open
        </span>
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
          All clear. New alerts will land here automatically.
        </div>
      )}

      {list.map((alert) => {
        const styles = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
        return (
          <article
            key={alert.id}
            className={`rounded-2xl border ${styles.border} bg-[#10141f] p-4 text-sm text-white/80 shadow-inner shadow-black/30`}
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">{alert.source}</p>
                <p className="text-base font-semibold text-white">{alert.title}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                {alert.severity === "critical"
                  ? "Critical"
                  : alert.severity === "warning"
                  ? "Warning"
                  : "Info"}
              </span>
            </header>
            {alert.description && <p className="mt-3 text-white/70">{alert.description}</p>}
            {alert.lastAction && (
              <p className="mt-1 text-xs text-white/40">
                Last action: {alert.lastAction.action} at {formatTimestamp(alert.lastAction.created_at)}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-white/40">
              <span>{formatTimestamp(alert.timestamp)}</span>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-white/70 disabled:opacity-40"
                  disabled={pending === alert.id}
                  onClick={() => handleAction(alert.id, "ack")}
                >
                  Ack
                </button>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-white/50 disabled:opacity-40"
                  disabled={pending === alert.id}
                  onClick={() => handleAction(alert.id, "snooze")}
                >
                  Snooze
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
