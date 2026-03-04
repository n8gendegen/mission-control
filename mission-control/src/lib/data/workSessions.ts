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
  lastAction?: { action: string; created_at: string };
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
    return data ?? [];
  }

  const ids = data.map((session) => session.id);
  const actionLog = await client
    .from("action_log")
    .select("entity_id, action, created_at")
    .eq("entity_type", "agent_work_session")
    .in("entity_id", ids);

  const latestAction = new Map<string, { action: string; created_at: string }>();
  if (!actionLog.error && actionLog.data) {
    for (const entry of actionLog.data) {
      const current = latestAction.get(entry.entity_id);
      if (!current || new Date(entry.created_at) > new Date(current.created_at)) {
        latestAction.set(entry.entity_id, entry);
      }
    }
  }

  return data.filter((session) => {
    const action = latestAction.get(session.id);
    if (action) {
      session.lastAction = action;
      if (action.action === "complete") {
        return false;
      }
    }
    return true;
  });
}
