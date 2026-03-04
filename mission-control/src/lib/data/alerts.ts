import { getSupabaseClient } from "../supabase/client";

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertItem = {
  id: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  source: string;
  timestamp: string;
};

function toAlertSeverity(status: string | null | undefined): AlertSeverity {
  if (!status) return "info";
  if (status === "error" || status === "critical") return "critical";
  if (status === "warning") return "warning";
  return "info";
}

export async function getAlertInbox(limit = 10): Promise<AlertItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const [health, workQueue] = await Promise.all([
    client
      .from("agent_health_status")
      .select("id,agent_name,status,updated_at,last_run_at,error_context")
      .in("status", ["error", "warning"])
      .limit(limit),
    client
      .from("agent_work_sessions")
      .select("id,task_slug,task_title,agent_name,status,triggered_at")
      .in("status", ["triggered"])
      .order("triggered_at", { ascending: false })
      .limit(limit),
  ]);

  const alerts: AlertItem[] = [];

  if (!health.error && health.data) {
    for (const row of health.data) {
      alerts.push({
        id: `health:${row.id}`,
        severity: toAlertSeverity(row.status),
        title: `${row.agent_name} status ${row.status?.toUpperCase()}`,
        description: row.error_context ?? `Last run at ${row.last_run_at ?? "unknown"}`,
        source: "Automation",
        timestamp: row.updated_at ?? row.last_run_at ?? new Date().toISOString(),
      });
    }
  }

  if (!workQueue.error && workQueue.data) {
    for (const row of workQueue.data) {
      alerts.push({
        id: `work:${row.id}`,
        severity: "warning",
        title: `${row.agent_name} queued ${row.task_slug ?? row.task_title ?? "task"}`,
        description: "Awaiting agent pickup",
        source: "Dispatch",
        timestamp: row.triggered_at ?? new Date().toISOString(),
      });
    }
  }

  return alerts
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
