import { getSupabaseClient } from "../supabase/client";

export type AgentWorkSession = {
  id: string;
  task_id: string;
  task_slug: string | null;
  task_title: string | null;
  agent_name: string;
  status: string;
  triggered_at: string;
  started_at: string | null;
  completed_at: string | null;
  lastAction?: { action: string; created_at: string; metadata?: Record<string, unknown> | null };
};

export async function getActiveWorkSessions(limit = 6): Promise<AgentWorkSession[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from("agent_work_sessions")
    .select(
      "id, task_id, task_slug, task_title, agent_name, status, triggered_at, started_at, completed_at"
    )
    .in("status", ["triggered", "started"])
    .order("triggered_at", { ascending: true })
    .limit(limit);

  if (error || !data || data.length === 0) {
    if (error) {
      console.error("Failed to load agent work sessions", error);
    }
    return (data as AgentWorkSession[] | null) ?? [];
  }

  const sessions = data as AgentWorkSession[];
  const ids = sessions.map((session) => session.id);
  const actionLog = await client
    .from("action_log")
    .select("entity_id, action, created_at, metadata")
    .eq("entity_type", "agent_work_session")
    .in("entity_id", ids);

  const latestAction = new Map<string, { action: string; created_at: string; metadata?: Record<string, unknown> }>();
  if (!actionLog.error && actionLog.data) {
    for (const entry of actionLog.data) {
      const current = latestAction.get(entry.entity_id);
      if (!current || new Date(entry.created_at) > new Date(current.created_at)) {
        latestAction.set(entry.entity_id, entry as { action: string; created_at: string; metadata?: Record<string, unknown> });
      }
    }
  }

  return sessions
    .filter((session) => {
      const action = latestAction.get(session.id);
      if (!action) return true;
      if (action.action === "complete") {
        return false;
      }
      if (action.action === "snooze") {
        const snoozeUntil = action.metadata?.snooze_until as string | undefined;
        if (snoozeUntil && new Date(snoozeUntil).getTime() > Date.now()) {
          return false;
        }
      }
      return true;
    })
    .map((session) => {
      const action = latestAction.get(session.id);
      return action ? { ...session, lastAction: action } : session;
    });
}
