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

  if (error || !data) {
    console.error("Failed to load agent work sessions", error);
    return [];
  }

  return data;
}
